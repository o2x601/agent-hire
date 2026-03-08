"""
Supabase クライアント & 認証ユーティリティ
- get_service_client(): Service Roleクライアント (管理操作用)
- get_current_user(): FastAPI依存関数 — JWTを検証してユーザーを返す
- require_current_user(): 認証必須版 (同上、エラー時は401)
"""
import asyncio
from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from supabase import create_client, Client

from app.core.config import settings


@lru_cache(maxsize=1)
def get_service_client() -> Client:
    """
    Service Roleクライアント (シングルトン)
    RLSをバイパスするため管理操作にのみ使用し、
    必ず呼び出し元でユーザー所有権を手動チェックすること。
    """
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def _validate_jwt(authorization: str | None) -> object | None:
    """JWTを検証し、Supabase Userオブジェクトを返す。無効なら None。"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    client = get_service_client()
    try:
        response = await asyncio.to_thread(client.auth.get_user, token)
        return response.user
    except Exception:
        return None


async def get_optional_user(
    authorization: Annotated[str | None, Header()] = None,
) -> object | None:
    """認証オプション: 未認証でも None を返す"""
    return await _validate_jwt(authorization)


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> object:
    """認証必須: 未認証・無効トークンの場合 401 を返す"""
    user = await _validate_jwt(authorization)
    if user is None:
        raise HTTPException(status_code=401, detail="認証が必要です")
    return user


# FastAPI Depends エイリアス
CurrentUser = Annotated[object, Depends(get_current_user)]
