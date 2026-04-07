# Core-Service Endpoint Development Rules

**Purpose**: Comprehensive guide for building new endpoints in the core-service following established best practices and architectural patterns.

**Last Updated**: 2026-03-29

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Endpoint Creation Checklist](#endpoint-creation-checklist)
3. [Code Quality & Patterns](#code-quality--patterns)
4. [HTTP & REST Standards](#http--rest-standards)
5. [Validation & Input Handling](#validation--input-handling)
6. [Error Handling](#error-handling)
7. [Authorization & Authentication](#authorization--authentication)
8. [Database & Query Patterns](#database--query-patterns)
9. [Testing Requirements](#testing-requirements)
10. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
11. [Implementation Examples](#implementation-examples)

---

## Architecture Overview

The core-service follows a **layered architecture** with three main concerns:

```
HTTP Layer (Routes)
       ↓
Business Logic Layer (Services)
       ↓
Data Access Layer (Database)
```

### Technology Stack
- **Framework**: Express.js with TypeScript
- **Validation**: Zod (runtime schema validation)
- **Database**: PostgreSQL with node-postgres (`pg` package)
- **Testing**: Jest + Supertest
- **HTTP Method**: RESTful conventions

### Directory Organization
- `/src/routes/` - HTTP route handlers (one file per resource)
- `/src/services/` - Business logic and database queries
- `/src/middleware/` - Express middleware (auth, error handling)
- `/src/validation/` - Zod schemas for input validation
- `/src/db/` - Database connection pool
- `/src/__tests__/` - Integration tests

---

## Endpoint Creation Checklist

When creating a new endpoint, follow this checklist in order:

- [ ] **Validation Schema**: Define Zod schema in `/src/validation/schemas.ts`
- [ ] **Service Function**: Implement business logic in appropriate service file
- [ ] **Route Handler**: Create route handler in `/src/routes/` with proper error handling
- [ ] **Error Handling**: Use correct HTTP status codes and error messages
- [ ] **Authorization**: Check `req.userId` if endpoint requires authentication
- [ ] **Integration Tests**: Add tests to `/src/__tests__/` covering happy path + error cases
- [ ] **Documentation**: Document endpoint in PR description with:
  - Request format
  - Response format
  - Status codes returned
  - Authentication requirements
  - Access control rules

---

## Code Quality & Patterns

### 1. Use Switch Statements for Complex Error Handling

**Rule**: When handling multiple error cases, use `switch` statements instead of nested `if/else`.

**Why**: More readable and maintainable than nested conditions.

```typescript
// ❌ AVOID: Nested if/else
if (error.code === "RECIPE_NOT_FOUND") {
  res.status(404).json({ error: "Recipe not found" });
} else if (error.code === "NO_PERMISSION") {
  res.status(403).json({ error: "No permission" });
} else if (error.code === "INVALID_STATUS") {
  res.status(409).json({ error: "Invalid status transition" });
} else {
  res.status(500).json({ error: "Internal server error" });
}

// ✅ PREFER: Switch statement
switch (error.code) {
  case "RECIPE_NOT_FOUND":
    res.status(404).json({ error: "Recipe not found" });
    break;
  case "NO_PERMISSION":
    res.status(403).json({ error: "No permission" });
    break;
  case "INVALID_STATUS":
    res.status(409).json({ error: "Invalid status transition" });
    break;
  default:
    res.status(500).json({ error: "Internal server error" });
}
```

### 2. Avoid TypeScript "as" Casting

**Rule**: Never use TypeScript `as` casting for type assertions. Always use Zod validation.

**Why**: Zod validates at runtime, preventing type mismatches between client and server.

```typescript
// ❌ AVOID: Using "as" casting
const recipeId = req.params.id as number;
const recipe = await getRecipeById(recipeId);

// ✅ PREFER: Zod validation
const result = positiveIntSchema.safeParse(req.params.id);
if (!result.success) {
  const error: CustomError = new Error("Invalid recipe ID");
  error.statusCode = 400;
  throw error;
}
const recipe = await getRecipeById(result.data);
```

### 3. Reuse Validation Functions

**Rule**: Extract common validation patterns into reusable functions (e.g., `validateIntId`).

**Why**: Prevents code duplication and ensures consistent validation across endpoints.

```typescript
// ✅ Define once
const validateIntId = (id: unknown): number => {
  const result = positiveIntSchema.safeParse(id);
  if (!result.success) {
    const error: CustomError = new Error("Invalid ID format");
    error.statusCode = 400;
    throw error;
  }
  return result.data;
};

// Use everywhere
const recipeId = validateIntId(req.params.id);
const userId = validateIntId(req.params.userId);
```

### 4. Optimize Database Queries

**Rule**: Avoid N+1 query patterns. Use SQL features like `UNNEST`, JOIN, or aggregation.

**Why**: Prevents performance bottlenecks as data grows.

```typescript
// ❌ AVOID: N+1 queries (slow with many ingredients)
const recipe = await pool.query("SELECT * FROM recipes WHERE id = $1", [recipeId]);
for (const ingredientId of recipe.ingredients) {
  const ingredient = await pool.query("SELECT * FROM ingredients WHERE id = $1", [ingredientId]);
  // Process ingredient
}

// ✅ PREFER: Single query with JOIN or aggregation
const recipe = await pool.query(`
  SELECT r.*, json_agg(i.*) as ingredients
  FROM recipes r
  LEFT JOIN ingredients i ON r.id = i.recipe_id
  WHERE r.id = $1
  GROUP BY r.id
`, [recipeId]);
```

### 5. Keep Schemas Named Clearly

**Rule**: Use descriptive, specific schema names (e.g., `positiveIntSchema`, not `intIdSchema`).

**Why**: Prevents confusion about schema intent and makes code self-documenting.

```typescript
// ❌ AVOID: Ambiguous name
const intIdSchema = z.coerce.number().int().positive();
export const spiciness = intIdSchema; // What does this represent?

// ✅ PREFER: Clear, specific names
const positiveIntSchema = z.coerce.number().int().positive();
export const spiciness = positiveIntSchema.max(3); // Clear this is a bounded int
```

### 6. Simplify Optional Fields in Validation

**Rule**: If a field is not optional in request validation, don't treat it as optional.

**Why**: Reduces unnecessary complexity in validation and business logic.

```typescript
// ❌ AVOID: Unnecessary complexity
const description = z.string().trim().optional().nullable();

// ✅ PREFER: Clear intent
const description = z.string().trim(); // Required
const description = z.string().trim().nullable().optional(); // Actually optional
```

### 7. Reuse Validation Templates

**Rule**: When multiple endpoints share similar validation result structures, create a template.

**Why**: Consistent error handling and response formatting across endpoints.

```typescript
// ✅ Define template once
type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; error: string };

// ✅ Use everywhere
const validateRecipeInput = (input: unknown): ValidationResult<CreateRecipeInput> => {
  const result = createRecipeInputSchema.safeParse(input);
  return result.success
    ? { valid: true, value: result.data }
    : { valid: false, error: formatZodError(result.error) };
};
```

---

## HTTP & REST Standards

### 1. HTTP Method Conventions

| Method | Purpose | Idempotent | Status Codes |
|--------|---------|-----------|--------------|
| GET | Retrieve data | Yes | 200, 400, 401, 403, 404 |
| POST | Create resource | No | 201, 400, 401, 403, 409 |
| PUT | Replace resource | Yes | 200, 400, 401, 403, 404 |
| DELETE | Remove resource | Yes | 204, 400, 401, 403, 404 |
| PATCH | Partial update | No | 200, 400, 401, 403, 404 |

### 2. URL Path Conventions

```typescript
// ✅ Collection
GET /recipes                  // List all recipes
GET /recipes/:id              // Get specific recipe

// ✅ Sub-resources
GET /users/:id/recipes        // Get recipes by user
GET /users/me/recipes         // Authenticated user's recipes

// ✅ Actions (non-CRUD operations)
POST /recipes/:id/publish     // Action endpoint
```

### 3. Response Format

**Success Response (2xx)**:
```json
{
  "data": { /* payload */ }
}
```

**Error Response (4xx, 5xx)**:
```json
{
  "error": "Human-readable error message"
}
```

### 4. Status Code Reference

| Code | Usage | Example |
|------|-------|---------|
| **200** | GET successful, data returned | `GET /recipes/1` → 200 |
| **201** | POST created new resource | `POST /recipes` → 201 |
| **204** | DELETE successful, no content | `DELETE /recipes/1` → 204 |
| **400** | Bad request, validation error | Missing required field |
| **401** | Authentication required | No valid X-User-Id header |
| **403** | Authenticated but forbidden | Wrong user accessing resource |
| **404** | Resource not found | Recipe ID doesn't exist |
| **409** | Conflict, invalid state transition | Publishing already published recipe |
| **500** | Server error, database failure | Unexpected exception |

---

## Validation & Input Handling

### 1. Always Validate Input with Zod

**Rule**: All user input must be validated using Zod before business logic.

**Why**: Runtime validation catches client errors early and prevents malformed data.

```typescript
// ✅ In route handler
const validation = createRecipeInputSchema.safeParse(req.body);
if (!validation.success) {
  const error: CustomError = new Error(formatZodError(validation.error));
  error.statusCode = 400;
  throw error;
}
const recipe = await createRecipe(req.userId, validation.data);
```

### 2. Validation Schema Structure

Define all validation schemas in `/src/validation/schemas.ts`:

```typescript
// ✅ Atomic schemas
const positiveIntSchema = z.coerce.number().int().positive().max(MAX_SIGNED_INT);
const userIdSchema = positiveIntSchema;

// ✅ Composed schemas
const createRecipeIngredientInputSchema = z.object({
  name: z.string().trim().min(1).max(256),
  quantity: z.string().trim().min(1).max(100),
  unit: z.string().trim().min(1).max(50)
});

// ✅ Request body schemas
const createRecipeInputSchema = z.object({
  title: z.string().trim().min(1).max(256),
  description: z.string().trim().max(5000).nullable(),
  instructions: z.array(z.string().trim().min(1)).min(1),
  servings: positiveIntSchema,
  spiciness: z.coerce.number().int().min(0).max(3),
  ingredients: z.array(createRecipeIngredientInputSchema).min(1),
  category_ids: z.array(positiveIntSchema).default([])
});
```

### 3. Validate Path Parameters

**Rule**: Always validate path parameters (`:id`, `:userId`) even though they're strings.

**Why**: Ensures type safety and prevents passing invalid IDs to database queries.

```typescript
// ✅ In route handler
router.get('/:id', async (req, res, next) => {
  try {
    const result = positiveIntSchema.safeParse(req.params.id);
    if (!result.success) {
      const error: CustomError = new Error("Invalid recipe ID");
      error.statusCode = 400;
      throw error;
    }
    const recipe = await getRecipeById(result.data);
    // ...
  } catch (error) {
    next(error);
  }
});
```

### 4. Sanitize String Input

**Rule**: Use `.trim()` on string fields to remove leading/trailing whitespace.

**Why**: Prevents empty-string attacks and ensures consistent data storage.

```typescript
// ✅ Always trim strings
const titleSchema = z.string().trim().min(1).max(256);
const descriptionSchema = z.string().trim().max(5000);
```

### 5. Use Parameterized Queries

**Rule**: Always use parameterized queries with `$1`, `$2` placeholders.

**Why**: Prevents SQL injection attacks.

```typescript
// ❌ DANGEROUS: String concatenation
const query = `SELECT * FROM recipes WHERE id = ${recipeId}`;

// ✅ SAFE: Parameterized query
const query = "SELECT * FROM recipes WHERE id = $1";
const result = await pool.query(query, [recipeId]);
```

---

## Error Handling

### 1. Custom Error Interface

Extend the Error interface with a `statusCode` property:

```typescript
// ✅ Define custom error type
interface CustomError extends Error {
  statusCode?: number;
}

// ✅ Create errors with status codes
const error: CustomError = new Error("Recipe not found");
error.statusCode = 404;
throw error;
```

### 2. Error Handling in Route Handlers

**Rule**: Wrap handler logic in try-catch and pass errors to `next()` middleware.

**Why**: Centralizes error handling and prevents uncaught exceptions.

```typescript
// ✅ Proper error handling pattern
router.get('/:id', async (req, res, next) => {
  try {
    // 1. Validation
    const result = positiveIntSchema.safeParse(req.params.id);
    if (!result.success) {
      const error: CustomError = new Error("Invalid recipe ID");
      error.statusCode = 400;
      throw error;
    }

    // 2. Business logic
    const recipe = await getRecipeById(result.data);
    if (!recipe) {
      const error: CustomError = new Error("Recipe not found");
      error.statusCode = 404;
      throw error;
    }

    // 3. Response
    res.status(200).json({ data: recipe });
  } catch (error) {
    next(error); // Pass to errorHandler middleware
  }
});
```

### 3. Error Message Guidelines

**Rule**: Error messages must be:
- Human-readable
- Specific (not generic like "Something went wrong")
- Non-disclosive (don't leak internal details)

```typescript
// ❌ AVOID: Generic or disclosive
"Database connection failed: connection timeout at 192.168.1.1:5432"

// ✅ PREFER: Specific and safe
"Failed to retrieve recipe"
"Invalid recipe ID format"
"No permission to access this recipe"
```

### 4. Handle Missing Resources

**Rule**: Return 404 for missing resources, not 500.

**Why**: Distinguishes client errors from server errors, helping with debugging.

```typescript
// ✅ Correct error handling
const recipe = await getRecipeById(recipeId);
if (!recipe) {
  const error: CustomError = new Error("Recipe not found");
  error.statusCode = 404;
  throw error;
}
```

### 5. Distinguish Permission Errors

**Rule**: Return 403 for permission denied, not 404 (don't hide resource existence).

**Why**: Helps clients understand they need different permissions, not that resource doesn't exist.

```typescript
// ✅ Correct permission checking
if (recipe.author_id !== req.userId) {
  const error: CustomError = new Error("No permission to access this recipe");
  error.statusCode = 403;
  throw error;
}
```

---

## Authorization & Authentication

### 1. Authentication Flow

The authentication flow is handled by the API Gateway and extractUser middleware:

```
Client → API Gateway (validates JWT, sets X-User-Id header) → Core-Service
                                                                    ↓
                                          extractUser middleware (validates header)
                                                    ↓
                                          req.userId = validated ID
```

### 2. Check Authentication in Handlers

**Rule**: If endpoint requires authentication, check `req.userId !== undefined`.

**Why**: Ensures only authenticated users can access protected endpoints.

```typescript
// ✅ Require authentication
if (req.userId === undefined) {
  const error: CustomError = new Error("Authentication required");
  error.statusCode = 401;
  throw error;
}
```

### 3. Verify Resource Ownership

**Rule**: Always verify `req.userId` matches resource owner before allowing modifications.

**Why**: Prevents users from modifying others' resources.

```typescript
// ✅ Ownership check
const recipe = await getRecipeById(recipeId);
if (recipe.author_id !== req.userId) {
  const error: CustomError = new Error("No permission to modify this recipe");
  error.statusCode = 403;
  throw error;
}
```

### 4. Authorization Header Best Practices

The JWT token is managed by the API Gateway:

```typescript
// ✅ Token in Authorization header (handled by gateway)
// Request: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// ✅ User ID in X-User-Id header (set by gateway, validated by core-service)
// Request: X-User-Id: 42

// ❌ AVOID: Putting token in request body
// Never send: { jwt: "token", username: "user" }
```

### 5. Access Control Rules

Apply these rules based on resource visibility:

- **Public resources** (published recipes): Anyone can view
- **Private resources** (draft recipes): Only owner can view
- **User-specific data** (my recipes): Only owner can view
- **Resource modifications**: Only owner can create/edit/delete

```typescript
// ✅ Public access pattern
export const getRecipeById = async (id: number, userId?: number) => {
  const result = await pool.query(
    `SELECT * FROM recipes WHERE id = $1 AND (status = 'published' OR author_id = $2)`,
    [id, userId]
  );
  // Return data if published OR if userId is owner
};
```

---

## Database & Query Patterns

### 1. Use Connection Pool

**Rule**: All database operations use the connection pool, never create individual connections.

**Why**: Connection pooling manages resources efficiently.

```typescript
// ✅ Use pool
import { pool } from "../db/database";
const result = await pool.query("SELECT * FROM recipes", []);

// ❌ AVOID: Creating new connections
const client = new Client({ /* config */ });
```

### 2. Transactions for Multi-Step Operations

**Rule**: Use transactions when modifying multiple rows or tables atomically.

**Why**: Ensures consistency if any step fails.

```typescript
// ✅ Transaction pattern
const client = await pool.connect();
try {
  await client.query('BEGIN');

  // Step 1: Insert recipe
  const recipeResult = await client.query(
    'INSERT INTO recipes (title, author_id) VALUES ($1, $2) RETURNING *',
    [title, userId]
  );

  // Step 2: Insert ingredients
  for (const ingredient of ingredients) {
    await client.query(
      'INSERT INTO recipe_ingredients (recipe_id, name) VALUES ($1, $2)',
      [recipeResult.rows[0].id, ingredient.name]
    );
  }

  await client.query('COMMIT');
  return recipeResult.rows[0];
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### 3. Avoid N+1 Queries

**Rule**: Fetch all needed data in one query using JOINs, LEFT JOINs, or aggregation.

**Why**: Prevents performance degradation as data grows.

```typescript
// ✅ Single query with aggregation
const result = await pool.query(`
  SELECT
    r.id, r.title, r.author_id,
    json_agg(json_build_object('id', i.id, 'name', i.name)) as ingredients
  FROM recipes r
  LEFT JOIN recipe_ingredients i ON r.id = i.recipe_id
  WHERE r.id = $1
  GROUP BY r.id
`, [recipeId]);
```

### 4. Use JSON Aggregation for Related Data

**Rule**: Use PostgreSQL's `json_agg()` to fetch related data as structured JSON.

**Why**: Simplifies data shaping and reduces application code.

```typescript
// ✅ PostgreSQL JSON aggregation
SELECT
  r.*,
  json_agg(json_build_object(
    'id', c.id,
    'name', c.name
  )) FILTER (WHERE c.id IS NOT NULL) as categories
FROM recipes r
LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id
LEFT JOIN categories c ON rc.category_id = c.id
GROUP BY r.id;
```

### 5. Handle NULL Values in Aggregation

**Rule**: Use `FILTER (WHERE ... IS NOT NULL)` to prevent NULL aggregates when no relations exist.

**Why**: Returns empty array `[]` instead of `[null]` for better data integrity.

```typescript
// ✅ Correct: Empty array when no ingredients
json_agg(i.*) FILTER (WHERE i.id IS NOT NULL) as ingredients

// ❌ AVOID: NULL in array when no ingredients
json_agg(i.*) as ingredients
```

---

## Testing Requirements

### 1. Test File Organization

Create tests in `/src/__tests__/` with matching resource names:

```
/src/__tests__/
├── recipes.test.ts          # Recipe endpoint tests
├── users.test.ts            # User endpoint tests
└── setup.ts                 # Jest setup (database cleanup)
```

### 2. Test Structure

```typescript
// ✅ Test structure
describe("GET /recipes/:id", () => {
  it("should return a recipe when it exists and is published", async () => {
    const response = await request(app).get("/recipes/1");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.id).toBe(1);
  });

  it("should return 404 when recipe doesn't exist", async () => {
    const response = await request(app).get("/recipes/99999");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should validate recipe ID format", async () => {
    const response = await request(app).get("/recipes/invalid-id");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});
```

### 3. Test Coverage Requirements

For each endpoint, test:

- ✅ **Happy path**: Valid input, successful response
- ✅ **Validation errors**: Invalid input (400)
- ✅ **Authentication**: Missing or invalid auth (401)
- ✅ **Permission errors**: Valid auth but no permission (403)
- ✅ **Not found**: Resource doesn't exist (404)
- ✅ **Conflicts**: Business logic violations (409)
- ✅ **Database errors**: Connection failures (500)

### 4. Supertest for HTTP Testing

```typescript
// ✅ Use Supertest for integration testing
import request from 'supertest';
import app from '../app';

describe("POST /recipes", () => {
  it("should create a recipe with valid input", async () => {
    const response = await request(app)
      .post("/recipes")
      .set("X-User-Id", "42")
      .send({
        title: "Pasta",
        description: "Delicious pasta",
        instructions: ["Boil water", "Add pasta"],
        servings: 2,
        spiciness: 0,
        ingredients: [
          { name: "Pasta", quantity: "1", unit: "cup" }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe("Pasta");
  });
});
```

### 5. Test Authorization

```typescript
// ✅ Test authentication requirements
it("should return 401 when user not authenticated", async () => {
  const response = await request(app)
    .post("/recipes")
    .send({ /* valid payload */ });

  expect(response.status).toBe(401);
});

// ✅ Test permission boundaries
it("should return 403 when user doesn't own resource", async () => {
  const response = await request(app)
    .post("/recipes/1/publish")
    .set("X-User-Id", "999")  // Different user
    .send({});

  expect(response.status).toBe(403);
});
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Nested if/else for Error Handling

**Problem**: Multiple error conditions create deeply nested code.

**Solution**: Use switch statements or early returns.

```typescript
// ❌ AVOID
if (condition1) {
  if (condition2) {
    if (condition3) {
      // actual logic
    }
  }
}

// ✅ PREFER: Early returns
if (!condition1) throw error1;
if (!condition2) throw error2;
if (!condition3) throw error3;
// actual logic
```

### Pitfall 2: TypeScript "as" Casting

**Problem**: Bypasses type safety, causing runtime errors.

**Solution**: Always validate with Zod.

```typescript
// ❌ AVOID: as casting loses type safety
const userId = req.params.id as number;

// ✅ PREFER: Zod validation
const result = positiveIntSchema.safeParse(req.params.id);
if (!result.success) throw error;
const userId = result.data; // Type-safe
```

### Pitfall 3: N+1 Query Pattern

**Problem**: Loop that queries database for each item.

**Solution**: Single query with JOIN or aggregation.

```typescript
// ❌ AVOID: N queries
for (const recipeId of recipeIds) {
  const recipe = await pool.query("SELECT * FROM recipes WHERE id = $1", [recipeId]);
}

// ✅ PREFER: 1 query
const recipes = await pool.query(
  "SELECT * FROM recipes WHERE id = ANY($1)",
  [recipeIds]
);
```

### Pitfall 4: Disclosing Internal Details in Errors

**Problem**: Error messages leak database structure or implementation details.

**Solution**: Use generic, safe error messages.

```typescript
// ❌ AVOID: Leaks internal details
"Database connection failed: connection timeout at db.internal:5432"
"NULL value for column 'author_id' violates not-null constraint"

// ✅ PREFER: Generic, safe messages
"Failed to process request"
"Invalid recipe data"
```

### Pitfall 5: Missing Ownership Checks

**Problem**: Users can modify other users' resources.

**Solution**: Always verify `recipe.author_id === req.userId`.

```typescript
// ❌ AVOID: No ownership check
await publishRecipe(recipeId);

// ✅ PREFER: Verify ownership
const recipe = await getRecipeById(recipeId);
if (recipe.author_id !== req.userId) {
  throw new Error("No permission");
}
await publishRecipe(recipeId);
```

### Pitfall 6: Concatenating Queries (SQL Injection)

**Problem**: String concatenation creates SQL injection vulnerability.

**Solution**: Always use parameterized queries with `$1`, `$2`, etc.

```typescript
// ❌ DANGEROUS: SQL Injection vulnerability
const query = `SELECT * FROM recipes WHERE id = ${recipeId}`;

// ✅ SAFE: Parameterized query
const query = "SELECT * FROM recipes WHERE id = $1";
const result = await pool.query(query, [recipeId]);
```

### Pitfall 7: Hiding Resource Existence with 404

**Problem**: Using 404 for permission errors reveals nothing exists.

**Solution**: Use 403 for permission errors, 404 only for truly missing resources.

```typescript
// ❌ AVOID: Hides existence (wrong for security)
if (recipe.author_id !== req.userId) {
  return res.status(404).json({ error: "Not found" });
}

// ✅ PREFER: Clear permission error
if (recipe.author_id !== req.userId) {
  const error: CustomError = new Error("No permission to access this recipe");
  error.statusCode = 403;
  throw error;
}
```

---

## Implementation Examples

### Example 1: Simple GET Endpoint

```typescript
// 1. Route handler (/src/routes/recipes.routes.ts)
router.get('/:id', async (req, res, next) => {
  try {
    // Validate ID
    const result = positiveIntSchema.safeParse(req.params.id);
    if (!result.success) {
      const error: CustomError = new Error("Invalid recipe ID");
      error.statusCode = 400;
      throw error;
    }

    // Call service
    const recipe = await getRecipeById(result.data, req.userId);

    if (!recipe) {
      const error: CustomError = new Error("Recipe not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ data: recipe });
  } catch (error) {
    next(error);
  }
});

// 2. Service function (/src/services/recipes.service.ts)
export const getRecipeById = async (
  id: number,
  userId?: number
): Promise<Recipe | null> => {
  const result = await pool.query(
    `SELECT * FROM recipes
     WHERE id = $1 AND (status = 'published' OR author_id = $2)`,
    [id, userId]
  );
  return result.rows[0] || null;
};

// 3. Validation schema (/src/validation/schemas.ts)
export const positiveIntSchema = z.coerce.number().int().positive();

// 4. Test (/src/__tests__/recipes.test.ts)
describe("GET /recipes/:id", () => {
  it("should return recipe", async () => {
    const response = await request(app).get("/recipes/1");
    expect(response.status).toBe(200);
  });

  it("should return 404 for missing recipe", async () => {
    const response = await request(app).get("/recipes/99999");
    expect(response.status).toBe(404);
  });
});
```

### Example 2: POST Endpoint with Authentication

```typescript
// 1. Route handler (/src/routes/recipes.routes.ts)
router.post('/', async (req, res, next) => {
  try {
    // Check authentication
    if (req.userId === undefined) {
      const error: CustomError = new Error("Authentication required");
      error.statusCode = 401;
      throw error;
    }

    // Validate input
    const validation = createRecipeInputSchema.safeParse(req.body);
    if (!validation.success) {
      const error: CustomError = new Error(formatZodError(validation.error));
      error.statusCode = 400;
      throw error;
    }

    // Create recipe
    const recipe = await createRecipe(req.userId, validation.data);
    res.status(201).json({ data: recipe });
  } catch (error) {
    next(error);
  }
});

// 2. Service function (/src/services/recipes.service.ts)
export const createRecipe = async (
  userId: number,
  input: CreateRecipeInput
): Promise<Recipe> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert recipe
    const recipeResult = await client.query(
      `INSERT INTO recipes (title, description, author_id, status)
       VALUES ($1, $2, $3, 'draft')
       RETURNING *`,
      [input.title, input.description, userId]
    );
    const recipe = recipeResult.rows[0];

    // Insert ingredients in batch
    for (const ingredient of input.ingredients) {
      await client.query(
        `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit)
         VALUES ($1, $2, $3, $4)`,
        [recipe.id, ingredient.name, ingredient.quantity, ingredient.unit]
      );
    }

    await client.query('COMMIT');
    return recipe;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// 3. Validation schema (/src/validation/schemas.ts)
export const createRecipeInputSchema = z.object({
  title: z.string().trim().min(1).max(256),
  description: z.string().trim().max(5000).nullable(),
  ingredients: z.array(createRecipeIngredientInputSchema).min(1)
});

// 4. Test (/src/__tests__/recipes.test.ts)
describe("POST /recipes", () => {
  it("should create recipe with valid input", async () => {
    const response = await request(app)
      .post("/recipes")
      .set("X-User-Id", "42")
      .send({
        title: "Pasta",
        description: "Delicious",
        ingredients: [{ name: "Pasta", quantity: "1", unit: "cup" }]
      });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe("Pasta");
  });

  it("should return 401 without authentication", async () => {
    const response = await request(app).post("/recipes").send({});
    expect(response.status).toBe(401);
  });
});
```

---

## Checklist for PR Review

Before submitting a PR with new endpoints:

- [ ] All input validated with Zod schemas
- [ ] No TypeScript `as` casting used
- [ ] Error handling uses appropriate status codes
- [ ] Authorization checks verify ownership when needed
- [ ] Database queries are parameterized (no SQL injection)
- [ ] No N+1 query patterns
- [ ] Complex error handling uses switch statements
- [ ] All tests pass and cover happy path + error cases
- [ ] No sensitive information in error messages
- [ ] Code follows established patterns from existing endpoints
- [ ] PR description documents endpoints, request/response formats, and status codes

---

**For questions or clarifications about these rules, refer to:**
- `ARCHITECTURE.md` - Technical architecture details
- `CORE_SERVICE_ENDPOINTS_DOCUMENTATION.md` - Historical review comments and patterns
- Existing endpoint implementations in `/src/routes/`
