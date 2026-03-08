"""
インタラクション (スカウト・応募・面接) CRUD + チャット
GET    /interactions                      - 一覧 (認証必須)
GET    /interactions/{id}                 - 詳細
POST   /interactions                      - スカウト or 応募 作成
PATCH  /interactions/{id}/status          - ステータス更新
POST   /interactions/{id}/chat            - チャットメッセージ追加
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.models.common import Pagination, PaginatedResponse
from app.models.interaction import (
    ChatMessageCreate,
    Interaction,
    InteractionCreate,
    InteractionStatusUpdate,
    InteractionType,
)
from app.services.supabase import CurrentUser, get_service_client

router = APIRouter(prefix="/interactions", tags=["interactions"])


def _get_user_agent_ids(client, user_id: str) -> list[str]:
    """認証ユーザーが保有するエージェントIDリストを返す"""
    res = (
        client.table("ai_agents")
        .select("id")
        .eq("developer_id", user_id)
        .execute()
    )
    return [r["id"] for r in res.data]


def _get_user_job_ids(client, user_id: str) -> list[str]:
    """認証ユーザーの企業が保有する求人IDリストを返す"""
    company_res = (
        client.table("companies")
        .select("id")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not company_res.data:
        return []
    res = (
        client.table("jobs")
        .select("id")
        .eq("company_id", company_res.data["id"])
        .execute()
    )
    return [r["id"] for r in res.data]


@router.get("", response_model=PaginatedResponse[Interaction])
async def list_interactions(user: CurrentUser):
    """自分のエージェント または 自分の求人に関連するインタラクションを返す"""
    client = get_service_client()
    user_id = str(user.id)

    agent_ids = _get_user_agent_ids(client, user_id)
    job_ids = _get_user_job_ids(client, user_id)

    if not agent_ids and not job_ids:
        return PaginatedResponse(data=[], count=0, limit=20, offset=0)

    # agent_id または job_id で OR フィルタ
    filters = []
    if agent_ids:
        filters.append(f"agent_id.in.({','.join(agent_ids)})")
    if job_ids:
        filters.append(f"job_id.in.({','.join(job_ids)})")

    query = client.table("interactions").select("*", count="exact")
    if len(filters) == 1:
        query = query.or_(filters[0])
    else:
        query = query.or_(",".join(filters))

    res = query.execute()
    return PaginatedResponse(
        data=res.data,
        count=res.count or 0,
        limit=20,
        offset=0,
    )


@router.get("/{interaction_id}", response_model=Interaction)
async def get_interaction(interaction_id: uuid.UUID, user: CurrentUser):
    client = get_service_client()
    res = (
        client.table("interactions")
        .select("*")
        .eq("id", str(interaction_id))
        .maybe_single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="インタラクションが見つかりません")

    # アクセス権確認: エージェントオーナー または 求人オーナーのみ
    _assert_access(client, res.data, str(user.id))
    return res.data


@router.post("", response_model=Interaction, status_code=201)
async def create_interaction(body: InteractionCreate, user: CurrentUser):
    client = get_service_client()
    user_id = str(user.id)

    if body.type == InteractionType.scout:
        # スカウト: 企業側ユーザーが行う → job_id が自分の企業の求人であること
        job_ids = _get_user_job_ids(client, user_id)
        if str(body.job_id) not in job_ids:
            raise HTTPException(status_code=403, detail="自社の求人以外でスカウトはできません")
    elif body.type == InteractionType.application:
        # 応募: エージェントオーナーが行う
        agent_ids = _get_user_agent_ids(client, user_id)
        if str(body.agent_id) not in agent_ids:
            raise HTTPException(status_code=403, detail="自分のエージェント以外で応募はできません")

    initial_chat = []
    if body.message:
        initial_chat.append({
            "role": "company" if body.type == InteractionType.scout else "agent",
            "content": body.message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    data = {
        "agent_id": str(body.agent_id),
        "job_id": str(body.job_id),
        "type": body.type.value,
        "chat_log": initial_chat,
    }
    res = client.table("interactions").insert(data).execute()
    return res.data[0]


@router.patch("/{interaction_id}/status", response_model=Interaction)
async def update_status(
    interaction_id: uuid.UUID,
    body: InteractionStatusUpdate,
    user: CurrentUser,
):
    client = get_service_client()
    existing = (
        client.table("interactions")
        .select("*")
        .eq("id", str(interaction_id))
        .maybe_single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="インタラクションが見つかりません")

    _assert_access(client, existing.data, str(user.id))

    res = (
        client.table("interactions")
        .update({"status": body.status.value})
        .eq("id", str(interaction_id))
        .execute()
    )
    return res.data[0]


@router.post("/{interaction_id}/chat", response_model=Interaction)
async def add_chat_message(
    interaction_id: uuid.UUID,
    body: ChatMessageCreate,
    user: CurrentUser,
):
    client = get_service_client()
    existing = (
        client.table("interactions")
        .select("*")
        .eq("id", str(interaction_id))
        .maybe_single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="インタラクションが見つかりません")

    interaction = existing.data
    _assert_access(client, interaction, str(user.id))

    # 送信者ロールを特定 (エージェントオーナーなら "agent"、企業なら "company")
    user_id = str(user.id)
    agent_ids = _get_user_agent_ids(client, user_id)
    role = "agent" if interaction["agent_id"] in agent_ids else "company"

    new_message = {
        "role": role,
        "content": body.content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    updated_log = list(interaction["chat_log"]) + [new_message]
    res = (
        client.table("interactions")
        .update({"chat_log": updated_log})
        .eq("id", str(interaction_id))
        .execute()
    )
    return res.data[0]


# ---------- helper ----------

def _assert_access(client, interaction: dict, user_id: str) -> None:
    """インタラクションへのアクセス権を検証。権限なければ403を送出。"""
    agent_ids = _get_user_agent_ids(client, user_id)
    job_ids = _get_user_job_ids(client, user_id)
    if (
        interaction["agent_id"] not in agent_ids
        and interaction["job_id"] not in job_ids
    ):
        raise HTTPException(status_code=403, detail="権限がありません")
