/**
 * Error Handler Middleware
 * 
 * Catches ALL errors that occur during request processing
 * and sends proper HTTP response with error instead of crashing the app
 * 
 * TypeScript benefits:
 * - CustomError interface allows adding statusCode property
 * - All parameters are type-safe
 * - Error is GUARANTEED to have correct format
 */

import { Request, Response, NextFunction } from "express";

/**
 * INTERFACE - describes the structure of an error object
 * extends Error - inherits from built-in Error class
 * 
 * Standard Error only has message, but we add statusCode
 * statusCode? - optional field (can be 404, 403, 500, etc.)
 */
interface CustomError extends Error {
  statusCode?: number;
}

/**
 * Error handler middleware - MUST be last!
 * 
 * Parameters:
 * - err: CustomError - the error that occurred
 * - req: Request - the request object
 * - res: Response - the response object (used to send response to client)
 * - next: NextFunction - pass control (usually not used in error handlers)
 * 
 * void - returns nothing, just sends res.status().json()
 */
const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // statusCode from error, or 500 if not set (internal server error)
  const statusCode = err.statusCode || 500;
  // message from error, or generic text
  const message = err.message || "Internal server error";

  // Log to console for debugging
  console.error(`Error [${statusCode}]:`, message);

  // Send JSON response to client
  // res.status(200) - success, res.status(404) - not found, res.status(500) - error
  res.status(statusCode).json({ error: message, status: statusCode });
};

/**
 * 404 Not Found Handler - called when no route matches the request
 * 
 * MUST be before errorHandler in middleware chain
 * Catches all requests that didn't match any route
 */
const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  res.status(404).json({ error: "Route not found", status: 404 });
};

export { errorHandler as default, notFoundHandler };
