#!/bin/bash
# Smoke tests for API endpoints
# Usage: ./test-endpoints.sh

set -e

BASE_URL="${API_BASE_URL:-http://localhost:3000}"
FAIL=0
TESTS_PASSED=0
TESTS_FAILED=0

echo "================================"
echo "🧪 API Endpoint Smoke Tests"
echo "================================"
echo "Base URL: $BASE_URL"
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

echo "Health Checks:"
check_endpoint "/health" "200" "GET /health"
check_endpoint "/health/db" "200" "GET /health/db"

echo ""
echo "Recipe Endpoints:"
check_endpoint "/recipes" "200" "GET /recipes (list)"
check_endpoint "/recipes/1" "200" "GET /recipes/1 (test recipe)"
check_endpoint "/recipes/999" "404" "GET /recipes/999 (non-existent)"

echo ""
echo "Validation Tests:"
check_endpoint "/recipes/abc" "400" "GET /recipes/abc (invalid ID)"
check_endpoint "/recipes/12.4" "400" "GET /recipes/12.4 (decimal)"
check_endpoint "/recipes/-5" "400" "GET /recipes/-5 (negative)"
check_endpoint "/recipes/.1" "400" "GET /recipes/.1 (starts with dot)"
check_endpoint "/recipes/40a" "400" "GET /recipes/40a (alphanumeric)"

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
