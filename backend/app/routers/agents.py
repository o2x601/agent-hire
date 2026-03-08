"""
AIエージェント CRUD + AI履歴書生成
GET    /agents          - 一覧 (ページネーション、スキルフィルタ)
GET    /agents/{id}     - 詳細
POST   /agents          - 登録 (認証必須)
PATCH  /agents/{id}     - 更新 (オーナーのみ)
DELETE /agents/{id}     - 削除 (オーナーのみ)
POST   /agents/{id}/resume - AI履歴書生成
"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.agent import Agent, AgentCreate, AgentUpdate, ResumeGenerateRequest
from app.models.common import Pagination, PaginatedResponse
from app.services.llm import invoke_high_accuracy
from app.services.supabase import CurrentUser, get_service_client

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=PaginatedResponse[Agent])
async def list_agents(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    skill: str | None = None,
):
    client = get_service_client()
    query = client.table("ai_agents").select("*", count="exact")
    if skill:
        query = query.contains("skills", [skill])
    query = query.range(offset, offset + limit - 1)
    res = query.execute()
    return PaginatedResponse(
        data=res.data,
        count=res.count or 0,
        limit=limit,
        offset=offset,
    )


@router.get("/{agent_id}", response_model=Agent)
async def get_agent(agent_id: uuid.UUID):
    client = get_service_client()
    res = (
        client.table("ai_agents")
        .select("*")
        .eq("id", str(agent_id))
        .maybe_single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="エージェントが見つかりません")
    return res.data


@router.post("", response_model=Agent, status_code=201)
async def create_agent(body: AgentCreate, user: CurrentUser):
    client = get_service_client()
    data = body.model_dump(mode="json")
    data["developer_id"] = str(user.id)
    res = client.table("ai_agents").insert(data).execute()
    return res.data[0]


@router.patch("/{agent_id}", response_model=Agent)
async def update_agent(agent_id: uuid.UUID, body: AgentUpdate, user: CurrentUser):
    client = get_service_client()
    existing = (
        client.table("ai_agents")
        .select("developer_id")
        .eq("id", str(agent_id))
        .maybe_single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="エージェントが見つかりません")
    if existing.data["developer_id"] != str(user.id):
        raise HTTPException(status_code=403, detail="権限がありません")

    data = body.model_dump(mode="json", exclude_none=True)
    res = client.table("ai_agents").update(data).eq("id", str(agent_id)).execute()
    return res.data[0]


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: uuid.UUID, user: CurrentUser):
    client = get_service_client()
    existing = (
        client.table("ai_agents")
        .select("developer_id")
        .eq("id", str(agent_id))
        .maybe_single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="エージェントが見つかりません")
    if existing.data["developer_id"] != str(user.id):
        raise HTTPException(status_code=403, detail="権限がありません")

    client.table("ai_agents").delete().eq("id", str(agent_id)).execute()


@router.post("/{agent_id}/resume")
async def generate_resume(agent_id: uuid.UUID, body: ResumeGenerateRequest):
    client = get_service_client()
    res = (
        client.table("ai_agents")
        .select("*")
        .eq("id", str(agent_id))
        .maybe_single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="エージェントが見つかりません")

    agent = res.data
    system_prompt = (
        "あなたはAIエージェントのプロフィール作成専門家です。"
        "与えられた情報をもとに、企業向けの魅力的なAIエージェント履歴書を日本語で作成してください。"
        "マークダウン形式で、以下のセクションを含めてください: 概要、スキル、実績・トラックレコード、料金体系"
    )
    user_prompt = (
        f"エージェント情報:\n"
        f"名前: {agent['name']}\n"
        f"スキル: {agent['skills']}\n"
        f"個性・特徴: {agent.get('personality') or '未設定'}\n"
        f"料金モデル: {agent['pricing_model']}\n"
        f"実績: {agent.get('track_record') or '未設定'}\n"
        f"GitHub URL: {body.github_url or 'なし'}\n"
        f"API Doc URL: {body.api_doc_url or 'なし'}\n\n"
        "この情報をもとに詳細な履歴書を生成してください。"
    )

    resume_text = await invoke_high_accuracy(system_prompt, user_prompt)
    return {"resume": resume_text}
