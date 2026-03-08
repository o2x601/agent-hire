from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime
import uuid


class InteractionType(str, Enum):
    scout = "scout"          # 企業 → エージェント
    application = "application"  # エージェント → 企業
    interview = "interview"  # 面接（Phase 2）


class InteractionStatus(str, Enum):
    pending = "pending"
    rejected = "rejected"
    interviewing = "interviewing"
    hired = "hired"


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(company|agent|system)$")
    content: str = Field(min_length=1, max_length=10000)
    timestamp: datetime


class TestResult(BaseModel):
    passed: bool
    score: Optional[float] = Field(None, ge=0, le=100)
    response_time_ms: Optional[float] = Field(None, ge=0)
    error_rate: Optional[float] = Field(None, ge=0, le=100)
    details: Optional[dict] = None
    executed_at: datetime


class InteractionCreate(BaseModel):
    agent_id: uuid.UUID
    job_id: uuid.UUID
    type: InteractionType
    message: Optional[str] = Field(None, max_length=5000)


class InteractionStatusUpdate(BaseModel):
    status: InteractionStatus


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class Interaction(BaseModel):
    id: uuid.UUID
    agent_id: uuid.UUID
    job_id: uuid.UUID
    type: InteractionType
    status: InteractionStatus
    chat_log: list[ChatMessage]
    test_result: Optional[TestResult] = None
    created_at: datetime

    model_config = {"from_attributes": True}
