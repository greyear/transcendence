/**
 * Profile Routes (API Gateway)
 *
 * Proxies profile-related requests to core-service.
 * All routes require authentication.
 *
 * GET /profile  – get authenticated user's profile
 * PUT /profile  – update authenticated user's profile (avatar, username)
 */

import { type NextFunction, type Response, Router } from "express";
import { type AuthenticatedRequest, requireAuth } from "../middleware/auth.js";
import { getInternalHeaders } from "../utils/internalHeaders.js";
import {
	CORE_SERVICE_TIMEOUT_MS,
	createTimeoutSignal,
	isTimeoutError,
} from "../utils/timeouts.js";

const CORE_SERVICE_URL =
	process.env.CORE_SERVICE_URL || "http://core-service:3002";

export const profileRouter = Router();

const getProfileHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	_next: NextFunction,
) => {
	try {
		console.info(
			`[api-gateway] profile:get start userId=${String(req.userId)} x-user-id=${String(req.headers["x-user-id"] ?? "")}`,
		);
		const response = await fetch(`${CORE_SERVICE_URL}/profile`, {
			headers: getInternalHeaders(req),
			signal: createTimeoutSignal(CORE_SERVICE_TIMEOUT_MS),
		});
		const data = await response.json();
		console.info(
			`[api-gateway] profile:get done status=${response.status} userId=${String(req.userId)}`,
		);
		res.status(response.status).json(data);
	} catch (error) {
		if (isTimeoutError(error)) {
			res.status(504).json({ error: "Gateway Timeout" });
			return;
		}

		console.error("Error proxying to core-service:", error);
		res.status(500).json({ error: "Failed to fetch profile" });
	}
};

const updateProfileHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	_next: NextFunction,
) => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/profile`, {
			method: "PUT",
			headers: getInternalHeaders(req), // forwards Content-Type: multipart/form-data
			body: req,
			duplex: "half",
			signal: createTimeoutSignal(CORE_SERVICE_TIMEOUT_MS),
		} as RequestInit);
		const data = await response.json();
		res.status(response.status).json(data);
	} catch (error) {
		if (isTimeoutError(error)) {
			res.status(504).json({ error: "Gateway Timeout" });
			return;
		}

		console.error("Error proxying to core-service:", error);
		res.status(500).json({ error: "Failed to update profile" });
	}
};

profileRouter.get("/", requireAuth, getProfileHandler);
profileRouter.put("/", requireAuth, updateProfileHandler);
