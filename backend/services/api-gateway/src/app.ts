/**
 * API Gateway Application Setup
 *
 * Exports configured Express app WITHOUT starting the server.
 * This allows testing without binding to a real port.
 *
 * API Gateway responsibilities:
 * - Authentication (JWT validation)
 * - Request forwarding to microservices
 * - Adding user context in headers
 */

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import "dotenv/config";
import { healthRouter } from "./routes/health.routes.js";
import { recipesRouter } from "./routes/recipes.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import {
	createResponseTimeoutMiddleware,
	GATEWAY_RESPONSE_TIMEOUT_MS,
} from "./utils/timeouts.js";

// Create Express application
const app: Express = express();

// ===== MIDDLEWARE =====
// CORS: allow frontend origin, override via CORS_ORIGIN env in production
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:5173",
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
	}),
);
// Parse JSON from request body
app.use(express.json());
// Parse cookies from request headers
app.use(cookieParser());
// Global timeout middleware to prevent hanging requests
app.use(createResponseTimeoutMiddleware(GATEWAY_RESPONSE_TIMEOUT_MS));

// ===== ROUTES =====
// Mount health router
app.use("/health", healthRouter);
// Mount recipes router (includes authentication middleware)
app.use("/recipes", recipesRouter);
// Mount users router
app.use("/users", usersRouter);
// Mount profile router
app.use("/profile", profileRouter);

// Export app for use in index.ts and tests
export { app };
