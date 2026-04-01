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

export const usersRouter = Router();

const getUsersHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/users`, {
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
		res.status(500).json({ error: "Failed to fetch users from core-service" });
	}
};

const getUserByIdHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/users/${req.params.id}`, {
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
		res.status(500).json({ error: "Failed to fetch user from core-service" });
	}
};

const getUserRecipesHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/users/${req.params.id}/recipes`,
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
		res
			.status(500)
			.json({ error: "Failed to fetch user recipes from core-service" });
	}
};

const getMyRecipesHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/users/me/recipes`, {
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
		res.status(500).json({
			error: "Failed to fetch current user recipes from core-service",
		});
	}
};

const getFollowersHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/users/${req.params.id}/followers`,
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
		res.status(500).json({
			error: "Failed to fetch user followers from core-service",
		});
	}
};

const getFollowingHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/users/${req.params.id}/following`,
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
		res.status(500).json({
			error: "Failed to fetch user following from core-service",
		});
	}
};

// Register more specific routes FIRST, then less specific
// /me/recipes is most specific
usersRouter.get("/me/recipes", requireAuth, getMyRecipesHandler);
// /:id/followers and /:id/following are more specific than /:id/recipes
usersRouter.get("/:id/followers", getFollowersHandler);
usersRouter.get("/:id/following", getFollowingHandler);
// /:id/recipes is less specific, should be last
usersRouter.get("/:id/recipes", getUserRecipesHandler);
usersRouter.get("/:id", getUserByIdHandler);
usersRouter.get("/", getUsersHandler);
