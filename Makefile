.PHONY: help up down restart clean logs

help:
	@echo "Transcendence Development Commands:"
	@echo "  make up        - Start all services (PostgreSQL, MongoDB)"
	@echo "  make down      - Stop all services (keep data)"
	@echo "  make restart   - Restart services (keep data)"
	@echo "  make clean     - Clean volumes and restart (fresh database)"
	@echo "  make logs      - View logs from all services"
	@echo "  make logs-db   - View PostgreSQL logs"
	@echo "  make logs-auth - View MongoDB logs"

up:
	docker compose up -d
	@echo "✓ Services started"

down:
	docker compose down
	@echo "✓ Services stopped"

restart:
	docker compose restart
	@echo "✓ Services restarted"

clean:
	@echo "Cleaning volumes and restarting database..."
	docker compose down -v
	docker compose up -d
	@echo "✓ Fresh database initialized"

logs:
	docker compose logs -f

logs-db:
	docker compose logs -f core-db

logs-auth:
	docker compose logs -f auth-db
