/**
 * Update Last Seen Middleware
 *
 * Fires on every authenticated request and updates last_seen_at.
 * Fire-and-forget: never blocks the request, errors are logged only.
 */

import type { NextFunction, Response } from "express";
import { pool } from "../db/database.js";
import type { AuthenticatedRequest } from "./extractUser.js";

export const updateLastSeen = (
	req: AuthenticatedRequest,
	_res: Response,
	next: NextFunction,
): void => {
	if (req.userId !== undefined) {
		pool
			.query(`UPDATE users SET last_seen_at = now() WHERE id = $1`, [
				req.userId,
			])
			.catch((err) => console.error("Failed to update last_seen_at:", err));
	}
	next();
};
