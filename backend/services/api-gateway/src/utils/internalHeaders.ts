import type { Request } from "express";

// Hop-by-hop headers that must NOT be forwarded to internal services.
const BLOCKED_HEADERS = new Set([
	"host",
	"connection",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailer",
	"transfer-encoding",
	"upgrade",
	"content-length",
	"content-type",
]);

const FORWARDED_HEADERS = [
	"x-user-id",
	"x-language",
	"x-source-language",
] as const;

export const getInternalHeaders = (req: Request): Record<string, string> => {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

    for (const key in req.headers) {
		if (BLOCKED_HEADERS.has(key.toLowerCase())) {
			continue;
		}
		const value = req.headers[key];
		if (typeof value === "string" && value.length > 0) {
			headers[key] = value;
		}
	}

	for (const key of FORWARDED_HEADERS) {
		const value = req.headers[key];
		if (typeof value === "string" && value.length > 0) {
			headers[key] = value;
		}
	}

	const contentType = req.headers["content-type"];
	if (typeof contentType === "string" && contentType.length > 0) {
		headers["Content-Type"] = contentType;
	}

    return headers;
};
