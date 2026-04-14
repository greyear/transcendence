#!/bin/bash

#This is entirely AI generated. Testing these manually works. So I trust for now.

# Auth Endpoint Test Script
# Tests all auth endpoints with valid, invalid, and edge cases

BASE_URL="https://localhost/auth"
PASS=0
FAIL=0

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Auth API Test Suite"
echo "========================================"

# Helper function to test endpoints
test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local headers=$4
    local data=$5
    local expected_status=$6
    
    echo -e "\n${YELLOW}Testing:${NC} $test_name"
    
    # Build curl command
    local curl_cmd="curl -s --cacert certs/cert.pem -w '%{http_code}' -X $method '$BASE_URL$endpoint'"
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    # Execute curl
    local response=$(eval "$curl_cmd")
    
    # Extract status code (last 3 chars)
    http_code="${response: -3}"
    body="${response%???}"
    
    if [[ "$http_code" == "$expected_status" ]]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "Response: $body"
        fi
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "Response: $body"
        ((FAIL++))
    fi
}

# Helper to extract token from JSON response
extract_token() {
    echo "$1" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4
}

# ========== REGISTER TESTS ==========
echo -e "\n\n${YELLOW}=== REGISTER ENDPOINT TESTS ===${NC}"

# Valid registration
test_endpoint \
    "Valid registration - new user" \
    "POST" \
    "/register" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser1","email":"testuser1@test.local","realname":"Test User 1","password":"TestPass123!"}' \
    "201"

# Duplicate username
test_endpoint \
    "Registration - duplicate username" \
    "POST" \
    "/register" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser1","email":"different@test.local","realname":"Different","password":"TestPass123!"}' \
    "409"

# Duplicate email
test_endpoint \
    "Registration - duplicate email" \
    "POST" \
    "/register" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser2","email":"testuser1@test.local","realname":"Another User","password":"TestPass123!"}' \
    "409"

# Invalid email format
test_endpoint \
    "Registration - invalid email format" \
    "POST" \
    "/register" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser3","email":"notanemail","realname":"Test","password":"TestPass123!"}' \
    "422"

# Password too short
test_endpoint \
    "Registration - password too short" \
    "POST" \
    "/register" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser4","email":"testuser4@test.local","realname":"Test","password":"Short1!"}' \
    "422"

# Password missing uppercase
test_endpoint \
    "Registration - password missing uppercase" \
    "POST" \
    "/register" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser5","email":"testuser5@test.local","realname":"Test","password":"lowercase123!"}' \
    "422"

# Password missing lowercase
test_endpoint \
    "Registration - password missing lowercase" \
    "POST" \
    "/register" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser6","email":"testuser6@test.local","realname":"Test","password":"UPPERCASE123!"}' \
    "422"

# Password missing number
test_endpoint \
    "Registration - password missing number" \
    "POST" \
    "/register" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser7","email":"testuser7@test.local","realname":"Test","password":"NoNumbers!"}' \
    "422"

# Password missing special char
test_endpoint \
    "Registration - password missing special character" \
    "POST" \
    "/register" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser8","email":"testuser8@test.local","realname":"Test","password":"NoSpecial123"}' \
    "422"

# ========== LOGIN TESTS ==========
echo -e "\n\n${YELLOW}=== LOGIN ENDPOINT TESTS ===${NC}"

# Valid login by username
LOGIN_RESPONSE=$(curl -s --cacert certs/cert.pem -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser1","password":"TestPass123!"}')
TOKEN=$(extract_token "$LOGIN_RESPONSE")

test_endpoint \
    "Valid login by username" \
    "POST" \
    "/login" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser1","password":"TestPass123!"}' \
    "200"

# Valid login by email
test_endpoint \
    "Valid login by email" \
    "POST" \
    "/login" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser1@test.local","password":"TestPass123!"}' \
    "200"

# Wrong password
test_endpoint \
    "Login - wrong password" \
    "POST" \
    "/login" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser1","password":"WrongPassword123!"}' \
    "401"

# Non-existent user
test_endpoint \
    "Login - non-existent user" \
    "POST" \
    "/login" \
    '-H "Content-Type: application/json"' \
    '{"username":"nonexistent","password":"TestPass123!"}' \
    "404"

# ========== VALIDATE TESTS ==========
echo -e "\n\n${YELLOW}=== VALIDATE ENDPOINT TESTS ===${NC}"

# Valid token
if [ -n "$TOKEN" ]; then
    test_endpoint \
        "Validate - valid token" \
        "POST" \
        "/validate" \
        "-H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN'" \
        '' \
        "200"
fi

# Missing auth header
test_endpoint \
    "Validate - missing auth header" \
    "POST" \
    "/validate" \
    '-H "Content-Type: application/json"' \
    '' \
    "500"

# Invalid token format
test_endpoint \
    "Validate - invalid token format" \
    "POST" \
    "/validate" \
    '-H "Content-Type: application/json" -H "Authorization: Bearer invalid_token"' \
    '' \
    "500"

# Malformed Authorization header (no Bearer prefix)
test_endpoint \
    "Validate - malformed auth header (no Bearer)" \
    "POST" \
    "/validate" \
    "-H 'Content-Type: application/json' -H 'Authorization: notavalidtoken'" \
    '' \
    "500"

# ========== CHANGE PASSWORD TESTS ==========
echo -e "\n\n${YELLOW}=== CHANGE PASSWORD ENDPOINT TESTS ===${NC}"

# Valid password change
if [ -n "$TOKEN" ]; then
    test_endpoint \
        "Change password - valid" \
        "PATCH" \
        "/change-password/testuser1" \
        "-H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN'" \
        '{"password":"TestPass123!","newPassword":"NewPass456@"}' \
        "200"
fi

# Login with new password to verify change
test_endpoint \
    "Verify new password works - login" \
    "POST" \
    "/login" \
    '-H "Content-Type: application/json"' \
    '{"username":"testuser1","password":"NewPass456@"}' \
    "200"

# Get new token for further tests
NEW_LOGIN=$(curl -s --cacert certs/cert.pem -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser1","password":"NewPass456@"}')
NEW_TOKEN=$(extract_token "$NEW_LOGIN")

# Change password - wrong old password
if [ -n "$NEW_TOKEN" ]; then
    test_endpoint \
        "Change password - wrong old password" \
        "PATCH" \
        "/change-password/testuser1" \
        "-H 'Content-Type: application/json' -H 'Authorization: Bearer $NEW_TOKEN'" \
        '{"password":"WrongPassword123!","newPassword":"AnotherPass789#"}' \
        "401"
fi

# Change password - invalid new password (too short)
if [ -n "$NEW_TOKEN" ]; then
    test_endpoint \
        "Change password - invalid new password (too short)" \
        "PATCH" \
        "/change-password/testuser1" \
        "-H 'Content-Type: application/json' -H 'Authorization: Bearer $NEW_TOKEN'" \
        '{"password":"NewPass456@","newPassword":"Short1!"}' \
        "422"
fi

# Change password - no auth header (should fail)
test_endpoint \
    "Change password - no auth header" \
    "PATCH" \
    "/change-password/testuser1" \
    '-H "Content-Type: application/json"' \
    '{"password":"NewPass456@","newPassword":"Final789#"}' \
    "401"

# Change password - wrong username in URL (token is for testuser1, trying to change testuser2)
if [ -n "$NEW_TOKEN" ]; then
    test_endpoint \
        "Change password - wrong username in URL" \
        "PATCH" \
        "/change-password/testuser2" \
        "-H 'Content-Type: application/json' -H 'Authorization: Bearer $NEW_TOKEN'" \
        '{"password":"NewPass456@","newPassword":"Final789#"}' \
        "401"
fi

# ========== DELETE TESTS ==========
echo -e "\n\n${YELLOW}=== DELETE ENDPOINT TESTS ===${NC}"

# Create user for deletion test
curl -s --cacert certs/cert.pem -X POST "$BASE_URL/register" \
    -H "Content-Type: application/json" \
    -d '{"username":"todelete","email":"todelete@test.local","realname":"To Delete","password":"TestPass123!"}' > /dev/null

# Get token for deletion test
DELETE_LOGIN=$(curl -s --cacert certs/cert.pem -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"todelete","password":"TestPass123!"}')
DELETE_TOKEN=$(extract_token "$DELETE_LOGIN")

# Valid deletion
if [ -n "$DELETE_TOKEN" ]; then
    test_endpoint \
        "Delete - valid deletion" \
        "DELETE" \
        "/delete/todelete" \
        "-H 'Content-Type: application/json' -H 'Authorization: Bearer $DELETE_TOKEN'" \
        '' \
        "200"
fi

# Attempt to login with deleted user
test_endpoint \
    "Delete - verify user deleted (login fails)" \
    "POST" \
    "/login" \
    '-H "Content-Type: application/json"' \
    '{"username":"todelete","password":"TestPass123!"}' \
    "404"

# Delete non-existent user (with valid token)
if [ -n "$NEW_TOKEN" ]; then
    test_endpoint \
        "Delete - non-existent user (auth fails)" \
        "DELETE" \
        "/delete/doesnotexist" \
        "-H 'Content-Type: application/json' -H 'Authorization: Bearer $NEW_TOKEN'" \
        '' \
        "401"
fi

# Delete - no auth header (should fail)
test_endpoint \
    "Delete - no auth header" \
    "DELETE" \
    "/delete/testuser1" \
    '-H "Content-Type: application/json"' \
    '' \
    "401"

# Delete - trying to delete different user (token is for testuser1, not for deletion of testuser2)
if [ -n "$NEW_TOKEN" ]; then
    test_endpoint \
        "Delete - trying to delete different user" \
        "DELETE" \
        "/delete/testuser2" \
        "-H 'Content-Type: application/json' -H 'Authorization: Bearer $NEW_TOKEN'" \
        '' \
        "401"
fi

# ========== SUMMARY ==========
echo -e "\n\n${YELLOW}========================================"
echo "Test Summary"
echo "========================================${NC}"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
TOTAL=$((PASS + FAIL))
echo "Total: $TOTAL"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed.${NC}"
    exit 1
fi
