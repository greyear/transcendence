# Core Service Middleware Chain Verification

## Middleware Order & Execution Flow

The core-service has a properly structured middleware chain. All endpoints correctly use all middlewares.

### Global Middlewares (runs for EVERY request)

**File: `src/index.ts`**

```
Request → CORS → JSON Parser → Routes → Error Handlers
```

1. **CORS Middleware** (line 24-28)
   - Runs first
   - Allows cross-origin requests
   - Configured for security

2. **JSON Parser** (line 29)
   - Parses request body as JSON
   - Required for POST/PUT requests with JSON body

3. **Routes** (line 31-33)
   - Routes requests to specific routers
   - `/health` → healthRouter
   - `/recipes` → recipesRouter

4. **Error Handlers** (line 36-38)
   - Must be LAST
   - Catches all errors from routes/middlewares above
   - Catches 404 (notFoundHandler)
   - Catches other errors (errorHandler)

---

## Endpoint Verification

### ✅ GET /health

**Route**: `healthRouter.get("/", ...)`  
**File**: `src/routes/health.routes.ts:30`

```
Request
  ↓
CORS middleware ✓
  ↓
JSON Parser ✓
  ↓
Route Handler (synchronous)
  → res.status(200).json()
  → No error handler needed (no errors possible)
  ✓ Covered by errorHandler if any error occurs
```

**Verification**: ✅
- Handler is synchronous, sends response
- Any unexpected errors caught by errorHandler

---

### ✅ GET /health/db

**Route**: `healthRouter.get("/db", async ...):`  
**File**: `src/routes/health.routes.ts:45-52`

```
Request
  ↓
CORS middleware ✓
  ↓
JSON Parser ✓
  ↓
Route Handler (async)
  → try: pool.query()
    ✓ Response sent
  → catch: next(error)
    ✓ Error passed to errorHandler
```

**Verification**: ✅
- Handler is async, uses try/catch
- Errors from pool.query() → caught → next(error) → errorHandler
- errorHandler sends proper HTTP response

---

### ✅ GET /recipes

**Route**: `recipesRouter.get("/", getAllRecipes)`  
**File**: `src/routes/recipes.routes.ts:36`

```
Request
  ↓
CORS middleware ✓
  ↓
JSON Parser ✓
  ↓
extractUser middleware ✓ (router.use on line 26)
  → Sets req.userId (string | undefined)
  ↓
Route Handler: getAllRecipes (async)
  → try: getAllRecipesService()
    ✓ Response sent
  → catch: next(error)
    ✓ Error passed to errorHandler
```

**Verification**: ✅
- extractUser middleware runs before handler
- Sets userId from X-User-Id header
- Handler is async, uses try/catch
- Errors → errorHandler

**File**: `src/controllers/recipes.controller.ts:40-57`

---

### ✅ GET /recipes/:id

**Route**: `recipesRouter.get("/:id", getRecipeById)`  
**File**: `src/routes/recipes.routes.ts:59`

```
Request
  ↓
CORS middleware ✓
  ↓
JSON Parser ✓
  ↓
extractUser middleware ✓ (router.use on line 26)
  → Sets req.userId (string | undefined)
  ↓
Route Handler: getRecipeById (async)
  → try:
      1. validateRecipeId(id)
         → if invalid: throw CustomError (statusCode: 400)
      2. getRecipeByIdService(id, userId)
      3. Check if recipe exists
         → if null: throw CustomError (statusCode: 404)
      4. Check if recipe restricted
         → if restricted: throw CustomError (statusCode: 403)
      5. Response sent ✓
    ✓ All paths covered
  → catch: next(error)
    ✓ Error passed to errorHandler
```

**Verification**: ✅
- extractUser middleware runs before handler
- Handler has comprehensive error handling
- All possible errors (400, 403, 404) are explicitly handled
- Errors → errorHandler

**File**: `src/controllers/recipes.controller.ts:63-121`

---

## Error Handler Coverage

### notFoundHandler

**Location**: `src/middleware/errorHandler.ts:56-61`  
**Triggered**: When no route matches request

```
Request to /unknown
  ↓
CORS ✓
  ↓
JSON Parser ✓
  ↓
healthRouter: no match
  ↓
recipesRouter: no match
  ↓
notFoundHandler (line 37 in index.ts)
  → res.status(404).json({ error: "Route not found" }) ✓
```

**Verification**: ✅
- Catches all unmatched routes
- Returns proper 404 response

### errorHandler

**Location**: `src/middleware/errorHandler.ts:28-46`  
**Triggered**: When next(error) is called

```
Handler throws/calls next(error)
  ↓
errorHandler (line 38 in index.ts)
  → Extracts statusCode from error (defaults to 500)
  → Extracts message from error
  → Logs: console.error()
  → Response: res.status(statusCode).json({ error: message }) ✓
```

**Verification**: ✅
- Catches all errors from route handlers
- Handles custom statusCode (400, 403, 404, 500)
- Logs for debugging
- Returns proper JSON response

---

## Middleware Chain Diagram

```
┌─────────────────────────────────────────┐
│         Incoming Request                │
└────────────────┬────────────────────────┘
                 │
     ┌───────────▼──────────┐
     │  CORS Middleware     │ (src/index.ts:24-28)
     └───────────┬──────────┘
                 │
     ┌───────────▼──────────┐
     │  JSON Parser         │ (src/index.ts:29)
     └───────────┬──────────┘
                 │
     ┌───────────▼──────────┐
     │  /health Route       │ (src/routes/health.routes.ts)
     │  + Handler Logic     │
     │  ├─ GET /           │ ✓
     │  └─ GET /db         │ ✓
     └───────────┬──────────┘
                 │
     ┌───────────▼──────────┐
     │  /recipes Route      │ (src/routes/recipes.routes.ts)
     │  + extractUser (✓)   │ (src/middleware/extractUser.ts)
     │  + Handler Logic     │
     │  ├─ GET /           │ ✓
     │  └─ GET /:id        │ ✓
     └───────────┬──────────┘
                 │
        ┌────────▼────────┐
        │   Error Occurs? │
        └────────┬────────┘
          Yes ✓  │  No ✓
             ┌───▼───────┐
             │ errorHandler  │ (src/middleware/errorHandler.ts)
             │ OR            │
             │ notFoundHandler│
             └───┬───────┘
                 │
     ┌───────────▼──────────┐
     │  JSON Response to    │
     │  Client              │
     └──────────────────────┘
```

---

## Summary

✅ **All endpoints use all middlewares correctly**

| Endpoint | CORS | JSON Parser | extractUser | Error Handler | Status |
|----------|------|-------------|-------------|---------------|--------|
| GET /health | ✓ | ✓ | - | ✓ | OK |
| GET /health/db | ✓ | ✓ | - | ✓ | OK |
| GET /recipes | ✓ | ✓ | ✓ | ✓ | OK |
| GET /recipes/:id | ✓ | ✓ | ✓ | ✓ | OK |
| Unknown route | ✓ | ✓ | - | ✓ (404) | OK |

### Key Points:
1. **Middleware order is correct** - CORS and JSON Parser run first, error handlers last
2. **All routes are covered** - Global middlewares apply to all routes
3. **Router-level middleware works** - extractUser runs only for /recipes routes
4. **Error handling is complete** - All error paths (400, 403, 404, 500) are caught
5. **No sync issues** - All async operations use try/catch with next(error)
