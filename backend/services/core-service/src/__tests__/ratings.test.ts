/**
 * Recipe Ratings Routes Integration Tests
 *
 * Tests POST/PUT/DELETE /recipes/:id/rating with:
 * - Happy path (valid requests)
 * - Validation errors (invalid IDs, invalid rating values)
 * - Authorization (unauthenticated requests)
 * - Business rule errors (conflict, not-rated, not-found)
 */

import request from "supertest";
import { app } from "../app.js";
import { pool } from "../db/database.js";

// ── Shared test helpers ───────────────────────────────────────────────────────

const TEST_USER_BASE_ID = 3000;

const insertUser = (id: number, username: string) =>
	pool.query(
		`INSERT INTO users (id, username, role, status)
     VALUES ($1, $2, 'user', 'offline')
     ON CONFLICT (id) DO NOTHING`,
		[id, username],
	);

const deleteUsers = (...ids: number[]) =>
	pool.query(`DELETE FROM users WHERE id = ANY($1::int[])`, [ids]);

const insertPublishedRecipe = async (authorId: number): Promise<number> => {
	const result = await pool.query(
		`INSERT INTO recipes (title, instructions, status, author_id)
     VALUES (
			jsonb_build_object('en', 'Test Recipe', 'fi', 'Test Recipe', 'ru', 'Test Recipe'),
			jsonb_build_object('en', to_jsonb(ARRAY['step 1']), 'fi', to_jsonb(ARRAY['step 1']), 'ru', to_jsonb(ARRAY['step 1'])),
			'published',
			$1
		 )
     RETURNING id`,
		[authorId],
	);
	return result.rows[0].id as number;
};

const deleteRecipe = (id: number | null) => {
	if (id !== null) {
		return pool.query(`DELETE FROM recipes WHERE id = $1`, [id]);
	}

	return null;
};

const insertRating = (recipeId: number, userId: number, rating: number) =>
	pool.query(
		`INSERT INTO recipe_ratings (recipe_id, user_id, rating) VALUES ($1, $2, $3)`,
		[recipeId, userId, rating],
	);

// ── POST /recipes/:id/rating ──────────────────────────────────────────────────

describe("POST /recipes/:id/rating", () => {
	it("should return 401 when not authenticated", async () => {
		const response = await request(app)
			.post("/recipes/1/rating")
			.send({ rating: 4 });

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for invalid recipe ID", async () => {
		const invalidIds = ["-1", "0", "abc", "1.5", "null"];

		for (const id of invalidIds) {
			const response = await request(app)
				.post(`/recipes/${id}/rating`)
				.set("X-User-Id", "1")
				.send({ rating: 4 });

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		}
	});

	it("should return 400 for invalid rating value", async () => {
		const invalidBodies = [
			{ rating: 0 },
			{ rating: 6 },
			{ rating: "five" },
			{},
		];

		for (const body of invalidBodies) {
			const response = await request(app)
				.post("/recipes/1/rating")
				.set("X-User-Id", "1")
				.send(body);

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		}
	});

	it("should return 404 for non-existent recipe", async () => {
		const userId = TEST_USER_BASE_ID + 1;
		await insertUser(userId, "rating_post_404");

		try {
			const response = await request(app)
				.post("/recipes/999999/rating")
				.set("X-User-Id", String(userId))
				.send({ rating: 4 });

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		} finally {
			await deleteUsers(userId);
		}
	});

	it("should create rating and recalculate recipe averages", async () => {
		const userId = TEST_USER_BASE_ID + 2;
		let recipeId: number | null = null;

		await insertUser(userId, "rating_post_success");

		try {
			recipeId = await insertPublishedRecipe(userId);

			const response = await request(app)
				.post(`/recipes/${recipeId}/rating`)
				.set("X-User-Id", String(userId))
				.send({ rating: 4 });

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("message", "Rating created");

			const dbResult = await pool.query(
				`SELECT rating_avg, rating_count FROM recipes WHERE id = $1`,
				[recipeId],
			);
			expect(Number(dbResult.rows[0].rating_avg)).toBe(4);
			expect(Number(dbResult.rows[0].rating_count)).toBe(1);
		} finally {
			await deleteRecipe(recipeId);
			await deleteUsers(userId);
		}
	});

	it("should return 409 when user rates the same recipe twice", async () => {
		const userId = TEST_USER_BASE_ID + 3;
		let recipeId: number | null = null;

		await insertUser(userId, "rating_post_conflict");

		try {
			recipeId = await insertPublishedRecipe(userId);
			await insertRating(recipeId, userId, 3);

			const response = await request(app)
				.post(`/recipes/${recipeId}/rating`)
				.set("X-User-Id", String(userId))
				.send({ rating: 5 });

			expect(response.status).toBe(409);
			expect(response.body).toHaveProperty("error");
		} finally {
			await deleteRecipe(recipeId);
			await deleteUsers(userId);
		}
	});
});

// ── PUT /recipes/:id/rating ───────────────────────────────────────────────────

describe("PUT /recipes/:id/rating", () => {
	it("should return 401 when not authenticated", async () => {
		const response = await request(app)
			.put("/recipes/1/rating")
			.send({ rating: 3 });

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for invalid recipe ID", async () => {
		const response = await request(app)
			.put("/recipes/abc/rating")
			.set("X-User-Id", "1")
			.send({ rating: 3 });

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for invalid rating value", async () => {
		const response = await request(app)
			.put("/recipes/1/rating")
			.set("X-User-Id", "1")
			.send({ rating: 99 });

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 404 for non-existent recipe", async () => {
		const userId = TEST_USER_BASE_ID + 4;
		await insertUser(userId, "rating_put_404_recipe");

		try {
			const response = await request(app)
				.put("/recipes/999999/rating")
				.set("X-User-Id", String(userId))
				.send({ rating: 2 });

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		} finally {
			await deleteUsers(userId);
		}
	});

	it("should return 404 when user has not rated the recipe yet", async () => {
		const userId = TEST_USER_BASE_ID + 5;
		let recipeId: number | null = null;

		await insertUser(userId, "rating_put_not_rated");

		try {
			recipeId = await insertPublishedRecipe(userId);

			const response = await request(app)
				.put(`/recipes/${recipeId}/rating`)
				.set("X-User-Id", String(userId))
				.send({ rating: 3 });

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		} finally {
			await deleteRecipe(recipeId);
			await deleteUsers(userId);
		}
	});

	it("should update rating and recalculate recipe averages", async () => {
		const userId = TEST_USER_BASE_ID + 6;
		let recipeId: number | null = null;

		await insertUser(userId, "rating_put_success");

		try {
			recipeId = await insertPublishedRecipe(userId);
			await insertRating(recipeId, userId, 2);

			const response = await request(app)
				.put(`/recipes/${recipeId}/rating`)
				.set("X-User-Id", String(userId))
				.send({ rating: 5 });

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Rating updated");

			const dbResult = await pool.query(
				`SELECT rating_avg FROM recipes WHERE id = $1`,
				[recipeId],
			);
			expect(Number(dbResult.rows[0].rating_avg)).toBe(5);
		} finally {
			await deleteRecipe(recipeId);
			await deleteUsers(userId);
		}
	});
});

// ── DELETE /recipes/:id/rating ────────────────────────────────────────────────

describe("DELETE /recipes/:id/rating", () => {
	it("should return 401 when not authenticated", async () => {
		const response = await request(app).delete("/recipes/1/rating");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 for invalid recipe ID", async () => {
		const response = await request(app)
			.delete("/recipes/abc/rating")
			.set("X-User-Id", "1");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 404 for non-existent recipe", async () => {
		const userId = TEST_USER_BASE_ID + 7;
		await insertUser(userId, "rating_delete_404_recipe");

		try {
			const response = await request(app)
				.delete("/recipes/999999/rating")
				.set("X-User-Id", String(userId));

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		} finally {
			await deleteUsers(userId);
		}
	});

	it("should return 404 when user has not rated the recipe", async () => {
		const userId = TEST_USER_BASE_ID + 8;
		let recipeId: number | null = null;

		await insertUser(userId, "rating_delete_not_rated");

		try {
			recipeId = await insertPublishedRecipe(userId);

			const response = await request(app)
				.delete(`/recipes/${recipeId}/rating`)
				.set("X-User-Id", String(userId));

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		} finally {
			await deleteRecipe(recipeId);
			await deleteUsers(userId);
		}
	});

	it("should delete rating and recalculate recipe averages", async () => {
		const userId = TEST_USER_BASE_ID + 9;
		let recipeId: number | null = null;

		await insertUser(userId, "rating_delete_success");

		try {
			recipeId = await insertPublishedRecipe(userId);
			await insertRating(recipeId, userId, 4);

			const response = await request(app)
				.delete(`/recipes/${recipeId}/rating`)
				.set("X-User-Id", String(userId));

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Rating deleted");

			const ratingRow = await pool.query(
				`SELECT 1 FROM recipe_ratings WHERE recipe_id = $1 AND user_id = $2`,
				[recipeId, userId],
			);
			expect(ratingRow.rowCount).toBe(0);

			const dbResult = await pool.query(
				`SELECT rating_avg, rating_count FROM recipes WHERE id = $1`,
				[recipeId],
			);
			expect(dbResult.rows[0].rating_avg).toBeNull();
			expect(Number(dbResult.rows[0].rating_count)).toBe(0);
		} finally {
			await deleteRecipe(recipeId);
			await deleteUsers(userId);
		}
	});

	it("should correctly recalculate averages with multiple raters after deletion", async () => {
		const ownerId = TEST_USER_BASE_ID + 10;
		const rater1Id = TEST_USER_BASE_ID + 11;
		const rater2Id = TEST_USER_BASE_ID + 12;
		let recipeId: number | null = null;

		await insertUser(ownerId, "rating_multi_owner");
		await insertUser(rater1Id, "rating_multi_rater1");
		await insertUser(rater2Id, "rating_multi_rater2");

		try {
			recipeId = await insertPublishedRecipe(ownerId);
			await insertRating(recipeId, rater1Id, 2);
			await insertRating(recipeId, rater2Id, 4);

			// Sync denormalized columns to reflect both ratings before test
			await pool.query(
				`UPDATE recipes SET rating_avg = 3, rating_count = 2 WHERE id = $1`,
				[recipeId],
			);

			// Delete rater1 (rating=2) → only rater2 (rating=4) remains → avg = 4
			const response = await request(app)
				.delete(`/recipes/${recipeId}/rating`)
				.set("X-User-Id", String(rater1Id));

			expect(response.status).toBe(200);

			const dbResult = await pool.query(
				`SELECT rating_avg, rating_count FROM recipes WHERE id = $1`,
				[recipeId],
			);
			expect(Number(dbResult.rows[0].rating_avg)).toBe(4);
			expect(Number(dbResult.rows[0].rating_count)).toBe(1);
		} finally {
			await deleteRecipe(recipeId);
			await deleteUsers(ownerId, rater1Id, rater2Id);
		}
	});
});
