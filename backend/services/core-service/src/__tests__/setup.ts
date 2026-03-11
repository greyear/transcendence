/**
 * Jest setup for core-service tests.
 *
 * Ensures shared resources are released so Jest can exit cleanly.
 */

import { pool } from "../db/database.js";

afterAll(async () => {
	await pool.end();
});
