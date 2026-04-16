#!/bin/bash

GOOGLE_ID_TOKEN="replace with ID"

BASE_URL="https://localhost:8443/auth"

echo "=========================================="
echo "Google Auth Complete Flow Test Suite"
echo "=========================================="

# Test 1: Google Login (creates user)
echo -e "\n1. Google Login - Create New User"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN")
echo "$LOGIN_RESPONSE" | jq .

# Extract session token using jq
SESSION_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

# Test 2: Google Login (existing user)
echo -e "\n2. Google Login - Existing User (should return JWT token)"
LOGIN_RESPONSE2=$(curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN")
echo "$LOGIN_RESPONSE2" | jq .
SESSION_TOKEN=$(echo "$LOGIN_RESPONSE2" | jq -r '.token // empty')

# Test 3: Validate session token
echo -e "\n3. Validate Google Session Token"
if [ -n "$SESSION_TOKEN" ] && [ "$SESSION_TOKEN" != "null" ]; then
  echo "Using token: ${SESSION_TOKEN:0:30}..."
  curl -s -X POST "$BASE_URL/validate/google" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SESSION_TOKEN" | jq .
else
  echo "ERROR: Could not extract session token"
fi

# Test 4: Validate with invalid token
echo -e "\n4. Validate with Invalid Token"
curl -s -X POST "$BASE_URL/validate/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_xyz" | jq .

# Test 5: Validate with missing token
echo -e "\n5. Validate with Missing Token"
curl -s -X POST "$BASE_URL/validate/google" \
  -H "Content-Type: application/json" | jq .

# Test 6: Google login with missing token
echo -e "\n6. Google Login - Missing Token"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" | jq .

# Test 7: Google login with invalid token
echo -e "\n7. Google Login - Invalid Token"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_fake_google_token_123" | jq .

echo -e "\n=========================================="
echo "Tests Complete"
echo "=========================================="
