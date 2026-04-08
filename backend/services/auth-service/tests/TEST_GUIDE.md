# Auth Service Test Suite Guide

This guide explains how to use the `test-auth2.sh` automated test suite to verify the authentication service functionality.

## Overview

The test suite (`test-auth2.sh`) performs comprehensive testing of:
- **Normal Authentication**: User registration, login, and password changes
- **Google Authentication**: Google Sign-In, user creation, and existing user login
- **Cross-Auth Conflicts**: Ensuring proper handling of users registered via different auth methods
- **Token Validation**: JWT token verification for both normal and Google auth
- **Edge Cases**: Invalid inputs, duplicate accounts, missing credentials, etc.

**Total Tests**: ~30 test cases covering all major auth workflows

All 30 of these tests are depicted in curl form in the file curls.txt.

---

## Prerequisites

Before running the tests, ensure:

1. **Services are running**:
   ```bash
   docker-compose up -d
   ```

2. **Auth service is accessible** at `http://localhost:3000/auth`

3. **MongoDB is running** and accessible

4. **Database is clean** (recommended for first run):
   ```bash
   # Connect to MongoDB shell
   mongosh
   # Switch to auth database
   use auth_db
   # Clear user collection
   db.usermodels.deleteMany({})
   # Clear counter collection
   db.usercounters.deleteMany({})
   ```

5. **Required tools installed**:
   - `bash` (usually pre-installed)
   - `curl` (for making HTTP requests)
   - `jq` (for parsing JSON responses)

   Install jq if needed:
   ```bash
   # macOS
   brew install jq
   
   # Ubuntu/Debian
   sudo apt-get install jq
   ```

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


> **Note**: Google ID tokens expire within an hour. If tests fail with "token verification" errors, the token needs to be refreshed from Google OAuth Playground.

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


=== 1. NORMAL REGISTRATION TESTS ===

Testing: Register new user - valid
✓ PASS (HTTP 201)

Testing: Register - duplicate username
✓ PASS (HTTP 409)

...

=== 3. GOOGLE LOGIN TESTS ===

Testing: Google - create new user
✓ PASS (HTTP 201)

Testing: Google - existing user login
✓ PASS (HTTP 200)

...

==========================================
Test Summary
==========================================
Passed: 28
Failed: 0
Total: 28

✓ All tests passed!
```

---

## Understanding Test Results

### Color Coding

- 🟢 **GREEN**: Test passed (Expected HTTP status received)
- 🔴 **RED**: Test failed (Unexpected HTTP status)
- 🔵 **BLUE**: Section headers
- 🟡 **YELLOW**: Individual test names

### Exit Codes

- `0` (Success): All tests passed
- `1` (Failure): One or more tests failed

### Reading Failure Output

When a test fails, you'll see:

```
Testing: Google - create new user
✗ FAIL (Expected 201, got 409)
Response: {"error":"Email or googleID already exists"}
```

This tells you:
- Expected HTTP 201 (Created)
- Got HTTP 409 (Conflict)
- Error message: Email or googleID already exists
- Usually means the user already exists in the database

---

## Test Sections Explained

### 1. Normal Registration Tests

Tests user registration with various scenarios:
- Valid registration (should pass)
- Duplicate username (should fail with 409)
- Duplicate email (should fail with 409)
- Invalid email format (should fail with 422)
- Password too short (should fail with 422)
- Username validation edge cases (should fail with 422)

### 2. Normal Login Tests

Tests user login functionality:
- Login by username (should pass)
- Login by email (should pass)
- Wrong password (should fail with 401)
- Non-existent user (should fail with 404)

### 3. Google Login Tests

Tests Google Sign-In:
- Create new user with Google credentials (should pass)
- Existing user login with same Google account (should pass)
- Missing token (should fail with 401)
- Invalid token (should fail with 500)

### 4. Cross-Auth Conflict Tests

Tests interactions between normal and Google auth:
- Google user cannot login normally with their email (should fail with 401)
- Cannot register normal user with Google user's email (should fail with 409)

### 5. Token Validation Tests

Tests JWT token verification:
- Valid token validation passes (should pass)
- Missing token fails (should fail with 401)
- Invalid token fails (should fail with 401)

### 6. Password Change Tests

Tests password modification:
- Change password with valid token (should pass)
- New password works for login (should pass)
- No auth header fails (should fail with 401)

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
test_endpoint \
    "Test Description" \
    "POST" \
    "/endpoint-path" \
    '{"json":"payload"}' \
    '-H "Content-Type: application/json"' \
    "200"
```

Parameters:
1. **Test name**: Descriptive label
2. **HTTP method**: GET, POST, PATCH, DELETE, etc.
3. **Endpoint**: Path relative to `/auth` base
4. **Data**: JSON payload (empty string `''` if none)
5. **Headers**: Additional headers in `-H` format
6. **Expected Status**: HTTP status code expected on success

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

