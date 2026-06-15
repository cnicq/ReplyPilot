.PHONY: dev dev-db dev-api dev-ext stop health

dev-db:
	docker compose up -d

API_PORT ?= 7800

dev-api:
	cd backend && . .venv/bin/activate && uvicorn app.main:app --reload --port $(API_PORT)

dev-ext:
	npm run dev

dev:
	@echo "Starting ReplyPilot dev environment..."
	@$(MAKE) dev-db
	@echo "Waiting for PostgreSQL..."
	@sleep 3
	@echo ""
	@echo "Run in separate terminals:"
	@echo "  make dev-api    # FastAPI backend"
	@echo "  make dev-ext    # Chrome extension (load dist/ in chrome://extensions)"
	@echo ""
	@echo "Or use: ./scripts/dev.sh"

stop:
	docker compose down

health:
	@curl -s http://localhost:$(API_PORT)/health || echo "Backend not running"
