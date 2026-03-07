/**
 * Core Service Entry Point
 * 
 * TypeScript provides:
 * - Type safety for Express objects (app, PORT)
 * - Compile-time error checking (errors found BEFORE runtime)
 * - IDE autocomplete and suggestions
 */

import express, { Express } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.routes.js";
import { recipesRouter } from "./routes/recipes.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Express app - typed as Express (type from @types/express)
// This ensures all methods like app.get(), app.use() etc. are type-checked
const app: Express = express();

// PORT: number ensures the variable MUST be a number
// parseInt() guarantees a number, ?? "3002" is fallback if PORT not set
const PORT: number = parseInt(process.env.PORT || "3002", 10);

// ===== MIDDLEWARE (handlers that run on EVERY request) =====
// TODO: Review CORS configuration when all microservices are integrated.
// Currently core-service is behind API Gateway, so CORS may not be needed here.
// Revisit when frontend direct access to core-service is required.
app.use(
  cors({
    origin: `http://localhost:${PORT}`,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
); // Configure CORS for security
app.use(express.json()); // Parse JSON from request body

// ===== ROUTES (endpoints for different paths) =====
// Requests to /health* are routed to healthRouter
app.use("/health", healthRouter);
// Requests to /recipes* are routed to recipesRouter
app.use("/recipes", recipesRouter);

// ===== ERROR HANDLER (MUST be last middleware!) =====
// Catches 404 errors (no route matched)
app.use(notFoundHandler);
// Catches all other errors that occurred during request processing
app.use(errorHandler);

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Core service running on port ${PORT}`);
});
