#!/bin/bash

GOOGLE_ID_TOKEN="replace wiht ID"

BASE_URL="https://localhost:8443/auth"

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
