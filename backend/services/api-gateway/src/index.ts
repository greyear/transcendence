/**
 * API Gateway Entry Point
 *
 * API Gateway is a "facade" that:
 * 1. Checks authorization (JWT token)
 * 2. Forwards requests to other services (core-service)
 * 3. Adds user context in headers
 *
 * TypeScript benefits:
 * - app: Express - properly typed
 * - Record<string, string> - type-safe headers object
 * - Promise<void> - async functions with explicit type
 */

import express, { type Express } from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import { healthRouter } from "./routes/health.routes.js";
import { recipesRouter } from "./routes/recipes.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import {
	createResponseTimeoutMiddleware,
	GATEWAY_RESPONSE_TIMEOUT_MS,
} from "./utils/timeouts.js";

/**
 * Custom Request type for authenticated requests
 * This is used in route handlers after optionalAuth middleware
 */
// (no need for declare global anymore - we use AuthRequest from middleware)

// Express application - typed as Express
const app: Express = express();
// PORT - number (environment variable converted to number)
const port = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(
	cors({
		origin: `http://localhost:${port}`,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
	}),
); // Configure CORS for security
app.use(express.json()); // Parse JSON from request body
app.use(cookieParser()); // Parse cookies from request headers
app.use(createResponseTimeoutMiddleware(GATEWAY_RESPONSE_TIMEOUT_MS));

// ===== ROUTES =====

// Mount health router (defined in routes/health.routes.ts)
app.use("/health", healthRouter);

// Mount recipes router (defined in routes/recipes.routes.ts)
app.use("/recipes", recipesRouter);
// Mount users router (defined in routes/users.routes.ts)
app.use("/users", usersRouter);

// ===== START SERVER =====
app.listen(port, () => {
	console.log(`api-gateway listening on port ${port}`);
});
