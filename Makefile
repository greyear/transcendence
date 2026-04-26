.PHONY: help up down restart clean re logs logs-db db-status db-reset db-seed dev-api dev-core dev-all test-core test-biome test-jest-core test-jest-api test-jest-all test-all check-node certs

help:
	@echo "Transcendence Development Commands:"
	@echo ""
	@echo "Docker (production-like):"
	@echo "  make up         - Start all services in Docker (databases and microservices)"
	@echo "  make down       - Stop all services (keep data)"
	@echo "  make restart    - Restart all services (keep data)"
	@echo "  make clean      - Stop and remove all services/volumes (no restart)"
	@echo "  make re         - Full rebuild + restart (recreate containers and DB seed)"
	@echo "  make logs       - View logs from all services"
	@echo "  make logs-db    - View database logs (core-db and auth-db)"
	@echo "  make db-status  - Check running containers and their health status"
	@echo "  make db-reset   - Reset only databases (keep app containers)"
	@echo "  make db-seed    - Re-run users/recipes/reviews seeds in running core-db"
	@echo ""
	@echo "Local development (without Docker):"
	@echo "  make dev-api         - Start api-gateway locally (auto-installs deps if needed)"
	@echo "  make dev-core        - Start core-service locally (auto-installs deps if needed)"
	@echo "  make dev-all         - Instructions for running API + Core locally"
	@echo ""
	@echo "Tests:"
	@echo "  make test-core       - Run core-service endpoint smoke tests"
	@echo "  make test-biome      - Run Biome autofix only"
	@echo "  make test-jest-core  - Run Jest unit/integration tests for core-service"
	@echo "  make test-jest-api   - Run Jest unit/integration tests for api-gateway"
	@echo "  make test-jest-all   - Run all Jest tests (core + gateway)"
	@echo "  make test-all        - Run smoke tests + all Jest tests"
	@echo ""
	@echo "Requirements for local dev:"
	@echo "  Node.js >= 18 (recommended 20 LTS)"

certs:
	@chmod +x scripts/generate-certs.sh
	@./scripts/generate-certs.sh

up: certs
	docker-compose up -d
	@echo "✓ Services started"

down:
	docker-compose down
	@echo "✓ Services stopped"

restart:
	docker-compose restart
	@echo "✓ Services restarted"

clean:
	@echo "Cleaning services and volumes (no restart)..."
	docker-compose down -v
	@echo "✓ Cleanup completed"

re: certs
	@echo "Rebuilding and restarting all services..."
	docker-compose down -v --remove-orphans
	docker-compose up -d --build
	@$(MAKE) db-seed
	@echo "✓ Rebuild completed, services are up"

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
	docker-compose stop auth-db core-db
	docker-compose rm -f -v auth-db core-db
	docker-compose up -d auth-db core-db
	@$(MAKE) db-seed
	@echo "✓ Database reset completed (apps untouched)"

db-seed:
	@echo "Waiting for core-db..."
	@until docker exec core-postgres pg_isready -U core_user -d core_db >/dev/null 2>&1; do sleep 1; done
	@echo "Waiting for core-db healthcheck to become healthy..."
	@health_waited=0; \
	until [ "`docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' core-postgres 2>/dev/null`" = "healthy" ]; do \
		if [ $$health_waited -ge 120 ]; then \
			echo "✗ core-db healthcheck timeout."; \
			echo "Inspect logs: docker-compose logs --tail=200 core-db"; \
			exit 1; \
		fi; \
		sleep 1; \
		health_waited=$$((health_waited + 1)); \
	done
	@echo "Waiting for schema initialization (users/recipes/recipe_media)..."
	@schema_waited=0; \
	until [ "`docker exec core-postgres psql -U core_user -d core_db -tAc \"SELECT (to_regclass('public.users') IS NOT NULL) AND (to_regclass('public.recipes') IS NOT NULL) AND (to_regclass('public.recipe_media') IS NOT NULL);\" | tr -d '[:space:]'`" = "t" ]; do \
		if [ $$schema_waited -ge 120 ]; then \
			echo "✗ Schema init timeout. core-db init scripts likely failed."; \
			echo "Inspect logs: docker-compose logs --tail=200 core-db"; \
			exit 1; \
		fi; \
		sleep 1; \
		schema_waited=$$((schema_waited + 1)); \
	done
	@echo "Applying users + recipes + reviews seeds via docker-compose..."
	@run_seed_sql() { \
		seed_file="$$1"; \
		seed_name="$$2"; \
		seed_try=0; \
		until docker-compose exec -T core-db psql -v ON_ERROR_STOP=1 -U core_user -d core_db -f "$$seed_file"; do \
			seed_try=$$((seed_try + 1)); \
			if [ $$seed_try -ge 10 ]; then \
				echo "✗ Failed to apply $$seed_name after $$seed_try attempts."; \
				echo "Inspect logs: docker-compose logs --tail=200 core-db"; \
				exit 1; \
			fi; \
			echo "core-db not ready while applying $$seed_name, retrying ($$seed_try/10)..."; \
			sleep 2; \
		done; \
	}; \
	run_seed_sql /docker-entrypoint-initdb.d/03-seed-users.sql users; \
	run_seed_sql /docker-entrypoint-initdb.d/04-seed-recipes.sql recipes; \
	run_seed_sql /docker-entrypoint-initdb.d/05-seed-reviews.sql reviews
	@echo "Seed counts:"
	@echo "  users:   `docker exec core-postgres psql -U core_user -d core_db -tAc \"SELECT COUNT(*) FROM users;\" | tr -d '[:space:]'`"
	@echo "  recipes: `docker exec core-postgres psql -U core_user -d core_db -tAc \"SELECT COUNT(*) FROM recipes;\" | tr -d '[:space:]'`"
	@echo "  reviews: `docker exec core-postgres psql -U core_user -d core_db -tAc \"SELECT COUNT(*) FROM recipe_reviews;\" | tr -d '[:space:]'`"
	@echo "✓ Seeds applied"

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
	@echo "(if you need auth-service stub in Docker)"
	@echo ""
	@echo "Or use tmux/screen to run them in one window"

test-biome:
	@echo "Running Biome check..."
	npm run check

test-core:
	@echo "Running core-service endpoint smoke tests..."
	npm test

test-jest-core:
	@echo "Running Jest tests for core-service..."
	cd backend/services/core-service && npm i && DATABASE_URL=postgresql://core_user:core_password@localhost:5433/core_db npm test

test-jest-api:
	@echo "Running Jest tests for api-gateway..."
	cd backend/services/api-gateway && npm i && npm test

test-jest-all:
	@echo "Running all Jest tests..."
	@$(MAKE) test-jest-core
	@$(MAKE) test-jest-api

test-all:
	@echo "Running complete test suite (smoke + Jest)..."
	@$(MAKE) test-core
	@$(MAKE) test-jest-all
	@echo "✓ All tests completed"