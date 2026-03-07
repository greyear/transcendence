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
 * - Validates X-User-Id header format (must be positive INT if present)
 * - Ensures type safety at runtime, not just compile time
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { userIdIntSchema } from "../validation/schemas.js";

/**
 * Zod schema for validating userId from header
 * 
 * z.preprocess() - first, normalize the value:
 *   - if it's an array from Node headers → take first value
 *   - otherwise keep value as-is for Zod coercion
 * 
 * Then validate:
 * - parse to integer using Zod coercion
 * - must fit application INT range
 * - .optional() - or undefined
 */
const userIdSchema = z.preprocess(
  (val) => (Array.isArray(val) ? val[0] : val),
  userIdIntSchema.optional()
);

/**
 * Custom Request type for authenticated requests
 * Used when X-User-Id header is present (comes from API Gateway)
 */
export interface AuthenticatedRequest extends Request {
  userId?: number;
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
    // Validation passed - set userId (could be valid INT or undefined)
    req.userId = result.data;
  } else {
    // Validation failed - treat as guest
    console.warn("Invalid X-User-Id header:", z.prettifyError(result.error));
    req.userId = undefined;
  }

  // Pass control to the next middleware
  next();
};
