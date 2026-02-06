"""Pydantic schemas for Prompt API."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PromptCreate(BaseModel):
    """Schema for creating a new prompt."""

    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    category: str | None = Field(default=None, max_length=100)
    tags: list[str] | None = Field(default=None)


class PromptUpdate(BaseModel):
    """Schema for updating an existing prompt."""

    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    category: str | None = Field(default=None, max_length=100)
    tags: list[str] | None = Field(default=None)


class PromptResponse(BaseModel):
    """Schema for prompt response."""

    id: UUID
    user_id: UUID
    title: str
    content: str
    category: str | None
    tags: list[str] | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PromptsListResponse(BaseModel):
    """Schema for paginated prompts list response."""

    prompts: list[PromptResponse]
    total: int
    limit: int
    offset: int


class TagsResponse(BaseModel):
    """Schema for tags autocomplete response."""

    tags: list[str]


class CategoriesResponse(BaseModel):
    """Schema for categories autocomplete response."""

    categories: list[str]
