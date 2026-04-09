/**
 * Core Service Application Setup
 *
 * Exports configured Express app WITHOUT starting the server.
 * This allows:
 * - Testing with Supertest without binding to a real port
 * - Reusing configuration in different environments
 */

import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express, { type Express } from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import { recipesRouter } from "./routes/recipes.routes.js";
import { usersRouter } from "./routes/users.routes.js";

// Ensure uploads/avatars directory exists at startup
const avatarsDir = path.resolve("uploads/avatars");
if (!fs.existsSync(avatarsDir)) {
	fs.mkdirSync(avatarsDir, { recursive: true });
}

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
// Serve uploaded avatars as static files at /avatars/*
app.use("/avatars", express.static(path.resolve("uploads/avatars")));

// ===== ROUTES =====
// /health/* → healthRouter
app.use("/health", healthRouter);
// /recipes/* → recipesRouter
app.use("/recipes", recipesRouter);
// /users/* → usersRouter
app.use("/users", usersRouter);
// /profile → profileRouter
app.use("/profile", profileRouter);

// ===== ERROR HANDLERS (must be last!) =====
// 404 for non-existent routes
app.use(notFoundHandler);
// Handle all other errors
app.use(errorHandler);

// Export app for use in index.ts and tests
export { app };
