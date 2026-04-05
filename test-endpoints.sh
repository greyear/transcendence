#!/bin/bash
# Smoke tests for API endpoints
# Usage: ./test-endpoints.sh

set -e

BASE_URL="${API_BASE_URL:-http://localhost:3000}"
SMOKE_BEARER_TOKEN="${SMOKE_BEARER_TOKEN:-}"
FAIL=0
TESTS_PASSED=0
TESTS_FAILED=0

echo "================================"
echo "🧪 API Endpoint Smoke Tests"
echo "================================"
echo "Base URL: $BASE_URL"
if [ -n "$SMOKE_BEARER_TOKEN" ]; then
  echo "Auth mode: enabled (SMOKE_BEARER_TOKEN is set)"
else
  echo "Auth mode: disabled (set SMOKE_BEARER_TOKEN to run authenticated POST checks)"
fi
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_endpoint() {
  local path="$1"
  local expected_status="$2"
  local description="${3:-$path}"
  
  local url="$BASE_URL$path"
  local actual_status
  
  actual_status=$(curl -sS -o /tmp/test-resp.json -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  
  if [ "$actual_status" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} $description -> $actual_status"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} $description -> got $actual_status, expected $expected_status"
    echo "   Response: $(head -c 100 /tmp/test-resp.json)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAIL=1
  fi
}

check_post_endpoint() {
  local path="$1"
  local payload="$2"
  local expected_status="$3"
  local description="${4:-POST $path}"

  local url="$BASE_URL$path"
  local actual_status

  actual_status=$(curl -sS -o /tmp/test-resp.json -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "$url" 2>/dev/null || echo "000")

  if [ "$actual_status" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} $description -> $actual_status"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} $description -> got $actual_status, expected $expected_status"
    echo "   Response: $(head -c 100 /tmp/test-resp.json)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAIL=1
  fi
}

check_post_endpoint_auth() {
  local path="$1"
  local payload="$2"
  local expected_status="$3"
  local description="${4:-POST $path}"

  local url="$BASE_URL$path"
  local actual_status

  actual_status=$(curl -sS -o /tmp/test-resp.json -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SMOKE_BEARER_TOKEN" \
    -d "$payload" \
    "$url" 2>/dev/null || echo "000")

  if [ "$actual_status" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} $description -> $actual_status"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} $description -> got $actual_status, expected $expected_status"
    echo "   Response: $(head -c 100 /tmp/test-resp.json)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAIL=1
  fi
}

check_put_endpoint() {
  local path="$1"
  local payload="$2"
  local expected_status="$3"
  local description="${4:-PUT $path}"

  local url="$BASE_URL$path"
  local actual_status

  actual_status=$(curl -sS -o /tmp/test-resp.json -w "%{http_code}" \
    -X PUT \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "$url" 2>/dev/null || echo "000")

  if [ "$actual_status" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} $description -> $actual_status"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} $description -> got $actual_status, expected $expected_status"
    echo "   Response: $(head -c 100 /tmp/test-resp.json)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAIL=1
  fi
}

check_delete_endpoint() {
  local path="$1"
  local expected_status="$2"
  local description="${3:-DELETE $path}"

  local url="$BASE_URL$path"
  local actual_status

  actual_status=$(curl -sS -o /tmp/test-resp.json -w "%{http_code}" \
    -X DELETE \
    "$url" 2>/dev/null || echo "000")

  if [ "$actual_status" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} $description -> $actual_status"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} $description -> got $actual_status, expected $expected_status"
    echo "   Response: $(head -c 100 /tmp/test-resp.json)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAIL=1
  fi
}

echo "Health Checks:"
check_endpoint "/health" "200" "GET /health"
check_endpoint "/health/db" "200" "GET /health/db"

echo ""
echo "Recipe Endpoints:"
check_endpoint "/recipes" "200" "GET /recipes (list)"
check_endpoint "/recipes/1" "200" "GET /recipes/1 (test recipe)"
check_endpoint "/recipes/999" "404" "GET /recipes/999 (non-existent)"

echo ""
echo "User Endpoints:"
check_endpoint "/users" "200" "GET /users (list)"
check_endpoint "/users/1" "200" "GET /users/1 (profile)"
check_endpoint "/users/999999" "404" "GET /users/999999 (non-existent user)"

echo ""
echo "User Recipe Endpoints:"
check_endpoint "/users/1/recipes" "200" "GET /users/1/recipes (public recipes)"
check_endpoint "/users/999/recipes" "404" "GET /users/999/recipes (non-existent user)"
check_endpoint "/users/me/recipes" "401" "GET /users/me/recipes (no token -> 401)"

echo ""
echo "Validation Tests:"
check_endpoint "/recipes/abc" "400" "GET /recipes/abc (invalid ID)"
check_endpoint "/recipes/12.4" "400" "GET /recipes/12.4 (decimal)"
check_endpoint "/recipes/-5" "400" "GET /recipes/-5 (negative)"
check_endpoint "/recipes/.1" "400" "GET /recipes/.1 (starts with dot)"
check_endpoint "/recipes/40a" "400" "GET /recipes/40a (alphanumeric)"
check_endpoint "/users/abc" "400" "GET /users/abc (invalid user ID)"
check_endpoint "/users/abc/recipes" "400" "GET /users/abc/recipes (invalid user ID)"

echo ""
echo "POST Endpoints:"
check_post_endpoint "/recipes" '{"title":"Smoke Recipe","description":"Created by smoke test","instructions":["Mix ingredients"],"servings":2,"spiciness":0,"ingredients":[{"ingredient_id":1,"amount":100,"unit":"g"}],"category_ids":[]}' "401" "POST /recipes (no token -> 401)"
check_post_endpoint "/recipes/1/publish" '{}' "401" "POST /recipes/1/publish (no token -> 401)"

echo ""
echo "PUT/DELETE Endpoints:"
check_put_endpoint "/recipes/1" '{"title":"Smoke Update","description":"Updated by smoke test","instructions":["Mix ingredients"],"servings":2,"spiciness":0,"ingredients":[{"ingredient_id":1,"amount":100,"unit":"g"}],"category_ids":[]}' "401" "PUT /recipes/1 (no token -> 401)"
check_delete_endpoint "/recipes/1" "401" "DELETE /recipes/1 (no token -> 401)"

if [ -n "$SMOKE_BEARER_TOKEN" ]; then
  echo ""
  echo "POST Endpoints (authenticated):"

  check_post_endpoint_auth "/recipes" '{"title":"Smoke Auth Recipe","description":"Created by authenticated smoke test","instructions":["Measure ingredients","Cook"],"servings":2,"spiciness":1,"ingredients":[{"ingredient_id":1,"amount":150,"unit":"g"}],"category_ids":[]}' "201" "POST /recipes (with token -> 201)"

  created_recipe_id=$(sed -n 's/.*"id"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' /tmp/test-resp.json | head -n 1)

  if [ -n "$created_recipe_id" ]; then
    check_post_endpoint_auth "/recipes/$created_recipe_id/publish" '{}' "200" "POST /recipes/$created_recipe_id/publish (with token -> 200)"
  else
    echo -e "${RED}✗${NC} Failed to parse recipe id from authenticated create response"
    echo "   Response: $(head -c 160 /tmp/test-resp.json)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAIL=1
  fi
fi

echo ""
echo "================================"
if [ "$FAIL" -ne 0 ]; then
  echo -e "${RED}❌ FAILED${NC}"
  echo "Passed: $TESTS_PASSED | Failed: $TESTS_FAILED"
  exit 1
else
  echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
  echo "Total tests: $TESTS_PASSED"
  exit 0
fi
