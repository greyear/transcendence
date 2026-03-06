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

import express, { Express, Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { recipesRouter } from "./routes/recipes.routes.js";
import {
  CORE_HEALTH_TIMEOUT_MS,
  GATEWAY_RESPONSE_TIMEOUT_MS,
  createResponseTimeoutMiddleware,
  createTimeoutSignal,
  isTimeoutError,
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
const CORE_SERVICE_URL =
  process.env.CORE_SERVICE_URL || "http://core-service:3002";

// ===== MIDDLEWARE =====
app.use(
  cors({
    origin: `http://localhost:${port}`,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
); // Configure CORS for security
app.use(express.json()); // Parse JSON from request body
app.use(cookieParser()); // Parse cookies from request headers
app.use(createResponseTimeoutMiddleware(GATEWAY_RESPONSE_TIMEOUT_MS));

// ===== HEALTH CHECK ROUTES =====

/**
 * GET /health - check gateway health
 * 
 * Forwards request to core-service:
 * Gateway request → Core service request → Response
 */
app.get("/health", async (req: Request, res: Response): Promise<void> => {
  try {
    // Forward request to core-service
    const response = await fetch(`${CORE_SERVICE_URL}/health`, {
      signal: createTimeoutSignal(CORE_HEALTH_TIMEOUT_MS),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    if (isTimeoutError(error)) {
      res.status(504).json({ error: "Gateway Timeout" });
      return;
    }

    console.error("Error proxying to core-service:", error);
    res.status(500).json({ error: "Failed to fetch health from core-service" });
  }
});

/**
 * GET /health/db - check database health
 * 
 * Forwards request to core-service which will check Postgres connection
 */
app.get("/health/db", async (req: Request, res: Response): Promise<void> => {
  try {
    const response = await fetch(`${CORE_SERVICE_URL}/health/db`, {
      signal: createTimeoutSignal(CORE_HEALTH_TIMEOUT_MS),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    if (isTimeoutError(error)) {
      res.status(504).json({ error: "Gateway Timeout" });
      return;
    }

    console.error("Error proxying to core-service:", error);
    res.status(500).json({ error: "Failed to fetch health/db from core-service" });
  }
});

// ===== RECIPES ROUTES =====

// Mount recipes router (defined in routes/recipes.routes.ts)
app.use("/recipes", recipesRouter);

// ===== START SERVER =====
app.listen(port, () => {
  console.log(`api-gateway listening on port ${port}`);
});
