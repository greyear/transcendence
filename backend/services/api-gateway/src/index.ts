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
import { optionalAuth, AuthenticatedRequest } from "./middleware/auth.js";

/**
 * Custom Request type for authenticated requests
 * This is used in route handlers after optionalAuth middleware
 */
// (no need for declare global anymore - we use AuthRequest from middleware)

// Express application - typed as Express
const app: Express = express();
// PORT - number (environment variable converted to number)
const port = process.env.PORT || 3000;

// Service URLs from environment variables (for different environments: dev, prod, k8s)
// http://localhost:3002 - for local development
// http://core-service:3002 - for Docker (named as core-service)
// http://core-service.default.svc.cluster.local:3002 - for Kubernetes
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

/**
 * API Gateway Architecture:
 * 
 * Request flow:
 * 1. Client sends request with Authorization header containing JWT token
 * 2. optionalAuth middleware:
 *    - Extracts token from header
 *    - Validates with auth-service
 *    - Sets req.userId if OK
 * 3. Route handlers forward request to core-service
 *    - Add X-User-Id header with userId
 *    - Core-service uses this header instead of validating token (safer, faster)
 * 4. Response from core-service is sent to client
 * 
 * Benefits:
 * - Token validated only ONCE (in gateway), not in every service
 * - Microservices don't see token (only see userId)
 * - Improved security and performance
 */
app.use(optionalAuth);

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
    const response = await fetch(`${CORE_SERVICE_URL}/health`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
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
    const response = await fetch(`${CORE_SERVICE_URL}/health/db`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying to core-service:", error);
    res.status(500).json({ error: "Failed to fetch health/db from core-service" });
  }
});

// ===== RECIPES ROUTES =====

/**
 * GET /recipes - get all recipes
 * 
 * Flow:
 * 1. Client: GET /recipes (without auth or with auth header)
 * 2. Gateway: optionalAuth checks token, sets req.userId
 * 3. Gateway: Forward GET http://core-service:3002/recipes
 *    - With header X-User-Id if user is authenticated
 * 4. Core-service: Return all published recipes (or own + published if authenticated)
 * 5. Gateway: Return response to client
 */
app.get("/recipes", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Record<string, string> - type-safe headers object
    // {} - empty object (headers)
    const headers: Record<string, string> = {};

    // If user is authenticated - add X-User-Id header
    // req.userId set by middleware optionalAuth
    if (req.userId) {
      headers["X-User-Id"] = req.userId.toString();
    }

    // Forward request to core-service
    // { headers } - pass headers in fetch request
    const response = await fetch(`${CORE_SERVICE_URL}/recipes`, { headers });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying to core-service:", error);
    res.status(500).json({ error: "Failed to fetch recipes from core-service" });
  }
});

/**
 * GET /recipes/:id - get a specific recipe
 * 
 * :id - URL parameter (example 550e8400-e29b-41d4-a716-446655440000)
 * 
 * Flow:
 * 1. Client: GET /recipes/550e8400-e29b-41d4-a716-446655440000
 * 2. Gateway: Forward with X-User-Id header (if authenticated)
 * 3. Core-service: Check access rights + return recipe
 * 4. Gateway: Return response to client
 * 
 * Possible responses:
 * - 200 OK: recipe found and accessible
 * - 403 Forbidden: recipe exists but is closed (draft of another user)
 * - 404 Not Found: recipe doesn't exist
 * - 400 Bad Request: ID is not a valid UUID
 */
app.get("/recipes/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Prepare headers
    const headers: Record<string, string> = {};
    if (req.userId) {
      headers["X-User-Id"] = req.userId.toString();
    }

    // Forward request to core-service
    // req.params.id - parameter from URL (/recipes/:id)
    const response = await fetch(
      `${CORE_SERVICE_URL}/recipes/${req.params.id}`,
      { headers }
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying to core-service:", error);
    res.status(500).json({ error: "Failed to fetch recipe from core-service" });
  }
});

// ===== START SERVER =====
app.listen(port, () => {
  console.log(`api-gateway listening on port ${port}`);
});
