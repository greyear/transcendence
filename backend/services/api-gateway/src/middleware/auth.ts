/**
 * Authentication Middleware
 *
 * This file exports two middleware functions: optionalAuth and requireAuth.
 * Both follow the same token resolution flow but differ in how they handle
 * missing or invalid tokens.
 *
 * Token sources (checked in this order):
 * - req.cookies.token           → browser / frontend (cookie set by auth-service)
 * - Authorization: Bearer <jwt> → mobile apps, API clients, curl
 *
 * Shared flow:
 * 1. Extract token from cookie or Authorization header
 * 2. Send token to auth-service POST /validate
 * 3. Parse and validate the response with Zod ({ id: number })
 * 4. Set req.userId + X-User-Id header (forwarded to core-service)
 *
 * ┌────────────────┬──────────────────────────────┬───────────────────────────────┐
 * │                │ optionalAuth                 │ requireAuth                   │
 * ├────────────────┼──────────────────────────────┼───────────────────────────────┤
 * │ No token       │ guest (userId = null), next() │ 401 Authentication required   │
 * │ Invalid token  │ guest (userId = null), next() │ 401 Invalid or expired token  │
 * │ Auth-svc down  │ guest (userId = null), next() │ 503 Service unavailable       │
 * │ Valid token    │ userId = number, next()       │ userId = number, next()       │
 * ├────────────────┼──────────────────────────────┼───────────────────────────────┤
 * │ Use on         │ Public routes (GET /recipes)  │ Protected routes              │
 * │                │                              │ (GET /users/me/recipes)       │
 * └────────────────┴──────────────────────────────┴───────────────────────────────┘
 */

import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
	AUTH_SERVICE_TIMEOUT_MS,
	createTimeoutSignal,
	isTimeoutError,
} from "../utils/timeouts.js";

/** Safely extracts a readable message from any thrown value (Error, string, etc.) */
function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

const MAX_SIGNED_INT = 2147483647;

/**
 * Zod schema for the auth-service /validate response.
 * Expects { id: <positive integer> } - coerces string to number just in case.
 */
const authUserIdSchema = z.coerce
	.number()
	.int()
	.positive()
	.max(MAX_SIGNED_INT, `id is out of INT range (max ${MAX_SIGNED_INT})`);

const authResponseSchema = z.object({
	id: authUserIdSchema,
});

/**
 * Typed reason for auth failure - used to map errors to HTTP status codes
 * without scattering magic strings across the codebase.
 */
type AuthFailureReason =
	| "invalid-token"
	| "invalid-auth-response"
	| "auth-timeout"
	| "auth-service-error";

/**
 * Discriminated union returned by validateTokenWithAuthService.
 * ok: true  → userId is present and trusted
 * ok: false → reason explains what went wrong
 */
type AuthResult =
	| { ok: true; userId: number }
	| { ok: false; reason: AuthFailureReason };

/** Extends Express Request with userId set by auth middleware. */
export interface AuthenticatedRequest extends Request {
	userId?: number | null;
}

const AUTH_SERVICE_URL =
	process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

const shouldLogOptionalAuth = process.env.NODE_ENV !== "test";

/**
 * Marks request as unauthenticated.
 * Deletes X-User-Id to prevent clients from spoofing this header directly.
 */
const setGuestUser = (req: AuthenticatedRequest): void => {
	req.userId = null;
	delete req.headers["x-user-id"];
};

/**
 * Marks request as authenticated: sets userId and forwards it to downstream
 * services via the X-User-Id internal header.
 */
const setAuthenticatedUser = (
	req: AuthenticatedRequest,
	userId: number,
): void => {
	req.userId = userId;
	req.headers["x-user-id"] = String(userId);
};

/**
 * Extracts JWT from the request.
 * Priority: cookie "token" first, then "Authorization: Bearer <token>" header.
 * Returns null if no token is found.
 */
const extractToken = (req: Request): string | null => {
	const cookieToken = req.cookies.token;
	if (typeof cookieToken === "string" && cookieToken.length > 0) {
		return cookieToken;
	}

	const authorizationHeader = Array.isArray(req.headers.authorization)
		? req.headers.authorization[0]
		: req.headers.authorization;

	if (!authorizationHeader) {
		return null;
	}

	// Safely split "Bearer <token>" or just fallback to token if someone sends it directly
	const parts = authorizationHeader.split(" ");
	const token = parts.length > 1 ? parts[1] : parts[0];

	return token && token.trim().length > 0 ? token.trim() : null;
};

/**
 * Sends the token to auth-service for validation.
 * Returns AuthResult - either { ok: true, userId } or { ok: false, reason }.
 * Never throws: all errors are caught and returned as failure reasons.
 */
const validateTokenWithAuthService = async (
	token: string,
): Promise<AuthResult> => {
	try {
		const response = await fetch(`${AUTH_SERVICE_URL}/validate`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			signal: createTimeoutSignal(AUTH_SERVICE_TIMEOUT_MS),
		});

		if (!response.ok) {
			return { ok: false, reason: "invalid-token" };
		}

		const rawData = await response.json();
		const parseResult = authResponseSchema.safeParse(rawData);

		if (!parseResult.success) {
			console.warn(
				"Invalid auth-service response format:",
				z.prettifyError(parseResult.error),
			);
			return { ok: false, reason: "invalid-auth-response" };
		}

		return { ok: true, userId: parseResult.data.id };
	} catch (authError) {
		if (isTimeoutError(authError)) {
			console.warn("Auth-service timeout");
			return { ok: false, reason: "auth-timeout" };
		}

		console.error("Auth-service error:", getErrorMessage(authError));
		return { ok: false, reason: "auth-service-error" };
	}
};

/**
 * Maps an AuthFailureReason to the correct HTTP error response.
 * 401 - token missing or invalid (client issue)
 * 502 - auth-service returned unexpected data (upstream issue)
 * 503 - auth-service is down or timed out (upstream unavailable)
 */
const respondToAuthFailure = (
	res: Response,
	reason: AuthFailureReason,
): void => {
	switch (reason) {
		case "invalid-token":
			res.status(401).json({ error: "Invalid or expired token" });
			return;
		case "invalid-auth-response":
			res
				.status(502)
				.json({ error: "Authentication service returned invalid response" });
			return;
		case "auth-timeout":
			res.status(504).json({ error: "Authentication service timed out" });
			return;
		case "auth-service-error":
			res.status(503).json({ error: "Authentication service unavailable" });
			return;
	}
};

/**
 * Optional auth middleware - used on public routes (e.g. GET /recipes).
 * If token is valid → req.userId = number (authenticated user).
 * If no token or invalid → req.userId = null (guest).
 * Never blocks the request - always calls next().
 */
export const optionalAuth = async (
	req: AuthenticatedRequest,
	_res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const tokenSource =
			typeof req.cookies.token === "string" && req.cookies.token.length > 0
				? "cookie"
				: "authorization";
		if (shouldLogOptionalAuth) {
			console.info(`[api-gateway] optionalAuth:start source=${tokenSource}`);
		}

		const token = extractToken(req);
		if (!token) {
			// No token provided, proceed as guest
			setGuestUser(req);
			if (shouldLogOptionalAuth) {
				console.info("[api-gateway] optionalAuth:missing-token (guest)");
			}
			next();
			return;
		}

		const authResult = await validateTokenWithAuthService(token);
		if (!authResult.ok) {
			// Token validation failed, proceed as guest
			setGuestUser(req);
			if (shouldLogOptionalAuth) {
				console.warn(
					`[api-gateway] optionalAuth:failed reason=${authResult.reason}`,
				);
			}
			next();
			return;
		}

		// Token is valid, proceed as authenticated user
		setAuthenticatedUser(req, authResult.userId);
		if (shouldLogOptionalAuth) {
			console.info(
				`[api-gateway] optionalAuth:success userId=${authResult.userId}`,
			);
		}
		next();
	} catch (error) {
		// Unexpected error, proceed as guest to avoid crashing the endpoint
		console.error("Error in optionalAuth middleware:", getErrorMessage(error));
		setGuestUser(req);
		next();
	}
};

/**
 * Required auth middleware - used on protected routes (e.g. GET /users/me/recipes).
 * If token is valid → req.userId = number, proceeds to route handler.
 * If no token → 401.
 * If token invalid/expired → 401.
 * If auth-service unavailable → 503.
 */
export const requireAuth = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const token = extractToken(req);
		if (!token) {
			// Missing token: clear X-User-Id just in case and block request
			setGuestUser(req);
			res.status(401).json({ error: "Authentication required" });
			return;
		}

		const authResult = await validateTokenWithAuthService(token);
		if (!authResult.ok) {
			// Invalid token or downstream service error: block request
			setGuestUser(req);
			respondToAuthFailure(res, authResult.reason);
			return;
		}

		// Success: assign userId and add X-User-Id internal header
		setAuthenticatedUser(req, authResult.userId);
		next();
	} catch (error) {
		// Unexpected fatal error
		console.error("Error in requireAuth middleware:", getErrorMessage(error));
		setGuestUser(req);
		res.status(500).json({ error: "Authentication failed" });
	}
};
