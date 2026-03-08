"""
求人票 CRUD + AI求人票パース
GET    /jobs          - 一覧 (ページネーション)
GET    /jobs/{id}     - 詳細
POST   /jobs          - 登録 (認証必須、企業アカウントのみ)
PATCH  /jobs/{id}     - 更新 (オーナーのみ)
DELETE /jobs/{id}     - 削除 (オーナーのみ)
POST   /jobs/parse    - 自由記述テキストを構造化求人票に変換 (AI)

budget_range は PostgreSQL INT4RANGE 型。
- 書き込み: "[min,max]" 形式の文字列に変換
- 読み出し: Supabase が "[min,max)" 等で返すため BudgetRange に変換
"""
import json
import re
import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from app.models.common import Pagination, PaginatedResponse
from app.models.job import BudgetRange, Job, JobCreate, JobRawInput
from app.services.llm import invoke_high_accuracy
from app.services.supabase import CurrentUser, get_service_client

router = APIRouter(prefix="/jobs", tags=["jobs"])


# ---------- helpers ----------

def _budget_to_range_str(b: BudgetRange) -> str:
    """BudgetRange → PostgreSQL INT4RANGE 文字列"""
    return f"[{b.min},{b.max}]"


def _range_str_to_budget(s: str | None) -> dict | None:
    """PostgreSQL INT4RANGE 文字列 → {"min": int, "max": int}"""
    if not s:
        return None
    nums = re.findall(r"\d+", s)
    if len(nums) < 2:
        return None
    low, high = int(nums[0]), int(nums[1])
    # 上限が排他 ")" の場合は -1 して閉区間に戻す
    if s.endswith(")"):
        high = max(low, high - 1)
    return {"min": low, "max": high}


def _normalize_job(row: dict) -> dict:
    """DB行の budget_range を BudgetRange 互換 dict に変換"""
    if "budget_range" in row and isinstance(row["budget_range"], str):
        row["budget_range"] = _range_str_to_budget(row["budget_range"])
    return row


# ---------- routes ----------

@router.get("", response_model=PaginatedResponse[Job])
async def list_jobs(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    status: str | None = None,
):
    client = get_service_client()
    query = client.table("jobs").select("*", count="exact")
    if status:
        query = query.eq("status", status)
    query = query.range(offset, offset + limit - 1)
    res = query.execute()
    return PaginatedResponse(
        data=[_normalize_job(r) for r in res.data],
        count=res.count or 0,
        limit=limit,
        offset=offset,
    )


@router.get("/{job_id}", response_model=Job)
async def get_job(job_id: uuid.UUID):
    client = get_service_client()
    res = (
        client.table("jobs")
        .select("*")
        .eq("id", str(job_id))
        .maybe_single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="求人が見つかりません")
    return _normalize_job(res.data)


@router.post("", response_model=Job, status_code=201)
async def create_job(body: JobCreate, user: CurrentUser):
    client = get_service_client()
    # 認証ユーザーの company_id を取得
    company_res = (
        client.table("companies")
        .select("id")
        .eq("user_id", str(user.id))
        .maybe_single()
        .execute()
    )
    if not company_res.data:
        raise HTTPException(
            status_code=422,
            detail="企業プロファイルが存在しません。先に企業プロファイルを作成してください。",
        )

    data = body.model_dump(mode="json")
    data["company_id"] = company_res.data["id"]

    # budget_range を INT4RANGE 文字列に変換
    if data.get("budget_range"):
        br = data["budget_range"]
        data["budget_range"] = f"[{br['min']},{br['max']}]"

    res = client.table("jobs").insert(data).execute()
    return _normalize_job(res.data[0])


@router.patch("/{job_id}", response_model=Job)
async def update_job(job_id: uuid.UUID, body: JobCreate, user: CurrentUser):
    client = get_service_client()
    # オーナー確認 (company.user_id == user.id)
    existing = (
        client.table("jobs")
        .select("id, company_id, companies(user_id)")
        .eq("id", str(job_id))
        .maybe_single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="求人が見つかりません")
    if existing.data["companies"]["user_id"] != str(user.id):
        raise HTTPException(status_code=403, detail="権限がありません")

    data = body.model_dump(mode="json", exclude_none=True)
    if data.get("budget_range"):
        br = data["budget_range"]
        data["budget_range"] = f"[{br['min']},{br['max']}]"

    res = client.table("jobs").update(data).eq("id", str(job_id)).execute()
    return _normalize_job(res.data[0])


@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: uuid.UUID, user: CurrentUser):
    client = get_service_client()
    existing = (
        client.table("jobs")
        .select("id, company_id, companies(user_id)")
        .eq("id", str(job_id))
        .maybe_single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="求人が見つかりません")
    if existing.data["companies"]["user_id"] != str(user.id):
        raise HTTPException(status_code=403, detail="権限がありません")

    client.table("jobs").delete().eq("id", str(job_id)).execute()


@router.post("/parse", response_model=Job)
async def parse_job(body: JobRawInput, user: CurrentUser):
    """自由記述テキストをAIで構造化求人票に変換して登録する"""
    client = get_service_client()
    company_res = (
        client.table("companies")
        .select("id")
        .eq("user_id", str(user.id))
        .maybe_single()
        .execute()
    )
    if not company_res.data:
        raise HTTPException(
            status_code=422,
            detail="企業プロファイルが存在しません。先に企業プロファイルを作成してください。",
        )

    system_prompt = (
        "あなたは求人票の構造化専門家です。"
        "与えられた自由記述の求人テキストを解析し、以下のJSON形式で返してください。"
        "必ずJSONのみを返し、他の文字は含めないでください。\n"
        "{\n"
        '  "title": "求人タイトル (最大200文字)",\n'
        '  "problem_statement": "課題・業務内容の詳細説明 (最大5000文字)",\n'
        '  "budget_range": {"min": 予算下限(整数), "max": 予算上限(整数)} または null,\n'
        '  "required_specs": {\n'
        '    "skills": ["スキル1", "スキル2"],\n'
        '    "min_uptime": 最低稼働率(0-100のfloat) または null,\n'
        '    "max_response_ms": 最大応答時間(ms, float) または null,\n'
        '    "pricing_model": "subscription" または "usage_based" または null,\n'
        '    "other": "その他要件" または null\n'
        "  }\n"
        "}"
    )

    raw_json = await invoke_high_accuracy(system_prompt, body.raw_description)

    # JSON部分だけ抽出 (```json ... ``` で囲まれる場合に対応)
    match = re.search(r"\{.*\}", raw_json, re.DOTALL)
    if not match:
        raise HTTPException(status_code=502, detail="AI応答のパースに失敗しました")

    try:
        parsed = json.loads(match.group())
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"AI応答のJSONパースエラー: {e}")

    data = {
        "company_id": company_res.data["id"],
        "title": parsed["title"],
        "problem_statement": parsed["problem_statement"],
        "required_specs": parsed.get("required_specs"),
    }
    if parsed.get("budget_range"):
        br = parsed["budget_range"]
        data["budget_range"] = f"[{br['min']},{br['max']}]"

    res = client.table("jobs").insert(data).execute()
    return _normalize_job(res.data[0])
