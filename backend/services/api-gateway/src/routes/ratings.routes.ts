/**
 * Recipe Ratings Routes (API Gateway)
 *
 * Proxies rating-related requests to core-service.
 * All routes require authentication.
 *
 * POST   /recipes/:id/rating  – rate a recipe
 * PUT    /recipes/:id/rating  – update your rating
 * DELETE /recipes/:id/rating  – remove your rating
 */

import { type RequestHandler, Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getInternalHeaders } from "../utils/internalHeaders.js";
import {
	CORE_SERVICE_TIMEOUT_MS,
	createTimeoutSignal,
	isTimeoutError,
} from "../utils/timeouts.js";

const CORE_SERVICE_URL =
	process.env.CORE_SERVICE_URL || "http://core-service:3002";

export const ratingsRouter = Router({ mergeParams: true });

/**
 * POST /recipes/:id/rating  – rate a recipe
 */
const createRatingHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/recipes/${req.params.id}/rating`,
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
		res.status(500).json({ error: "Failed to create rating" });
	}
};

/**
 * PUT /recipes/:id/rating  – update rating
 */
const updateRatingHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/recipes/${req.params.id}/rating`,
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
		res.status(500).json({ error: "Failed to update rating" });
	}
};

/**
 * DELETE /recipes/:id/rating  – remove rating
 */
const deleteRatingHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/recipes/${req.params.id}/rating`,
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
		res.status(500).json({ error: "Failed to delete rating" });
	}
};

ratingsRouter.post("/", requireAuth, createRatingHandler);
ratingsRouter.put("/", requireAuth, updateRatingHandler);
ratingsRouter.delete("/", requireAuth, deleteRatingHandler);
