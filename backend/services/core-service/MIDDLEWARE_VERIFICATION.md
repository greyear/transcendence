# Core Service Middleware Chain Verification

This document is synced with the current code in:
- `src/app.ts`
- `src/routes/*.ts`
- `src/middleware/errorHandler.ts`
- `src/middleware/extractUser.ts`

## 1) Global Middleware Order

Global chain in `src/app.ts` is:

```text
Request -> CORS -> express.json() -> Routers -> notFoundHandler -> errorHandler
```

Verification:
- `cors(...)` is mounted before all routers.
- `express.json()` is mounted before all routers.
- `notFoundHandler` is mounted after all routers.
- `errorHandler` is mounted last.

This order is correct for Express.

## 2) Router-Level Middleware Usage

Current routes in core-service are read endpoints only.

`/recipes` router (`src/routes/recipes.routes.ts`):
- `GET /recipes` -> no `extractUser` (public list of published recipes)
- `GET /recipes/:id` -> uses `extractUser` before handler

`/users` router (`src/routes/users.routes.ts`):
- `GET /users/:id/recipes` -> no `extractUser` (public profile recipes)
- `GET /users/:id` -> uses `extractUser` before handler (user profile with visibility rules)
- `GET /users/me/recipes` -> uses `extractUser` before handler

Health router (`src/routes/health.routes.ts`):
- `GET /health`
- `GET /health/db`

## 3) Endpoint-by-Endpoint Flow

### GET /health

Flow:
1. CORS
2. JSON parser
3. `healthRouter.get("/")`
4. Response `200`

Notes:
- No DB calls.
- No auth middleware required.

### GET /health/db

Flow:
1. CORS
2. JSON parser
3. `healthRouter.get("/db")`
4. `pool.query("SELECT 1")`
5. Success `200` or `next(error)`

Notes:
- Uses async handler with `try/catch` and forwards errors correctly.

### GET /recipes

Flow:
1. CORS
2. JSON parser
3. `recipesRouter.get("/")`
4. `getAllRecipes()` service call
5. Success `200` or `next(error)`

Notes:
- Public endpoint by design.
- Does not need user context.

### GET /recipes/:id

Flow:
1. CORS
2. JSON parser
3. `extractUser` (parses optional `X-User-Id`)
4. Validate `id` (`validateRecipeId`)
5. Service call `getRecipeById(id, req.userId)`
6. Return `200`, `400`, `403`, or `404`
7. Unexpected errors go to `next(error)`

Notes:
- `extractUser` is applied only where visibility depends on user context.

### GET /users/:id/recipes

Flow:
1. CORS
2. JSON parser
3. Validate `:id` (`validateUserId`)
4. Service call `getPublishedRecipesByUserId`
5. Return `200`, `400`, or `404`

Notes:
- Public endpoint.

### GET /users/:id

Flow:
1. CORS
2. JSON parser
3. `extractUser` (parses optional `X-User-Id`)
4. Validate `:id` (`validateUserId`)
5. Service call `getUserById(userId, req.userId?)`
6. Return `200`, `400`, or `404`

Notes:
- Public endpoint (unauthenticated users can access).
- `extractUser` is applied because `status` visibility depends on mutual follow relationship.
- Response always excludes `role`.
- Response includes `status` only if:
  - User is authenticated (`X-User-Id` present), AND
  - User and target follow each other (mutual follow)
- Otherwise, `status` is `null`.

### GET /users/me/recipes

Flow:
1. CORS
2. JSON parser
3. `extractUser`
4. If `req.userId` is missing -> `401`
5. Service call `getMyRecipes(req.userId)`
6. Return `200`

Notes:
- Requires API gateway to forward `X-User-Id`.

## 4) Error Handling Coverage

`notFoundHandler` (`src/middleware/errorHandler.ts`):
- Handles unmatched routes.
- Returns JSON `404` with `Route not found`.

`errorHandler` (`src/middleware/errorHandler.ts`):
- Handles errors passed with `next(error)`.
- Uses `err.statusCode` if provided; otherwise `500`.
- Returns JSON error payload.

## 5) Verification Summary

Status: middleware chain is correct and consistent.

Key points:
1. Global middleware order is correct.
2. `extractUser` is applied only to routes that need user context.
3. Route handlers consistently use `try/catch` + `next(error)`.
4. 404 and generic error handling are correctly mounted last.
5. Current document reflects `src/app.ts` (not `src/index.ts`).
