#!/bin/bash

GOOGLE_ID_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6ImNjZTRlMDI0YTUxYWEwYzFjNDFjMWE0NTE1YTQxZGQ3ZTk2MTkzNmIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0NDM2NDMyOTYzNjItcDV0MGF2ZnR1M2V1Nm5mNzhwOXB2Nm90NWFkb21vcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0NDM2NDMyOTYzNjItcDV0MGF2ZnR1M2V1Nm5mNzhwOXB2Nm90NWFkb21vcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTgwMjAxNTYwNzY1MDY5NTkxMTgiLCJlbWFpbCI6ImR1cmdsZWRvZ2d5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiYWpVcWNzQnNKWVdHLWNaUkhTeF9tUSIsIm5hbWUiOiJEdXJnbGUgRG9nZ3kiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSjhCdGg3dUlJdkNzSVQ0akk0d1Z5NmZSdVRBWmo5VjFpVWkzMFlvalJ0cTJmOGlSbz1zOTYtYyIsImdpdmVuX25hbWUiOiJEdXJnbGUiLCJmYW1pbHlfbmFtZSI6IkRvZ2d5IiwiaWF0IjoxNzc1NTk4OTA3LCJleHAiOjE3NzU2MDI1MDd9.SIO1i2w2rWuIurd7bnw4SaWzzGRqMYxBWOpXeUF2QvzPweRc2hEf8MJDfSk3Z60WNomjerXWpsoiWixQwe1xTU1kf79xhxADsew5Lk7fM-DSo7SR9XlQo9-QpX8ioJgLarxmqNUaSvxgkgPMClND-Aafgo49OuJX1HCwh-kc4fc-GKSiiaKIX2OEqtMOSwIQKB4XuMj8CKxfYH5hcQGeITdxBOms3wzGOSoUeN99eugPo95QhdKcSMHJruVN3V8stDRdRLep7qQ8uucRyAUwzqhD8xpTYT9YED7JsqxHxOtIXTIAEKUsGeXmuignSEjhC7ywl6RaYdMaZfjbrLASMQ"

BASE_URL="http://localhost:3000/auth"

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