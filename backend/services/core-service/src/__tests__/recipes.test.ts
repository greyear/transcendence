/**
 * Recipes Routes Integration Tests
 *
 * Tests the recipes endpoints with various scenarios:
 * - Happy path (valid requests)
 * - Validation errors (invalid IDs)
 * - Authorization scenarios (guest vs authenticated user)
 */

import fs from "node:fs";
import path from "node:path";
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
		expect(response.body).toHaveProperty("total_count");
		expect(response.body).toHaveProperty("total_pages");
		expect(response.body).toHaveProperty("page");
		expect(response.body).toHaveProperty("per_page");
		expect(Array.isArray(response.body.data)).toBe(true);
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
				 VALUES (
					jsonb_build_object('en', 'Secret Draft', 'fi', 'Secret Draft', 'ru', 'Secret Draft'),
					jsonb_build_object('en', to_jsonb(ARRAY['step 1']), 'fi', to_jsonb(ARRAY['step 1']), 'ru', to_jsonb(ARRAY['step 1'])),
					'draft',
					$1
				 ) RETURNING id`,
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
				 VALUES (
					jsonb_build_object('en', 'Publish Target', 'fi', 'Publish Target', 'ru', 'Publish Target'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'draft',
					$1
				 )
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
	 * Test: Author publishes draft -> published, second publish -> 409
	 *
	 * What we're testing:
	 * - Valid status transition draft -> published
	 * - Repeated publish is rejected as invalid state transition
	 */
	it("should move recipe from draft to published on publish", async () => {
		const userId = 2004;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[userId, "publish_owner_success"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Draft For Moderation', 'fi', 'Draft For Moderation', 'ru', 'Draft For Moderation'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'draft',
					$1
				 )
				 RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			const publishResponse = await request(app)
				.post(`/recipes/${recipeId}/publish`)
				.set("X-User-Id", String(userId));

			expect(publishResponse.status).toBe(200);
			expect(publishResponse.body).toHaveProperty("message");
			expect(publishResponse.body.data).toHaveProperty("status", "published");

			const dbStatus = await pool.query(
				`SELECT status FROM recipes WHERE id = $1`,
				[recipeId],
			);
			expect(dbStatus.rows[0].status).toBe("published");

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

	const minimalJpeg = Buffer.from(
		"/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
			"HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN" +
			"DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy" +
			"MjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAA" +
			"AAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAA" +
			"AAAA/9oADAMBAAIRAxEAPwCwABmX/9k=",
		"base64",
	);

	it("should return 401 for PUT /recipes/:id/picture without authentication", async () => {
		const response = await request(app)
			.put("/recipes/1/picture")
			.attach("picture", minimalJpeg, {
				filename: "pic.jpg",
				contentType: "image/jpeg",
			});

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for PUT /recipes/:id/picture with invalid recipe ID", async () => {
		const response = await request(app)
			.put("/recipes/abc/picture")
			.set("X-User-Id", "1")
			.attach("picture", minimalJpeg, {
				filename: "pic.jpg",
				contentType: "image/jpeg",
			});

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 when no picture file is provided", async () => {
		const userId = 2200;
		let recipeId: number | null = null;
		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[userId, "picture_no_file"],
		);
		try {
			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				VALUES (
					jsonb_build_object('en', 'No File Test', 'fi', 'No File Test', 'ru', 'No File Test'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'draft',
					$1
				) RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.put(`/recipes/${recipeId}/picture`)
				.set("X-User-Id", String(userId));

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should return 400 for unsupported file type", async () => {
		const userId = 2201;
		let recipeId: number | null = null;
		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[userId, "picture_bad_type"],
		);
		try {
			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				VALUES (
					jsonb_build_object('en', 'Bad Type Test', 'fi', 'Bad Type Test', 'ru', 'Bad Type Test'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'draft',
					$1
				) RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.put(`/recipes/${recipeId}/picture`)
				.set("X-User-Id", String(userId))
				.attach("picture", Buffer.from("fake gif"), {
					filename: "pic.gif",
					contentType: "image/gif",
				});

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should return 404 for non-existent recipe", async () => {
		const userId = 2202;
		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[userId, "picture_no_recipe"],
		);
		try {
			const response = await request(app)
				.put("/recipes/999999/picture")
				.set("X-User-Id", String(userId))
				.attach("picture", minimalJpeg, {
					filename: "pic.jpg",
					contentType: "image/jpeg",
				});

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		} finally {
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should return 403 when user is not the recipe author", async () => {
		const ownerId = 2203;
		const intruderId = 2204;
		let recipeId: number | null = null;

		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[ownerId, "picture_owner"],
		);
		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[intruderId, "picture_intruder"],
		);
		try {
			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Picture Target', 'fi', 'Picture Target', 'ru', 'Picture Target'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'draft',
					$1
				 ) RETURNING id`,
				[ownerId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.put(`/recipes/${recipeId}/picture`)
				.set("X-User-Id", String(intruderId))
				.attach("picture", minimalJpeg, {
					filename: "pic.jpg",
					contentType: "image/jpeg",
				});

			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
				ownerId,
				intruderId,
			]);
		}
	});

	it("should return 409 for recipe in moderation status", async () => {
		const userId = 2205;
		let recipeId: number | null = null;

		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[userId, "picture_moderation"],
		);
		try {
			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Moderation Recipe', 'fi', 'Moderation Recipe', 'ru', 'Moderation Recipe'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'moderation',
					$1
				 ) RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.put(`/recipes/${recipeId}/picture`)
				.set("X-User-Id", String(userId))
				.attach("picture", minimalJpeg, {
					filename: "pic.jpg",
					contentType: "image/jpeg",
				});

			expect(response.status).toBe(409);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should return 409 for archived recipe", async () => {
		const userId = 2206;
		let recipeId: number | null = null;

		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[userId, "picture_archived"],
		);
		try {
			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Archived Recipe', 'fi', 'Archived Recipe', 'ru', 'Archived Recipe'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'archived',
					$1
				 ) RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.put(`/recipes/${recipeId}/picture`)
				.set("X-User-Id", String(userId))
				.attach("picture", minimalJpeg, {
					filename: "pic.jpg",
					contentType: "image/jpeg",
				});

			expect(response.status).toBe(409);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should upload picture for draft recipe and store URL in recipe_media", async () => {
		const userId = 2207;
		let recipeId: number | null = null;

		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[userId, "picture_draft_success"],
		);
		try {
			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Draft With Picture', 'fi', 'Draft With Picture', 'ru', 'Draft With Picture'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'draft',
					$1
				 ) RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.put(`/recipes/${recipeId}/picture`)
				.set("X-User-Id", String(userId))
				.attach("picture", minimalJpeg, {
					filename: "pic.jpg",
					contentType: "image/jpeg",
				});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Recipe picture updated");
			expect(response.body.data.picture_url).toMatch(/^\/recipe-pictures\//);

			const mediaResult = await pool.query(
				`SELECT url, type, position FROM recipe_media WHERE recipe_id = $1 AND position = 0`,
				[recipeId],
			);
			expect(mediaResult.rowCount).toBe(1);
			expect(mediaResult.rows[0].type).toBe("image");
			expect(mediaResult.rows[0].url).toMatch(/^\/recipe-pictures\//);

			// Cleanup uploaded file
			const filePath = path.resolve(
				"uploads/recipes",
				path.basename(mediaResult.rows[0].url),
			);
			if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
		} finally {
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should upload picture for published recipe", async () => {
		const userId = 2208;
		let recipeId: number | null = null;

		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[userId, "picture_published_success"],
		);
		try {
			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Published With Picture', 'fi', 'Published With Picture', 'ru', 'Published With Picture'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'published',
					$1
				 ) RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.put(`/recipes/${recipeId}/picture`)
				.set("X-User-Id", String(userId))
				.attach("picture", minimalJpeg, {
					filename: "pic.jpg",
					contentType: "image/jpeg",
				});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Recipe picture updated");

			const mediaResult = await pool.query(
				`SELECT url FROM recipe_media WHERE recipe_id = $1 AND position = 0`,
				[recipeId],
			);
			if (mediaResult.rows[0]?.url) {
				const filePath = path.resolve(
					"uploads/recipes",
					path.basename(mediaResult.rows[0].url),
				);
				if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
			}
		} finally {
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should replace existing picture and delete old file from disk", async () => {
		const userId = 2209;
		let recipeId: number | null = null;
		const oldFilePath = path.resolve(`uploads/recipes/old_${userId}.jpg`);

		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[userId, "picture_replace"],
		);
		try {
			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Replace Picture', 'fi', 'Replace Picture', 'ru', 'Replace Picture'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'draft',
					$1
				 ) RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			// Seed an existing picture row with a fake old file on disk
			fs.writeFileSync(oldFilePath, "old image data");
			await pool.query(
				`INSERT INTO recipe_media (recipe_id, type, url, position)
				 VALUES ($1, 'image', $2, 0)`,
				[recipeId, `/recipe-pictures/old_${userId}.jpg`],
			);

			const response = await request(app)
				.put(`/recipes/${recipeId}/picture`)
				.set("X-User-Id", String(userId))
				.attach("picture", minimalJpeg, {
					filename: "pic.jpg",
					contentType: "image/jpeg",
				});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Recipe picture updated");

			// Old file should be deleted from disk
			expect(fs.existsSync(oldFilePath)).toBe(false);

			// DB should have the new URL
			const mediaResult = await pool.query(
				`SELECT url FROM recipe_media WHERE recipe_id = $1 AND position = 0`,
				[recipeId],
			);
			expect(mediaResult.rows[0].url).not.toBe(
				`/recipe-pictures/old_${userId}.jpg`,
			);

			// Cleanup new file
			const newFilePath = path.resolve(
				"uploads/recipes",
				path.basename(mediaResult.rows[0].url),
			);
			if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
		} finally {
			if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should return 401 for PUT /recipes/:id without authentication", async () => {
		const response = await request(app)
			.put("/recipes/1")
			.send({
				title: "Updated",
				description: "Updated description",
				instructions: ["step"],
				servings: 2,
				spiciness: 1,
				ingredients: [{ ingredient_id: 1, amount: 100, unit: "g" }],
				category_ids: [],
			});

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for PUT /recipes/:id with invalid data", async () => {
		const response = await request(app)
			.put("/recipes/1")
			.set("X-User-Id", "1")
			.send({
				title: "",
				description: "invalid",
				instructions: [],
				servings: 0,
				spiciness: 99,
				ingredients: [],
				category_ids: [],
			});

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 403 for PUT /recipes/:id when user is not owner", async () => {
		const ownerId = 2101;
		const intruderId = 2102;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[ownerId, "update_owner"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[intruderId, "update_intruder"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Draft To Update', 'fi', 'Draft To Update', 'ru', 'Draft To Update'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'draft',
					$1
				 )
				 RETURNING id`,
				[ownerId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.put(`/recipes/${recipeId}`)
				.set("X-User-Id", String(intruderId))
				.send({
					title: "Updated by intruder",
					description: "Should fail",
					instructions: ["step"],
					servings: 2,
					spiciness: 1,
					ingredients: [{ ingredient_id: 1, amount: 100, unit: "g" }],
					category_ids: [],
				});

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

	it("should return 409 for PUT /recipes/:id when recipe is not draft", async () => {
		const userId = 2103;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[userId, "update_owner_published"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Published Recipe', 'fi', 'Published Recipe', 'ru', 'Published Recipe'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'published',
					$1
				 )
				 RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.put(`/recipes/${recipeId}`)
				.set("X-User-Id", String(userId))
				.send({
					title: "Updated title",
					description: "Updated description",
					instructions: ["updated"],
					servings: 3,
					spiciness: 2,
					ingredients: [{ ingredient_id: 1, amount: 150, unit: "g" }],
					category_ids: [],
				});

			expect(response.status).toBe(409);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should update draft recipe for owner", async () => {
		const userId = 2104;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[userId, "update_owner_success"],
			);

			const categoryResult = await pool.query(
				`SELECT id FROM recipe_categories ORDER BY id LIMIT 1`,
			);
			const categoryId = categoryResult.rows[0].id as number;

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, description, instructions, servings, spiciness, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Old Title', 'fi', 'Old Title', 'ru', 'Old Title'),
					jsonb_build_object('en', 'Old Description', 'fi', 'Old Description', 'ru', 'Old Description'),
					jsonb_build_object('en', to_jsonb(ARRAY['old step']), 'fi', to_jsonb(ARRAY['old step']), 'ru', to_jsonb(ARRAY['old step'])),
					1,
					0,
					'draft',
					$1
				 )
				 RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			await pool.query(
				`INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
				 VALUES ($1, 1, 50, 'g')`,
				[recipeId],
			);

			const response = await request(app)
				.put(`/recipes/${recipeId}`)
				.set("X-User-Id", String(userId))
				.send({
					title: "New Title",
					description: "New Description",
					instructions: ["new step 1", "new step 2"],
					servings: 4,
					spiciness: 2,
					ingredients: [{ ingredient_id: 1, amount: 200, unit: "g" }],
					category_ids: [categoryId],
				});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Recipe updated");
			expect(response.body.data).toHaveProperty("title", "New Title");
			expect(response.body.data).toHaveProperty(
				"description",
				"New Description",
			);
			expect(response.body.data.ingredients[0]).toHaveProperty("amount", 200);

			const dbRecipe = await pool.query(
				`SELECT title, description, servings, spiciness, status FROM recipes WHERE id = $1`,
				[recipeId],
			);
			expect(dbRecipe.rows[0].title).toMatchObject({ en: "New Title" });
			expect(dbRecipe.rows[0].description).toMatchObject({
				en: "New Description",
			});
			expect(dbRecipe.rows[0].status).toBe("draft");
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should return 401 for DELETE /recipes/:id without authentication", async () => {
		const response = await request(app).delete("/recipes/1");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for DELETE /recipes/:id with invalid id", async () => {
		const response = await request(app)
			.delete("/recipes/abc")
			.set("X-User-Id", "1");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 403 for DELETE /recipes/:id when user has no permission", async () => {
		const ownerId = 2105;
		const intruderId = 2106;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[ownerId, "archive_owner"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[intruderId, "archive_intruder"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Archive Target', 'fi', 'Archive Target', 'ru', 'Archive Target'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'published',
					$1
				 )
				 RETURNING id`,
				[ownerId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.delete(`/recipes/${recipeId}`)
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

	it("should archive recipe when requested by owner", async () => {
		const ownerId = 2107;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[ownerId, "archive_owner_success"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Owner Archive Target', 'fi', 'Owner Archive Target', 'ru', 'Owner Archive Target'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'published',
					$1
				 )
				 RETURNING id`,
				[ownerId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.delete(`/recipes/${recipeId}`)
				.set("X-User-Id", String(ownerId));

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Recipe archived");
			expect(response.body.data).toHaveProperty("status", "archived");
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id = $1`, [ownerId]);
		}
	});

	it("should archive recipe when requested by admin", async () => {
		const ownerId = 2108;
		const adminId = 2109;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[ownerId, "archive_admin_owner"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'admin', 'offline') ON CONFLICT (id) DO NOTHING`,
				[adminId, "archive_admin"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Admin Archive Target', 'fi', 'Admin Archive Target', 'ru', 'Admin Archive Target'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'published',
					$1
				 )
				 RETURNING id`,
				[ownerId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.delete(`/recipes/${recipeId}`)
				.set("X-User-Id", String(adminId));

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Recipe archived");
			expect(response.body.data).toHaveProperty("status", "archived");
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
				ownerId,
				adminId,
			]);
		}
	});

	it("should return 409 for DELETE /recipes/:id when recipe is already archived", async () => {
		const userId = 2110;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[userId, "archive_already"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Already Archived', 'fi', 'Already Archived', 'ru', 'Already Archived'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'archived',
					$1
				 )
				 RETURNING id`,
				[userId],
			);
			recipeId = recipeResult.rows[0].id;

			const response = await request(app)
				.delete(`/recipes/${recipeId}`)
				.set("X-User-Id", String(userId));

			expect(response.status).toBe(409);
			expect(response.body).toHaveProperty("error");
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
				 VALUES (
					jsonb_build_object('en', 'Favorite Target', 'fi', 'Favorite Target', 'ru', 'Favorite Target'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'published',
					$1
				 )
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

	it("should return 401 for POST /recipes/:id/reviews without authentication", async () => {
		const response = await request(app)
			.post("/recipes/1/reviews")
			.send({ body: "Great recipe" });

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for POST /recipes/:id/reviews with invalid id", async () => {
		const response = await request(app)
			.post("/recipes/abc/reviews")
			.set("X-User-Id", "1")
			.send({ body: "Great recipe" });

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for POST /recipes/:id/reviews when body is too long", async () => {
		const response = await request(app)
			.post("/recipes/1/reviews")
			.set("X-User-Id", "1")
			.send({ body: "x".repeat(1001) });

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 404 for POST /recipes/:id/reviews when recipe does not exist", async () => {
		const response = await request(app)
			.post("/recipes/999999/reviews")
			.set("X-User-Id", "1")
			.send({ body: "Great recipe" });

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 401 for POST /recipes/:id/reviews when user is not registered", async () => {
		const response = await request(app)
			.post("/recipes/1/reviews")
			.set("X-User-Id", "999999")
			.send({ body: "Great recipe" });

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should create and return reviews for GET /recipes/:id/reviews", async () => {
		const authorId = 2301;
		const reviewerId = 2302;
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[authorId, "review_recipe_author"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[reviewerId, "review_author"],
			);

			const titleColumnTypeResult = await pool.query(
				`SELECT data_type
				 FROM information_schema.columns
				 WHERE table_name = 'recipes' AND column_name = 'title'`,
			);
			const usesJsonbTitle =
				titleColumnTypeResult.rows[0]?.data_type === "jsonb";

			const recipeResult = usesJsonbTitle
				? await pool.query(
						`INSERT INTO recipes (title, instructions, status, author_id)
						 VALUES (
							jsonb_build_object('en', 'Review Target', 'fi', 'Review Target', 'ru', 'Review Target'),
							jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
							'published',
							$1
						 )
						 RETURNING id`,
						[authorId],
					)
				: await pool.query(
						`INSERT INTO recipes (title, instructions, status, author_id)
						 VALUES ('Review Target', ARRAY['step'], 'published', $1)
						 RETURNING id`,
						[authorId],
					);
			recipeId = recipeResult.rows[0].id;

			const createResponse = await request(app)
				.post(`/recipes/${recipeId}/reviews`)
				.set("X-User-Id", String(reviewerId))
				.send({ body: "Looks tasty!" });

			expect(createResponse.status).toBe(201);
			expect(createResponse.body).toHaveProperty("data");
			expect(createResponse.body.data).toHaveProperty("recipe_id", recipeId);
			expect(createResponse.body).toHaveProperty("message", "Review published");

			const listResponse = await request(app).get(
				`/recipes/${recipeId}/reviews`,
			);

			expect(listResponse.status).toBe(200);
			expect(listResponse.body).toHaveProperty("data");
			expect(listResponse.body).toHaveProperty("count");
			expect(listResponse.body.count).toBeGreaterThanOrEqual(1);
			expect(
				listResponse.body.data.some(
					(review: { body: string }) => review.body === "Looks tasty!",
				),
			).toBe(true);
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
				authorId,
				reviewerId,
			]);
		}
	});

	it("should return 404 for GET /recipes/:id/reviews when recipe does not exist", async () => {
		const response = await request(app).get("/recipes/999999/reviews");

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 401 for PUT /recipes/:id/reviews/:reviewId without authentication", async () => {
		const response = await request(app)
			.put("/recipes/1/reviews/1")
			.send({ body: "Updated" });

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for PUT /recipes/:id/reviews/:reviewId with invalid recipe id", async () => {
		const response = await request(app)
			.put("/recipes/abc/reviews/1")
			.set("X-User-Id", "1")
			.send({ body: "Updated" });

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for PUT /recipes/:id/reviews/:reviewId with invalid review id", async () => {
		const response = await request(app)
			.put("/recipes/1/reviews/abc")
			.set("X-User-Id", "1")
			.send({ body: "Updated" });

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for PUT /recipes/:id/reviews/:reviewId with invalid body", async () => {
		const response = await request(app)
			.put("/recipes/1/reviews/1")
			.set("X-User-Id", "1")
			.send({ body: "x".repeat(1001) });

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 404 for PUT /recipes/:id/reviews/:reviewId when review does not exist", async () => {
		const userId = 2401;
		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[userId, "update_review_404"],
		);
		try {
			const response = await request(app)
				.put("/recipes/1/reviews/999999")
				.set("X-User-Id", String(userId))
				.send({ body: "Updated" });

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		} finally {
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should return 403 for PUT /recipes/:id/reviews/:reviewId when user does not own review", async () => {
		const authorId = 2402;
		const intruderId = 2403;
		const recipeAuthorId = 2404;
		let recipeId: number | null = null;
		let reviewId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[recipeAuthorId, "update_review_recipe_author"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[authorId, "update_review_author"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[intruderId, "update_review_intruder"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Review Forbidden Target', 'fi', 'Review Forbidden Target', 'ru', 'Review Forbidden Target'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'published',
					$1
				 ) RETURNING id`,
				[recipeAuthorId],
			);
			recipeId = recipeResult.rows[0].id;

			const reviewResult = await pool.query(
				`INSERT INTO recipe_reviews (recipe_id, author_id, body) VALUES ($1, $2, $3) RETURNING id`,
				[recipeId, authorId, "Original review"],
			);
			reviewId = reviewResult.rows[0].id;

			const response = await request(app)
				.put(`/recipes/${recipeId}/reviews/${reviewId}`)
				.set("X-User-Id", String(intruderId))
				.send({ body: "Intruder update" });

			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (reviewId)
				await pool.query(`DELETE FROM recipe_reviews WHERE id = $1`, [
					reviewId,
				]);
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2, $3)`, [
				recipeAuthorId,
				authorId,
				intruderId,
			]);
		}
	});

	it("should update review when requested by author", async () => {
		const authorId = 2405;
		const recipeAuthorId = 2406;
		let recipeId: number | null = null;
		let reviewId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[recipeAuthorId, "update_review_recipe_owner"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[authorId, "update_review_success_author"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Review Update Target', 'fi', 'Review Update Target', 'ru', 'Review Update Target'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'published',
					$1
				 ) RETURNING id`,
				[recipeAuthorId],
			);
			recipeId = recipeResult.rows[0].id;

			const reviewResult = await pool.query(
				`INSERT INTO recipe_reviews (recipe_id, author_id, body) VALUES ($1, $2, $3) RETURNING id`,
				[recipeId, authorId, "Original body"],
			);
			reviewId = reviewResult.rows[0].id;

			const response = await request(app)
				.put(`/recipes/${recipeId}/reviews/${reviewId}`)
				.set("X-User-Id", String(authorId))
				.send({ body: "Updated body" });

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Review updated");
			expect(response.body.data).toHaveProperty("body", "Updated body");
			expect(response.body.data).toHaveProperty("id", reviewId);
			expect(response.body.data).toHaveProperty("recipe_id", recipeId);

			// Verify DB was updated
			const dbReview = await pool.query(
				`SELECT body FROM recipe_reviews WHERE id = $1`,
				[reviewId],
			);
			expect(dbReview.rows[0].body).toBe("Updated body");
		} finally {
			if (reviewId)
				await pool.query(`DELETE FROM recipe_reviews WHERE id = $1`, [
					reviewId,
				]);
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
				recipeAuthorId,
				authorId,
			]);
		}
	});

	it("should return 401 for DELETE /recipes/:id/reviews/:reviewId without authentication", async () => {
		const response = await request(app).delete("/recipes/1/reviews/1");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for DELETE /recipes/:id/reviews/:reviewId with invalid recipe id", async () => {
		const response = await request(app)
			.delete("/recipes/abc/reviews/1")
			.set("X-User-Id", "1");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for DELETE /recipes/:id/reviews/:reviewId with invalid review id", async () => {
		const response = await request(app)
			.delete("/recipes/1/reviews/abc")
			.set("X-User-Id", "1");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 404 for DELETE /recipes/:id/reviews/:reviewId when review does not exist", async () => {
		const userId = 2501;
		await pool.query(
			`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
			[userId, "delete_review_404"],
		);
		try {
			const response = await request(app)
				.delete("/recipes/1/reviews/999999")
				.set("X-User-Id", String(userId));

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		} finally {
			await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
		}
	});

	it("should return 403 for DELETE /recipes/:id/reviews/:reviewId when user does not own review", async () => {
		const authorId = 2502;
		const intruderId = 2503;
		const recipeAuthorId = 2504;
		let recipeId: number | null = null;
		let reviewId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[recipeAuthorId, "delete_review_recipe_author"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[authorId, "delete_review_author"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[intruderId, "delete_review_intruder"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Delete Review Forbidden', 'fi', 'Delete Review Forbidden', 'ru', 'Delete Review Forbidden'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'published',
					$1
				 ) RETURNING id`,
				[recipeAuthorId],
			);
			recipeId = recipeResult.rows[0].id;

			const reviewResult = await pool.query(
				`INSERT INTO recipe_reviews (recipe_id, author_id, body) VALUES ($1, $2, $3) RETURNING id`,
				[recipeId, authorId, "Review to not delete"],
			);
			reviewId = reviewResult.rows[0].id;

			const response = await request(app)
				.delete(`/recipes/${recipeId}/reviews/${reviewId}`)
				.set("X-User-Id", String(intruderId));

			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (reviewId)
				await pool.query(`DELETE FROM recipe_reviews WHERE id = $1`, [
					reviewId,
				]);
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2, $3)`, [
				recipeAuthorId,
				authorId,
				intruderId,
			]);
		}
	});

	it("should soft-delete review when requested by author", async () => {
		const authorId = 2505;
		const recipeAuthorId = 2506;
		let recipeId: number | null = null;
		let reviewId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[recipeAuthorId, "delete_review_recipe_owner"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[authorId, "delete_review_success_author"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Delete Review Target', 'fi', 'Delete Review Target', 'ru', 'Delete Review Target'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'published',
					$1
				 ) RETURNING id`,
				[recipeAuthorId],
			);
			recipeId = recipeResult.rows[0].id;

			const reviewResult = await pool.query(
				`INSERT INTO recipe_reviews (recipe_id, author_id, body) VALUES ($1, $2, $3) RETURNING id`,
				[recipeId, authorId, "Review to delete"],
			);
			reviewId = reviewResult.rows[0].id;

			const response = await request(app)
				.delete(`/recipes/${recipeId}/reviews/${reviewId}`)
				.set("X-User-Id", String(authorId));

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Review deleted");
			expect(response.body.data).toHaveProperty("id", reviewId);
			expect(response.body.data).toHaveProperty("recipe_id", recipeId);
			expect(response.body.data).toHaveProperty("updated_at");
			expect(typeof response.body.data.updated_at).toBe("string");

			// Verify soft-delete: row still exists but is_deleted = true
			const dbReview = await pool.query(
				`SELECT is_deleted FROM recipe_reviews WHERE id = $1`,
				[reviewId],
			);
			expect(dbReview.rows[0].is_deleted).toBe(true);

			// Verify it no longer appears in GET /reviews
			const listResponse = await request(app).get(
				`/recipes/${recipeId}/reviews`,
			);
			expect(
				listResponse.body.data.some((r: { id: number }) => r.id === reviewId),
			).toBe(false);
		} finally {
			if (reviewId)
				await pool.query(`DELETE FROM recipe_reviews WHERE id = $1`, [
					reviewId,
				]);
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
				recipeAuthorId,
				authorId,
			]);
		}
	});

	it("should return 404 when trying to delete an already-deleted review", async () => {
		const authorId = 2507;
		const recipeAuthorId = 2508;
		let recipeId: number | null = null;
		let reviewId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[recipeAuthorId, "delete_review_recipe_owner_2"],
			);
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[authorId, "delete_review_double_author"],
			);

			const recipeResult = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES (
					jsonb_build_object('en', 'Double Delete Target', 'fi', 'Double Delete Target', 'ru', 'Double Delete Target'),
					jsonb_build_object('en', to_jsonb(ARRAY['step']), 'fi', to_jsonb(ARRAY['step']), 'ru', to_jsonb(ARRAY['step'])),
					'published',
					$1
				 ) RETURNING id`,
				[recipeAuthorId],
			);
			recipeId = recipeResult.rows[0].id;

			const reviewResult = await pool.query(
				`INSERT INTO recipe_reviews (recipe_id, author_id, body, is_deleted) VALUES ($1, $2, $3, true) RETURNING id`,
				[recipeId, authorId, "Already deleted review"],
			);
			reviewId = reviewResult.rows[0].id;

			const response = await request(app)
				.delete(`/recipes/${recipeId}/reviews/${reviewId}`)
				.set("X-User-Id", String(authorId));

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (reviewId)
				await pool.query(`DELETE FROM recipe_reviews WHERE id = $1`, [
					reviewId,
				]);
			if (recipeId)
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
				recipeAuthorId,
				authorId,
			]);
		}
	});
});
