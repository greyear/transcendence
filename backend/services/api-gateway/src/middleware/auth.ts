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

import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
	AUTH_SERVICE_TIMEOUT_MS,
	createTimeoutSignal,
	isTimeoutError,
} from "../utils/timeouts.js";

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
 * id can be integer number or integer string
 * value is parsed to integer and validated against INT range
 */
const MAX_SIGNED_INT = 2147483647;

const authUserIdSchema = z.coerce
	.number()
	.int()
	.positive()
	.max(MAX_SIGNED_INT, `id is out of INT range (max ${MAX_SIGNED_INT})`);

const authResponseSchema = z.object({
	id: authUserIdSchema,
});

/**
 * Custom Request type for authenticated requests
 * Extends Express.Request with userId field
 *
 * userId is optional - it's set by optionalAuth middleware
 * After middleware: number (authenticated) or null (guest)
 * Before middleware: undefined
 */
export interface AuthenticatedRequest extends Request {
	userId?: number | null;
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
	next: NextFunction,
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

		// Early return: no token provided
		if (!token) {
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
					Authorization: `Bearer ${token}`, // Send token in Authorization header (RFC 7235)
				},
				signal: createTimeoutSignal(AUTH_SERVICE_TIMEOUT_MS),
			});

			// Early return: token is invalid (expired, fake, etc.)
			if (!response.ok) {
				console.warn("Invalid token, continuing as guest");
				req.userId = null;
				return next();
			}

			// Get user information from response
			const rawData = await response.json();

			// Validate response with Zod schema
			const parseResult = authResponseSchema.safeParse(rawData);

			// Early return: response format is invalid
			if (!parseResult.success) {
				console.warn(
					"Invalid auth-service response format:",
					z.prettifyError(parseResult.error),
				);
				req.userId = null;
				return next();
			}

			// Success: token is valid and response is well-formed
			req.userId = parseResult.data.id;
			// Set X-User-Id header for proxying to downstream services
			req.headers["x-user-id"] = String(parseResult.data.id);
			return next();
		} catch (authError) {
			// Auth-service is unavailable (network error, service down, etc.)
			// Continue as guest (to avoid breaking entire service)
			if (isTimeoutError(authError)) {
				console.warn("Auth-service timeout, continuing as guest");
			} else {
				console.error("Auth-service error:", getErrorMessage(authError));
			}

			req.userId = null;
			return next();
		}
	} catch (error) {
		// Unexpected error - continue as guest (fail-safe)
		console.error("Error in optionalAuth middleware:", getErrorMessage(error));
		req.userId = null;
		return next();
	}
};
