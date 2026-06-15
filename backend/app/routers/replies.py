from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai import call_ai
from app.database import get_db
from app.models import ReplyHistory
from app.prompt import build_prompt
from app.schemas import GenerateRepliesRequest, GenerateRepliesResponse, GeneratedReply
from app.services.settings import (
    get_default_profile,
    get_or_create_settings,
    get_recent_history_for_profile,
)

router = APIRouter(prefix="/replies", tags=["replies"])

LEGACY_REPLY_TYPE_MAP = {
    "humorous": "restrained",
    "engagement": "reflective",
}


def _normalize_reply_type(reply_type: str) -> str:
    return LEGACY_REPLY_TYPE_MAP.get(reply_type, reply_type)


@router.post("/generate", response_model=GenerateRepliesResponse)
async def generate_replies(data: GenerateRepliesRequest, db: Session = Depends(get_db)):
    profile = get_default_profile(db)
    if not profile:
        raise HTTPException(status_code=400, detail="请先创建并设置默认账号 Profile")

    settings = get_or_create_settings(db)
    recent = get_recent_history_for_profile(db, profile.id, settings.max_history_examples)
    prompt = build_prompt(profile, data.source_comment, recent)

    try:
        raw_replies = await call_ai(
            api_key=settings.api_key,
            base_url=settings.base_url,
            model=settings.model,
            prompt=prompt,
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    replies = [
        GeneratedReply(type=_normalize_reply_type(r["type"]), text=r["text"])
        for r in raw_replies
    ]

    history = ReplyHistory(
        profile_id=profile.id,
        platform=profile.platform,
        source_comment=data.source_comment.strip(),
        generated_replies=[r.text for r in replies],
        action="generated",
        page_url=data.page_url,
    )
    db.add(history)
    db.commit()

    return GenerateRepliesResponse(
        replies=replies,
        profile_id=profile.id,
        profile_name=profile.name,
    )
