/**
 * Optional Authentication Middleware
 * 
 * This middleware:
 * 1. Checks for JWT token in cookies OR Authorization header
 * 2. If yes - validates token with auth-service
 * 3. If OK - saves userId in req.userId
 * 4. If no/error - continues as guest (req.userId = null)
 * 5. NEVER blocks the request (optional = not required)
 * 
 * Token sources (priority order):
 * - req.cookies.token (browser/frontend apps)
 * - req.headers.authorization: "Bearer <token>" (mobile/API clients)
 * 
 * Benefits of optionalAuth:
 * - Guests can view published recipes
 * - Authenticated users see their own recipes + published
 * - One middleware instead of two (auth required / not required)
 * - Supports both cookie-based and header-based authentication
 */

import express, { Request, Response, NextFunction, RequestHandler, Router } from "express";
import { z } from "zod";

/**
 * Utility function to safely extract error message from unknown error type
 * 
 * Handles cases where error might not be an Error instance
 * (e.g., throw "string", throw 123, throw {custom: "object"})
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Zod schema for validating auth-service response
 * Auth service must return an object with 'id' field
 * id must be a non-empty string (the user ID)
 */
const authResponseSchema = z.object({
  id: z.string().min(1),
});

/**
 * Custom Request type for authenticated requests
 * Extends Express.Request with userId field
 * 
 * userId is NOT optional here - after auth middleware,
 * we know it always exists (string or null, but defined)
 */
export interface AuthenticatedRequest extends Request {
  userId: string | null;
}

// Auth service URL from environment variable
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

/**
 * Optional Authentication Middleware
 * 
 * Parameters:
 * - req: Request - request object
 * - res: Response - response object
 * - next: NextFunction - pass control to next middleware
 * 
 * Promise<void> - async function (uses await for fetch)
 * 
 * Process:
 * 1. Get Authorization header
 * 2. If not present -> continue as guest
 * 3. If present -> send to auth-service for validation
 * 4. Set req.userId based on result
 * 5. Call next() to pass to next middleware
 */
export const optionalAuth: RequestHandler = async (
  req,
  res,
  next
): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  try {
    // 1. GET TOKEN FROM COOKIE OR HEADER
    // Priority: 
    // - First check cookies (browser sends automatically)
    // - If no cookie, check Authorization header (mobile apps, API clients)
    let token = authReq.cookies.token;

    // If no cookie, try Authorization header
    if (!token) {
      const authHeader = authReq.headers.authorization;
      if (authHeader) {
        token = authHeader.split(" ")[1]; // Remove "Bearer " prefix
      }
    }

    // If no token from either source → continue as guest
    if (!token) {
      // No token provided - continue as guest
      authReq.userId = null;
    } else {
      // 2. VALIDATE TOKEN IN AUTH-SERVICE
      // Send token to auth-service for verification
      // Auth-service returns user information or error
      try {
        // fetch() - HTTP request (built-in function in Node.js)
        const response = await fetch(`${AUTH_SERVICE_URL}/auth/validate`, {
          method: "POST", // POST request
          headers: {
            "Authorization": `Bearer ${token}`, // Send token in Authorization header (RFC 7235)
          },
        });

        // response.ok = true if status 200-299
        if (response.ok) {
          // Token is valid! Get user information
          const rawData = await response.json();

          // Validate response with Zod schema
          const parseResult = authResponseSchema.safeParse(rawData);

          if (parseResult.success) {
            // Validation passed - extract user ID
            authReq.userId = parseResult.data.id;
            // Set X-User-Id header for proxying to downstream services
            authReq.headers["x-user-id"] = parseResult.data.id;
          } else {
            // Response format is invalid - treat as auth failure
            console.warn("Invalid auth-service response format:", parseResult.error.issues[0]?.message);
            authReq.userId = null;
          }
        } else {
          // Token is invalid (expired, fake, etc.)
          // Continue as guest
          console.warn("Invalid token, continuing as guest");
          authReq.userId = null;
        }
      } catch (authError) {
        // Auth-service is unavailable (network error, service down, etc.)
        // Continue as guest (to avoid breaking entire service)
        console.error("Auth-service error:", getErrorMessage(authError));
        authReq.userId = null;
      }
    }
  } catch (error) {
    // Unexpected error - continue as guest (fail-safe)
    console.error("Error in optionalAuth middleware:", getErrorMessage(error));
    authReq.userId = null;
  }
  
  // ALWAYS call next() - happens after both successful and error paths
  next();
};

/**
 * Authentication Router
 * 
 * Router with optionalAuth middleware applied
 * Use this for routes that need optional authentication (recipes, etc.)
 * 
 * Benefits:
 * - optionalAuth only runs for routes that need it
 * - Health/monitoring endpoints don't trigger auth-service calls
 * - Better performance and reduced coupling
 */
export const authRouter: Router = express.Router();
authRouter.use(optionalAuth);
