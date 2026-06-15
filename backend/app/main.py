from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app.routers import profiles, replies, reply_history, settings
from app.schemas import HealthResponse


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS writing_dna TEXT NOT NULL DEFAULT ''"
        ))
        conn.execute(text(
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reply_voice_guide TEXT NOT NULL DEFAULT ''"
        ))
        conn.commit()
    yield


app = FastAPI(
    title="ReplyPilot API",
    description=(
        "Local-first AI reply assistant for creators — "
        "persona-aware replies based on account profiles, writing style, and reply history."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles.router)
app.include_router(replies.router)
app.include_router(reply_history.router)
app.include_router(settings.router)


@app.get("/health", response_model=HealthResponse)
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"
    return HealthResponse(status="ok", database=db_status)


@app.get("/")
def root():
    return {"name": "ReplyPilot API", "docs": "/docs"}
