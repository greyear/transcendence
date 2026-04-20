# Core-Service Architecture

## 1. Core-Service Directory Structure

```
/backend/services/core-service/
├── src/
│   ├── __tests__/                 # Integration tests
│   │   ├── setup.ts              # Jest test setup
│   │   ├── health.test.ts        # Health endpoint tests
│   │   ├── recipes.test.ts       # Recipe endpoint tests
│   │   └── users.test.ts         # User endpoint tests
│   ├── middleware/               # Express middleware
│   │   ├── errorHandler.ts       # Global error handling
│   │   ├── extractUser.ts        # User authentication
│   │   └── updateLastSeen.ts     # Track user activity
│   ├── routes/                   # HTTP route definitions
│   │   ├── health.routes.ts      # Health check endpoints
│   │   ├── recipes.routes.ts     # Recipe CRUD endpoints
│   │   ├── users.routes.ts       # User-specific endpoints
│   │   ├── profile.routes.ts     # User profile endpoints
│   │   ├── ratings.routes.ts     # Recipe review endpoints
│   │   └── internalSearch.routes.ts  # Search functionality
│   ├── services/                 # Business logic layer
│   │   ├── recipes.service.ts    # Recipe business logic
│   │   ├── users.service.ts      # User operations
│   │   ├── profile.service.ts    # Profile management
│   │   ├── ratings.service.ts    # Review and rating logic
│   │   ├── translation.service.ts # Translation operations
│   │   └── service.utils.ts      # Shared service utilities
│   ├── utils/                    # Utility functions
│   │   ├── locale.js             # Locale handling
│   │   ├── internalHeaders.js    # Internal header utilities
│   │   └── timeouts.js           # Timeout management
│   ├── validation/               # Input validation schemas
│   │   └── schemas.ts            # Zod validation schemas
│   ├── db/                       # Database connection
│   │   └── database.ts           # PostgreSQL connection pool
│   ├── app.ts                    # Express app configuration
│   └── index.ts                  # Server startup
├── Dockerfile                    # Container build
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── jest.config.js               # Test configuration
└── .env.template               # Environment variables
```

## 2. Router/Endpoint Architecture

**Framework**: Express.js with TypeScript
**Routing Pattern**: Modular routers with middleware chains
**File Organization**: Route-specific files in `/src/routes/`

### Endpoint structure
```typescript
// Global middleware chain (src/app.ts)
app.use(cors())
app.use(express.json())
app.use('/health', healthRouter)
app.use('/recipes', recipesRouter)
app.use('/users', usersRouter)
app.use('/profile', profileRouter)
app.use('/ratings', ratingsRouter)
app.use('/internalSearch', internalSearchRouter)
app.use(notFoundHandler)
app.use(errorHandler)
```

### Available Endpoints
- **Health**: `GET /health`, `GET /health/db`
- **Recipes**: `GET /recipes`, `GET /recipes/:id`, `POST /recipes`, `POST /recipes/:id/publish`
- **Users**: `GET /users/:id/recipes`, `GET /users/me/recipes`

### Route Handler Pattern
```typescript
const handlerFunction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Validation
    // 2. Service layer call
    // 3. Response formatting
    res.status(200).json({ data: result });
  } catch (error) {
    next(error); // Pass to error handler
  }
};
```

## 3. Service Layer Pattern

**Location**: `/src/services/recipes.service.ts`
**Responsibilities**: Business logic, database operations, access control
**Method Organization**: Export individual async functions

### Service Functions
```typescript
// Public recipes
export const getAllRecipes = async (): Promise<RecipeListItem[]>
export const getRecipeById = async (id: number, userId?: number): Promise<Recipe | { restricted: true } | null>

// User-specific recipes
export const getMyRecipes = async (userId: number): Promise<MyRecipeListItem[]>
export const getPublishedRecipesByUserId = async (userId: number): Promise<RecipeListItem[] | null>

// Recipe management
export const createRecipe = async (userId: number, input: CreateRecipeInput): Promise<Recipe>
export const publishRecipe = async (recipeId: number, userId: number): Promise<PublishRecipeResult>
```

### Access Control Logic
- **Guests**: See only published recipes
- **Authenticated users**: See their own recipes (all statuses) + others' published recipes
- **Owner verification**: Required for recipe modifications

## 4. Storage/Database Layer

**Database**: PostgreSQL
**Client**: node-postgres (`pg` package)
**Connection Pattern**: Connection pool with environment-based configuration

### Database Configuration (`/src/db/database.ts`)
```typescript
export const pool: Pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.POSTGRES_HOST || "localhost",
      port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
      database: process.env.POSTGRES_DB || "recipes_db",
      user: process.env.POSTGRES_USER || "postgres",
      password: process.env.POSTGRES_PASSWORD || "postgres",
    });
```

### Query Execution Patterns
```typescript
// Simple queries
const result = await pool.query('SELECT * FROM recipes WHERE status = $1', ['published']);

// Transactions
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Multiple operations
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Complex Queries
- JSON aggregation for ingredients and categories
- Parameterized queries for SQL injection prevention
- Array operations for bulk inserts

## 5. Middleware

### Authentication middleware (`/src/middleware/extractUser.ts`)
```typescript
export const extractUser = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const result = headerUserIdSchema.safeParse(req.headers["x-user-id"]);
  req.userId = result.success ? result.data : undefined;
  next();
};
```

**Purpose**: Extracts user ID from `X-User-Id` header (set by API Gateway)
**Validation**: Zod schema validation with graceful degradation to guest mode

### Error Handling Middleware (`/src/middleware/errorHandler.ts`)
```typescript
export const errorHandler = (err: CustomError, _req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  res.status(statusCode).json({ error: message });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ error: "Route not found" });
};
```

**Features**:
- Custom status codes (400, 401, 403, 404, 500)
- Structured error responses
- Development vs production logging

## 6. Key Technologies

### Core Dependencies
```json
{
  "cors": "^2.8.5",           // Cross-origin resource sharing
  "express": "^4.18.2",       // Web framework
  "pg": "^8.11.3",            // PostgreSQL client
  "zod": "^4.3.6",            // Runtime validation
  "dotenv": "^16.4.7"         // Environment configuration
}
```

### Development Dependencies
```json
{
  "@types/express": "^4.17.21", // Express TypeScript types
  "@types/pg": "^8.11.3",       // PostgreSQL TypeScript types
  "jest": "^30.2.0",            // Testing framework
  "supertest": "^7.2.2",       // HTTP integration testing
  "ts-jest": "^29.4.6",        // TypeScript Jest support
  "tsx": "^4.7.0",             // TypeScript execution
  "typescript": "^5.3.3"       // TypeScript compiler
}
```

### TypeScript Configuration
- **Target**: ES2022
- **Module**: ES2022 (ESM)
- **Strict mode**: Enabled
- **Source maps**: Enabled for debugging

## 7. Validation Patterns

### Input Validation (`/src/validation/schemas.ts`)
**Library**: Zod for runtime validation

### Key Schemas
```typescript
// ID validation
const positiveIntSchema = z.coerce.number().int().positive().max(MAX_SIGNED_INT);
export const userIdSchema = positiveIntSchema;

// Recipe creation
const createRecipeInputSchema = z.object({
  title: z.string().trim().min(1).max(256),
  description: z.string().trim().max(5000).nullable(),
  instructions: z.array(z.string().trim().min(1)).min(1),
  servings: positiveIntSchema,
  spiciness: z.coerce.number().int().min(0).max(3),
  ingredients: z.array(createRecipeIngredientInputSchema).min(1),
  category_ids: z.array(createRecipeCategoryIdSchema).default([])
});
```

### Validation Pattern
```typescript
const validateInput = (input: unknown): ValidationResult<T> => {
  const result = schema.safeParse(input);
  return result.success
    ? { valid: true, value: result.data }
    : { valid: false, error: z.prettifyError(result.error) };
};
```

## 8. Error Handling

### Custom Error Interface
```typescript
interface CustomError extends Error {
  statusCode?: number;
}
```

### Error Flow Pattern
```typescript
// In route handlers
if (!validation.valid) {
  const error: CustomError = new Error(validation.error);
  error.statusCode = 400;
  throw error;
}

// Caught by errorHandler middleware
const statusCode = err.statusCode || 500;
res.status(statusCode).json({ error: err.message });
```

### Status Code Usage
- **400**: Validation errors, malformed input
- **401**: Authentication required
- **403**: Access forbidden (wrong user)
- **404**: Resource not found
- **409**: Business logic conflicts (invalid state transitions)
- **500**: Internal server errors, database failures

## 9. Testing

### Testing Framework
- **Framework**: Jest with ts-jest
- **HTTP Testing**: Supertest
- **Test Environment**: Node.js

### Test Structure (`/src/__tests__/`)
```typescript
describe("Endpoint Group", () => {
  it("should handle happy path", async () => {
    const response = await request(app).get("/endpoint");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
  });

  it("should validate input", async () => {
    const response = await request(app).get("/endpoint/invalid-id");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});
```

### Test Categories
- **Integration tests**: Full HTTP request/response cycle
- **Database tests**: Real PostgreSQL connections
- **Validation tests**: Input validation scenarios
- **Authorization tests**: Access control verification

### Jest Configuration
- **ESM support**: Configured for ES modules
- **TypeScript**: ts-jest transform
- **Setup**: Database cleanup in `setup.ts`
- **Coverage**: Source file coverage tracking

## 10. Authentication/Authorization

### Authentication Flow
1. **API Gateway** sets `X-User-Id` header
2. **extractUser middleware** validates header with Zod
3. **Route handlers** check `req.userId` for authorization

### Authorization Patterns
```typescript
// Require authentication
if (req.userId === undefined) {
  const error: CustomError = new Error("Authentication required");
  error.statusCode = 401;
  throw error;
}

// Check ownership
if (recipe.author_id !== req.userId) {
  const error: CustomError = new Error("No permission to access this recipe");
  error.statusCode = 403;
  throw error;
}
```

### Access Control Rules
- **Public endpoints**: No authentication required
- **User-specific endpoints**: Require valid `X-User-Id` header
- **Resource ownership**: Users can only modify their own resources
- **Visibility rules**: Draft recipes only visible to owners

### Security Features
- **CORS configuration**: Restricts allowed origins
- **Input sanitization**: Zod validation and SQL parameterization
- **Error message consistency**: Prevents information disclosure
- **Header validation**: Graceful degradation for invalid auth headers

---

This core-service implements a clean, well-structured Node.js/Express API with comprehensive validation, error handling, and testing. The architecture follows modern TypeScript practices with a clear separation between HTTP concerns (routes), business logic (services), and data access (database queries).
