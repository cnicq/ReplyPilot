import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False, default="xiaohongshu")

    account_name: Mapped[str] = mapped_column(String(255), default="")
    account_description: Mapped[str] = mapped_column(Text, default="")
    creator_background: Mapped[str] = mapped_column(Text, default="")
    content_purpose: Mapped[str] = mapped_column(Text, default="")
    target_audience: Mapped[str] = mapped_column(Text, default="")

    persona: Mapped[str] = mapped_column(Text, default="")
    writing_dna: Mapped[str] = mapped_column(Text, default="")
    tone: Mapped[list] = mapped_column(JSONB, default=list)
    communication_style: Mapped[list] = mapped_column(JSONB, default=list)
    preferred_topics: Mapped[list] = mapped_column(JSONB, default=list)
    avoid_topics: Mapped[list] = mapped_column(JSONB, default=list)
    forbidden_phrases: Mapped[list] = mapped_column(JSONB, default=list)
    reply_principles: Mapped[list] = mapped_column(JSONB, default=list)

    language: Mapped[str] = mapped_column(String(20), default="zh-CN")
    default_reply_length: Mapped[str] = mapped_column(String(20), default="short")
    examples: Mapped[list] = mapped_column(JSONB, default=list)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    history: Mapped[list["ReplyHistory"]] = relationship(back_populates="profile")


class Settings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    default_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True
    )
    provider: Mapped[str] = mapped_column(String(50), default="mimo")
    api_key: Mapped[str] = mapped_column(String(512), default="")
    base_url: Mapped[str] = mapped_column(String(512), default="https://api.xiaomimimo.com/v1")
    model: Mapped[str] = mapped_column(String(100), default="mimo-v2.5-pro")
    max_history_examples: Mapped[int] = mapped_column(Integer, default=15)


class ReplyHistory(Base):
    __tablename__ = "reply_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    platform: Mapped[str] = mapped_column(String(50), default="xiaohongshu")
    source_comment: Mapped[str] = mapped_column(Text, nullable=False)
    generated_replies: Mapped[list] = mapped_column(JSONB, default=list)
    selected_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    edited_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    action: Mapped[str] = mapped_column(String(20), default="generated")
    page_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    profile: Mapped["Profile"] = relationship(back_populates="history")
