#!/bin/bash

GOOGLE_ID_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6ImNjZTRlMDI0YTUxYWEwYzFjNDFjMWE0NTE1YTQxZGQ3ZTk2MTkzNmIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0NDM2NDMyOTYzNjItcDV0MGF2ZnR1M2V1Nm5mNzhwOXB2Nm90NWFkb21vcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0NDM2NDMyOTYzNjItcDV0MGF2ZnR1M2V1Nm5mNzhwOXB2Nm90NWFkb21vcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTgwMjAxNTYwNzY1MDY5NTkxMTgiLCJlbWFpbCI6ImR1cmdsZWRvZ2d5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiYWpVcWNzQnNKWVdHLWNaUkhTeF9tUSIsIm5hbWUiOiJEdXJnbGUgRG9nZ3kiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSjhCdGg3dUlJdkNzSVQ0akk0d1Z5NmZSdVRBWmo5VjFpVWkzMFlvalJ0cTJmOGlSbz1zOTYtYyIsImdpdmVuX25hbWUiOiJEdXJnbGUiLCJmYW1pbHlfbmFtZSI6IkRvZ2d5IiwiaWF0IjoxNzc1NTk4OTA3LCJleHAiOjE3NzU2MDI1MDd9.SIO1i2w2rWuIurd7bnw4SaWzzGRqMYxBWOpXeUF2QvzPweRc2hEf8MJDfSk3Z60WNomjerXWpsoiWixQwe1xTU1kf79xhxADsew5Lk7fM-DSo7SR9XlQo9-QpX8ioJgLarxmqNUaSvxgkgPMClND-Aafgo49OuJX1HCwh-kc4fc-GKSiiaKIX2OEqtMOSwIQKB4XuMj8CKxfYH5hcQGeITdxBOms3wzGOSoUeN99eugPo95QhdKcSMHJruVN3V8stDRdRLep7qQ8uucRyAUwzqhD8xpTYT9YED7JsqxHxOtIXTIAEKUsGeXmuignSEjhC7ywl6RaYdMaZfjbrLASMQ"

BASE_URL="http://localhost:3000/auth"

echo "=========================================="
echo "Test: Google User Tries Normal Login"
echo "=========================================="

# Step 1: Create Google user
echo -e "\n1. Creating Google user..."
GOOGLE_RESPONSE=$(curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN")
echo "$GOOGLE_RESPONSE" | jq .

# Extract email
EMAIL=$(echo "$GOOGLE_RESPONSE" | jq -r '.email // empty')
if [ -z "$EMAIL" ] || [ "$EMAIL" = "null" ]; then
  echo "ERROR: Could not extract email from Google response"
  exit 1
fi

echo "Extracted email: $EMAIL"

# Step 2: Try normal login with that email
echo -e "\n2. Attempting normal login with Google user's email..."
echo "Using email: $EMAIL with password: 'testpass123'"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$EMAIL\",
    \"password\": \"testpass123\"
  }")

echo "$LOGIN_RESPONSE" | jq .

# Verify we got the expected error
ERROR_MSG=$(echo "$LOGIN_RESPONSE" | jq -r '.error // empty')
if [[ "$ERROR_MSG" == *"Google Sign-In"* ]]; then
  echo -e "\n✓ SUCCESS: Got expected error message for Google-only account"
else
  echo -e "\n✗ FAILED: Did not get expected error message"
fi

echo -e "\n=========================================="