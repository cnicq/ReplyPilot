#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Starting PostgreSQL..."
docker compose up -d

echo "==> Waiting for database..."
sleep 3

if [ ! -d backend/.venv ]; then
  echo "==> Creating Python venv..."
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -r backend/requirements.txt -q
fi

if [ ! -f backend/.env ]; then
  echo "==> Creating backend/.env from example..."
  cp backend/.env.example backend/.env
  echo "    Please edit backend/.env and set AI_API_KEY"
fi

API_PORT="${API_PORT:-7800}"

echo "==> Starting FastAPI (background)..."
backend/.venv/bin/uvicorn app.main:app --reload --port "$API_PORT" --app-dir backend &
API_PID=$!

echo "==> Building Chrome extension..."
npm run dev &
EXT_PID=$!

trap 'kill $API_PID $EXT_PID 2>/dev/null; exit' INT TERM

echo ""
echo "ReplyPilot dev environment running:"
echo "  API:       http://localhost:${API_PORT}/docs"
echo "  Extension: load dist/ in chrome://extensions"
echo ""
echo "Press Ctrl+C to stop"

wait
