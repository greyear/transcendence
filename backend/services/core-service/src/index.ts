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
import healthRoutes from "./routes/health.routes.js";
import recipesRoutes from "./routes/recipes.routes.js";
import errorHandler, { notFoundHandler } from "./middleware/errorHandler.js";

// Express app - typed as Express (type from @types/express)
// This ensures all methods like app.get(), app.use() etc. are type-checked
const app: Express = express();

// PORT: number ensures the variable MUST be a number
// parseInt() guarantees a number, ?? "3002" is fallback if PORT not set
const PORT: number = parseInt(process.env.PORT || "3002", 10);

// ===== MIDDLEWARE (handlers that run on EVERY request) =====
app.use(cors()); // Allow cross-domain requests
app.use(express.json()); // Parse JSON from request body

// ===== ROUTES (endpoints for different paths) =====
// Requests to /health* are routed to healthRoutes
app.use("/health", healthRoutes);
// Requests to /recipes* are routed to recipesRoutes
app.use("/recipes", recipesRoutes);

// ===== ERROR HANDLER (MUST be last middleware!) =====
// Catches 404 errors (no route matched)
app.use(notFoundHandler);
// Catches all other errors that occurred during request processing
app.use(errorHandler);

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Core service running on port ${PORT}`);
});
