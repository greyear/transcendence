#!/bin/bash

# AI generated Auth Test Suite - Normal & Google Authentication
# Tests auth endpoints, edge cases, and cross-auth conflicts
# Manual versions of these tests seem to work fine, so I trust this for a quick sanity check.

#This token will need refreshing periodically. https://developers.google.com/oauthplayground
GOOGLE_ID_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6ImNjZTRlMDI0YTUxYWEwYzFjNDFjMWE0NTE1YTQxZGQ3ZTk2MTkzNmIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0NDM2NDMyOTYzNjItcDV0MGF2ZnR1M2V1Nm5mNzhwOXB2Nm90NWFkb21vcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0NDM2NDMyOTYzNjItcDV0MGF2ZnR1M2V1Nm5mNzhwOXB2Nm90NWFkb21vcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTgwMjAxNTYwNzY1MDY5NTkxMTgiLCJlbWFpbCI6ImR1cmdsZWRvZ2d5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoidkRzYVBsbVIzNVc2T1RoTHExVTNQZyIsImlhdCI6MTc3NTYwNTgyNSwiZXhwIjoxNzc1NjA5NDI1fQ.gwQoFgLRewwaIj4FOF5STiG_gR76GXegQY7432MomGM4z_kr_8LdEEi-XAExsFQI1zJX8oD0UPSaBSdoBHowhDJqNOy31StVPYH_y7reV3BY8iF6spop52We-NMDMziv1OdVqggqrjRBtR6NxH_mW_HFEBJRVLOBFm01mGr3Q_XGcthKBIlAskv3kDuG5qg5ShogyQoTvFb5eTYryzOBYH5UshaiGXW81Hsv709RaXXG6LfVEyG_zk-OnFO4LAI0JIQROBhRig5RfZA7MqZuPQYjSTzGHIwAr7VpbU6k8BtKkqn-vK9mnjKXY4eWhL3r9bISoAd3XPaufab8ypUh9Q"

BASE_URL="http://localhost:3000/auth"
PASS=0
FAIL=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "Complete Auth Test Suite"
echo "Normal + Google Authentication"
echo "=========================================="

# Test helper function
test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local headers=$5
    local expected_status=$6
    
    echo -e "\n${YELLOW}Testing:${NC} $test_name"
    
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method '$BASE_URL$endpoint'"
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    local response=$(eval "$curl_cmd")
    local http_code=$(echo "$response" | tail -1)
    local body=$(echo "$response" | head -n -1)
    
    if [[ "$http_code" == "$expected_status" ]]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "Response: $(echo "$body" | jq -c . 2>/dev/null || echo "$body")"
        ((FAIL++))
    fi
}

# ========== 1. NORMAL REGISTRATION TESTS ==========
echo -e "\n\n${BLUE}=== 1. NORMAL REGISTRATION TESTS ===${NC}"

test_endpoint \
    "Register new user - valid" \
    "POST" \
    "/register" \
    '{"username":"normaluser1","email":"normal1@test.local","realname":"Normal User","password":"TestPass123!"}' \
    '-H "Content-Type: application/json"' \
    "201"

test_endpoint \
    "Register - duplicate username" \
    "POST" \
    "/register" \
    '{"username":"normaluser1","email":"other@test.local","realname":"Other","password":"TestPass123!"}' \
    '-H "Content-Type: application/json"' \
    "409"

test_endpoint \
    "Register - duplicate email" \
    "POST" \
    "/register" \
    '{"username":"normaluser2","email":"normal1@test.local","realname":"Other","password":"TestPass123!"}' \
    '-H "Content-Type: application/json"' \
    "409"

test_endpoint \
    "Register - invalid email format" \
    "POST" \
    "/register" \
    '{"username":"normaluser3","email":"notanemail","realname":"Test","password":"TestPass123!"}' \
    '-H "Content-Type: application/json"' \
    "422"

test_endpoint \
    "Register - password too short" \
    "POST" \
    "/register" \
    '{"username":"normaluser4","email":"user4@test.local","realname":"Test","password":"Short1!"}' \
    '-H "Content-Type: application/json"' \
    "422"

test_endpoint \
    "Register - username too short" \
    "POST" \
    "/register" \
    '{"username":"ab","email":"user5@test.local","realname":"Test","password":"TestPass123!"}' \
    '-H "Content-Type: application/json"' \
    "422"

test_endpoint \
    "Register - username too long" \
    "POST" \
    "/register" \
    '{"username":"this_is_a_very_long_username_over_20_chars","email":"user6@test.local","realname":"Test","password":"TestPass123!"}' \
    '-H "Content-Type: application/json"' \
    "422"

test_endpoint \
    "Register - username with spaces" \
    "POST" \
    "/register" \
    '{"username":"user name","email":"user7@test.local","realname":"Test","password":"TestPass123!"}' \
    '-H "Content-Type: application/json"' \
    "422"

test_endpoint \
    "Register - username with special characters" \
    "POST" \
    "/register" \
    '{"username":"user@name!","email":"user8@test.local","realname":"Test","password":"TestPass123!"}' \
    '-H "Content-Type: application/json"' \
    "422"

# ========== 2. NORMAL LOGIN TESTS ==========
echo -e "\n\n${BLUE}=== 2. NORMAL LOGIN TESTS ===${NC}"

test_endpoint \
    "Login - valid by username" \
    "POST" \
    "/login" \
    '{"username":"normaluser1","password":"TestPass123!"}' \
    '-H "Content-Type: application/json"' \
    "200"

test_endpoint \
    "Login - valid by email" \
    "POST" \
    "/login" \
    '{"username":"normal1@test.local","password":"TestPass123!"}' \
    '-H "Content-Type: application/json"' \
    "200"

test_endpoint \
    "Login - wrong password" \
    "POST" \
    "/login" \
    '{"username":"normaluser1","password":"WrongPass123!"}' \
    '-H "Content-Type: application/json"' \
    "401"

test_endpoint \
    "Login - non-existent user" \
    "POST" \
    "/login" \
    '{"username":"doesnotexist","password":"TestPass123!"}' \
    '-H "Content-Type: application/json"' \
    "404"

# Get token for later tests
NORMAL_LOGIN=$(curl -s -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"normaluser1","password":"TestPass123!"}')
NORMAL_TOKEN=$(echo "$NORMAL_LOGIN" | jq -r '.token // empty')

# ========== 3. GOOGLE LOGIN TESTS ==========
echo -e "\n\n${BLUE}=== 3. GOOGLE LOGIN TESTS ===${NC}"

test_endpoint \
    "Google - create new user" \
    "POST" \
    "/google" \
    '' \
    "-H 'Content-Type: application/json' -H 'Authorization: Bearer $GOOGLE_ID_TOKEN'" \
    "201"

# Extract email from first Google login (creation response has email)
GOOGLE_CREATE=$(curl -s -X POST "$BASE_URL/google" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GOOGLE_ID_TOKEN")
GOOGLE_EMAIL=$(echo "$GOOGLE_CREATE" | jq -r '.email // empty')

# If email wasn't in response, decode from JWT token
if [ -z "$GOOGLE_EMAIL" ] || [ "$GOOGLE_EMAIL" = "null" ]; then
    GOOGLE_EMAIL=$(echo "$GOOGLE_ID_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq -r '.email // empty')
fi

test_endpoint \
    "Google - existing user login" \
    "POST" \
    "/google" \
    '' \
    "-H 'Content-Type: application/json' -H 'Authorization: Bearer $GOOGLE_ID_TOKEN'" \
    "200"

# Get Google token for validation tests
GOOGLE_LOGIN=$(curl -s -X POST "$BASE_URL/google" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GOOGLE_ID_TOKEN")
GOOGLE_TOKEN=$(echo "$GOOGLE_LOGIN" | jq -r '.token // empty')

test_endpoint \
    "Google - missing token" \
    "POST" \
    "/google" \
    '' \
    '-H "Content-Type: application/json"' \
    "401"

test_endpoint \
    "Google - invalid token" \
    "POST" \
    "/google" \
    '' \
    "-H 'Content-Type: application/json' -H 'Authorization: Bearer invalid_token_xyz'" \
    "500"


# ========== 4. CROSS-AUTH CONFLICTS ==========
echo -e "\n\n${BLUE}=== 4. CROSS-AUTH CONFLICT TESTS ===${NC}"

# Test: Google user tries normal login with their Google email
if [ -z "$GOOGLE_EMAIL" ] || [ "$GOOGLE_EMAIL" = "null" ]; then
    echo "ERROR: GOOGLE_EMAIL is empty. Cannot run conflict tests."
else
    test_endpoint \
        "Conflict - Google user tries normal login with email" \
        "POST" \
        "/login" \
        "{\"username\":\"$GOOGLE_EMAIL\",\"password\":\"anypassword\"}" \
        '-H "Content-Type: application/json"' \
        "401"
fi

# Test: Try to register normally with a Google user's existing email
if [ -z "$GOOGLE_EMAIL" ] || [ "$GOOGLE_EMAIL" = "null" ]; then
    echo "ERROR: GOOGLE_EMAIL is empty. Cannot run conflict tests."
else
    test_endpoint \
        "Conflict - register normal user with Google user's existing email" \
        "POST" \
        "/register" \
        "{\"username\":\"conflict_user\",\"email\":\"$GOOGLE_EMAIL\",\"realname\":\"Conflict\",\"password\":\"TestPass123!\"}" \
        '-H "Content-Type: application/json"' \
        "409"
fi

# ========== 5. VALIDATION TESTS ==========
echo -e "\n\n${BLUE}=== 5. TOKEN VALIDATION TESTS ===${NC}"

if [ -n "$NORMAL_TOKEN" ] && [ "$NORMAL_TOKEN" != "null" ]; then
    test_endpoint \
        "Validate - normal user with valid token" \
        "POST" \
        "/validate" \
        '' \
        "-H 'Content-Type: application/json' -H 'Authorization: Bearer $NORMAL_TOKEN'" \
        "200"
fi

if [ -n "$GOOGLE_TOKEN" ] && [ "$GOOGLE_TOKEN" != "null" ]; then
    test_endpoint \
        "Validate Google - Google user with valid token" \
        "POST" \
        "/validate/google" \
        '' \
        "-H 'Content-Type: application/json' -H 'Authorization: Bearer $GOOGLE_TOKEN'" \
        "200"
fi

test_endpoint \
    "Validate - missing token" \
    "POST" \
    "/validate" \
    '' \
    '-H "Content-Type: application/json"' \
    "401"

test_endpoint \
    "Validate - invalid token" \
    "POST" \
    "/validate" \
    '' \
    "-H 'Content-Type: application/json' -H 'Authorization: Bearer invalid_token_xyz'" \
    "401"

test_endpoint \
    "Validate Google - missing token" \
    "POST" \
    "/validate/google" \
    '' \
    '-H "Content-Type: application/json"' \
    "401"

# ========== 6. PASSWORD CHANGE TESTS ==========
echo -e "\n\n${BLUE}=== 6. PASSWORD CHANGE TESTS ===${NC}"

if [ -n "$NORMAL_TOKEN" ] && [ "$NORMAL_TOKEN" != "null" ]; then
    test_endpoint \
        "Change password - valid" \
        "PATCH" \
        "/change-password/normaluser1" \
        '{"password":"TestPass123!","newPassword":"NewPass456@"}' \
        "-H 'Content-Type: application/json' -H 'Authorization: Bearer $NORMAL_TOKEN'" \
        "200"
    
    # Verify new password works
    test_endpoint \
        "Login - verify new password works" \
        "POST" \
        "/login" \
        '{"username":"normaluser1","password":"NewPass456@"}' \
        '-H "Content-Type: application/json"' \
        "200"
fi

test_endpoint \
    "Change password - no auth header" \
    "PATCH" \
    "/change-password/normaluser1" \
    '{"password":"NewPass456@","newPassword":"AnotherPass789#"}' \
    '-H "Content-Type: application/json"' \
    "401"

# ========== 7. SUMMARY ==========
echo -e "\n\n${YELLOW}=========================================="
echo "Test Summary"
echo "=========================================${NC}"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
TOTAL=$((PASS + FAIL))
echo "Total: $TOTAL"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ $FAIL test(s) failed.${NC}"
    exit 1
fi
