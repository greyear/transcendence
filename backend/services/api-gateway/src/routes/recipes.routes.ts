/**
 * Recipes Routes
 *
 * Router for recipe-related endpoints.
 * GET routes use optional authentication.
 * POST routes require authentication.
 */

import { type RequestHandler, Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { getInternalHeaders } from "../utils/internalHeaders.js";
import {
	CORE_SERVICE_TIMEOUT_MS,
	createTimeoutSignal,
	isTimeoutError,
} from "../utils/timeouts.js";
import { ratingsRouter } from "./ratings.routes.js";

// Service URL for core-service
const CORE_SERVICE_URL =
	process.env.CORE_SERVICE_URL || "http://core-service:3002";

// Create router for recipes
export const recipesRouter = Router();

/**
 * GET / - get all recipes
 * (Actual path: /recipes/)
 */
const getRecipesHandler: RequestHandler = async (req, res, _next) => {
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
const getRecipeByIdHandler: RequestHandler = async (req, res, _next) => {
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

const createRecipeHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/recipes`, {
			method: "POST",
			headers: getInternalHeaders(req),
			body: JSON.stringify(req.body),
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
		res.status(500).json({ error: "Failed to create recipe" });
	}
};

const publishRecipeHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/recipes/${req.params.id}/publish`,
			{
				method: "POST",
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
		res.status(500).json({ error: "Failed to publish recipe" });
	}
};

const leaveRecipeReviewHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/recipes/${req.params.id}/reviews`,
			{
				method: "POST",
				headers: getInternalHeaders(req),
				body: JSON.stringify(req.body),
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
		res.status(500).json({ error: "Failed to leave recipe review" });
	}
};

const getRecipeReviewsHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/recipes/${req.params.id}/reviews`,
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
		res.status(500).json({ error: "Failed to fetch recipe reviews" });
	}
};

const updateRecipeHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/recipes/${req.params.id}`,
			{
				method: "PUT",
				headers: getInternalHeaders(req),
				body: JSON.stringify(req.body),
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
		res.status(500).json({ error: "Failed to update recipe" });
	}
};

const deleteRecipeHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/recipes/${req.params.id}`,
			{
				method: "DELETE",
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
		res.status(500).json({ error: "Failed to archive recipe" });
	}
};

const favoriteRecipeHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/recipes/${req.params.id}/favorite`,
			{
				method: "POST",
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
		res.status(500).json({ error: "Failed to add recipe to favorites" });
	}
};

const unfavoriteRecipeHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/recipes/${req.params.id}/favorite`,
			{
				method: "DELETE",
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
		res.status(500).json({ error: "Failed to remove recipe from favorites" });
	}
};

recipesRouter.post("/:id/publish", requireAuth, publishRecipeHandler);
recipesRouter.post("/:id/reviews", requireAuth, leaveRecipeReviewHandler);
recipesRouter.post("/:id/favorite", requireAuth, favoriteRecipeHandler);
recipesRouter.delete("/:id/favorite", requireAuth, unfavoriteRecipeHandler);

recipesRouter.get("/:id/reviews", optionalAuth, getRecipeReviewsHandler);
recipesRouter.get("/:id", optionalAuth, getRecipeByIdHandler);
recipesRouter.put("/:id", requireAuth, updateRecipeHandler);
recipesRouter.delete("/:id", requireAuth, deleteRecipeHandler);

recipesRouter.get("/", optionalAuth, getRecipesHandler);
recipesRouter.post("/", requireAuth, createRecipeHandler);

recipesRouter.use("/:id/rating", ratingsRouter);
