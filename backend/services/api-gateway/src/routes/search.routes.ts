import { type RequestHandler, Router } from "express";
import { getInternalHeaders } from "../utils/internalHeaders.js";
import {
	createTimeoutSignal,
	CORE_SERVICE_TIMEOUT_MS,
	isTimeoutError,
} from "../utils/timeouts.js";

const SEARCH_SERVICE_URL =
	process.env.SEARCH_SERVICE_URL || "http://search-service:8000";

export const searchRouter = Router();

const getSearchRecipesHandler: RequestHandler = async (req, res, _next) => {
	try {
		const query = new URLSearchParams();

		const q = req.query.q;
		if (typeof q === "string") {
			query.set("q", q);
		}

		const limit = req.query.limit;
		if (typeof limit === "string") {
			query.set("limit", limit);
		}

		const response = await fetch(
			`${SEARCH_SERVICE_URL}/search/recipes?${query.toString()}`,
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

		console.error("Error proxying to search-service:", error);
		res
			.status(500)
			.json({ error: "Failed to fetch search results from search-service" });
	}
};

searchRouter.get("/recipes", getSearchRecipesHandler);
