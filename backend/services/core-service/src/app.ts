/**
 * Core Service Application Setup
 *
 * Exports configured Express app WITHOUT starting the server.
 * This allows:
 * - Testing with Supertest without binding to a real port
 * - Reusing configuration in different environments
 */

import cors from "cors";
import express, { type Express } from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.routes.js";
import { recipesRouter } from "./routes/recipes.routes.js";

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

// ===== ROUTES =====
// /health/* → healthRouter
app.use("/health", healthRouter);
// /recipes/* → recipesRouter
app.use("/recipes", recipesRouter);

// ===== ERROR HANDLERS (must be last!) =====
// 404 for non-existent routes
app.use(notFoundHandler);
// Handle all other errors
app.use(errorHandler);

// Export app for use in index.ts and tests
export { app };
