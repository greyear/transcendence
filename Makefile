.PHONY: help up down restart clean logs logs-db db-status db-reset dev-api dev-core dev-all test-core test-core-fix check-node

help:
	@echo "Transcendence Development Commands:"
	@echo ""
	@echo "Docker (production-like):"
	@echo "  make up         - Start all services in Docker (databases and microservices)"
	@echo "  make down       - Stop all services (keep data)"
	@echo "  make restart    - Restart all services (keep data)"
	@echo "  make clean      - Full reset (all services, all volumes)"
	@echo "  make logs       - View logs from all services"
	@echo "  make logs-db    - View database logs (core-db and auth-db)"
	@echo "  make db-status  - Check running containers and their health status"
	@echo "  make db-reset   - Reset only databases (keep app containers)"
	@echo ""
	@echo "Local development (without Docker):"
	@echo "  make dev-api         - Start api-gateway locally (auto-installs deps if needed)"
	@echo "  make dev-core        - Start core-service locally (auto-installs deps if needed)"
	@echo "  make dev-all         - Instructions for running API + Core locally"
	@echo ""
	@echo "Tests:"
	@echo "  make test-core       - Run core-service endpoint smoke tests"
	@echo "  make test-core-fix   - Run Biome autofix, then core-service smoke tests"
	@echo ""
	@echo "Requirements for local dev:"
	@echo "  Node.js >= 18 (recommended 20 LTS)"

up:
	docker-compose up -d
	@echo "✓ Services started"

down:
	docker-compose down
	@echo "✓ Services stopped"

restart:
	docker-compose restart
	@echo "✓ Services restarted"

clean:
	@echo "Cleaning volumes and restarting database..."
	docker-compose down -v
	docker-compose up -d
	@echo "✓ Fresh database initialized"

logs:
	docker-compose logs -f

logs-db:
	docker-compose logs -f core-db auth-db

db-status:
	@echo "Container Status:"
	docker-compose ps
	@echo ""
	@echo "Health Status:"
	docker-compose ps --format "table {{.Service}}\t{{.Status}}"

db-reset:
	@echo "Resetting only database containers and volumes..."
	docker-compose stop auth-db core-db notification-db
	docker-compose rm -f -v auth-db core-db notification-db
	docker-compose up -d auth-db core-db notification-db
	@echo "✓ Database reset completed (apps untouched)"

test-core:
	@echo "Running core-service endpoint smoke tests..."
	npm test

test-core-fix:
	@echo "Running Biome autofix + core-service endpoint smoke tests..."
	npm run test:fix

check-node:
	@node -e 'const major=Number(process.versions.node.split(".")[0]); if (major < 18) { console.error("Node.js >= 18 is required for local dev (current: " + process.versions.node + ")"); console.error("Install Node.js 20 LTS, then retry make dev-api/dev-core."); process.exit(1); }'

dev-api:
	@echo "Starting api-gateway locally..."
	@$(MAKE) check-node
	cd backend/services/api-gateway && if [ ! -x node_modules/.bin/tsx ] || [ ! -d node_modules/dotenv ]; then npm install; fi && npm run dev

dev-core:
	@echo "Starting core-service locally..."
	@$(MAKE) check-node
	cd backend/services/core-service && if [ ! -x node_modules/.bin/tsx ] || [ ! -d node_modules/dotenv ]; then npm install; fi && npm run dev

dev-all:
	@echo "Run locally in separate terminals:"
	@echo ""
	@echo "  Terminal 1: make dev-api"
	@echo "  Terminal 2: make dev-core"
	@echo ""
	@echo "Optional (in another terminal): make up"
	@echo "(if you need auth-service and notification-service stubs in Docker)"
	@echo ""
	@echo "Or use tmux/screen to run them in one window"
