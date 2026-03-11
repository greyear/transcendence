import type { Request } from "express";

export const getInternalHeaders = (req: Request): Record<string, string> => {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	for (const key in req.headers) {
		const value = req.headers[key];

		if (value) {
			headers[key] = Array.isArray(value) ? value.join(", ") : value;
		}
	}

	return headers;
};
