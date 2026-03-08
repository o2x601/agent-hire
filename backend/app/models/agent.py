from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
from enum import Enum
from datetime import datetime
import uuid


class PricingModel(str, Enum):
    subscription = "subscription"
    usage_based = "usage_based"


class TrackRecord(BaseModel):
    total_processed: int = Field(ge=0)
    uptime_percentage: float = Field(ge=0, le=100)
    avg_response_ms: float = Field(ge=0)
    error_rate: float = Field(ge=0, le=100)
    last_active_at: Optional[datetime] = None


class AgentBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    avatar_url: Optional[HttpUrl] = None
    personality: Optional[str] = Field(None, max_length=500)
    skills: list[str] = []
    track_record: Optional[TrackRecord] = None
    pricing_model: PricingModel
    api_endpoint: Optional[HttpUrl] = None


class AgentCreate(AgentBase):
    pass


class AgentUpdate(AgentBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    pricing_model: Optional[PricingModel] = None


class Agent(AgentBase):
    id: uuid.UUID
    developer_id: uuid.UUID
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResumeGenerateRequest(BaseModel):
    github_url: Optional[HttpUrl] = None
    api_doc_url: Optional[HttpUrl] = None

    def model_post_init(self, __context):
        if not self.github_url and not self.api_doc_url:
            raise ValueError("github_url か api_doc_url のいずれかが必要です")
