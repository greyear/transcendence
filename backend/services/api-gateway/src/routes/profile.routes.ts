/**
 * Profile Routes (API Gateway)
 *
 * Proxies profile-related requests to core-service.
 * All routes require authentication.
 *
 * GET /profile  – get authenticated user's profile
 * PUT /profile  – update authenticated user's profile (avatar, username)
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

export const profileRouter = Router();

const getProfileHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/profile`, {
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
		res.status(500).json({ error: "Failed to fetch profile" });
	}
};

const updateProfileHandler: RequestHandler = async (req, res, _next) => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/profile`, {
			method: "PUT",
			headers: getInternalHeaders(req), // forwards Content-Type: multipart/form-data
			body: req,
			duplex: "half",
		} as RequestInit,
		);
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