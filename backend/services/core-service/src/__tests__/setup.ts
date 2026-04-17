/**
 * Jest setup for core-service tests.
 *
 * Ensures shared resources are released so Jest can exit cleanly.
 */

import { jest } from "@jest/globals";
import { pool } from "../db/database.js";

const parsedTimeout = Number(process.env.JEST_TEST_TIMEOUT_MS ?? 20000);
const testTimeoutMs =
	Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 20000;

jest.setTimeout(testTimeoutMs);

afterAll(async () => {
	await pool.end();
});
