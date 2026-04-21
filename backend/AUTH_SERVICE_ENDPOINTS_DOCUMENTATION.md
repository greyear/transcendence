# Auth service endpoints documentation

## Overview
This document consolidates all authentication service endpoints, including implementation details, validation requirements, and usage patterns.

**Scope**: Auth-service only (all authentication and user account management)

---

## Bottom Line Up Front

| Endpoint | Method | Parameters | Input | Output | Success Code | Error Codes | Auth Required |
|----------|--------|------------|-------|--------|--------------|-------------|---------------|
| `/auth/register` | POST | None | `email`, `password` | `id`, `email`, `token`, `message` | 201 | 409, 422, 500 | No |
| `/auth/login` | POST | None | `email`, `password` | `token`, `message` | 200 | 401, 404 | No |
| `/auth/google` | POST | None | Google ID Token (Authorization header) | `token`, `message`, user fields | 201/200 | 401, 409, 500 | No (header auth) |
| `/auth/validate` | POST | None | Token (Authorization header) | `id` | 200 | 401, 500 | Yes |
| `/auth/me` | GET | None | Token (Authorization header) | `id`, `email` | 200 | 401, 404 | Yes |
| `/auth/delete` | DELETE | None | `userId` (body) | `message` | 200 | 401, 404 | Yes |
| `/auth/change-password` | PATCH | None | `userId`, `password`, `newPassword` (body) | `message` | 200 | 401, 422, 404, 500 | Yes |

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
**Purpose**: Register a new user with email/password authentication

**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Validation Rules**:
- Email: Valid email format (validated via Zod)
- Password: 8–64 characters, must contain at least one uppercase, one lowercase, one number, and one special character

**Success Response (201)**:
```json
{
  "id": "number",
  "email": "string",
  "token": "JWT token string",
  "message": "Login successful"
}
```

Token is also set as an `httpOnly` cookie named `token` (1 hour expiry).

**Error Responses**:
- `409 Conflict`: Email already exists; or email registered via Google Sign-In
- `422 Unprocessable Entity`: Invalid email or password format
- `500 Internal Server Error`: Password hashing failed

**Implementation Notes**:
- Password hashed with bcrypt (salt cost 12) before storage
- User ID is a sequential integer generated from a MongoDB counter
- Email uniqueness enforced at database level (MongoDB unique index, error code 11000)
- After saving, calls internal `/login` to generate and return the JWT in the same response

---

### 2. User Login

#### `POST /auth/login`
**Purpose**: Login with email and password

**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response (200)**:
```json
{
  "token": "JWT token string",
  "message": "Login successful"
}
```

Token is also set as an `httpOnly` cookie named `token` (1 hour expiry).

**Error Responses**:
- `401 Unauthorised`: Wrong password; or account is Google Sign-In only
- `404 Not Found`: No user found with that email

**Implementation Notes**:
- Accepts email only (no username field)
- Google-only accounts are rejected with a specific error message directing the user to `/auth/google`

---

### 3. Google OAuth Authentication

#### `POST /auth/google`
**Purpose**: Authenticate using a Google ID token, creating a new user if necessary

**Request Headers**:
```
Authorization: Bearer <Google ID Token>
Content-Type: application/json
```

**Success Response — New user (201)**:
```json
{
  "id": "number",
  "googleID": "string",
  "email": "string",
  "name": "string",
  "token": "JWT token string",
  "message": "Login successful"
}
```

**Success Response — Existing user (200)**:
```json
{
  "token": "JWT token string",
  "message": "Login successful"
}
```

Token is also set as an `httpOnly` cookie named `token` (1 hour expiry).

**Error Responses**:
- `401 Unauthorised`: Missing or invalid Authorization header; payload missing from Google token; Google account has no email
- `409 Conflict`: Email already registered with password login
- `500 Internal Server Error`: `GOOGLE_CLIENT_ID` env variable not set; token verification failure

**Implementation Notes**:
- Google ID token verified using `google-auth-library` `verifyIdToken()`
- Google users have `passwordHash` set to `"empty"` in the database
- User ID is a sequential integer generated from the same MongoDB counter as normal users
- Cross-auth conflict: if the email exists as a normal account, registration is rejected with 409

---

### 4. Token Validation

#### `POST /auth/validate`
**Purpose**: Verify a JWT token and return the user's internal ID

**Request Headers**:
```
Authorization: Bearer <JWT Token>
```

**Success Response (200)**:
```json
{
  "id": "number"
}
```

**Error Responses**:
- `401 Unauthorised`: Missing, invalid, or expired token; user not found in database
- `500 Internal Server Error`: User record has no ID

**Implementation Notes**:
- Validates JWT signature and expiry
- Looks up the user in MongoDB by email from token claims
- Works for both `mongo` and `google` token types
- Used by the API gateway to validate requests before forwarding to other services

---

### 5. Fetch Current User

#### `GET /auth/me`
**Purpose**: Return the authenticated user's ID and email

**Request Headers**:
```
Authorization: Bearer <JWT Token>
```

**Success Response (200)**:
```json
{
  "id": "number",
  "email": "string"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing, invalid, or expired token
- `404 Not Found`: User not found in database

---

### 6. Delete User

#### `DELETE /auth/delete`
**Purpose**: Permanently delete the authenticated user's account

**Request Headers**:
```
Authorization: Bearer <JWT Token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "number"
}
```

**Success Response (200)**:
```json
{
  "message": "User deleted"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token; `userId` in body does not match token
- `404 Not Found`: User not found in database

**Implementation Notes**:
- `compareJWT` middleware verifies the token is valid and that `userId` in the body matches the `userId` claim in the JWT
- Deletes the MongoDB document via `findOneAndDelete`

---

### 7. Change Password

#### `PATCH /auth/change-password`
**Purpose**: Change the password for an authenticated normal-auth user

**Request Headers**:
```
Authorization: Bearer <JWT Token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "number",
  "password": "string (current password)",
  "newPassword": "string (new password)"
}
```

**New Password Validation Rules**:
- 8–64 characters
- Must contain at least one uppercase, one lowercase, one number, and one special character

**Success Response (200)**:
```json
{
  "message": "Password updated successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token; `userId` in body does not match token; current password incorrect
- `422 Unprocessable Entity`: New password does not meet requirements
- `404 Not Found`: User not found in database
- `500 Internal Server Error`: Password hashing failed

**Implementation Notes**:
- `compareJWT` middleware verifies the token is valid and that `userId` in the body matches the JWT
- Current password verified against stored bcrypt hash before any change is made
- Not usable by Google-only accounts (they have no password hash to verify against)
- No URL parameters — user is identified entirely via `userId` in the request body

---

## Complete Endpoint Summary

| Method | Endpoint | Category | Purpose |
|--------|----------|----------|---------|
| POST | `/auth/register` | Registration | Register new user |
| POST | `/auth/login` | Login | Login with email and password |
| POST | `/auth/google` | Google Auth | Google Sign-In or registration |
| POST | `/auth/validate` | Validation | Validate JWT, return user ID |
| GET | `/auth/me` | Account | Return current user's ID and email |
| DELETE | `/auth/delete` | Account | Delete authenticated user |
| PATCH | `/auth/change-password` | Account | Change user password |

---

## Authentication Flow Diagrams

### Normal Authentication Flow
```
1. User registers with POST /auth/register
   ↓
2. Email and hashed password stored in MongoDB
   ↓
3. JWT returned immediately in response and Set-Cookie header
   ↓
4. Subsequent requests include token in Authorization header or cookie
   ↓
5. Token verified with POST /auth/validate (used by API gateway)
```

### Google Authentication Flow
```
1. Frontend obtains Google ID token via Google Sign-In
   ↓
2. Frontend sends POST /auth/google with token in Authorization header
   ↓
3. Backend verifies token signature using google-auth-library
   ↓
4. New user created (201) OR existing Google user logged in (200)
   ↓
5. JWT returned in response and Set-Cookie header
   ↓
6. Token valid for all protected endpoints
```

### Cross-Auth Conflict Handling
```
Scenario: Google user tries normal login
  → POST /auth/login with Google user's email
  → Returns 401 — Google users must use /auth/google

Scenario: Normal user tries Google registration with same email
  → POST /auth/google with that email
  → Returns 409 — email already registered with password login

Scenario: Normal user tries to register with existing email
  → POST /auth/register with duplicate email
  → Returns 409 — email already exists
```

---

## Key Implementation Details

### Token Structure
- **Type**: JWT (JSON Web Token)
- **Algorithm**: HS256
- **Expiry**: 1 hour
- **Claims**: `sub` (MongoDB `_id`), `userId` (numeric), `email`, `type` (`"mongo"` or `"google"`)
- **Delivery**: Returned in JSON response body and set as `httpOnly`, `SameSite=lax` cookie

### Password Security
- **Hashing**: bcrypt with salt cost 12
- **Validation**: 8–64 characters, uppercase, lowercase, number, and special character required
- **Storage**: Only hash stored, never plaintext
- **Google accounts**: `passwordHash` stored as `"empty"`, password endpoints not applicable

### Authorised Endpoint Protection (`compareJWT`)
Endpoints that modify or delete user data use the `compareJWT` middleware:
1. Extracts and decodes JWT from `Authorization: Bearer` header
2. Verifies `userId` in the request body matches `userId` in the token payload
3. Attaches decoded token to `req.decodedJWT` for use in the handler

### Error Handling
- **Validation Errors**: 422 for password format failures
- **Auth Errors**: 401 for missing/invalid/mismatched credentials or tokens
- **Conflict Errors**: 409 for duplicate email or auth-type conflicts (MongoDB error code 11000)
- **Not Found**: 404 for non-existent users
- **Server Errors**: 500 for hashing failures, missing env variables, or token verification failures

### CORS & Security Headers
- **Authorization Header**: Required format is `Bearer <token>`
- **Content-Type**: Must be `application/json`
- **Cookie**: Token also set as `httpOnly`, `SameSite=lax`; `Secure` flag enabled in production

---

## Testing

See [TEST_GUIDE.md](./services/auth-service/__tests__/TEST_GUIDE.md) for test suite documentation.

**Available Test Files**:
- `test-auth.sh` — shell-based auth test suite
- `curls2.txt` — individual curl commands for manual endpoint testing

---

## Deployment Notes

### Database Requirements
- MongoDB collection with fields: `id` (numeric, unique), `email` (unique), `passwordHash`, `googleID` (optional)
- Separate counter collection (`CounterDB`) for sequential ID generation
- Unique indexes on `email` and `googleID`

### Environment Variables Required
```
JWT_SECRET=<secret for signing tokens>
GOOGLE_CLIENT_ID=<Google OAuth client ID>
MONGODB_URI=<MongoDB connection string>
AUTH_SERVICE_URL=<internal URL of auth-service, default: http://auth-service:3001>
```
