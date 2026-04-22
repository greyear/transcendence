import { type RequestHandler, Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { getInternalHeaders } from "../utils/internalHeaders.js";
import {
	CORE_SERVICE_TIMEOUT_MS,
	createTimeoutSignal,
	isTimeoutError,
} from "../utils/timeouts.js";

const CORE_SERVICE_URL =
	process.env.CORE_SERVICE_URL || "http://core-service:3002";

const withForwardedQuery = (
	req: Parameters<RequestHandler>[0],
	path: string,
) => {
	const queryIndex = req.originalUrl.indexOf("?");
	if (queryIndex === -1) {
		return `${CORE_SERVICE_URL}${path}`;
	}

	return `${CORE_SERVICE_URL}${path}${req.originalUrl.slice(queryIndex)}`;
};

export const usersRouter = Router();

const getUsersHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(withForwardedQuery(req, "/users"), {
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
		const response = await fetch(
			withForwardedQuery(req, `/users/${req.params.id}`),
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
		res.status(500).json({ error: "Failed to fetch user from core-service" });
	}
};

const getUserRecipesHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			withForwardedQuery(req, `/users/${req.params.id}/recipes`),
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
		const response = await fetch(withForwardedQuery(req, "/users/me/recipes"), {
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

const getMyFavoritesHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			withForwardedQuery(req, "/users/me/favorites"),
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
		res.status(500).json({ error: "Failed to fetch favorite recipes" });
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

const followUserHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/users/${req.params.id}/follow`,
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
		res.status(500).json({ error: "Failed to follow user" });
	}
};

const unfollowUserHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/users/${req.params.id}/follow`,
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
		res.status(500).json({ error: "Failed to unfollow user" });
	}
};

const heartbeatHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/users/me/heartbeat`, {
			method: "POST",
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
		res.status(500).json({ error: "Failed to send heartbeat" });
	}
};

const getFavoritesHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(
			`${CORE_SERVICE_URL}/users/${req.params.id}/favorites`,
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
		res.status(500).json({ error: "Failed to fetch user favorites" });
	}
};

const getMyFollowersHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/users/me/followers`, {
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
		res.status(500).json({ error: "Failed to fetch my followers" });
	}
};

const getMyFollowingHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/users/me/following`, {
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
		res.status(500).json({ error: "Failed to fetch my following" });
	}
};

const getMyFriendsHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/users/me/friends`, {
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
		res.status(500).json({ error: "Failed to fetch my friends" });
	}
};

// Register more specific routes FIRST, then less specific
usersRouter.post("/me/heartbeat", requireAuth, heartbeatHandler);
// /me/recipes is most specific
usersRouter.get("/me/recipes", requireAuth, getMyRecipesHandler);
usersRouter.get("/me/favorites", requireAuth, getMyFavoritesHandler);
usersRouter.get("/me/followers", requireAuth, getMyFollowersHandler);
usersRouter.get("/me/following", requireAuth, getMyFollowingHandler);
usersRouter.get("/me/friends", requireAuth, getMyFriendsHandler);
usersRouter.post("/:id/follow", requireAuth, followUserHandler);
usersRouter.delete("/:id/follow", requireAuth, unfollowUserHandler);
// /:id/followers and /:id/following are public, /:id/favorites requires auth
usersRouter.get("/:id/followers", getFollowersHandler);
usersRouter.get("/:id/following", getFollowingHandler);
usersRouter.get("/:id/favorites", requireAuth, getFavoritesHandler);
// /:id/recipes is less specific, should be last
usersRouter.get("/:id/recipes", getUserRecipesHandler);
usersRouter.get("/:id", optionalAuth, getUserByIdHandler);
usersRouter.get("/", getUsersHandler);
