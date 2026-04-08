/**
 * Recipes Routes Integration Tests
 *
 * Tests the recipes endpoints with various scenarios:
 * - Happy path (valid requests)
 * - Validation errors (invalid IDs)
 * - Authorization scenarios (guest vs authenticated user)
 */

import request from "supertest";
import { app } from "../app.js";
import { pool } from "../db/database.js";

describe("Recipes Routes", () => {
	/**
	 * Test: GET /recipes returns list of recipes
	 *
	 * What we're testing:
	 * - Endpoint is accessible
	 * - Returns proper JSON structure
	 * - Includes data array and count
	 */
	it("should return list of recipes for GET /recipes", async () => {
		const response = await request(app).get("/recipes");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body).toHaveProperty("count");
		expect(Array.isArray(response.body.data)).toBe(true); // data must be an array
	});

	/**
	 * Test: GET /recipes/:id with valid ID returns recipe
	 *
	 * Assumes recipe with ID 1 exists (seeded in database)
	 * In production, you'd use test fixtures or factories
	 */
	it("should return recipe for GET /recipes/:id with valid ID", async () => {
		const response = await request(app).get("/recipes/1");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body.data).toHaveProperty("id", 1);
		expect(response.body.data).toHaveProperty("title");
		expect(Array.isArray(response.body.data.ingredients)).toBe(true);
		expect(Array.isArray(response.body.data.categories)).toBe(true);
	});

	/**
	 * Test: GET /recipes/:id with invalid ID returns 400
	 *
	 * Why this matters:
	 * - Prevents crashes from malformed input
	 * - Tests our Zod validation is working
	 * - Invalid IDs: negative numbers, non-integers, strings like "abc"
	 */
	it("should return 400 for GET /recipes/:id with invalid ID", async () => {
		// Test various invalid IDs
		const invalidIds = ["-1", "0", "abc", "1.5", "null"];

		for (const id of invalidIds) {
			const response = await request(app).get(`/recipes/${id}`);

			expect(response.status).toBe(400); // Bad Request
			expect(response.body).toHaveProperty("error");
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
	it("should return 403 for restricted recipe access", async () => {
		let recipeId: number | null = null;

		try {
			// 1. Create a dummy user (ID 999) to own the draft
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[999, "draft_owner"],
			);

			// 2. Create a dummy draft recipe owned by this user
			const recipeRes = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id) 
				 VALUES ('Secret Draft', ARRAY['step 1'], 'draft', $1) RETURNING id`,
				[999],
			);
			recipeId = recipeRes.rows[0].id;

			// 3. Make a request as a guest (no X-User-Id header)
			const guestResponse = await request(app).get(`/recipes/${recipeId}`);

			expect(guestResponse.status).toBe(403);
			expect(guestResponse.body).toHaveProperty("error");

			// 4. Make a request as a different user (e.g., ID 2 - doesn't need to exist, just different)
			const otherUserResponse = await request(app)
				.get(`/recipes/${recipeId}`)
				.set("X-User-Id", "2");

			expect(otherUserResponse.status).toBe(403);
			expect(otherUserResponse.body).toHaveProperty("error");

			// 5. Make a request as the owner (ID 999) to verify they CAN access it
			const ownerResponse = await request(app)
				.get(`/recipes/${recipeId}`)
				.set("X-User-Id", "999");

			expect(ownerResponse.status).toBe(200);
			expect(ownerResponse.body.data.id).toBe(recipeId);
		} finally {
			// Cleanup: ensure we don't leave test data in DB
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id = $1`, [999]);
		}
	});

	/**
	 * Test: Non-existent recipe returns 404
	 *
	 * Why: Distinguish between "not found" and "forbidden"
	 */
	it("should return 404 for non-existent recipe", async () => {
		// Use very high ID that's unlikely to exist
		const response = await request(app).get("/recipes/999999");

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("error");
	});

	/**
	 * Test: POST /recipes without auth returns 401
	 *
	 * Why this matters:
	 * - Creating recipes must be available only for authenticated users
	 * - Missing X-User-Id means request is treated as guest
	 */
	it("should return 401 for POST /recipes without authentication", async () => {
		const response = await request(app)
			.post("/recipes")
			.send({
				title: "No Auth Recipe",
				instructions: ["Step 1"],
			});

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	/**
	 * Test: POST /recipes with invalid payload returns 400
	 *
	 * Why this matters:
	 * - Verifies createRecipeInput Zod validation in route layer
	 * - Prevents writing malformed draft data to database
	 */
	it("should return 400 for POST /recipes with invalid payload", async () => {
		const response = await request(app)
			.post("/recipes")
			.set("X-User-Id", "1")
			.send({
				title: "Missing Description",
				instructions: ["Step 1"],
				ingredients: [{ ingredient_id: 1, amount: 100, unit: "g" }],
			});

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	/**
	 * Test: POST /recipes creates draft with ingredients and categories
	 *
	 * What we're testing:
	 * - Authenticated request can create recipe
	 * - Recipe is created with default draft status
	 * - Related ingredients/categories are persisted and returned
	 */
	it("should create recipe as draft for authenticated user", async () => {
		const userId = 2001;
		let createdRecipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[userId, "create_draft_user"],
			);

			const ingredientResult = await pool.query(
				`SELECT id FROM ingredients ORDER BY id LIMIT 1`,
			);
			const ingredientId = ingredientResult.rows[0].id as number;

			const categoryResult = await pool.query(
				`SELECT id FROM recipe_categories ORDER BY id LIMIT 1`,
			);
			const categoryId = categoryResult.rows[0].id as number;

			const response = await request(app)
				.post("/recipes")
				.set("X-User-Id", String(userId))
				.send({
					title: "Draft Recipe",
					description: "Created in tests",
					instructions: ["Prepare ingredients", "Mix and cook"],
					servings: 2,
					spiciness: 1,
					ingredients: [
						{ ingredient_id: ingredientId, amount: 150, unit: "g" },
					],
					category_ids: [categoryId],
				});

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveProperty("status", "draft");
			expect(response.body.data).toHaveProperty("author_id", userId);
			expect(Array.isArray(response.body.data.ingredients)).toBe(true);
			expect(response.body.data.ingredients).toHaveLength(1);
			expect(response.body.data.ingredients[0]).toHaveProperty(
				"ingredient_id",
				ingredientId,
			);
			expect(response.body.data.ingredients[0]).toHaveProperty("amount", 150);
			expect(response.body.data.ingredients[0]).toHaveProperty("unit", "g");
			expect(Array.isArray(response.body.data.categories)).toBe(true);
			expect(response.body.data.categories).toHaveLength(1);
			expect(response.body.data.categories[0]).toHaveProperty("id", categoryId);
			expect(response.body.data.categories[0]).toHaveProperty("code");
			expect(response.body.data.categories[0]).toHaveProperty(
				"category_type_code",
			);

			createdRecipeId = response.body.data.id as number;
		} finally {
			if (createdRecipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [
					createdRecipeId,
				]);
			}
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	/**
	 * Test: POST /recipes/:id/publish without auth returns 401
	 *
	 * Why this matters:
	 * - Publishing is protected operation and requires authenticated user
	 */
	it("should return 401 for POST /recipes/:id/publish without authentication", async () => {
		const response = await request(app).post("/recipes/1/publish");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for POST /recipes/:id/publish with invalid recipe id", async () => {
		const response = await request(app)
			.post("/recipes/abc/publish")
			.set("X-User-Id", "1");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 404 for POST /recipes/:id/publish when recipe does not exist", async () => {
		const response = await request(app)
			.post("/recipes/999999/publish")
			.set("X-User-Id", "1");

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("error");
	});

	/**
	 * Test: Non-owner cannot publish recipe (403)
	 *
	 * Why this matters:
	 * - Only recipe author can move draft to moderation
	 */
	it("should return 403 when non-owner tries to publish recipe", async () => {
		const ownerId = 2002;
		const intruderId = 2003;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[ownerId, "publish_owner"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[intruderId, "publish_intruder"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES ('Publish Target', ARRAY['step'], 'draft', $1)
				 RETURNING id`,
				[ownerId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.post(`/recipes/${recipeId}/publish`)
				.set("X-User-Id", String(intruderId));

			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
				ownerId,
				intruderId,
			]);
		}
	});

	/**
	 * Test: Author publishes draft -> moderation, second publish -> 409
	 *
	 * What we're testing:
	 * - Valid status transition draft -> moderation
	 * - Repeated publish is rejected as invalid state transition
	 */
	it("should move recipe from draft to moderation on publish", async () => {
		const userId = 2004;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[userId, "publish_owner_success"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES ('Draft For Moderation', ARRAY['step'], 'draft', $1)
				 RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			const publishResponse = await request(app)
				.post(`/recipes/${recipeId}/publish`)
				.set("X-User-Id", String(userId));

			expect(publishResponse.status).toBe(200);
			expect(publishResponse.body).toHaveProperty("message");
			expect(publishResponse.body.data).toHaveProperty("status", "moderation");

			const dbStatus = await pool.query(
				`SELECT status FROM recipes WHERE id = $1`,
				[recipeId],
			);
			expect(dbStatus.rows[0].status).toBe("moderation");

			const secondPublishResponse = await request(app)
				.post(`/recipes/${recipeId}/publish`)
				.set("X-User-Id", String(userId));

			expect(secondPublishResponse.status).toBe(409);
			expect(secondPublishResponse.body).toHaveProperty("error");
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should return 401 for POST /recipes/:id/favorite without authentication", async () => {
		const response = await request(app).post("/recipes/1/favorite");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for POST /recipes/:id/favorite with invalid id", async () => {
		const response = await request(app)
			.post("/recipes/abc/favorite")
			.set("X-User-Id", "1");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 404 for POST /recipes/:id/favorite when recipe does not exist", async () => {
		const response = await request(app)
			.post("/recipes/999999/favorite")
			.set("X-User-Id", "1");

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("error");
	});

	it("should add recipe to favorites and return 409 on duplicate favorite", async () => {
		const userId = 2201;
		const authorId = 2202;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[userId, "favorite_user"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[authorId, "favorite_author"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES ('Favorite Target', ARRAY['step'], 'published', $1)
				 RETURNING id`,
				[authorId],
			);
			recipeId = recipeResult.rows[0].id;

			const firstResponse = await request(app)
				.post(`/recipes/${recipeId}/favorite`)
				.set("X-User-Id", String(userId));

			expect(firstResponse.status).toBe(200);
			expect(firstResponse.body).toHaveProperty(
				"message",
				"Recipe added to favorites",
			);

			const duplicateResponse = await request(app)
				.post(`/recipes/${recipeId}/favorite`)
				.set("X-User-Id", String(userId));

			expect(duplicateResponse.status).toBe(409);
			expect(duplicateResponse.body).toHaveProperty("error");
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
				userId,
				authorId,
			]);
		}
	});

	it("should return 401 for DELETE /recipes/:id/favorite without authentication", async () => {
		const response = await request(app).delete("/recipes/1/favorite");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 409 for DELETE /recipes/:id/favorite when recipe is not in favorites", async () => {
		const userId = 2203;
		const authorId = 2204;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[userId, "unfavorite_user"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[authorId, "unfavorite_author"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES ('Unfavorite Target', ARRAY['step'], 'published', $1)
				 RETURNING id`,
				[authorId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.delete(`/recipes/${recipeId}/favorite`)
				.set("X-User-Id", String(userId));

			expect(response.status).toBe(409);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
				userId,
				authorId,
			]);
		}
	});

	it("should remove recipe from favorites", async () => {
		const userId = 2205;
		const authorId = 2206;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[userId, "remove_favorite_user"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[authorId, "remove_favorite_author"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES ('Remove Favorite Target', ARRAY['step'], 'published', $1)
				 RETURNING id`,
				[authorId],
			);
			recipeId = recipeResult.rows[0].id;

			await request(app)
				.post(`/recipes/${recipeId}/favorite`)
				.set("X-User-Id", String(userId));

			const deleteResponse = await request(app)
				.delete(`/recipes/${recipeId}/favorite`)
				.set("X-User-Id", String(userId));

			expect(deleteResponse.status).toBe(200);
			expect(deleteResponse.body).toHaveProperty(
				"message",
				"Recipe removed from favorites",
			);
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
				userId,
				authorId,
			]);
		}
	});

	it("should return 401 for GET /users/me/favorites without authentication", async () => {
		const response = await request(app).get("/users/me/favorites");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return current user favorite recipes", async () => {
		const userId = 2207;
		const authorId = 2208;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[userId, "my_favorites_user"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[authorId, "my_favorites_author"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES ('My Favorites Target', ARRAY['step'], 'published', $1)
				 RETURNING id`,
				[authorId],
			);
			recipeId = recipeResult.rows[0].id;

			await request(app)
				.post(`/recipes/${recipeId}/favorite`)
				.set("X-User-Id", String(userId));

			const response = await request(app)
				.get("/users/me/favorites")
				.set("X-User-Id", String(userId));

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count");
			expect(response.body.count).toBeGreaterThanOrEqual(1);
			expect(
				response.body.data.some(
					(recipe: { id: number }) => recipe.id === recipeId,
				),
			).toBe(true);
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
				userId,
				authorId,
			]);
		}
	});
});
