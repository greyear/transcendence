/**
 * Health Routes Integration Tests
 *
 * These tests verify the health check endpoints work correctly.
 * Uses Supertest to make HTTP requests without starting a real server.
 */

import request from 'supertest';
import { app } from '../app.js';

/**
 * Test suite for /health endpoints
 *
 * describe() groups related tests together
 * Each test is isolated - no shared state between them
 */
describe('Health Routes', () => {
	/**
	 * Test: GET /health returns 200 OK
	 *
	 * Why this test matters:
	 * - Load balancers use this to check if service is alive
	 * - If it fails, the whole service is considered down
	 */
	it('should return 200 OK for GET /health', async () => {
		// Supertest makes HTTP request to Express app (no real server needed)
		const response = await request(app).get('/health');

		// Assertions: verify the response
		expect(response.status).toBe(200); // HTTP status must be 200
		expect(response.body).toHaveProperty('status'); // Body must have 'status' field
	});

	/**
	 * Test: GET /health/db returns database connection status
	 *
	 * Note: This will fail if database is not available
	 */
	it('should return database health status for GET /health/db', async () => {
		const response = await request(app).get('/health/db');

		// Either 200 (DB connected) or 500 (DB unavailable) - both are valid responses
		expect([200, 500]).toContain(response.status);
		expect(response.body).toHaveProperty('status');
	});
});
