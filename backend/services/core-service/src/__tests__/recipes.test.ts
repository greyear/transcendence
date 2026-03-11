/**
 * Recipes Routes Integration Tests
 *
 * Tests the recipes endpoints with various scenarios:
 * - Happy path (valid requests)
 * - Validation errors (invalid IDs)
 * - Authorization scenarios (guest vs authenticated user)
 */

import request from 'supertest';
import { app } from '../app.js';

describe('Recipes Routes', () => {
	/**
	 * Test: GET /recipes returns list of recipes
	 *
	 * What we're testing:
	 * - Endpoint is accessible
	 * - Returns proper JSON structure
	 * - Includes data array and count
	 */
	it('should return list of recipes for GET /recipes', async () => {
		const response = await request(app).get('/recipes');

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('data');
		expect(response.body).toHaveProperty('count');
		expect(Array.isArray(response.body.data)).toBe(true); // data must be an array
	});

	/**
	 * Test: GET /recipes/:id with valid ID returns recipe
	 *
	 * Assumes recipe with ID 1 exists (seeded in database)
	 * In production, you'd use test fixtures or factories
	 */
	it('should return recipe for GET /recipes/:id with valid ID', async () => {
		const response = await request(app).get('/recipes/1');

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('data');
		expect(response.body.data).toHaveProperty('id', 1);
		expect(response.body.data).toHaveProperty('title');
	});

	/**
	 * Test: GET /recipes/:id with invalid ID returns 400
	 *
	 * Why this matters:
	 * - Prevents crashes from malformed input
	 * - Tests our Zod validation is working
	 * - Invalid IDs: negative numbers, non-integers, strings like "abc"
	 */
	it('should return 400 for GET /recipes/:id with invalid ID', async () => {
		// Test various invalid IDs
		const invalidIds = ['-1', '0', 'abc', '1.5', 'null'];

		for (const id of invalidIds) {
			const response = await request(app).get(`/recipes/${id}`);

			expect(response.status).toBe(400); // Bad Request
			expect(response.body).toHaveProperty('error');
		}
	});

	/**
	 * Test: Restricted recipe returns 403 for non-owner
	 *
	 * Scenario: Recipe exists but is a draft from another user
	 * Guest or different user should get 403 Forbidden
	 *
	 * Note: This test requires specific database state
	 * You may need to adjust or skip it depending on your seed data
	 */
	it.todo('should return 403 for restricted recipe access');

	/**
	 * Test: Non-existent recipe returns 404
	 *
	 * Why: Distinguish between "not found" and "forbidden"
	 */
	it('should return 404 for non-existent recipe', async () => {
		// Use very high ID that's unlikely to exist
		const response = await request(app).get('/recipes/999999');

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty('error');
	});
});
