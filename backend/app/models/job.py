from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime
import uuid


class JobStatus(str, Enum):
    open = "open"
    closed = "closed"
    filled = "filled"


class BudgetRange(BaseModel):
    min: int = Field(ge=0)
    max: int = Field(ge=0)

    def model_post_init(self, __context):
        if self.min > self.max:
            raise ValueError("min は max 以下である必要があります")


class RequiredSpecs(BaseModel):
    skills: Optional[list[str]] = None
    min_uptime: Optional[float] = Field(None, ge=0, le=100)
    max_response_ms: Optional[float] = Field(None, ge=0)
    pricing_model: Optional[str] = None
    other: Optional[str] = Field(None, max_length=1000)


class JobBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    problem_statement: str = Field(min_length=1, max_length=5000)
    budget_range: Optional[BudgetRange] = None
    required_specs: Optional[RequiredSpecs] = None


class JobCreate(JobBase):
    pass


class JobRawInput(BaseModel):
    raw_description: str = Field(min_length=10, max_length=10000)


class Job(JobBase):
    id: uuid.UUID
    company_id: uuid.UUID
    status: JobStatus
    created_at: datetime

    model_config = {"from_attributes": True}
