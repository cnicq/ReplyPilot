from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Profile
from app.schemas import ProfileCreate, ProfileResponse, ProfileUpdate
from app.services.settings import get_default_profile, set_default_profile

router = APIRouter(prefix="/profiles", tags=["profiles"])


def _to_response(profile: Profile) -> ProfileResponse:
    return ProfileResponse(
        id=profile.id,
        name=profile.name,
        platform=profile.platform,
        account_name=profile.account_name,
        account_description=profile.account_description,
        creator_background=profile.creator_background,
        content_purpose=profile.content_purpose,
        target_audience=profile.target_audience,
        persona=profile.persona,
        writing_dna=profile.writing_dna,
        tone=profile.tone or [],
        communication_style=profile.communication_style or [],
        preferred_topics=profile.preferred_topics or [],
        avoid_topics=profile.avoid_topics or [],
        forbidden_phrases=profile.forbidden_phrases or [],
        reply_principles=profile.reply_principles or [],
        language=profile.language,
        default_reply_length=profile.default_reply_length,
        examples=profile.examples or [],
        is_default=profile.is_default,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("", response_model=list[ProfileResponse])
def list_profiles(db: Session = Depends(get_db)):
    profiles = db.query(Profile).order_by(Profile.updated_at.desc()).all()
    return [_to_response(p) for p in profiles]


@router.post("", response_model=ProfileResponse, status_code=201)
def create_profile(data: ProfileCreate, db: Session = Depends(get_db)):
    profile = Profile(
        name=data.name,
        platform=data.platform,
        account_name=data.account_name,
        account_description=data.account_description,
        creator_background=data.creator_background,
        content_purpose=data.content_purpose,
        target_audience=data.target_audience,
        persona=data.persona,
        writing_dna=data.writing_dna,
        tone=data.tone,
        communication_style=data.communication_style,
        preferred_topics=data.preferred_topics,
        avoid_topics=data.avoid_topics,
        forbidden_phrases=data.forbidden_phrases,
        reply_principles=data.reply_principles,
        language=data.language,
        default_reply_length=data.default_reply_length,
        examples=[ex.model_dump() for ex in data.examples],
        is_default=data.is_default,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    # First profile or explicit flag → set as default (user never picks per reply)
    if data.is_default or get_default_profile(db) is None:
        set_default_profile(db, profile.id)
        db.refresh(profile)

    return _to_response(profile)


@router.post("/seed-example", response_model=ProfileResponse, status_code=201)
def seed_example_profile(db: Session = Depends(get_db)):
    from app.seed import EXAMPLE_PROFILE

    existing = db.query(Profile).filter(Profile.name == EXAMPLE_PROFILE["name"]).first()
    if existing:
        if not existing.is_default and get_default_profile(db) is None:
            set_default_profile(db, existing.id)
            db.refresh(existing)
        return _to_response(existing)

    data = ProfileCreate(**EXAMPLE_PROFILE)
    return create_profile(data, db)


@router.delete("/{profile_id}", status_code=204)
def delete_profile(profile_id: UUID, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    was_default = profile.is_default
    db.delete(profile)
    db.commit()

    if was_default:
        next_profile = db.query(Profile).order_by(Profile.updated_at.desc()).first()
        if next_profile:
            set_default_profile(db, next_profile.id)


@router.put("/{profile_id}", response_model=ProfileResponse)
def update_profile(profile_id: UUID, data: ProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    payload = data.model_dump()
    examples = payload.pop("examples")
    is_default = payload.pop("is_default")

    for field, value in payload.items():
        setattr(profile, field, value)
    profile.examples = [ex if isinstance(ex, dict) else ex for ex in examples]

    db.commit()
    db.refresh(profile)

    if is_default:
        set_default_profile(db, profile.id)
        db.refresh(profile)

    return _to_response(profile)
