/**
 * Extract User Middleware
 * 
 * Middleware function that ADDS user information to the req object
 * 
 * TypeScript benefits:
 * - req.userId is now "known" by TypeScript everywhere req is used
 * - Without this, TypeScript would complain: "Property 'userId' does not exist"
 * 
 * Zod validation:
 * - Validates X-User-Id header format (must be a valid UUID if present)
 * - Ensures type safety at runtime, not just compile time
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Zod schema for validating userId from header
 * 
 * z.preprocess() - first, normalize the value:
 *   - if it's a string → keep it
 *   - if it's anything else → convert to undefined
 * 
 * Then validate:
 * - z.string().uuid() - must be valid UUID format
 * - .optional() - or undefined
 * - .default(undefined) - if undefined, stays undefined
 */
const userIdSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val : undefined),
  z.string().uuid().optional()
);

/**
 * Custom Request type for authenticated requests
 * Used when X-User-Id header is present (comes from API Gateway)
 */
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Middleware function that EXTRACTS userId from header
 * 
 * Parameters:
 * - req: Request - the request object
 * - res: Response - the response object
 * - next: NextFunction - function to pass to next middleware
 * 
 * void - function returns nothing (just calls next() at the end)
 */
export const extractUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Validate userId with Zod (no type assertion needed!)
  // z.preprocess handles the type coercion safely
  const result = userIdSchema.safeParse(req.headers["x-user-id"]);

  if (result.success) {
    // Validation passed - set userId (could be valid UUID or undefined)
    req.userId = result.data;
  } else {
    // Validation failed - treat as guest
    console.warn("Invalid X-User-Id header format:", result.error.issues[0]?.message);
    req.userId = undefined;
  }

  // Pass control to the next middleware
  next();
};
