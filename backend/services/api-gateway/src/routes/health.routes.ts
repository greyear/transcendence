/**
 * Health Routes
 *
 * Routes for checking gateway and downstream service health
 */

import { type Request, type Response, Router } from "express";
import {
	CORE_HEALTH_TIMEOUT_MS,
	createTimeoutSignal,
	isTimeoutError,
} from "../utils/timeouts.js";

const CORE_SERVICE_URL =
	process.env.CORE_SERVICE_URL || "http://core-service:3002";

export const healthRouter = Router();

/**
 * GET /health - check gateway health
 *
 * Forwards request to core-service:
 * Gateway request → Core service request → Response
 */
const getHealthHandler = async (req: Request, res: Response): Promise<void> => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/health`, {
			signal: createTimeoutSignal(CORE_HEALTH_TIMEOUT_MS),
		});
		const data = await response.json();
		res.status(response.status).json(data);
	} catch (error) {
		if (isTimeoutError(error)) {
			res.status(504).json({ error: "Gateway Timeout" });
			return;
		}

		console.error("Error proxying to core-service:", error);
		res.status(500).json({ error: "Failed to fetch health from core-service" });
	}
};

healthRouter.get("/", getHealthHandler);

/**
 * GET /health/db - check database health
 *
 * Forwards request to core-service which will check Postgres connection
 */
const getHealthDbHandler = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const response = await fetch(`${CORE_SERVICE_URL}/health/db`, {
			signal: createTimeoutSignal(CORE_HEALTH_TIMEOUT_MS),
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
			.json({ error: "Failed to fetch health/db from core-service" });
	}
};

healthRouter.get("/db", getHealthDbHandler);
