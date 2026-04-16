# Token Transmission Review

This file describes the current authentication context flow across services.

## 1) Client -> API Gateway

Source: `backend/services/api-gateway/src/middleware/auth.ts`

Gateway accepts token from:
1. Cookie: `token`
2. Header: `Authorization: Bearer <jwt>`

Behavior:
- If token exists, gateway validates it via auth-service.
- If valid, gateway sets internal request context (`req.userId` and `X-User-Id`).

## 2) API Gateway -> Auth Service

Source: `backend/services/api-gateway/src/middleware/auth.ts`

Validation call:

```http
POST /validate
Authorization: Bearer <jwt>
```

Expected successful payload from auth-service:

```json
{ "id": 123 }
```

Gateway validates this response with Zod before trusting it.

## 3) API Gateway -> Core Service

Sources:
- `backend/services/api-gateway/src/middleware/auth.ts`
- `backend/services/api-gateway/src/utils/internalHeaders.ts`

Gateway forwards user context as:

```http
X-User-Id: <number>
```

Important:
- JWT itself is not forwarded to core-service.
- Core-service trusts gateway and consumes only `X-User-Id`.

## 4) Core Service Consumption

Source: `backend/services/core-service/src/middleware/extractUser.ts`

Core-service:
- Parses `X-User-Id` with Zod.
- Sets `req.userId` for route handlers.
- Treats invalid/missing header as unauthenticated context (`undefined`).

Core-service does not validate JWT directly.

## 5) Why This Split Is Good

Benefits:
1. Separation of concerns: token verification stays in gateway.
2. Simpler core-service logic: only user identity context is needed.
3. Reduced coupling: core-service is not tied to token format.
4. Easier policy changes: auth rules can evolve in one place.

## 6) Status Matrix

| Hop | Credential / Context | Current Format | Status |
|---|---|---|---|
| Client -> Gateway | JWT | Cookie or Authorization header | OK |
| Gateway -> Auth Service | JWT | Authorization header | OK |
| Gateway -> Core Service | User context | X-User-Id header | OK |
| Core internal use | Parsed user id | req.userId | OK |

## 7) Manual Verification Checklist

1. Call protected gateway route without token -> `401`.
2. Call protected gateway route with invalid token -> `401` (or upstream error when auth-service is unavailable).
3. Call public route with valid token -> route works and personalized visibility is possible.
4. Verify core-service receives `X-User-Id` only (not JWT).
