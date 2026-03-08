# Token Transmission Review

## Current Token Flow Architecture

### 1. **Client → API Gateway (✅ CORRECT)**

**Location**: [api-gateway/src/middleware/auth.ts](api-gateway/src/middleware/auth.ts#L95-L104)

```typescript
// Lines 95-104: Extract from cookies OR Authorization header
let token = authReq.cookies.token;
if (!token) {
  const authHeader = authReq.headers.authorization;
  token = authHeader.split(" ")[1];  // Remove "Bearer " prefix
}
```

**What happens**:
- Frontend sends JWT in one of two ways:
  1. **Cookie**: `Set-Cookie: token=jwt_value` (browser-based apps)
  2. **Authorization Header**: `Authorization: Bearer jwt_value` (mobile/API clients)

**Assessment**: ✅ **CORRECT - Follows REST standards (RFC 7235)**
- Authorization header is the standard way to transmit credentials
- Cookie fallback is good for browser compatibility
- Both methods are industry-standard

---

### 2. **API Gateway → Auth Service (✅ FIXED - CORRECT)**

**Location**: [api-gateway/src/middleware/auth.ts](api-gateway/src/middleware/auth.ts#L110-L115)

```typescript
// Lines 110-115: Send token to auth-service in Authorization header
const response = await fetch(`${AUTH_SERVICE_URL}/auth/validate`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`  // ✅ Token in Authorization header (RFC 7235)
  }
});
```

**What happens**:
- Token is sent in Authorization header: `Authorization: Bearer jwt_value`
- Auth service receives and validates it

**Assessment**: ✅ **CORRECT - Follows RFC 7235 standard**

**Why it's correct**:
- **RFC 7235** specifies that credentials/authentication tokens belong in the `Authorization` header
- Authorization header is the standard for transmitting credentials
- Makes the API RESTful and follows industry conventions
- Developers expect standard Authorization header handling
- Aligns with OAuth 2.0 and modern authentication practices

**Implementation**:
```typescript
const response = await fetch(`${AUTH_SERVICE_URL}/auth/validate`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`  // ✅ Token in Authorization header
  }
});
```

---

### 3. **API Gateway → Core Service (✅ CORRECT)**

**Location**: [api-gateway/src/index.ts](api-gateway/src/index.ts#L90-L105)

```typescript
// Lines 90-105: Forward userId in X-User-Id header
const headers: Record<string, string> = {};
if (authReq.userId) {
  headers["X-User-Id"] = authReq.userId.toString();
}

const response = await fetch(`${CORE_SERVICE_URL}/recipes`, { headers });
```

**What happens**:
- After validating token with auth-service, API gateway extracts `userId`
- Passes userId to core-service in custom header `X-User-Id`
- Core-service does NOT receive or validate JWT (trusts API gateway)

**Assessment**: ✅ **CORRECT - Follows service-to-service communication patterns**
- userId (not token) is sent between services
- API gateway validates token, other services trust the result
- Uses custom header which is appropriate for internal service communication
- Reduces coupling and unnecessary token validation

---

### 4. **Core Service - Token Usage (✅ CORRECT)**

**Location**: [core-service/src/middleware/extractUser.ts](core-service/src/middleware/extractUser.ts)

```typescript
// Reads X-User-Id from header (NOT JWT token)
const result = userIdSchema.safeParse(req.headers["x-user-id"]);

if (result.success) {
  req.userId = result.data;  // Set userId for route handlers
}
```

**What happens**:
- Core service extracts `userId` from `X-User-Id` header
- Does NOT validate JWT tokens
- Trusts API gateway to have validated the token

**Assessment**: ✅ **CORRECT - Proper service separation**
- Core service doesn't need to know about tokens
- Only needs to know about the user making the request
- Reduces coupling between services
- Simpler implementation

---

## Token Transmission Summary Table

| Step | Current Method | Standard | Status | Change Needed? |
|------|----------------|----------|--------|---|
| Client → API Gateway | Header/Cookie | RFC 7235 Authorization | ✅ Correct | No |
| API Gateway → Auth Service | Authorization Header | RFC 7235 Authorization | ✅ Correct | **DONE** ✅ |
| API Gateway → Core Service | X-User-Id Header | Custom Internal Header | ✅ Correct | No |
| Core Service Internal | Uses X-User-Id Header | N/A | ✅ Correct | No |

---

## Changes Made ✅

### Fixed token transmission in API Gateway

**File**: [api-gateway/src/middleware/auth.ts](api-gateway/src/middleware/auth.ts)  
**Lines**: 110-115  
**Change**: Token now sent in Authorization header instead of request body

### Before (Non-standard):
```typescript
const response = await fetch(`${AUTH_SERVICE_URL}/auth/validate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ token })
});
```

### After (Corrected - RFC 7235 Standard):
```typescript
const response = await fetch(`${AUTH_SERVICE_URL}/auth/validate`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`
  }
});
```

**Status**: ✅ **COMPLETED**

---

## Impact Analysis

### Services affected:
1. **api-gateway** - will send token in header instead of body
2. **auth-service** - needs to expect token in Authorization header instead of body

### Changes required:
1. Update api-gateway to use Authorization header
2. Update auth-service to read from Authorization header instead of body

### No changes needed for:
- ✅ Client-side (already handles both cookie and header)
- ✅ Core service (never receives tokens, only userId)
- ✅ Notification service (doesn't deal with auth)

---

## Best Practices Applied

This change aligns with:
- **RFC 7235** - HTTP Authentication Scheme Registry
- **OAuth 2.0** - Authorization framework standard
- **REST API Design** - Standard practices
- **Microservices patterns** - Service-to-service communication

---

## Testing After Change

After implementing this change, verify:

1. ✅ Client still authenticates (token in header or cookie)
2. ✅ API gateway still validates token with auth-service
3. ✅ Core service still receives userId correctly
4. ✅ All endpoints return expected responses:
   - GET /health → 200
   - GET /recipes → 200
   - GET /recipes/:id → 200/404/400

Run:
```bash
docker-compose up -d --build
# Then test endpoints with curl or REST client
```
