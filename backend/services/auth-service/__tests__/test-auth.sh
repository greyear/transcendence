#!/bin/bash

# Auth Test Suite - Normal & Google Authentication
# Tests auth endpoints, edge cases, and cross-auth conflicts
# Manual versions of these tests seem to work fine, so I trust this for a quick sanity check.

#This token will need refreshing periodically. https://developers.google.com/oauthplayground
GOOGLE_ID_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6ImIzZDk1Yjk1ZmE0OGQxODBiODVmZmU4MDgyZmNmYTIxNzRiMDQ2NjciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0NDM2NDMyOTYzNjItcDV0MGF2ZnR1M2V1Nm5mNzhwOXB2Nm90NWFkb21vcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0NDM2NDMyOTYzNjItcDV0MGF2ZnR1M2V1Nm5mNzhwOXB2Nm90NWFkb21vcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTgwMjAxNTYwNzY1MDY5NTkxMTgiLCJlbWFpbCI6ImR1cmdsZWRvZ2d5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiZWY0RTdmVXdBTlFwOTE1V1ZKdXBvUSIsIm5hbWUiOiJEdXJnbGUgRG9nZ3kiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSjhCdGg3dUlJdkNzSVQ0akk0d1Z5NmZSdVRBWmo5VjFpVWkzMFlvalJ0cTJmOGlSbz1zOTYtYyIsImdpdmVuX25hbWUiOiJEdXJnbGUiLCJmYW1pbHlfbmFtZSI6IkRvZ2d5IiwiaWF0IjoxNzc2MjAxNzE2LCJleHAiOjE3NzYyMDUzMTZ9.tYqXyMqI2BvM5XLN9Xgc7RpapMFexOwmCqHoDlA9VN4sHT4CmV-y_2WRARTO6CDZJpbnG-TNZSmo5tDHy5UZRRhJeo0v1XO8cP9ii2cNUu5iwFW12UyjSzGIOpBXvStEdFkbTc_cNlHY04w25yrgwWHcCGhpKlNtLF2DyppIjSNGSSsMadZv-DdIEsCbqZ41x5BT0QG6yxPKsrqU7Jza8OOtAHnUi_yXcxSIMPECq3FpDqYFlQwlHe0qXBvdgG6Z3dpFIp98yjUf_PClCNIzVG_UCfClNrfvyIrNQcdh9DPEUFrmkZpvE39rqp_C6kvBuOvVTfV-FtB6Sf5RiKhlPw"

BASE_URL="http://localhost:3000/auth"

echo "=========================================="
echo "Complete Auth Test Suite"
echo "Normal + Google Authentication"
echo "=========================================="

# ========== 1. NORMAL REGISTRATION TESTS ==========
echo -e "\n========== 1. NORMAL REGISTRATION TESTS =========="

echo -e "\n1. Register new user - valid"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"normal1@test.local","password":"TestPass123!"}' | jq .

echo -e "\n2. Register - duplicate email"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"normal1@test.local","password":"TestPass456@"}' | jq .

echo -e "\n3. Register - invalid email format"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"TestPass123!"}' | jq .

echo -e "\n4. Register - password too short"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"user4@test.local","password":"Short1!"}' | jq .

echo -e "\n5. Register - password no uppercase"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"user5@test.local","password":"testpass123!"}' | jq .

echo -e "\n6. Register - missing email"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"password":"TestPass123!"}' | jq .

# ========== 2. NORMAL LOGIN TESTS ==========
echo -e "\n========== 2. NORMAL LOGIN TESTS =========="

echo -e "\n7. Login - valid by email"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"normal1@test.local","password":"TestPass123!"}' | jq .

# Sleep to ensure token timestamps differ
sleep 1

echo -e "\n8. Login - wrong password"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"normal1@test.local","password":"WrongPass123!"}' | jq .

echo -e "\n9. Login - non-existent email"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"doesnotexist@test.local","password":"TestPass123!"}' | jq .

echo -e "\n10. Login - missing email field"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"TestPass123!"}' | jq .

# Extract token for later tests
echo -e "\n11. Login - extract token for later tests"
NORMAL_LOGIN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"normal1@test.local","password":"TestPass123!"}')
NORMAL_TOKEN=$(echo "$NORMAL_LOGIN" | jq -r '.token // empty')
echo "$NORMAL_LOGIN" | jq .
echo "TOKEN: ${NORMAL_TOKEN:0:30}..."

# ========== 3. GOOGLE LOGIN TESTS ==========
echo -e "\n========== 3. GOOGLE LOGIN TESTS =========="

sleep 1

echo -e "\n12. Google - create new user"
GOOGLE_RESPONSE=$(curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN")
echo "$GOOGLE_RESPONSE" | jq .

sleep 1

echo -e "\n13. Google - existing user login"
GOOGLE_RESPONSE=$(curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN")
echo "$GOOGLE_RESPONSE" | jq .

# Extract Google email and token
GOOGLE_EMAIL=$(echo "$GOOGLE_ID_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq -r '.email // empty')
GOOGLE_TOKEN=$(echo "$GOOGLE_RESPONSE" | jq -r '.token // empty')
echo -e "Google Email: $GOOGLE_EMAIL"
echo -e "Google Token: ${GOOGLE_TOKEN:0:30}..."

# Extract Google user ID early for use in cross-auth tests
GOOGLE_USER_ID=""
if [ -n "$GOOGLE_TOKEN" ] && [ "$GOOGLE_TOKEN" != "null" ]; then
  GOOGLE_USER_ID=$(curl -s -X POST "$BASE_URL/validate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GOOGLE_TOKEN" | jq -r '.id // empty')
  echo -e "Google User ID: $GOOGLE_USER_ID"
fi

echo -e "\n14. Google - missing token"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" | jq .

echo -e "\n15. Google - invalid token"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_xyz" | jq .


# ========== 4. CROSS-AUTH CONFLICT TESTS ==========
echo -e "\n========== 4. CROSS-AUTH CONFLICT TESTS =========="

echo -e "\n16. Conflict - Google user tries normal login with their email"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$GOOGLE_EMAIL\",\"password\":\"anypassword\"}" | jq .

echo -e "\n17. Conflict - Register normal user with Google user's existing email"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$GOOGLE_EMAIL\",\"password\":\"TestPass123!\"}" | jq .

echo -e "\n18. Conflict - Try to register with Google user's existing email (second attempt)"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$GOOGLE_EMAIL\",\"password\":\"TestPass456@\"}" | jq .

echo -e "\n19. Conflict - Normal user tries to use Google auth endpoint"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NORMAL_TOKEN" | jq .

echo -e "\n20. Conflict - Attempt to register with existing normal user's email using Google"
# Note: This would need an actual Google token with a normal1@test.local email
echo "SKIPPED: Would require Google account with normal1@test.local email"

echo -e "\n21. Conflict - Try to change password on Google user (should fail)"
if [ -n "$GOOGLE_TOKEN" ] && [ "$GOOGLE_TOKEN" != "null" ] && [ -n "$GOOGLE_USER_ID" ]; then
  curl -s -X PATCH "$BASE_URL/change-password" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GOOGLE_TOKEN" \
    -d '{"password":"oldpass","newPassword":"NewPass456@"}' | jq .
else
  echo "SKIPPED: No Google token or user ID"
fi

# ========== 5. TOKEN VALIDATION TESTS ==========
echo -e "\n========== 5. TOKEN VALIDATION TESTS =========="

echo -e "\n22. Validate - normal user with valid token"
if [ -n "$NORMAL_TOKEN" ] && [ "$NORMAL_TOKEN" != "null" ]; then
	VALIDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/validate" \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer $NORMAL_TOKEN")
	echo "$VALIDATE_RESPONSE" | jq .
	NORMAL_USER_ID=$(echo "$VALIDATE_RESPONSE" | jq -r '.id // empty')
	echo "NORMAL_USER_ID: $NORMAL_USER_ID"
	else echo "SKIPPED: No normal token"
fi

echo -e "\n23. Validate - Google user with valid token"
if [ -n "$GOOGLE_TOKEN" ] && [ "$GOOGLE_TOKEN" != "null" ]; then
	VALIDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/validate" \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer $GOOGLE_TOKEN")
	echo "$VALIDATE_RESPONSE" | jq .
	GOOGLE_USER_ID=$(echo "$VALIDATE_RESPONSE" | jq -r '.id // empty')
	echo "GOOGLE_USER_ID: $GOOGLE_USER_ID"
else echo "SKIPPED: No Google token"
fi

echo -e "\n24. Validate - missing token"
curl -s -X POST "$BASE_URL/validate" \
	-H "Content-Type: application/json" | jq .

echo -e "\n25. Validate - invalid token"
curl -s -X POST "$BASE_URL/validate" \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer invalid_token_xyz" | jq .

# ========== 6. EXTENDED TOKEN VALIDATION - EDGE CASES ==========
echo -e "\n========== 6. EXTENDED TOKEN VALIDATION - EDGE CASES =========="

echo -e "\n26. Validate - malformed auth header (missing Bearer prefix)"
if [ -n "$NORMAL_TOKEN" ] && [ "$NORMAL_TOKEN" != "null" ]; then
	curl -s -X POST "$BASE_URL/validate" \
		-H "Content-Type: application/json" \
		-H "Authorization: $NORMAL_TOKEN" | jq .
fi

echo -e "\n27. Validate - empty bearer token"
curl -s -X POST "$BASE_URL/validate" \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer " | jq .

echo -e "\n28. Validate - completely invalid JWT structure"
curl -s -X POST "$BASE_URL/validate" \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer totally.not.a.jwt" | jq .

echo -e "\n29. Validate - random string as token"
curl -s -X POST "$BASE_URL/validate" \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer randomstringnotavalidtoken" | jq .


# ========== 7. PASSWORD CHANGE TESTS ==========
echo -e "\n========== 7. PASSWORD CHANGE TESTS =========="

echo -e "\n30. Change password - valid"
if [ -n "$NORMAL_TOKEN" ] && [ "$NORMAL_TOKEN" != "null" ] && [ -n "$NORMAL_USER_ID" ]; then
  CHANGE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/change-password" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $NORMAL_TOKEN" \
    -d "{\"email\":\"normal1@test.local\",\"userId\":$NORMAL_USER_ID,\"password\":\"TestPass123!\",\"newPassword\":\"NewPass456@\"}")
  echo "RAW: $CHANGE_RESPONSE"
  echo "$CHANGE_RESPONSE" | jq .
else
  echo "SKIPPED: No normal token or user ID"
fi

echo -e "\n31. Login - verify new password works"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"normal1@test.local","password":"NewPass456@"}' | jq .

echo -e "\n32. Change password - no auth header"
if [ -n "$NORMAL_USER_ID" ]; then
  curl -s -X PATCH "$BASE_URL/change-password" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"normal1@test.local\",\"userId\":$NORMAL_USER_ID,\"password\":\"NewPass456@\",\"newPassword\":\"AnotherPass789#\"}" | jq .
else
  echo "SKIPPED: No user ID"
fi

echo -e "\n33. Change password - wrong current password"
if [ -n "$NORMAL_TOKEN" ] && [ "$NORMAL_TOKEN" != "null" ] && [ -n "$NORMAL_USER_ID" ]; then
  curl -s -X PATCH "$BASE_URL/change-password" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $NORMAL_TOKEN" \
    -d "{\"email\":\"normal1@test.local\",\"userId\":$NORMAL_USER_ID,\"password\":\"WrongCurrentPass\",\"newPassword\":\"AnotherPass789#\"}" | jq .
else
  echo "SKIPPED: No normal token or user ID"
fi

echo -e "\n=========================================="
echo "Tests Complete"
echo "=========================================="
