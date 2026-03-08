"""
LLM Hybrid Dispatcher
- 軽量処理 → Ollama (ローカルLLM)
- 高精度推論 / Ollamaタイムアウト時 → OpenAI API
"""
import asyncio
from typing import Any
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from app.core.config import settings


def _get_ollama_llm() -> BaseChatModel:
    try:
        from langchain_community.chat_models import ChatOllama
        return ChatOllama(
            base_url=settings.ollama_base_url,
            model=settings.ollama_model,
            timeout=settings.llm_timeout_ms / 1000,
        )
    except ImportError as e:
        raise RuntimeError("langchain-community が必要です") from e


def _get_openai_llm(model: str = "gpt-4o-mini") -> ChatOpenAI:
    return ChatOpenAI(
        api_key=settings.openai_api_key,
        model=model,
    )


async def invoke_llm(
    system_prompt: str,
    user_prompt: str,
    prefer_local: bool = True,
) -> str:
    """
    prefer_local=True のとき Ollama を試み、失敗したら OpenAI にフォールバック。
    prefer_local=False のとき直接 OpenAI を使用。
    """
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    if prefer_local and settings.ollama_base_url:
        try:
            llm = _get_ollama_llm()
            response = await asyncio.wait_for(
                llm.ainvoke(messages),
                timeout=settings.llm_timeout_ms / 1000,
            )
            return str(response.content)
        except Exception:
            pass  # OpenAI にフォールバック

    llm = _get_openai_llm()
    response = await llm.ainvoke(messages)
    return str(response.content)


async def invoke_high_accuracy(
    system_prompt: str,
    user_prompt: str,
    model: str = "gpt-4o",
) -> str:
    """高精度推論が必要な処理に使用 (履歴書生成・求人票整形)"""
    llm = _get_openai_llm(model=model)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]
    response = await llm.ainvoke(messages)
    return str(response.content)
