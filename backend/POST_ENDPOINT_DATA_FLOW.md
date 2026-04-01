# POST Endpoint Data Flow (Frontend -> API Gateway -> Core Service)

This document explains how data should flow for a POST endpoint that is handled by both api-gateway and core-service.

Important current status:
- This guide is a practical template for implementing/maintaining a POST flow such as `POST /recipes`.

## 1) End-to-End Idea

```text
Frontend (JSON body + token)
  -> API Gateway route
  -> API Gateway auth middleware
  -> Proxy call to Core Service
  -> Core route + input validation
  -> Core service business logic + DB write
  -> Core response
  -> Gateway forwards response
  -> Frontend receives result
```

## 2) Entry Points in Current Project

API Gateway app wiring:
- `backend/services/api-gateway/src/app.ts`

Core Service app wiring:
- `backend/services/core-service/src/app.ts`

Current recipes routers:
- `backend/services/api-gateway/src/routes/recipes.routes.ts`
- `backend/services/core-service/src/routes/recipes.routes.ts`

Current auth flow middleware (gateway):
- `backend/services/api-gateway/src/middleware/auth.ts`

Current user context extraction (core):
- `backend/services/core-service/src/middleware/extractUser.ts`

## 3) Request Lifecycle for a POST Endpoint

Example target endpoint: `POST /recipes`

### Step A. Frontend sends request

Frontend sends:
1. JSON body (`Content-Type: application/json`)
2. Authentication token (cookie `token` or `Authorization: Bearer ...`)

### Step B. API Gateway receives request

In gateway:
1. `express.json()` parses body (`backend/services/api-gateway/src/app.ts`)
2. Route in `recipes.routes.ts` receives request
3. Protected POST should use `requireAuth` from `auth.ts` (for public POST endpoints this step can be skipped)

What `requireAuth` does (`backend/services/api-gateway/src/middleware/auth.ts`):
1. Reads token from cookie/header
2. Calls auth-service `POST /auth/validate`
3. Parses auth response
4. Sets internal `X-User-Id` header for downstream core-service call

### Step C. Gateway proxies to Core Service

Gateway route handler should:
1. Forward JSON body as-is
2. Forward internal headers via `getInternalHeaders(req)`
3. Use timeout wrappers from `utils/timeouts.ts`

### Step D. Core Service receives request

In core:
1. `express.json()` parses body (`backend/services/core-service/src/app.ts`)
2. Route handler should apply `extractUser` if user context is required
3. Route validates payload using schemas from `validation/schemas.ts`
4. Route returns `400` on validation errors, `401` if auth context is missing

For current `GET /users/*` routes, core already demonstrates this split:
- public endpoints do not require `extractUser`
- private endpoints (`/users/me/...`) do require user context and return `401` when missing

### Step E. Core business logic writes to DB

Service layer in `services/recipes.service.ts` should:
1. Run DB transaction for write flow
2. Insert/update required tables
3. Read back persisted entity if needed
4. Return typed result to route

### Step F. Response path back to frontend

1. Core route returns JSON (`201`/`200` or error)
2. Gateway forwards core response status/body
3. Frontend receives final result

## 4) Data Ownership Rules

1. Gateway validates token and forwards user context (`X-User-Id`).
2. Core does not validate JWT directly; it trusts gateway context.
3. Core owns business validation and DB consistency.

## 5) Error Mapping Guidelines

Recommended status usage for POST flows:
1. `400` - invalid payload / invalid path parameter
2. `401` - missing or invalid authentication context
3. `403` - authenticated user has no permission
4. `404` - target entity does not exist
5. `409` - invalid state transition/conflict
6. `500` - unexpected internal error

Gateway-specific upstream errors:
1. `504` - downstream timeout
2. `503` - auth service unavailable (from `requireAuth` path)

## 6) Minimal POST Implementation Checklist

For adding a new POST endpoint touching both services:
1. Add route in gateway router (`recipes.routes.ts`) with `requireAuth` if needed.
2. Add proxy handler in gateway (forward body + internal headers + timeout handling).
3. Add route in core router (`recipes.routes.ts`) and apply `extractUser` when auth context is required.
4. Add/extend Zod payload schema in `core-service/src/validation/schemas.ts`.
5. Add service function in `core-service/src/services/recipes.service.ts` with transaction-safe DB writes.
6. Add/update tests:
   - gateway route tests (`backend/services/api-gateway/src/__tests__/recipes.test.ts`)
   - core integration tests (`backend/services/core-service/src/__tests__/recipes.test.ts`)
7. Run smoke and jest checks before merge.

Tip:
- Keep gateway handlers "thin" (proxy + auth + timeout), and keep business rules/DB writes in core services.

## 7) Why This Architecture Works

1. Clear separation of concerns:
   - Gateway: authentication + routing/proxy
   - Core: domain rules + persistence
2. Lower coupling between business services and token details.
3. Easier debugging because each layer has explicit responsibility.