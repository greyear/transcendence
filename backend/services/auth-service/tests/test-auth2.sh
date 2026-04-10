#!/bin/bash

# AI generated Auth Test Suite - Normal & Google Authentication
# Tests auth endpoints, edge cases, and cross-auth conflicts
# Manual versions of these tests seem to work fine, so I trust this for a quick sanity check.

#This token will need refreshing periodically. https://developers.google.com/oauthplayground
GOOGLE_ID_TOKEN="insert token here"

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
  -d '{"username":"normaluser1","email":"normal1@test.local","password":"TestPass123!"}' | jq .

echo -e "\n2. Register - duplicate username"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"normaluser1","email":"other@test.local","password":"TestPass123!"}' | jq .

echo -e "\n3. Register - duplicate email"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"normaluser2","email":"normal1@test.local","password":"TestPass123!"}' | jq .

echo -e "\n4. Register - invalid email format"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"normaluser3","email":"notanemail","password":"TestPass123!"}' | jq .

echo -e "\n5. Register - password too short"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"normaluser4","email":"user4@test.local","password":"Short1!"}' | jq .

echo -e "\n6. Register - username too short"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"ab","email":"user5@test.local","password":"TestPass123!"}' | jq .

echo -e "\n7. Register - username too long"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"this_is_a_very_long_username_over_20_chars","email":"user6@test.local","password":"TestPass123!"}' | jq .

echo -e "\n8. Register - username with spaces"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"user name","email":"user7@test.local","password":"TestPass123!"}' | jq .

echo -e "\n9. Register - username with special characters"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"user@name!","email":"user8@test.local","password":"TestPass123!"}' | jq .

# ========== 2. NORMAL LOGIN TESTS ==========
echo -e "\n========== 2. NORMAL LOGIN TESTS =========="

echo -e "\n10. Login - valid by username"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"normaluser1","password":"TestPass123!"}' | jq .

echo -e "\n11. Login - valid by email"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"normal1@test.local","password":"TestPass123!"}' | jq .

echo -e "\n12. Login - wrong password"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"normaluser1","password":"WrongPass123!"}' | jq .

echo -e "\n13. Login - non-existent user"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"doesnotexist","password":"TestPass123!"}' | jq .

# Extract token for later tests
echo -e "\n14. Login - extract token for later tests"
NORMAL_LOGIN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"normaluser1","password":"TestPass123!"}')
NORMAL_TOKEN=$(echo "$NORMAL_LOGIN" | jq -r '.token // empty')
echo "$NORMAL_LOGIN" | jq .
echo "TOKEN: ${NORMAL_TOKEN:0:30}..."

# ========== 3. GOOGLE LOGIN TESTS ==========
echo -e "\n========== 3. GOOGLE LOGIN TESTS =========="

echo -e "\n15. Google - create new user"
GOOGLE_RESPONSE=$(curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN")
echo "$GOOGLE_RESPONSE" | jq .

sleep 1

echo -e "\n16. Google - existing user login"
GOOGLE_RESPONSE=$(curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_ID_TOKEN")
echo "$GOOGLE_RESPONSE" | jq .

# Extract Google email and token
GOOGLE_EMAIL=$(echo "$GOOGLE_ID_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq -r '.email // empty')
GOOGLE_TOKEN=$(echo "$GOOGLE_RESPONSE" | jq -r '.token // empty')
echo -e "Google Email: $GOOGLE_EMAIL"
echo -e "Google Token: ${GOOGLE_TOKEN:0:30}..."

echo -e "\n17. Google - missing token"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" | jq .

echo -e "\n18. Google - invalid token"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_xyz" | jq .


# ========== 4. CROSS-AUTH CONFLICT TESTS ==========
echo -e "\n========== 4. CROSS-AUTH CONFLICT TESTS =========="

echo -e "\n19. Conflict - Google user tries normal login with their email"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$GOOGLE_EMAIL\",\"password\":\"anypassword\"}" | jq .

echo -e "\n20. Conflict - Register normal user with Google user's existing email"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"conflict_user\",\"email\":\"$GOOGLE_EMAIL\",\"password\":\"TestPass123!\"}" | jq .

echo -e "\n21. Conflict - Try to register with Google user's existing email (different username)"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"another_conflict\",\"email\":\"$GOOGLE_EMAIL\",\"password\":\"TestPass123!\"}" | jq .

echo -e "\n22. Conflict - Normal user tries to use Google auth endpoint"
curl -s -X POST "$BASE_URL/google" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NORMAL_TOKEN" | jq .

echo -e "\n23. Conflict - Attempt to register with existing normal user's email using Google"
# Note: This would need an actual Google token with a normaluser1@test.local email
echo "SKIPPED: Would require Google account with normaluser1@test.local email"

echo -e "\n24. Conflict - Normal user token should fail on Google validation endpoint"
if [ -n "$NORMAL_TOKEN" ] && [ "$NORMAL_TOKEN" != "null" ]; then
  curl -s -X POST "$BASE_URL/validate/google" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $NORMAL_TOKEN" | jq .
fi

echo -e "\n25. Conflict - Google token should fail on normal validation endpoint"
if [ -n "$GOOGLE_TOKEN" ] && [ "$GOOGLE_TOKEN" != "null" ]; then
  curl -s -X POST "$BASE_URL/validate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GOOGLE_TOKEN" | jq .
fi

echo -e "\n26. Conflict - Try to change password on Google user (should fail)"
if [ -n "$GOOGLE_TOKEN" ] && [ "$GOOGLE_TOKEN" != "null" ]; then
  curl -s -X PATCH "$BASE_URL/change-password/googleuser" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GOOGLE_TOKEN" \
    -d '{"password":"oldpass","newPassword":"newpass"}' | jq .
fi

# ========== 5. TOKEN VALIDATION TESTS ==========
echo -e "\n========== 5. TOKEN VALIDATION TESTS =========="

echo -e "\n27. Validate - normal user with valid token"
if [ -n "$NORMAL_TOKEN" ] && [ "$NORMAL_TOKEN" != "null" ]; then
  curl -s -X POST "$BASE_URL/validate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $NORMAL_TOKEN" | jq .
fi

echo -e "\n28. Validate Google - Google user with valid token"
if [ -n "$GOOGLE_TOKEN" ] && [ "$GOOGLE_TOKEN" != "null" ]; then
  curl -s -X POST "$BASE_URL/validate/google" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GOOGLE_TOKEN" | jq .
fi

echo -e "\n29. Validate - missing token"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" | jq .

echo -e "\n30. Validate - invalid token"
curl -s -X POST "$BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_xyz" | jq .

echo -e "\n31. Validate Google - missing token"
curl -s -X POST "$BASE_URL/validate/google" \
  -H "Content-Type: application/json" | jq .

# ========== 6. PASSWORD CHANGE TESTS ==========
echo -e "\n========== 6. PASSWORD CHANGE TESTS =========="

echo -e "\n32. Change password - valid"
if [ -n "$NORMAL_TOKEN" ] && [ "$NORMAL_TOKEN" != "null" ]; then
  curl -s -X PATCH "$BASE_URL/change-password/normaluser1" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $NORMAL_TOKEN" \
    -d '{"password":"TestPass123!","newPassword":"NewPass456@"}' | jq .
fi

echo -e "\n33. Login - verify new password works"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"normaluser1","password":"NewPass456@"}' | jq .

echo -e "\n34. Change password - no auth header"
curl -s -X PATCH "$BASE_URL/change-password/normaluser1" \
  -H "Content-Type: application/json" \
  -d '{"password":"NewPass456@","newPassword":"AnotherPass789#"}' | jq .

echo -e "\n35. Change password - wrong current password"
if [ -n "$NORMAL_TOKEN" ] && [ "$NORMAL_TOKEN" != "null" ]; then
  curl -s -X PATCH "$BASE_URL/change-password/normaluser1" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $NORMAL_TOKEN" \
    -d '{"password":"WrongCurrentPass","newPassword":"AnotherPass789#"}' | jq .
fi

echo -e "\n=========================================="
echo "Tests Complete"
echo "=========================================="
