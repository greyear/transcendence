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

import express, { Express, Request, Response, RequestHandler } from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter, AuthenticatedRequest } from "./middleware/auth.js";

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
 * Recipes routes with optional authentication
 * 
 * Architecture:
 * - authRouter (from auth.ts) has optionalAuth middleware applied
 * - Mounted to /recipes path
 * - Health endpoints don't use authRouter (no auth overhead)
 * 
 * Benefits:
 * - Reduced auth-service calls (only for routes that need it)
 * - Better performance for monitoring endpoints
 * - Clear separation of concerns
 */

/**
 * GET / - get all recipes
 * (Actual path: /recipes/)
 */
const getRecipesHandler: RequestHandler = async (req, res, next) => {
  try {
    // Forward request to core-service
    // X-User-Id header already set by optionalAuth middleware
    const response = await fetch(`${CORE_SERVICE_URL}/recipes`, {
      headers: req.headers as Record<string, string>
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying to core-service:", error);
    res.status(500).json({ error: "Failed to fetch recipes from core-service" });
  }
};

authRouter.get("/", getRecipesHandler);

/**
 * GET /:id - get a specific recipe
 * (Actual path: /recipes/:id)
 * 
 * Possible responses:
 * - 200 OK: recipe found and accessible
 * - 403 Forbidden: recipe exists but is closed (draft of another user)
 * - 404 Not Found: recipe doesn't exist
 * - 400 Bad Request: ID is not a valid positive integer
 */
const getRecipeByIdHandler: RequestHandler = async (req, res, next) => {
  try {
    // Forward request to core-service
    // X-User-Id header already set by optionalAuth middleware
    // req.params.id - parameter from URL (/recipes/:id)
    const response = await fetch(
      `${CORE_SERVICE_URL}/recipes/${req.params.id}`,
      { headers: req.headers as Record<string, string> }
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying to core-service:", error);
    res.status(500).json({ error: "Failed to fetch recipe from core-service" });
  }
};

authRouter.get("/:id", getRecipeByIdHandler);

// Mount authRouter to /recipes path
app.use("/recipes", authRouter);

// ===== START SERVER =====
app.listen(port, () => {
  console.log(`api-gateway listening on port ${port}`);
});
