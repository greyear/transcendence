# Auth Service Endpoints Documentation

## Overview
This document consolidates all authentication service endpoints, including implementation details, validation requirements, and usage patterns.

**Scope**: Auth-service only (all authentication and user account management)

---

## Bottom Line Up Front

| Endpoint | Method | Parameters | Input | Output | Success Code | Error Codes | Auth Required |
|----------|--------|------------|-------|--------|--------------|-------------|---------------|
| `/auth/register` | POST | None | `username`, `email`, `password` | `userId`, `username`, `email`, `message` | 201 | 409, 422, 400 | No |
| `/auth/login` | POST | None | `username` (email or username), `password` | `token`, `user` object | 200 | 401, 404, 400 | No |
| `/auth/google` | POST | None | Google ID Token (in Authorization header) | `token`, `user` object | 201/200 | 401, 500, 409 | No (header auth) |
| `/validate` | POST | None | None (token in header) | `valid: true`, `user` object | 200 | 401, 400 | Yes |
| `/auth/change-password/:username` | PATCH | `username` | `password` (current), `newPassword` | `message`, `user` object | 200 | 401, 403, 400, 404 | Yes (Normal) |

**Key**:
- **Input**: JSON body fields or Authorization header data
- **Output**: Response fields in JSON
- **Success Code**: HTTP status on successful request
- **Error Codes**: Possible HTTP error statuses
- **Auth Required**: Whether `Authorization: Bearer <token>` header is needed

---

## Endpoint Categories

### 1. User Registration

#### `POST /auth/register`
**Purpose**: Register a new user with normal (non-OAuth) authentication

**Request Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Validation Rules**:
- Username: 3-20 characters, alphanumeric with optional underscores, no spaces or special characters
- Email: Valid email format
- Password: Minimum 8 characters, must contain uppercase, lowercase, number, and special character

**Success Response (201)**:
```json
{
  "userId": "string",
  "username": "string",
  "email": "string",
  "message": "User registered successfully"
}
```

**Error Responses**:
- `409 Conflict`: Username already exists, Email already exists
- `422 Unprocessable Entity`: Invalid format, validation failed
- `400 Bad Request`: Missing required fields

**Implementation Notes**:
- Password is hashed before storage
- User is created with normal authentication type
- Email and username uniqueness enforced at database level

---

### 2. User Login (Normal Authentication)

#### `POST /auth/login`
**Purpose**: Login with username/email and password

**Request Body**:
```json
{
  "username": "string (username or email)",
  "password": "string"
}
```

**Success Response (200)**:
```json
{
  "token": "JWT token string",
  "user": {
    "userId": "string",
    "username": "string",
    "email": "string"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Wrong password
- `404 Not Found`: User does not exist
- `400 Bad Request`: Missing credentials

**Implementation Notes**:
- Accepts both username and email in the username field
- Returns JWT token valid for authenticated requests
- Token includes user claims (userId, username, etc.)

---

### 3. Google OAuth Authentication

#### `POST /auth/google`
**Purpose**: Authenticate using Google ID token or create new Google user

**Request Headers**:
```
Authorization: Bearer <Google ID Token>
Content-Type: application/json
```

**Success Responses**:
- `201 Created`: New Google user created
- `200 OK`: Existing Google user logged in

**Response Body**:
```json
{
  "token": "JWT token string",
  "user": {
    "userId": "string",
    "email": "string",
    "name": "string",
    "authType": "google"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authorization header
- `500 Internal Server Error`: Token verification failed, invalid token format
- `409 Conflict`: Email already exists with different auth method

**Implementation Notes**:
- Validates Google ID token signature and expiry
- Creates user if first-time login
- Returns existing user if already registered via Google
- Maintains separate user record from normal auth users
- Cross-auth conflict handling: prevents registering normal user with Google user's email

---

### 4. Token Validation (Normal Auth)

#### `POST /validate`
**Purpose**: Verify JWT token validity for authenticated users

**Request Headers**:
```
Authorization: Bearer <JWT Token>
Content-Type: application/json
```

**Success Response (200)**:
```json
{
  "valid": true,
  "user": {
    "userId": "string",
    "username": "string",
    "email": "string"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing token, invalid token, expired token
- `400 Bad Request`: Malformed token

**Implementation Notes**:
- Validates JWT signature, expiry, and claims
- Does not require request body
- Returns user data embedded in token

---

### 5. Password Change

#### `PATCH /auth/change-password/:username`
**Purpose**: Change password for authenticated normal auth user

**URL Parameters**:
- `username`: Username of the user changing password

**Request Headers**:
```
Authorization: Bearer <JWT Token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "password": "string (current password)",
  "newPassword": "string (new password)"
}
```

**New Password Validation Rules**:
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Cannot be same as current password

**Success Response (200)**:
```json
{
  "message": "Password changed successfully",
  "user": {
    "userId": "string",
    "username": "string"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing auth token, invalid token
- `403 Forbidden`: User attempting to change another user's password
- `400 Bad Request`: Current password is incorrect, new password invalid
- `404 Not Found`: User not found

**Implementation Notes**:
- Requires valid JWT token in Authorization header
- Token username must match URL parameter username
- Old password verification required before change
- Not available for Google-authenticated users
- New password is hashed before storage

---

## Complete Endpoint Summary

| Method | Endpoint | Category | Purpose |
|--------|----------|----------|---------|
| POST | `/auth/register` | Registration | Register normal user |
| POST | `/auth/login` | Login | Login normal user |
| POST | `/auth/google` | Google Auth | Google Sign-In or registration |
| POST | `/validate` | Validation | Validate normal auth token |
| PATCH | `/auth/change-password/:username` | Account | Change user password |

---

## Authentication Flow Diagrams

### Normal Authentication Flow
```
1. User registers with POST /auth/register
   ↓
2. Credentials stored (password hashed)
   ↓
3. User logs in with POST /auth/login
   ↓
4. JWT token returned
   ↓
5. Token included in Authorization header for protected endpoints
   ↓
6. Token verified with POST /validate
```

### Google Authentication Flow
```
1. Frontend obtains Google ID token
   ↓
2. Frontend sends POST /auth/google with token
   ↓
3. Backend verifies Google token signature
   ↓
4. New user created OR existing user retrieved
   ↓
5. JWT token returned
   ↓
6. Token valid for protected endpoints
   ↓
7. Token verified with POST /validate/google
```

### Cross-Auth Conflict Handling
```
Scenario: Google user tries normal login
  → POST /auth/login with Google user's email
  → Returns 401 (auth failed) - Google users must use /auth/google

Scenario: Normal user tries to register with Google user's email
  → POST /auth/register with Google user's email
  → Returns 409 (conflict) - email already exists

Scenario: Normal token used on Google validation
  → POST /validate/google with normal JWT
  → Returns 401 (invalid for this endpoint)

Scenario: Google token used on normal validation
  → POST /validate with Google JWT
  → Returns 401 (invalid for this endpoint)

Scenario: Normal JWT sent to Google auth endpoint
  → POST /auth/google with normal JWT (not Google token)
  → Returns 500 (token verification failed) - not a valid Google token format
```

---

## Key Implementation Details

### Token Structure
- **Type**: JWT (JSON Web Token)
- **Algorithm**: HS256 or RS256 (depending on environment)
- **Expiry**: Configurable (typically 24 hours)
- **Claims**: userId, username/email, email, authType, iat, exp

### Password Security
- **Hashing**: bcrypt with configurable salt rounds
- **Validation**: Uppercase, lowercase, number, and special character required
- **Minimum Length**: 8 characters
- **Storage**: Only hash stored, never plaintext

### Error Handling
- **Validation Errors**: 422 with field-level error details
- **Auth Errors**: 401 for missing/invalid credentials
- **Conflict Errors**: 409 for duplicate username/email or auth type conflicts
- **Not Found**: 404 for non-existent users
- **Server Errors**: 500 for token verification or system failures

### CORS & Security Headers
- **Authorization Header**: Required format is `Bearer <token>`
- **Content-Type**: Must be `application/json`
- **Response Headers**: Appropriate CORS headers included
- **Token Extraction**: Bearer token extraction only (case-insensitive)

---

## Testing

See [TEST_GUIDE.md](./backend/services/auth-service/tests/TEST_GUIDE.md) for comprehensive test suite documentation.

**Available Test Scripts**:
- `test-auth2.sh` - Complete auth test suite (35 tests)
- `test-goog.sh` - Google auth specific tests
- `curls.txt` - Individual curl commands for manual testing

---

## Rate Limiting & Security Considerations

### Recommended Rate Limits
- `/auth/register` - 5 requests per hour per IP
- `/auth/login` - 10 failed attempts per 15 minutes per IP
- `/auth/google` - 20 requests per hour per IP
- `/auth/change-password` - 5 requests per hour per user

### Security Best Practices
- Always use HTTPS in production
- Implement rate limiting on authentication endpoints
- Log authentication failures for security monitoring
- Periodically rotate JWT signing keys
- Implement CSRF protection for web clients
- Store tokens securely on client-side (httpOnly cookies recommended)
- Implement token refresh mechanism for long-lived sessions

---

## Migration & Deployment Notes

### Database Requirements
- User collection with fields: userId, username, email, password (hashed), authType, createdAt, updatedAt
- Unique indexes on username and email
- Separate tracking for Google ID and normal auth credentials

### Environment Variables Required
```
JWT_SECRET=<secret for signing tokens>
GOOGLE_CLIENT_ID=<Google OAuth client ID>
MONGODB_URL=<MongoDB connection string>
```

### Breaking Changes & Deprecations
- Password change endpoint requires Authorization header (not in body)
- Google tokens must come through Authorization header (not body)
- Cross-auth conflicts now properly enforced (previously allowed duplicate emails)
