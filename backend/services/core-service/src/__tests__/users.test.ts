/**
 * Users Routes Integration Tests
 *
 * Tests the user-specific endpoints with various scenarios:
 * - Public user recipes (GET /users/:id/recipes)
 * - Private logged-in user recipes (GET /users/me/recipes)
 * - Validation errors and authorization checks
 */

import request from "supertest";
import { app } from "../app.js";
import { pool } from "../db/database.js";

describe("Users Routes", () => {
	beforeAll(async () => {
		// Ensure a user and a published recipe exist so the test doesn't fail on a 404
		// This deals with local test DBs that might not have run the latest seeds yet
		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES (1, 'test_user', 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
		);
		await pool.query(`UPDATE recipes SET author_id = 1 WHERE id = 1`);
	});

	describe("GET /users/:id/recipes", () => {
		/**
		 * Test: GET /users/:id/recipes returns list of published recipes
		 *
		 * What we're testing:
		 * - Endpoint is accessible for public profiles
		 * - Returns proper JSON structure (data array and count)
		 */
		it("should return list of published recipes for a valid user ID", async () => {
			// Assuming user with ID 1 exists
			const response = await request(app).get("/users/1/recipes");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count");
			expect(Array.isArray(response.body.data)).toBe(true);
		});

		/**
		 * Test: GET /users/:id/recipes with invalid ID returns 400
		 *
		 * Why this matters:
		 * - Prevents crashes from malformed input
		 * - Tests Zod validation for user ID parameters
		 */
		it("should return 400 if user ID is invalid", async () => {
			const invalidIds = ["-1", "0", "abc", "1.5", "null"];

			for (const id of invalidIds) {
				const response = await request(app).get(`/users/${id}/recipes`);

				expect(response.status).toBe(400);
				expect(response.body).toHaveProperty("error");
			}
		});

		/**
		 * Test: GET /users/:id/recipes for non-existent user returns 404
		 *
		 * Why: Avoid returning empty arrays 200 for users that don't even exist
		 */
		it("should return 404 if user does not exist", async () => {
			// Very high ID unlikely to be in the DB
			const response = await request(app).get("/users/999999/recipes");

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		});
	});

	describe("GET /users/me/recipes", () => {
		/**
		 * Test: GET /users/me/recipes returns all recipes for the logged-in user
		 *
		 * What we're testing:
		 * - Validates that the internal X-User-Id header successfully grants access
		 * - Returns proper JSON structure
		 */
		it("should return list of all recipes for the authenticated user", async () => {
			// In core-service, auth is represented via X-User-Id header set by API Gateway
			const response = await request(app)
				.get("/users/me/recipes")
				.set("X-User-Id", "1");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count");
			expect(Array.isArray(response.body.data)).toBe(true);
		});

		/**
		 * Test: GET /users/me/recipes without auth header returns 401
		 *
		 * Why: Prevent guests from accessing private user dashboards directly via core-service
		 */
		it("should return 401 Unauthorized if X-User-Id header is missing", async () => {
			// Simulating a request where API Gateway didn't pass auth data
			const response = await request(app).get("/users/me/recipes");

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("error");
		});
	});
});
