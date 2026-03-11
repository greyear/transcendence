/**
 * Health Routes
 *
 * Routes for checking service health (is everything working)
 *
 * TypeScript benefits:
 * - Router is typed from express
 * - Function parameters (req, res) have correct types
 * - : void means function returns nothing
 */

import {
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
import { pool } from "../db/database.js";

// Router - object that contains routes (endpoints)
// Typed as Router from express
export const healthRouter: Router = Router();

/**
 * GET /health - endpoint to check service health
 *
 * Usage: curl http://localhost:3002/health
 *
 * Parameters:
 * - req: Request - request object (we don't use it)
 * - res: Response - response object (use res.status().json())
 *
 * : void - function returns nothing, just sends res.json()
 */
healthRouter.get("/", (_req: Request, res: Response): void => {
	// Send JSON response
	// res.status(200) - HTTP status "OK"
	// res.json({...}) - convert object to JSON and send
	res.status(200).json({ status: "ok", service: "core-service" });
});

/**
 * GET /health/db - endpoint to check database health
 *
 * Verifies that PostgreSQL connection is working
 *
 * Usage: curl http://localhost:3002/health/db
 *
 * Parameters:
 * - req: Request - request object (we don't use it)
 * - res: Response - response object
 * - next: NextFunction - pass errors to error handler middleware
 *
 * Promise<void> - async function that sends response (not returns)
 */
healthRouter.get(
	"/db",
	async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			// Simple query to verify database connectivity
			await pool.query("SELECT 1");
			res.status(200).json({ status: "ok", database: "connected" });
		} catch (error) {
			// Forward database errors to the global error handler
			next(error);
		}
	},
);
