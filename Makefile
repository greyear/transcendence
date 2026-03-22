.PHONY: help up down restart clean logs logs-db db-status db-reset wait-core-seed dev-api dev-core dev-all test-core test-biome test-jest-core test-jest-api test-jest-all test-all check-node

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
	@echo "  make test-biome      - Run Biome autofix, then smoke tests"
	@echo "  make test-jest-core  - Run Jest unit/integration tests for core-service"
	@echo "  make test-jest-api   - Run Jest unit/integration tests for api-gateway"
	@echo "  make test-jest-all   - Run all Jest tests (core + gateway)"
	@echo "  make test-all        - Run smoke tests + all Jest tests"
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
	@$(MAKE) wait-core-seed
	@echo "✓ Fresh database initialized with seed data"

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
	@$(MAKE) wait-core-seed
	@echo "✓ Database reset completed (apps untouched)"

wait-core-seed:
	@echo "Waiting for core-db to become ready..."
	@until docker exec core-postgres pg_isready -U core_user -d core_db >/dev/null 2>&1; do sleep 1; done
	@echo "Waiting for core seed data (users.id=1)..."
	@until [ "`docker exec core-postgres psql -U core_user -d core_db -tAc \"SELECT COUNT(*) FROM users WHERE id = 1;\" | tr -d '[:space:]'`" = "1" ]; do sleep 1; done
	@echo "✓ Core DB seed data is ready"

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

# ===== Code Quality & Formatting =====
# Biome autofix + smoke tests for code consistency

test-biome:
	@echo "Running Biome autofix + core-service endpoint smoke tests..."
	npm run test:fix

# ===== Smoke Tests =====
# Functional black-box tests using bash scripts
# These test the entire stack with Docker containers

test-core:
	@echo "Running core-service endpoint smoke tests..."
	npm test

# ===== Jest Tests =====
# Unit and integration tests using Jest + Supertest
# These test individual services without requiring Docker

test-jest-core:
	@echo "Running Jest tests for core-service..."
	cd backend/services/core-service && npm test

test-jest-api:
	@echo "Running Jest tests for api-gateway..."
	cd backend/services/api-gateway && npm test

test-jest-all:
	@echo "Running all Jest tests..."
	@$(MAKE) test-jest-core
	@$(MAKE) test-jest-api

test-all:
	@echo "Running complete test suite (smoke + Jest)..."
	@$(MAKE) test-core
	@$(MAKE) test-jest-all
	@echo "✓ All tests completed"

