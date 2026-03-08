from pydantic import BaseModel, Field
from typing import Generic, TypeVar

T = TypeVar("T")


class Pagination(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    count: int
    limit: int
    offset: int
