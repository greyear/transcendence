/**
 * Extract User Middleware
 * 
 * Middleware function that ADDS user information to the req object
 * 
 * TypeScript benefits:
 * - declare global namespace Express - extends built-in Request type
 * - req.userId is now "known" by TypeScript everywhere req is used
 * - Without this, TypeScript would complain: "Property 'userId' does not exist"
 */

import { Request, Response, NextFunction } from "express";

/**
 * INTERFACE - a "contract" that an object contains specific properties
 * declare global - tells TypeScript "extend an existing type"
 * 
 * Before: Request had only: method, headers, body, params, etc.
 * After: Request has ALL existing fields + our new userId field
 */
declare global {
  namespace Express {
    interface Request {
      // userId can be: string (user ID), null (guest), or undefined (not set)
      // ? after userId means this field is OPTIONAL (can be undefined)
      userId?: string | null;
    }
  }
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
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get userId from X-User-Id header
  // as string | undefined - tells TypeScript this can be string or undefined
  const userId = req.headers["x-user-id"] as string | undefined;

  // If userId was sent - set it, otherwise set to null (guest)
  if (userId) {
    req.userId = userId;
  } else {
    req.userId = null;
  }

  // Pass control to the next middleware
  next();
};
