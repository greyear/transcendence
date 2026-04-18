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

Current routes in core-service include read and write endpoints.

`/recipes` router (`src/routes/recipes.routes.ts`):
- `GET /recipes` -> no `extractUser` (public list of published recipes)
- `GET /recipes/:id` -> uses `extractUser` before handler
- `POST /recipes` -> uses `extractUser`, requires `req.userId`
- `POST /recipes/:id/publish` -> uses `extractUser`, requires `req.userId`
- `PUT /recipes/:id` -> uses `extractUser`, requires `req.userId`
- `DELETE /recipes/:id` -> uses `extractUser`, requires `req.userId`

`/users` router (`src/routes/users.routes.ts`):
- `GET /users/:id/recipes` -> no `extractUser` (public profile recipes)
- `GET /users/:id` -> uses `extractUser` before handler (user profile with visibility rules)
- `GET /users/:id/followers` -> no `extractUser` (public followers list)
- `GET /users/:id/following` -> no `extractUser` (public following list)
- `GET /users/:id/favorites` -> uses `extractUser` before handler (requires mutual follow relationship)
- `GET /users/me/recipes` -> uses `extractUser` before handler
- `GET /users/me/favorites` -> uses `extractUser` before handler (requires auth)
- `POST /users/:id/follow` -> uses `extractUser`, requires `req.userId`
- `DELETE /users/:id/follow` -> uses `extractUser`, requires `req.userId`

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

### POST /recipes

Flow:
1. CORS
2. JSON parser
3. `extractUser`
4. If `req.userId` is missing -> `401`
5. Validate request body (`validateCreateRecipeInput`)
6. Service call `createRecipe(req.userId, payload)`
7. Return `201` or `400`
8. Unexpected errors go to `next(error)`

Notes:
- Authentication is required (via API Gateway forwarded `X-User-Id`).

### POST /recipes/:id/publish

Flow:
1. CORS
2. JSON parser
3. `extractUser`
4. If `req.userId` is missing -> `401`
5. Validate `:id` (`validateRecipeId`)
6. Service call `publishRecipe(id, req.userId)`
7. Return `200`, `400`, `403`, `404`, or `409`
8. Unexpected errors go to `next(error)`

Notes:
- Publishes only from valid status transition according to service rules.

### PUT /recipes/:id

Flow:
1. CORS
2. JSON parser
3. `extractUser`
4. If `req.userId` is missing -> `401`
5. Validate `:id` (`validateRecipeId`)
6. Validate body (`validateUpdateRecipeInput`)
7. Service call `updateRecipe(id, req.userId, payload)`
8. Return `200`, `400`, `403`, `404`, or `409`
9. Unexpected errors go to `next(error)`

Notes:
- Endpoint updates recipe content and relations (ingredients/categories) in one transaction.

### DELETE /recipes/:id

Flow:
1. CORS
2. JSON parser
3. `extractUser`
4. If `req.userId` is missing -> `401`
5. Validate `:id` (`validateRecipeId`)
6. Service call `archiveRecipe(id, req.userId)`
7. Return `200`, `400`, `403`, `404`, or `409`
8. Unexpected errors go to `next(error)`

Notes:
- This is soft delete: recipe status is changed to `archived`.
- Author can archive own recipe, admin can archive any recipe.

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

### GET /users/:id/followers

Flow:
1. CORS
2. JSON parser
3. Validate `:id` (`validateUserId`)
4. Service call `getFollowers(id)`
5. Return `200`, `400`, or `404`

Notes:
- Public endpoint (unauthenticated users can access).
- Returns list of users who follow the specified user.

### GET /users/:id/following

Flow:
1. CORS
2. JSON parser
3. Validate `:id` (`validateUserId`)
4. Service call `getFollowing(id)`
5. Return `200`, `400`, or `404`

Notes:
- Public endpoint (unauthenticated users can access).
- Returns list of users that the specified user is following.

### POST /users/:id/follow

Flow:
1. CORS
2. JSON parser
3. `extractUser`
4. If `req.userId` is missing -> `401`
5. Validate `:id` (`validateUserId`)
6. Service call `followUser(req.userId, id)`
7. Return `200`, `400`, `404`, or `409`
8. Unexpected errors go to `next(error)`

Notes:
- Creates follow relationship between authenticated user and target user.
- Returns `400` if user tries to follow themselves.
- Returns `404` if either user doesn't exist.
- Returns `409` if follow relationship already exists.
- Success returns `200` with relationship data.

### DELETE /users/:id/follow

Flow:
1. CORS
2. JSON parser
3. `extractUser`
4. If `req.userId` is missing -> `401`
5. Validate `:id` (`validateUserId`)
6. Service call `unfollowUser(req.userId, id)`
7. Return `200`, `400`, `404`, or `409`
8. Unexpected errors go to `next(error)`

Notes:
- Removes follow relationship between authenticated user and target user.
- Returns `400` if user tries to unfollow themselves.
- Returns `404` if either user doesn't exist or follow relationship doesn't exist.
- Success returns `200` with success message.

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

### GET /users/:id/favorites

Flow:
1. CORS
2. JSON parser
3. `extractUser` middleware (required for authentication)
4. If `req.userId` is missing -> `401`
5. Validate `:id` (`validateUserId`)
6. Check if users are mutual followers
7. If not mutual followers -> `403`
8. Service call `getFavoriteRecipesByUserId(id, currentUserId)`
9. Return `200`, `400`, `401`, `403`, or `404`

Notes:
- Requires authentication (X-User-Id from API Gateway).
- Access denied if users are not mutual followers (returns 403).
- Returns list of published recipes favorited by the specified user only if mutual follow relationship exists.

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
2. `extractUser` is applied only to routes that need user context or authentication checks.
3. Route handlers consistently use `try/catch` + `next(error)`.
4. 404 and generic error handling are correctly mounted last.
5. Current document reflects `src/app.ts` (not `src/index.ts`).
