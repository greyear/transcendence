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
		await pool.query(
			`INSERT INTO users (id, username, role, status)
			 VALUES (10001, 'mutual_target', 'user', 'online')
			 ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, role = EXCLUDED.role, status = EXCLUDED.status`,
		);
		await pool.query(
			`INSERT INTO users (id, username, role, status)
			 VALUES (10002, 'mutual_viewer', 'user', 'offline')
			 ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, role = EXCLUDED.role, status = EXCLUDED.status`,
		);
		await pool.query(
			`INSERT INTO users (id, username, role, status)
			 VALUES (10003, 'oneway_target', 'user', 'online')
			 ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, role = EXCLUDED.role, status = EXCLUDED.status`,
		);
		await pool.query(
			`INSERT INTO users (id, username, role, status)
			 VALUES (10004, 'oneway_viewer', 'user', 'offline')
			 ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, role = EXCLUDED.role, status = EXCLUDED.status`,
		);
		await pool.query(
			`INSERT INTO followers (user_id, followed_id)
			 VALUES (10001, 10002), (10002, 10001), (10004, 10003)
			 ON CONFLICT (user_id, followed_id) DO NOTHING`,
		);
		await pool.query(`UPDATE recipes SET author_id = 1 WHERE id = 1`);

		// Setup followers test data
		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES (2, 'user_two', 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
		);
		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES (3, 'user_three', 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
		);
		await pool.query(
			`INSERT INTO users (id, username, role, status)
			 SELECT 11000 + gs, 'search_cap_' || lpad(gs::text, 2, '0'), 'user', 'offline'
			 FROM generate_series(1, 25) AS gs
			 ON CONFLICT (id) DO UPDATE
			 SET username = EXCLUDED.username, role = EXCLUDED.role, status = EXCLUDED.status`,
		);
		// User 2 follows User 1
		await pool.query(
			`INSERT INTO followers (user_id, followed_id) VALUES (2, 1) ON CONFLICT DO NOTHING`,
		);
		// User 3 follows User 1
		await pool.query(
			`INSERT INTO followers (user_id, followed_id) VALUES (3, 1) ON CONFLICT DO NOTHING`,
		);
		// User 1 follows User 2
		await pool.query(
			`INSERT INTO followers (user_id, followed_id) VALUES (1, 2) ON CONFLICT DO NOTHING`,
		);
	});

	describe("GET /users", () => {
		it("should return list of users", async () => {
			const response = await request(app).get("/users");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count");
			expect(Array.isArray(response.body.data)).toBe(true);
			expect(response.body.count).toBe(response.body.data.length);
			if (response.body.data.length > 0) {
				expect(response.body.data[0]).toHaveProperty("id");
				expect(response.body.data[0]).toHaveProperty("username");
				expect(response.body.data[0]).toHaveProperty("avatar");
				expect(response.body.data[0]).toHaveProperty("recipes_count");
				expect(response.body.data[0]).not.toHaveProperty("status");
				expect(response.body.data[0]).not.toHaveProperty("role");
			}
		});

		it("should filter users by partial username query", async () => {
			const response = await request(app).get("/users?q=search_cap_01");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count", 1);
			expect(response.body.data).toHaveLength(1);
			expect(response.body.data[0]).toHaveProperty("username", "search_cap_01");
			expect(response.body.data[0]).not.toHaveProperty("status");
			expect(response.body.data[0]).not.toHaveProperty("role");
		});

		it("should search users case-insensitively and cap results to 20", async () => {
			const response = await request(app).get("/users?q=SEARCH_CAP_");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count", 20);
			expect(response.body.data).toHaveLength(20);
			expect(
				response.body.data.every((user: { username: string }) =>
					user.username.toLowerCase().includes("search_cap_"),
				),
			).toBe(true);
		});

		it("should return an empty list when no username matches the query", async () => {
			const response = await request(app).get(
				"/users?q=no_such_user_for_search",
			);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ data: [], count: 0 });
		});

		it("should return 400 when the search query is too long", async () => {
			const response = await request(app).get(`/users?q=${"a".repeat(33)}`);

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty(
				"error",
				"Search query must be 32 characters or less",
			);
		});
	});

	describe("GET /users/:id", () => {
		it("should return public user profile without role for anonymous requester", async () => {
			const response = await request(app).get("/users/1");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveProperty("id", 1);
			expect(response.body.data).toHaveProperty("username");
			expect(response.body.data).toHaveProperty("avatar");
			expect(response.body.data.status).toMatch(/^(online|offline)$/);
			expect(response.body.data).toHaveProperty("is_following", false);
			expect(response.body.data).not.toHaveProperty("role");
			expect(response.body.data).toHaveProperty("recipes_count");
		});

		it("should report is_following=true when requester follows target", async () => {
			const response = await request(app)
				.get("/users/10001")
				.set("X-User-Id", "10002");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveProperty("id", 10001);
			expect(response.body.data.status).toMatch(/^(online|offline)$/);
			expect(response.body.data).toHaveProperty("is_following", true);
			expect(response.body.data).not.toHaveProperty("role");
		});

		it("should report is_following=false when target is not followed", async () => {
			const response = await request(app)
				.get("/users/10004")
				.set("X-User-Id", "10003");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveProperty("id", 10004);
			expect(response.body.data.status).toMatch(/^(online|offline)$/);
			expect(response.body.data).toHaveProperty("is_following", false);
			expect(response.body.data).not.toHaveProperty("role");
		});

		it("should return 400 for invalid user id", async () => {
			const response = await request(app).get("/users/abc");

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		});

		it("should return 404 for non-existent user", async () => {
			const response = await request(app).get("/users/999999");

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		});
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
			expect(response.body.count).toBe(response.body.data.length);
			if (response.body.data.length > 0) {
				expect(response.body.data[0]).toHaveProperty("id");
				expect(response.body.data[0]).toHaveProperty("title");
				expect(response.body.data[0]).toHaveProperty("description");
				expect(response.body.data[0]).toHaveProperty("author_id");
				expect(response.body.data[0]).toHaveProperty("rating_avg");
				expect(response.body.data[0]).not.toHaveProperty("status");
			}
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
			expect(response.body.count).toBe(response.body.data.length);
			if (response.body.data.length > 0) {
				expect(response.body.data[0]).toHaveProperty("id");
				expect(response.body.data[0]).toHaveProperty("title");
				expect(response.body.data[0]).toHaveProperty("description");
				expect(response.body.data[0]).toHaveProperty("author_id");
				expect(response.body.data[0]).toHaveProperty("rating_avg");
				expect(response.body.data[0]).toHaveProperty("status");
			}
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

	describe("GET /users/:id/followers", () => {
		/**
		 * Test: GET /users/:id/followers returns list of followers
		 */
		it("should return list of followers for a valid user ID", async () => {
			const response = await request(app).get("/users/1/followers");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count");
			expect(Array.isArray(response.body.data)).toBe(true);
			if (response.body.data.length > 0) {
				expect(response.body.data[0]).toHaveProperty("id");
				expect(response.body.data[0]).toHaveProperty("username");
				expect(response.body.data[0]).toHaveProperty("avatar");
				expect(response.body.data[0]).toHaveProperty("recipes_count");
			}
		});

		/**
		 * Test: GET /users/:id/followers with invalid ID returns 400
		 */
		it("should return 400 if user ID is invalid", async () => {
			const invalidIds = ["-1", "0", "abc", "1.5"];

			for (const id of invalidIds) {
				const response = await request(app).get(`/users/${id}/followers`);
				expect(response.status).toBe(400);
				expect(response.body).toHaveProperty("error");
			}
		});

		/**
		 * Test: GET /users/:id/followers for non-existent user returns 404
		 */
		it("should return 404 if user does not exist", async () => {
			const response = await request(app).get("/users/999999/followers");

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		});
	});

	describe("GET /users/:id/following", () => {
		/**
		 * Test: GET /users/:id/following returns list of users being followed
		 */
		it("should return list of users being followed for a valid user ID", async () => {
			const response = await request(app).get("/users/1/following");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count");
			expect(Array.isArray(response.body.data)).toBe(true);
			if (response.body.data.length > 0) {
				expect(response.body.data[0]).toHaveProperty("id");
				expect(response.body.data[0]).toHaveProperty("username");
				expect(response.body.data[0]).toHaveProperty("avatar");
				expect(response.body.data[0]).toHaveProperty("recipes_count");
			}
		});

		/**
		 * Test: GET /users/:id/following with invalid ID returns 400
		 */
		it("should return 400 if user ID is invalid", async () => {
			const invalidIds = ["-1", "0", "abc", "1.5"];

			for (const id of invalidIds) {
				const response = await request(app).get(`/users/${id}/following`);
				expect(response.status).toBe(400);
				expect(response.body).toHaveProperty("error");
			}
		});

		/**
		 * Test: GET /users/:id/following for non-existent user returns 404
		 */
		it("should return 404 if user does not exist", async () => {
			const response = await request(app).get("/users/999999/following");

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		});
	});

	describe("POST /users/:id/follow", () => {
		it("should follow another user when authenticated", async () => {
			const response = await request(app)
				.post("/users/10004/follow")
				.set("X-User-Id", "10003");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toEqual({
				follower_id: 10003,
				followed_id: 10004,
			});
		});

		it("should return 409 when already followed", async () => {
			const response = await request(app)
				.post("/users/10004/follow")
				.set("X-User-Id", "10003");

			expect(response.status).toBe(409);
			expect(response.body).toHaveProperty("error");
		});

		it("should return 401 when user is not authenticated", async () => {
			const response = await request(app).post("/users/10004/follow");

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("error");
		});

		it("should return 400 for invalid user id", async () => {
			const response = await request(app)
				.post("/users/abc/follow")
				.set("X-User-Id", "10003");

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		});

		it("should return 404 if target user does not exist", async () => {
			const response = await request(app)
				.post("/users/999999/follow")
				.set("X-User-Id", "10003");

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		});
	});

	describe("DELETE /users/:id/follow", () => {
		it("should unfollow another user when authenticated", async () => {
			const response = await request(app)
				.delete("/users/10003/follow")
				.set("X-User-Id", "10004");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message");
		});

		it("should return 404 when the relation does not exist", async () => {
			const response = await request(app)
				.delete("/users/10003/follow")
				.set("X-User-Id", "10004");

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		});

		it("should return 401 when user is not authenticated", async () => {
			const response = await request(app).delete("/users/10003/follow");

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("error");
		});

		it("should return 400 for invalid user id", async () => {
			const response = await request(app)
				.delete("/users/abc/follow")
				.set("X-User-Id", "10004");

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		});

		it("should return 404 if target user does not exist", async () => {
			const response = await request(app)
				.delete("/users/999999/follow")
				.set("X-User-Id", "10004");

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		});
	});

	describe("GET /users/me/followers", () => {
		it("should return list of followers for authenticated user", async () => {
			const response = await request(app)
				.get("/users/me/followers")
				.set("X-User-Id", "1");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count");
			expect(Array.isArray(response.body.data)).toBe(true);
			expect(response.body.count).toBe(response.body.data.length);
			if (response.body.data.length > 0) {
				expect(response.body.data[0]).toHaveProperty("id");
				expect(response.body.data[0]).toHaveProperty("username");
				expect(response.body.data[0]).toHaveProperty("avatar");
				expect(response.body.data[0]).toHaveProperty("recipes_count");
			}
		});

		it("should return 401 without authentication", async () => {
			const response = await request(app).get("/users/me/followers");

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("error");
		});

		it("should include users who follow the authenticated user", async () => {
			// From beforeAll: user 2 and 3 follow user 1
			const response = await request(app)
				.get("/users/me/followers")
				.set("X-User-Id", "1");

			expect(response.status).toBe(200);
			const ids = response.body.data.map((u: { id: number }) => u.id);
			expect(ids).toContain(2);
			expect(ids).toContain(3);
		});
	});

	describe("GET /users/me/following", () => {
		it("should return list of users the authenticated user follows", async () => {
			const response = await request(app)
				.get("/users/me/following")
				.set("X-User-Id", "1");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count");
			expect(Array.isArray(response.body.data)).toBe(true);
			expect(response.body.count).toBe(response.body.data.length);
			if (response.body.data.length > 0) {
				expect(response.body.data[0]).toHaveProperty("id");
				expect(response.body.data[0]).toHaveProperty("username");
				expect(response.body.data[0]).toHaveProperty("avatar");
				expect(response.body.data[0]).toHaveProperty("recipes_count");
			}
		});

		it("should return 401 without authentication", async () => {
			const response = await request(app).get("/users/me/following");

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("error");
		});

		it("should include users that the authenticated user follows", async () => {
			// From beforeAll: user 1 follows user 2
			const response = await request(app)
				.get("/users/me/following")
				.set("X-User-Id", "1");

			expect(response.status).toBe(200);
			const ids = response.body.data.map((u: { id: number }) => u.id);
			expect(ids).toContain(2);
		});
	});

	describe("GET /users/me/friends", () => {
		it("should return list of mutual followers for authenticated user", async () => {
			const response = await request(app)
				.get("/users/me/friends")
				.set("X-User-Id", "1");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count");
			expect(Array.isArray(response.body.data)).toBe(true);
			expect(response.body.count).toBe(response.body.data.length);
			if (response.body.data.length > 0) {
				expect(response.body.data[0]).toHaveProperty("id");
				expect(response.body.data[0]).toHaveProperty("username");
				expect(response.body.data[0]).toHaveProperty("avatar");
				expect(response.body.data[0]).toHaveProperty("recipes_count");
			}
		});

		it("should return 401 without authentication", async () => {
			const response = await request(app).get("/users/me/friends");

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("error");
		});

		it("should return 404 when authenticated user is not found", async () => {
			const response = await request(app)
				.get("/users/me/friends")
				.set("X-User-Id", "999999");

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		});

		it("should only include mutual followers", async () => {
			// From beforeAll: user 1 and user 2 follow each other (mutual)
			// user 3 follows user 1 but user 1 does NOT follow user 3 (not mutual)
			const response = await request(app)
				.get("/users/me/friends")
				.set("X-User-Id", "1");

			expect(response.status).toBe(200);
			const ids = response.body.data.map((u: { id: number }) => u.id);
			expect(ids).toContain(2);
			expect(ids).not.toContain(3);
		});
	});

	describe("GET /users/:id/favorites", () => {
		/**
		 * Test: GET /users/:id/favorites without authentication returns 401
		 */
		it("should return 401 without authentication", async () => {
			const response = await request(app).get("/users/1/favorites");

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("error");
		});

		/**
		 * Test: GET /users/:id/favorites returns 400 for invalid user ID
		 */
		it("should return 400 for invalid user id", async () => {
			const invalidIds = ["-1", "0", "abc", "1.5"];

			for (const id of invalidIds) {
				const response = await request(app)
					.get(`/users/${id}/favorites`)
					.set("X-User-Id", "1");

				expect(response.status).toBe(400);
				expect(response.body).toHaveProperty("error");
			}
		});

		/**
		 * Test: GET /users/:id/favorites returns 404 if user doesn't exist
		 */
		it("should return 404 if user does not exist", async () => {
			const response = await request(app)
				.get("/users/999999/favorites")
				.set("X-User-Id", "1");

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		});

		/**
		 * Test: GET /users/:id/favorites returns 403 if not mutual followers
		 */
		it("should return 403 if users are not mutual followers", async () => {
			// User 1 and User 3 are NOT mutual followers (from beforeAll setup)
			const response = await request(app)
				.get("/users/3/favorites")
				.set("X-User-Id", "1");

			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty("error");
		});

		/**
		 * Test: GET /users/:id/favorites returns list for mutual followers
		 *
		 * Note: In test setup, User 1 and User 2 ARE mutual followers
		 * (User 1 follows User 2, User 2 follows User 1 from beforeAll)
		 */
		it("should return list of favorite recipes for mutual followers", async () => {
			const response = await request(app)
				.get("/users/2/favorites")
				.set("X-User-Id", "1");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count");
			expect(Array.isArray(response.body.data)).toBe(true);
		});
	});

	afterAll(async () => {
		// Clean up test data created in beforeAll
		try {
			await pool.query(
				`DELETE FROM followers WHERE user_id IN (1, 2, 3, 10001, 10002, 10003, 10004) OR followed_id IN (1, 2, 3, 10001, 10002, 10003, 10004)`,
			);
			await pool.query(
				`DELETE FROM users WHERE id IN (2, 3, 10001, 10002, 10003, 10004)`,
			);
			await pool.query(`DELETE FROM users WHERE id BETWEEN 11001 AND 11025`);
		} catch (error) {
			console.error("Cleanup failed:", error);
		}
	});
});
