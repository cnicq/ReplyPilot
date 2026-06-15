from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.providers import PROVIDER_DEFAULTS, PROVIDER_LABELS, get_provider_defaults
from app.schemas import ProviderInfo, SettingsResponse, SettingsUpdate
from app.services.settings import get_or_create_settings

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/providers", response_model=list[ProviderInfo])
def list_providers():
    return [
        ProviderInfo(
            id=provider_id,
            label=PROVIDER_LABELS[provider_id],
            base_url=defaults["base_url"],
            model=defaults["model"],
        )
        for provider_id, defaults in PROVIDER_DEFAULTS.items()
    ]


@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    row = get_or_create_settings(db)
    return SettingsResponse(
        provider=row.provider,
        api_key=row.api_key,
        base_url=row.base_url,
        model=row.model,
        max_history_examples=row.max_history_examples,
    )


@router.put("", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    row = get_or_create_settings(db)
    updates = data.model_dump(exclude_unset=True)

    if "provider" in updates and updates["provider"] is not None:
        defaults = get_provider_defaults(updates["provider"])
        row.provider = updates["provider"]
        if "base_url" not in updates:
            row.base_url = defaults["base_url"]
        if "model" not in updates:
            row.model = defaults["model"]

    for field, value in updates.items():
        if field == "provider":
            continue
        setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return SettingsResponse(
        provider=row.provider,
        api_key=row.api_key,
        base_url=row.base_url,
        model=row.model,
        max_history_examples=row.max_history_examples,
    )
