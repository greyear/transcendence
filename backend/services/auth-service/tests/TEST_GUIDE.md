# Auth Service Test Suite Guide

This guide explains how to use the `test-auth2.sh` automated test suite to verify the authentication service functionality.

## Overview

The test suite (`test-auth2.sh`) performs comprehensive testing of:
- **Normal Authentication**: User registration, login, and password changes
- **Google Authentication**: Google Sign-In, user creation, and existing user login
- **Cross-Auth Conflicts**: Ensuring proper handling of users registered via different auth methods
- **Token Validation**: JWT token verification for both normal and Google auth
- **Edge Cases**: Invalid inputs, duplicate accounts, missing credentials, etc.

**Total Tests**: 35 test cases covering all major auth workflows

All tests use direct curl commands with JSON output parsing via `jq` for easy reading.

---

## Prerequisites

Before running the tests, ensure:

1. **Services are running**:
   ```bash
   docker-compose up -d
   ```

2. **Auth service is accessible** at `http://localhost:3000/auth`

3. **MongoDB is running** and accessible
	```
	docker exec -it auth-mongo mongosh -u <user> -p <password>
	-
	use auth_db
	db.usermodels.find()
	db.usercounters.find()
	```

4. **Database is clean** (recommended for first run):
   ```
	docker exec -it auth-mongo mongosh -u <user> -p <password>
	-
	use auth_db
	db.usermodels.deleteMany({})
	db.usercounters.deleteMany({})
   ```

5. **Required tools installed**:
   - `bash` (usually pre-installed)
   - `curl` (for making HTTP requests)
   - `jq` (for parsing JSON responses)


---

## Setting Up the Google Token

Google authentication tests require a valid Google ID token.

### Getting a Google ID Token

1. Visit [Google OAuth Playground](https://developers.google.com/oauthplayground)

2. In the left sidebar:
   - Click **Google OAuth2 API v2**
   - Select **userinfo.profile** and **userinfo.email** scopes

3. Click the gear in the top right and check **Use your own OAuth credentials**

4. Enter **OAuth Client ID** and **OAuth Client secret**

5. Click **Authorize APIs** and sign in with your Google account, authorise access to ft_transcendence if needed

6. After authorization, follow the instructions in the **Step 2** section

7. Copy the **id_token**

### Updating the Test Script

Edit `test-auth2.sh` and replace the placeholder:

```bash
GOOGLE_ID_TOKEN="insert token when needed"
```

With your actual token


> **Note**: Google ID tokens expire within an hour. If tests fail with "Token used too late" or similar errors, the token needs to be refreshed from Google OAuth Playground.

---

## Running the Tests

### Step 1: Navigate to the Tests Directory

```bash
cd backend/services/auth-service/tests
```

### Step 2: Make the Script Executable if needed

```bash
chmod +x test-auth2.sh
```

### Step 3: Run the Test Suite

```bash
./test-auth2.sh
```

### Example Output

```
==========================================
Complete Auth Test Suite
Normal + Google Authentication
==========================================

========== 1. NORMAL REGISTRATION TESTS ==========

1. Register new user - valid
{
  "userId": "123456",
  "username": "normaluser1",
  "email": "normal1@test.local",
  "message": "User registered successfully"
}

2. Register - duplicate username
{
  "error": "Username already exists"
}

3. Register - duplicate email
{
  "error": "Email already exists"
}

...

========== 4. CROSS-AUTH CONFLICT TESTS ==========

19. Conflict - Google user tries normal login with their email
{
  "error": "Authentication failed"
}

...

========== 6. PASSWORD CHANGE TESTS ==========

35. Change password - wrong current password
{
  "error": "Current password is incorrect"
}

==========================================
Tests Complete
==========================================
```

---

## Understanding Test Results

### Reading Test Output

Each test displays:
1. A numbered test description (e.g., "1. Register new user - valid")
2. The JSON response from the API formatted by `jq`

### Evaluating Results

**Success indicators:**
- Check the HTTP status codes in responses (201 for created, 200 for success, 401 for unauthorized, 409 for conflict, etc.)
- Look for expected fields in the JSON response (e.g., "token", "userId", "message")
- For login/registration, presence of a "token" field indicates success

**Failure indicators:**
- "error" field in the JSON response indicates the test failed
- Unexpected HTTP status codes (check actual status vs expected)
- Missing expected fields in the response

### Example: Reading a Failure

If you see:
```
3. Register - duplicate email
{
  "error": "Email already exists"
}
```

This indicates the test is working correctly - it properly rejected a duplicate email registration.

---

## Test Sections Explained

### 1. Normal Registration Tests (Tests 1-9)

Tests user registration with various scenarios:
- Valid registration (should succeed with 201 and token)
- Duplicate username (should fail with 409)
- Duplicate email (should fail with 409)
- Invalid email format (should fail with 422)
- Password too short (should fail with 422)
- Username validation edge cases (should fail with 422)

### 2. Normal Login Tests (Tests 10-14)

Tests user login functionality:
- Login by username (should succeed with token)
- Login by email (should succeed with token)
- Wrong password (should fail with 401)
- Non-existent user (should fail with 404)
- Token extraction for use in later tests

### 3. Google Login Tests (Tests 15-18)

Tests Google Sign-In:
- Create new user with Google credentials (should succeed)
- Existing user login with same Google account (should succeed and return token)
- Missing token (should fail with 401)
- Invalid token (should fail with 500)

### 4. Cross-Auth Conflict Tests (Tests 19-26)

Comprehensive tests for interactions between normal and Google auth:
- Google user attempts normal login with their email (should fail)
- Attempts to register normal user with Google user's existing email (should fail)
- Multiple registration attempts with Google email (should fail)
- Normal user tries Google auth endpoint (should fail)
- Normal user token fails on Google validation endpoint
- Google token fails on normal validation endpoint
- Google user attempts password change (should fail)

### 5. Token Validation Tests (Tests 27-31)

Tests JWT token verification:
- Valid normal user token validation (should succeed)
- Valid Google user token validation (should succeed)
- Missing token validation (should fail with 401)
- Invalid token validation (should fail with 401)
- Missing Google token validation (should fail with 401)

### 6. Password Change Tests (Tests 32-35)

Tests password modification:
- Change password with valid token (should succeed)
- New password works for login (should succeed)
- No auth header fails (should fail with 401)
- Wrong current password fails (should fail with 401)

---

## Troubleshooting

### Issue: Tests fail with "Connection refused"

**Solution**: Ensure services are running:
```bash
docker-compose up -d
docker-compose logs auth-service  # Check for startup errors
```

### Issue: Google tests fail with token errors

**Solution**: Refresh the Google ID token from Google OAuth Playground (tokens expire)

### Issue: Tests fail with "Email already exists" even after clean database

**Solution**: Clear MongoDB completely:
```bash
mongosh
use auth_db
db.usermodels.deleteMany({})
db.usercounters.deleteMany({})
exit
```

### Issue: Some tests pass but others fail inconsistently

**Solution**: Ensure sufficient sleep time between tests. The script includes 1-second delays to allow database operations to complete. If you still see issues, try adding longer delays:

Edit the test script and increase sleep durations:
```bash
sleep 2  # Instead of sleep 1
```

### Issue: "jq" command not found

**Solution**: Install jq:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Fedora/RHEL
sudo dnf install jq
```

---

## Running Tests Manually

If you prefer to test endpoints manually instead of using the script, see [curls.txt](./curls.txt) for individual curl commands.

---

## Modifying Tests

To add new test cases, follow this pattern:

```bash
echo -e "\n[TEST_NUMBER]. [Test Description]"
curl -s -X [METHOD] "$BASE_URL/[endpoint]" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"key":"value"}' | jq .
```

Example:
```bash
echo -e "\n36. Example test"
curl -s -X POST "$BASE_URL/example-endpoint" \
  -H "Content-Type: application/json" \
  -d '{"example":"data"}' | jq .
```

**Key points:**
- Always use `echo -e` with `\n` to separate test output
- Pipe curl output to `jq .` for readable JSON formatting
- Use `-s` flag for curl to suppress progress
- Use `$BASE_URL` for the auth service base URL
- Use `$NORMAL_TOKEN` for normal user tokens or `$GOOGLE_TOKEN` for Google tokens

---

## Testing Checklist

Before committing code changes, ensure:

- [ ] Database is clean (`db.usermodels.deleteMany({})`)
- [ ] Google token is fresh (from Google OAuth Playground)
- [ ] Services are running and responsive
- [ ] All tests pass (0 failures)
- [ ] No connection errors or timeouts
- [ ] Response data matches expectations

---

## Summary

| Task | Command |
|------|---------|
| Clean database | `mongosh` → `use auth_db` → `db.usermodels.deleteMany({})` |
| Get Google token | Visit [Google OAuth Playground](https://developers.google.com/oauthplayground) |
| Run tests | `./test-auth2.sh` |
| View specific logs | `docker-compose logs auth-service` |
| Restart services | `docker-compose down && docker-compose up -d` |

