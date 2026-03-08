/**
 * Recipes Routes
 *
 * Router for recipe-related endpoints with optional authentication.
 * All routes in this router automatically pass through optionalAuth middleware.
 */

import { type Request, type RequestHandler, Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import {
	CORE_SERVICE_TIMEOUT_MS,
	createTimeoutSignal,
	isTimeoutError,
} from "../utils/timeouts.js";

// Service URL for core-service
const CORE_SERVICE_URL =
	process.env.CORE_SERVICE_URL || "http://core-service:3002";

const getInternalHeaders = (req: Request): Record<string, string> => {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	for (const key in req.headers) {
		const value = req.headers[key];

		if (value) {
			headers[key] = Array.isArray(value) ? value.join(", ") : value;
		}
	}

	return headers;
};

// Create router for recipes
export const recipesRouter = Router();

// Apply optionalAuth middleware to all routes in this router
recipesRouter.use(optionalAuth);

/**
 * GET / - get all recipes
 * (Actual path: /recipes/)
 */
const getRecipesHandler: RequestHandler = async (req, res, next) => {
	try {
		// Forward request to core-service
		// X-User-Id header already set by optionalAuth middleware
		const response = await fetch(`${CORE_SERVICE_URL}/recipes`, {
			headers: getInternalHeaders(req),
			signal: createTimeoutSignal(CORE_SERVICE_TIMEOUT_MS),
		});
		const data = await response.json();
		res.status(response.status).json(data);
	} catch (error) {
		if (isTimeoutError(error)) {
			res.status(504).json({ error: "Gateway Timeout" });
			return;
		}

		console.error("Error proxying to core-service:", error);
		res
			.status(500)
			.json({ error: "Failed to fetch recipes from core-service" });
	}
};

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
			{
				headers: getInternalHeaders(req),
				signal: createTimeoutSignal(CORE_SERVICE_TIMEOUT_MS),
			},
		);
		const data = await response.json();
		res.status(response.status).json(data);
	} catch (error) {
		if (isTimeoutError(error)) {
			res.status(504).json({ error: "Gateway Timeout" });
			return;
		}

		console.error("Error proxying to core-service:", error);
		res.status(500).json({ error: "Failed to fetch recipe from core-service" });
	}
};

recipesRouter.get("/:id", getRecipeByIdHandler);
recipesRouter.get("/", getRecipesHandler);
