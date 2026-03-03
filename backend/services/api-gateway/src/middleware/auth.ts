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

import { Request, Response, NextFunction } from "express";
import { z } from "zod";

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
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. GET TOKEN FROM COOKIE OR HEADER
    // Priority: 
    // - First check cookies (browser sends automatically)
    // - If no cookie, check Authorization header (mobile apps, API clients)
    let token = req.cookies.token;

    // If no cookie, try Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        token = authHeader.split(" ")[1]; // Remove "Bearer " prefix
      }
    }

    // If no token from either source → continue as guest
    if (!token) {
      // No token provided - continue as guest
      req.userId = null;
      return next();
    }

    // 2. VALIDATE TOKEN IN AUTH-SERVICE
    // Send token to auth-service for verification
    // Auth-service returns user information or error
    try {
      // fetch() - HTTP request (built-in function in Node.js)
      const response = await fetch(`${AUTH_SERVICE_URL}/auth/validate`, {
        method: "POST", // POST request
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }), // Send token in request body
      });

      // response.ok = true if status 200-299
      if (response.ok) {
        // Token is valid! Get user information
        const rawData = await response.json();

        // Validate response with Zod schema
        const parseResult = authResponseSchema.safeParse(rawData);

        if (parseResult.success) {
          // Validation passed - extract user ID
          req.userId = parseResult.data.id;
        } else {
          // Response format is invalid - treat as auth failure
          console.warn("Invalid auth-service response format:", parseResult.error.issues[0]?.message);
          req.userId = null;
        }
      } else {
        // Token is invalid (expired, fake, etc.)
        // Continue as guest
        console.warn("Invalid token, continuing as guest");
        req.userId = null;
      }
    } catch (authError) {
      // Auth-service is unavailable (network error, service down, etc.)
      // Continue as guest (to avoid breaking entire service)
      // if (authError instanceof Error) - check to avoid TypeScript error
      if (authError instanceof Error) {
        console.error("Auth-service error:", authError.message);
      }
      req.userId = null;
    }

    // ALWAYS call next() to pass to next middleware
    next();
  } catch (error) {
    // Unexpected error - continue as guest (fail-safe)
    if (error instanceof Error) {
      console.error("Error in optionalAuth middleware:", error);
    }
    req.userId = null;
    next();
  }
};
