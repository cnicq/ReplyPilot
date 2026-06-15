from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ReplyHistory
from app.schemas import (
    CachedRepliesResponse,
    GeneratedReply,
    ReplyHistoryCreate,
    ReplyHistoryResponse,
)
from app.services.settings import get_default_profile

router = APIRouter(prefix="/reply-history", tags=["reply-history"])

REPLY_STYLE_IDS = ("sincere", "restrained", "reflective")

REPLY_STYLE_LABELS = {
    "sincere": "真诚直接",
    "restrained": "克制简约",
    "reflective": "经历共鸣",
}


def _to_generated_replies(texts: list[str]) -> list[GeneratedReply]:
    return [
        GeneratedReply(
            type=REPLY_STYLE_IDS[i] if i < len(REPLY_STYLE_IDS) else "sincere",
            text=text,
        )
        for i, text in enumerate(texts)
        if text
    ]


@router.get("/lookup", response_model=CachedRepliesResponse)
def lookup_cached_replies(
    source_comment: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    profile = get_default_profile(db)
    if not profile:
        return CachedRepliesResponse(found=False)

    comment = source_comment.strip()
    item = (
        db.query(ReplyHistory)
        .filter(
            ReplyHistory.profile_id == profile.id,
            ReplyHistory.source_comment == comment,
        )
        .order_by(ReplyHistory.created_at.desc())
        .first()
    )
    if not item or not item.generated_replies:
        return CachedRepliesResponse(found=False)

    replies = _to_generated_replies(item.generated_replies)
    if not replies:
        return CachedRepliesResponse(found=False)

    return CachedRepliesResponse(
        found=True,
        replies=replies,
        profile_id=profile.id,
        profile_name=profile.name,
    )


@router.get("", response_model=list[ReplyHistoryResponse])
def list_reply_history(
    profile_id: UUID | None = None,
    limit: int = Query(default=30, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(ReplyHistory).order_by(ReplyHistory.created_at.desc())
    if profile_id:
        query = query.filter(ReplyHistory.profile_id == profile_id)
    return query.limit(limit).all()


@router.post("", response_model=ReplyHistoryResponse, status_code=201)
def create_reply_history(data: ReplyHistoryCreate, db: Session = Depends(get_db)):
    item = ReplyHistory(
        profile_id=data.profile_id,
        platform=data.platform,
        source_comment=data.source_comment.strip(),
        generated_replies=data.generated_replies,
        selected_reply=data.selected_reply,
        edited_reply=data.edited_reply,
        action=data.action,
        page_url=data.page_url,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
