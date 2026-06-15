from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.providers import AIProvider

ProviderType = AIProvider


class ReplyExample(BaseModel):
    comment: str
    reply: str


class ProfileBase(BaseModel):
    name: str
    platform: Literal["xiaohongshu", "bilibili", "x", "zhihu", "generic"] = "xiaohongshu"
    account_name: str = ""
    account_description: str = ""
    creator_background: str = ""
    content_purpose: str = ""
    target_audience: str = ""
    persona: str = ""
    writing_dna: str = ""
    tone: list[str] = Field(default_factory=list)
    communication_style: list[str] = Field(default_factory=list)
    preferred_topics: list[str] = Field(default_factory=list)
    avoid_topics: list[str] = Field(default_factory=list)
    forbidden_phrases: list[str] = Field(default_factory=list)
    reply_principles: list[str] = Field(default_factory=list)
    language: Literal["zh-CN", "en", "fr", "auto"] = "zh-CN"
    default_reply_length: Literal["short", "medium", "long"] = "short"
    examples: list[ReplyExample] = Field(default_factory=list)
    is_default: bool = False


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class ReplyHistoryCreate(BaseModel):
    profile_id: UUID
    platform: str = "xiaohongshu"
    source_comment: str
    generated_replies: list[str] = Field(default_factory=list)
    selected_reply: str | None = None
    edited_reply: str | None = None
    action: Literal["generated", "copied", "saved", "edited"] = "generated"
    page_url: str | None = None


class ReplyHistoryResponse(ReplyHistoryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class GenerateRepliesRequest(BaseModel):
    source_comment: str
    page_url: str | None = None


class GeneratedReply(BaseModel):
    type: Literal["sincere", "humorous", "engagement"]
    text: str


class GenerateRepliesResponse(BaseModel):
    replies: list[GeneratedReply]
    profile_id: UUID
    profile_name: str


class CachedRepliesResponse(BaseModel):
    found: bool
    replies: list[GeneratedReply] = Field(default_factory=list)
    profile_id: UUID | None = None
    profile_name: str | None = None


class HealthResponse(BaseModel):
    status: str
    database: str


class SettingsResponse(BaseModel):
    provider: ProviderType = "mimo"
    api_key: str = ""
    base_url: str = "https://api.xiaomimimo.com/v1"
    model: str = "mimo-v2.5-pro"
    max_history_examples: int = 15


class SettingsUpdate(BaseModel):
    provider: ProviderType | None = None
    api_key: str | None = None
    base_url: str | None = None
    model: str | None = None
    max_history_examples: int | None = None


class ProviderInfo(BaseModel):
    id: ProviderType
    label: str
    base_url: str
    model: str

