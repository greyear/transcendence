#!/bin/bash

# Comprehensive Auth Test Suite
# Tests all auth endpoints with both normal and Google authentication
# Tests token passing via both Authorization header and Cookie Jar

# Google ID token - needs refreshing periodically
# https://developers.google.com/oauthplayground
GOOGLE_ID_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6IjY0NzAxNGY5YTRhNGNiYmI2ZTlhYTFmOWUzMGVlNmNjNzBkYTc0MmEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0NDM2NDMyOTYzNjItcDV0MGF2ZnR1M2V1Nm5mNzhwOXB2Nm90NWFkb21vcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0NDM2NDMyOTYzNjItcDV0MGF2ZnR1M2V1Nm5mNzhwOXB2Nm90NWFkb21vcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTgwMjAxNTYwNzY1MDY5NTkxMTgiLCJlbWFpbCI6ImR1cmdsZWRvZ2d5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiNGxETXZySTNXM25QZVFzRDdFa0EtUSIsImlhdCI6MTc3NjYzODc3MiwiZXhwIjoxNzc2NjQyMzcyfQ.DNHzzsobtwdXQx26oxFbHBBfxuIev_OYerUntth6RRc0rrU_P8XU9WM1BJgQDPniHYt9uVM1IJLC3AcOVRFARITzYqUVkH0AqMszH1WPZykRGnKHoUop7Yd2bYVboK1vDcglL24AoHjnRhyxY5erY0n9HtgoWxXN1fPeVBEZmlhv997cy7wFKPfKzR2WLc2bdArj1uOwp_0MnwRf1zIGu2kRa64KWS2qUfzgJjFW1vBg9fIYZSXBsb61VHgI8v0Joebz0SdlP7ZmscJ1m6W__pS3O5IxuCSuAH5a4wVBPKgTYP-MVxW0ntW58ajMMppoZP7j2iAlQFi4BaDfSVNtQw"

BASE_URL="http://localhost:3000/auth"

# Cookie jar files for cookie-based test scenarios
NORMAL_COOKIE_JAR="/tmp/normal-cookie.txt"
GOOGLE_COOKIE_JAR="/tmp/google-cookie.txt"
DELETE_JAR_2="/tmp/delete-2.txt"

# Clean up old jars
rm -f "$NORMAL_COOKIE_JAR" "$GOOGLE_COOKIE_JAR" "$DELETE_JAR_2"

# Function to extract userId from JWT token
extract_user_id_from_token() {
  local token=$1
  # Extract and decode the payload (second part of JWT)
  local payload=$(echo "$token" | cut -d'.' -f2)
  # Add padding if needed
  local padding=$((4 - ${#payload} % 4))
  if [ $padding -ne 4 ]; then
    payload="${payload}$(printf '%0.s=' $(seq 1 $padding))"
  fi
  # Decode and extract userId
  echo "$payload" | base64 -d 2>/dev/null | jq -r '.userId // empty'
}

echo "=========================================="
echo "Comprehensive Auth Test Suite"
echo "Normal + Google Authentication"
echo "Token passing: Header & Cookie Jar"
echo "=========================================="

# Check if server is reachable
echo -e "\nChecking server connectivity..."
if ! curl -s -k "$BASE_URL/validate" > /dev/null 2>&1; then
  echo "WARNING: Server might not be running. Continuing anyway..."
fi
echo "Proceeding with tests..."
echo ""

# ========== 1. NORMAL REGISTRATION & LOGIN ==========
echo -e "\n========== 1. NORMAL REGISTRATION & LOGIN =========="

echo -e "\n1. Register normal user (for header token tests)"
HEADER_TOKEN=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"normaluser@test.local","password":"TestPass123!"}' | jq -r '.token // empty')
echo "Header token registered: ${HEADER_TOKEN:0:30}..."

echo -e "\n1b. Register normal user again (cookie jar test)"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"normaluser2@test.local","password":"TestPass123!"}' \
  -c "$NORMAL_COOKIE_JAR" | jq .

sleep 1

# ========== 2. NORMAL VALIDATION - HEADER & COOKIE ==========
echo -e "\n========== 2. NORMAL VALIDATION - HEADER & COOKIE =========="

echo -e "\n2. Validate - Header token"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HEADER_TOKEN" | jq .

echo -e "\n3. Validate - Cookie jar"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -b "$NORMAL_COOKIE_JAR" | jq .

echo -e "\n3a. Check cookie jar has token"
echo "Cookie jar content:"
grep -c "token" "$NORMAL_COOKIE_JAR" && echo "✓ Cookie present" || echo "✗ No cookie"

sleep 1

# ========== 3. NORMAL LOGOUT - HEADER & COOKIE ==========
echo -e "\n========== 3. NORMAL LOGOUT - HEADER & COOKIE =========="

echo -e "\n4. Logout - Header token"
curl -s -X POST "$BASE_URL/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HEADER_TOKEN" | jq .

sleep 1

echo -e "\n5. Login for cookie logout test (save to jar)"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"normaluser@test.local","password":"TestPass123!"}' \
  -c "$NORMAL_COOKIE_JAR" | jq .

echo -e "\n5a. Check cookie jar has token after login"
grep -c "token" "$NORMAL_COOKIE_JAR" && echo "✓ Cookie present" || echo "✗ No cookie"

echo -e "\n6. Logout - Cookie jar"
curl -s -X POST "$BASE_URL/logout" \
  -H "Content-Type: application/json" \
  -b "$NORMAL_COOKIE_JAR" \
  -c "$NORMAL_COOKIE_JAR" | jq .

echo -e "\n7. Validate after logout - jar should be empty"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -b "$NORMAL_COOKIE_JAR" | jq .

echo -e "\n7a. Check cookie jar is empty after logout"
if grep -q "token" "$NORMAL_COOKIE_JAR"; then
  echo "✗ Cookie still present (NOT empty)"
else
  echo "✓ Cookie jar is empty"
fi

sleep 1

# ========== 4. NORMAL PASSWORD CHANGE - HEADER & COOKIE ==========
echo -e "\n========== 4. NORMAL PASSWORD CHANGE - HEADER & COOKIE =========="

echo -e "\n8. Login for header password change (get token)"
HEADER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"normaluser@test.local","password":"TestPass123!"}')
HEADER_TOKEN=$(echo "$HEADER_LOGIN_RESPONSE" | jq -r '.token // empty')
# Try to get id from response, fall back to extracting from token
HEADER_USER_ID=$(echo "$HEADER_LOGIN_RESPONSE" | jq -r '.id // empty')
if [ -z "$HEADER_USER_ID" ]; then
  HEADER_USER_ID=$(extract_user_id_from_token "$HEADER_TOKEN")
fi
echo "Got token: ${HEADER_TOKEN:0:30}... and userId: $HEADER_USER_ID"

echo -e "\n9. Change password - Header token"
curl -s -X PATCH "$BASE_URL/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HEADER_TOKEN" \
  -d "{\"userId\":$HEADER_USER_ID,\"password\":\"TestPass123!\",\"newPassword\":\"NewPass456@\"}" | jq .

sleep 1

echo -e "\n10. Login for cookie password change (update jar)"
COOKIE_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"normaluser2@test.local","password":"TestPass123!"}' \
  -c "$NORMAL_COOKIE_JAR")
COOKIE_TOKEN=$(echo "$COOKIE_LOGIN_RESPONSE" | jq -r '.token // empty')
# Try to get id from response, fall back to extracting from token
COOKIE_USER_ID=$(echo "$COOKIE_LOGIN_RESPONSE" | jq -r '.id // empty')
if [ -z "$COOKIE_USER_ID" ]; then
  COOKIE_USER_ID=$(extract_user_id_from_token "$COOKIE_TOKEN")
fi
echo "Got token: ${COOKIE_TOKEN:0:30}... and userId: $COOKIE_USER_ID"

echo -e "\n11. Change password - Cookie jar"
curl -s -X PATCH "$BASE_URL/change-password" \
  -H "Content-Type: application/json" \
  -b "$NORMAL_COOKIE_JAR" \
  -c "$NORMAL_COOKIE_JAR" \
  -d "{\"userId\":$COOKIE_USER_ID,\"password\":\"TestPass123!\",\"newPassword\":\"NewPass456@\"}" | jq .

sleep 1

echo -e "\n12. Login with new password - Header token"
HEADER_TOKEN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"normaluser@test.local","password":"NewPass456@"}' | jq -r '.token // empty')
echo "Got new token: ${HEADER_TOKEN:0:30}..."

echo -e "\n13. Login with new password - Cookie jar"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"normaluser2@test.local","password":"NewPass456@"}' \
  -c "$NORMAL_COOKIE_JAR" | jq .

sleep 1

# ========== 5. NORMAL /ME ENDPOINT - HEADER & COOKIE ==========
echo -e "\n========== 5. NORMAL /ME ENDPOINT - HEADER & COOKIE =========="

echo -e "\n14. /me - Header token"
curl -s -X GET "$BASE_URL/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HEADER_TOKEN" | jq .

echo -e "\n15. /me - Cookie jar"
curl -s -X GET "$BASE_URL/me" \
  -H "Content-Type: application/json" \
  -b "$NORMAL_COOKIE_JAR" | jq .

sleep 1

# ========== 6. NORMAL DELETE - HEADER & COOKIE ==========
echo -e "\n========== 6. NORMAL DELETE - HEADER & COOKIE =========="

echo -e "\n16. Register user for deletion (header test)"
HEADER_DELETE_RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"deletetest1@test.local","password":"TestPass123!"}')
HEADER_TOKEN_DELETE=$(echo "$HEADER_DELETE_RESPONSE" | jq -r '.token // empty')
HEADER_USER_ID=$(echo "$HEADER_DELETE_RESPONSE" | jq -r '.id // empty')
echo "Got token: ${HEADER_TOKEN_DELETE:0:30}... and userId: $HEADER_USER_ID"

echo -e "\n17. Delete user - Header token"
curl -s -X DELETE "$BASE_URL/delete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HEADER_TOKEN_DELETE" \
  -d "{\"userId\":$HEADER_USER_ID}" | jq .

echo -e "\n18. Validate deletion - should fail"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HEADER_TOKEN_DELETE" | jq .

echo -e "\n18b. Login attempt with deleted user - Header"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"deletetest1@test.local","password":"TestPass123!"}' | jq .

sleep 1

echo -e "\n19. Register user for deletion (cookie jar)"
COOKIE_DELETE_RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"deletetest2@test.local","password":"TestPass123!"}' \
  -c "$DELETE_JAR_2")
COOKIE_DELETE_USER_ID=$(echo "$COOKIE_DELETE_RESPONSE" | jq -r '.id // empty')
echo "Got userId: $COOKIE_DELETE_USER_ID"

echo -e "\n20. Delete user - Cookie jar"
curl -s -X DELETE "$BASE_URL/delete" \
  -H "Content-Type: application/json" \
  -b "$DELETE_JAR_2" \
  -c "$DELETE_JAR_2" \
  -d "{\"userId\":$COOKIE_DELETE_USER_ID}" | jq .

echo -e "\n21. Validate deletion - should fail"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -b "$DELETE_JAR_2" | jq .

echo -e "\n21b. Login attempt with deleted user - Cookie jar"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"deletetest2@test.local","password":"TestPass123!"}' | jq .

sleep 1

# ========== 7. GOOGLE LOGIN ==========
echo -e "\n========== 7. GOOGLE LOGIN =========="

echo -e "\n21. Google login (header test - get token)"
GOOGLE_HEADER_TOKEN=$(curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN" | jq -r '.token // empty')
echo "Got token: ${GOOGLE_HEADER_TOKEN:0:30}..."

echo -e "\n21b. Google login (cookie jar)"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN" \
  -c "$GOOGLE_COOKIE_JAR" | jq .

sleep 1

# ========== 8. GOOGLE VALIDATION - HEADER & COOKIE ==========
echo -e "\n========== 8. GOOGLE VALIDATION - HEADER & COOKIE =========="

echo -e "\n22. Validate - Google header token"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_HEADER_TOKEN" | jq .

echo -e "\n23. Validate - Google cookie jar"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -b "$GOOGLE_COOKIE_JAR" | jq .

sleep 1

# ========== 9. GOOGLE LOGOUT - HEADER & COOKIE ==========
echo -e "\n========== 9. GOOGLE LOGOUT - HEADER & COOKIE =========="

echo -e "\n24. Logout - Google header token"
curl -s -X POST "$BASE_URL/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_HEADER_TOKEN" | jq .

sleep 1

echo -e "\n25. Google login again for cookie logout (save to jar)"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN" \
  -c "$GOOGLE_COOKIE_JAR" | jq .

echo -e "\n25a. Check cookie jar has token after Google login"
grep -c "token" "$GOOGLE_COOKIE_JAR" && echo "✓ Cookie present" || echo "✗ No cookie"

echo -e "\n26. Logout - Google cookie jar"
curl -s -X POST "$BASE_URL/logout" \
  -H "Content-Type: application/json" \
  -b "$GOOGLE_COOKIE_JAR" \
  -c "$GOOGLE_COOKIE_JAR" | jq .

echo -e "\n27. Validate after logout - jar should be empty"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -b "$GOOGLE_COOKIE_JAR" | jq .

echo -e "\n27a. Check cookie jar is empty after Google logout"
if grep -q "token" "$GOOGLE_COOKIE_JAR"; then
  echo "✗ Cookie still present (NOT empty)"
else
  echo "✓ Cookie jar is empty"
fi

sleep 1

# ========== 10. GOOGLE /ME ENDPOINT - HEADER & COOKIE ==========
echo -e "\n========== 10. GOOGLE /ME ENDPOINT - HEADER & COOKIE =========="

echo -e "\n28. Google login for /me test (header token and cookie jar)"
GOOGLE_ME_RESPONSE=$(curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN" \
  -c "$GOOGLE_COOKIE_JAR")
GOOGLE_HEADER_TOKEN_ME=$(echo "$GOOGLE_ME_RESPONSE" | jq -r '.token // empty')
echo "Got token: ${GOOGLE_HEADER_TOKEN_ME:0:30}..."

echo -e "\n29. /me - Google header token"
curl -s -X GET "$BASE_URL/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_HEADER_TOKEN_ME" | jq .

echo -e "\n30. /me - Google cookie jar"
curl -s -X GET "$BASE_URL/me" \
  -H "Content-Type: application/json" \
  -b "$GOOGLE_COOKIE_JAR" | jq .

sleep 1

# ========== 11. GOOGLE DELETE - HEADER & COOKIE ==========
echo -e "\n========== 11. GOOGLE DELETE - HEADER & COOKIE =========="

echo -e "\n31. Google login for delete test (header token)"
GOOGLE_DELETE_HEADER_RESPONSE=$(curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN")
GOOGLE_HEADER_TOKEN_DELETE=$(echo "$GOOGLE_DELETE_HEADER_RESPONSE" | jq -r '.token // empty')
# Try to get id from response, fall back to extracting from token
GOOGLE_HEADER_USER_ID=$(echo "$GOOGLE_DELETE_HEADER_RESPONSE" | jq -r '.id // empty')
if [ -z "$GOOGLE_HEADER_USER_ID" ]; then
  GOOGLE_HEADER_USER_ID=$(extract_user_id_from_token "$GOOGLE_HEADER_TOKEN_DELETE")
fi
echo "Got token: ${GOOGLE_HEADER_TOKEN_DELETE:0:30}... and userId: $GOOGLE_HEADER_USER_ID"

echo -e "\n32. Delete Google user - Header token"
curl -s -X DELETE "$BASE_URL/delete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_HEADER_TOKEN_DELETE" \
  -d "{\"userId\":$GOOGLE_HEADER_USER_ID}" | jq .

echo -e "\n33. Validate Google deletion - should fail"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_HEADER_TOKEN_DELETE" | jq .

echo -e "\n33b. Google login attempt with deleted user - Header"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN" | jq .

sleep 1

echo -e "\n34. Google login for cookie delete test (save to jar)"
GOOGLE_DELETE_COOKIE_RESPONSE=$(curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN" \
  -c "$GOOGLE_COOKIE_JAR")
GOOGLE_COOKIE_DELETE_TOKEN=$(echo "$GOOGLE_DELETE_COOKIE_RESPONSE" | jq -r '.token // empty')
# Try to get id from response, fall back to extracting from token
GOOGLE_COOKIE_DELETE_USER_ID=$(echo "$GOOGLE_DELETE_COOKIE_RESPONSE" | jq -r '.id // empty')
if [ -z "$GOOGLE_COOKIE_DELETE_USER_ID" ]; then
  GOOGLE_COOKIE_DELETE_USER_ID=$(extract_user_id_from_token "$GOOGLE_COOKIE_DELETE_TOKEN")
fi
echo "Got userId: $GOOGLE_COOKIE_DELETE_USER_ID"

echo -e "\n35. Delete Google user - Cookie jar"
curl -s -X DELETE "$BASE_URL/delete" \
  -H "Content-Type: application/json" \
  -b "$GOOGLE_COOKIE_JAR" \
  -c "$GOOGLE_COOKIE_JAR" \
  -d "{\"userId\":$GOOGLE_COOKIE_DELETE_USER_ID}" | jq .

echo -e "\n36. Validate Google deletion - should fail"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -b "$GOOGLE_COOKIE_JAR" | jq .

echo -e "\n36b. Google login attempt with deleted user - Cookie jar"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN" \
  -b "$GOOGLE_COOKIE_JAR" | jq .

# ========== 12. EDGE CASES & ERROR HANDLING ==========
echo -e "\n========== 12. EDGE CASES & ERROR HANDLING =========="

echo -e "\n36. Validate without token"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" | jq .

echo -e "\n37. Logout without token"
curl -s -X POST "$BASE_URL/logout" \
  -H "Content-Type: application/json" | jq .

echo -e "\n38. /me without token"
curl -s -X GET "$BASE_URL/me" \
  -H "Content-Type: application/json" | jq .

echo -e "\n39. Delete without token"
curl -s -X DELETE "$BASE_URL/delete" \
  -H "Content-Type: application/json" \
  -d '{"userId":999999}' | jq .

echo -e "\n40. Change password without token"
curl -s -X PATCH "$BASE_URL/change-password" \
  -H "Content-Type: application/json" \
  -d '{"userId":999999,"password":"old","newPassword":"NewPass123!"}' | jq .

echo -e "\n41. Validate with invalid token"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid.token.here" | jq .

echo -e "\n42. Logout with invalid token"
curl -s -X POST "$BASE_URL/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid.token.here" | jq .

echo -e "\n=========================================="
echo "Comprehensive Tests Complete"
echo "=========================================="
