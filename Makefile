.PHONY: help up down restart clean logs logs-db db-status db-reset

help:
	@echo "Transcendence Development Commands:"
	@echo "  make up         - Start all services (databases and microservices)"
	@echo "  make down       - Stop all services (keep data)"
	@echo "  make restart    - Restart all services (keep data)"
	@echo "  make clean      - Full reset (all services, all volumes)"
	@echo "  make logs       - View logs from all services"
	@echo "  make logs-db    - View database logs (core-db and auth-db)"
	@echo "  make db-status  - Check running containers and their health status"
	@echo "  make db-reset   - Reset only databases (keep app containers)"

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
	docker compose logs -f core-db auth-db

db-status:
	@echo "Container Status:"
	docker compose ps
	@echo ""
	@echo "Health Status:"
	docker compose ps --format "table {{.Service}}\t{{.Status}}"

db-reset:
	@echo "Resetting only database containers and volumes..."
	docker compose stop auth-db core-db notification-db
	docker compose rm -f -v auth-db core-db notification-db
	docker compose up -d auth-db core-db notification-db
	@echo "✓ Database reset completed (apps untouched)"
