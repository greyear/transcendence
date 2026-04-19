import { type RequestHandler, Router } from "express";
import {
	CORE_SERVICE_TIMEOUT_MS,
	createTimeoutSignal,
	isTimeoutError,
} from "../utils/timeouts.js";

const CORE_SERVICE_URL =
	process.env.CORE_SERVICE_URL || "http://core-service:3002";

const PASS_THROUGH_HEADERS = [
	"content-type",
	"content-length",
	"cache-control",
	"etag",
	"last-modified",
	"accept-ranges",
] as const;

const proxyMediaHandler: RequestHandler = async (req, res) => {
	try {
		const targetUrl = `${CORE_SERVICE_URL}${req.originalUrl}`;
		const response = await fetch(targetUrl, {
			headers: {
				accept: req.headers.accept ?? "*/*",
			},
			signal: createTimeoutSignal(CORE_SERVICE_TIMEOUT_MS),
		});

		for (const header of PASS_THROUGH_HEADERS) {
			const value = response.headers.get(header);
			if (value) {
				res.setHeader(header, value);
			}
		}

		if (!response.ok) {
			const body = await response.text();
			res.status(response.status).send(body || "Not found");
			return;
		}

		const body = Buffer.from(await response.arrayBuffer());
		res.status(response.status).send(body);
	} catch (error) {
		if (isTimeoutError(error)) {
			res.status(504).send("Gateway Timeout");
			return;
		}

		console.error("Error proxying media from core-service:", error);
		res.status(500).send("Failed to fetch media");
	}
};

export const mediaRouter = Router();

mediaRouter.use(proxyMediaHandler);
