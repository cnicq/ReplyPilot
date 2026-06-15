from uuid import UUID

from sqlalchemy.orm import Session

from app.config import settings as app_settings
from app.models import Profile, Settings
from app.providers import get_provider_defaults


def get_or_create_settings(db: Session) -> Settings:
    row = db.query(Settings).filter(Settings.id == 1).first()
    if not row:
        defaults = get_provider_defaults(app_settings.ai_provider)
        row = Settings(
            id=1,
            provider=app_settings.ai_provider,
            api_key=app_settings.ai_api_key,
            base_url=app_settings.ai_base_url or defaults["base_url"],
            model=app_settings.ai_model or defaults["model"],
            max_history_examples=app_settings.max_history_examples,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def get_default_profile(db: Session) -> Profile | None:
    profile = db.query(Profile).filter(Profile.is_default.is_(True)).first()
    if profile:
        return profile
    settings = get_or_create_settings(db)
    if not settings.default_profile_id:
        return None
    return db.query(Profile).filter(Profile.id == settings.default_profile_id).first()


def set_default_profile(db: Session, profile_id: UUID) -> None:
    db.query(Profile).update({Profile.is_default: False})
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        return
    profile.is_default = True
    settings = get_or_create_settings(db)
    settings.default_profile_id = profile_id
    db.commit()


def get_recent_history_for_profile(db: Session, profile_id: UUID, limit: int) -> list:
    from app.models import ReplyHistory

    return (
        db.query(ReplyHistory)
        .filter(
            ReplyHistory.profile_id == profile_id,
            (ReplyHistory.selected_reply.isnot(None)) | (ReplyHistory.edited_reply.isnot(None)),
        )
        .order_by(ReplyHistory.created_at.desc())
        .limit(limit)
        .all()
    )
