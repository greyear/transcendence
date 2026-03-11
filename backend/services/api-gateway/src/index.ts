/**
 * API Gateway Entry Point
 *
 * Server startup only - all configuration is in app.ts.
 * This allows testing the app without starting a real server.
 */

<<<<<<< HEAD
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
=======
import { app } from "./app.js";
>>>>>>> origin/main

// PORT from environment variable or default 3000
const port = process.env.PORT || 3000;

<<<<<<< HEAD
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
=======
// Start server
>>>>>>> origin/main
app.listen(port, () => {
	console.log(`api-gateway listening on port ${port}`);
});
