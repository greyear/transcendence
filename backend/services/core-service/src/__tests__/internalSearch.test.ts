import request from "supertest";
import { app } from "../app.js";
import { pool } from "../db/database.js";

describe("Internal Search Routes", () => {
	it("should return published recipes for GET /internal/search/recipes", async () => {
		const response = await request(app).get("/internal/search/recipes");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body).toHaveProperty("count");
		expect(Array.isArray(response.body.data)).toBe(true);

		if (response.body.count > 0) {
			expect(response.body.data[0]).toHaveProperty("id");
			expect(response.body.data[0]).toHaveProperty("title");
			expect(response.body.data[0]).toHaveProperty("description");
			expect(response.body.data[0]).toHaveProperty("instructions");
			expect(response.body.data[0]).toHaveProperty("author_id");
			expect(response.body.data[0]).toHaveProperty("servings");
			expect(response.body.data[0]).toHaveProperty("spiciness");
			expect(response.body.data[0]).toHaveProperty("rating_avg");
			expect(response.body.data[0]).toHaveProperty("ingredients");
			expect(response.body.data[0]).toHaveProperty("categories");
			expect(response.body.data[0]).toHaveProperty("updated_at");
		}
	});

	it("should return one published recipe for GET /internal/search/recipes/:id", async () => {
		const response = await request(app).get("/internal/search/recipes/1");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body.data).toHaveProperty("id", 1);
		expect(response.body.data).toHaveProperty("title");
		expect(response.body.data).toHaveProperty("description");
		expect(response.body.data).toHaveProperty("instructions");
		expect(response.body.data).toHaveProperty("author_id");
		expect(response.body.data).toHaveProperty("servings");
		expect(response.body.data).toHaveProperty("spiciness");
		expect(response.body.data).toHaveProperty("rating_avg");
		expect(response.body.data).toHaveProperty("ingredients");
		expect(response.body.data).toHaveProperty("categories");
		expect(response.body.data).toHaveProperty("updated_at");
	});

	it("should return 400 for invalid internal search recipe IDs", async () => {
		const invalidIds = ["-1", "0", "abc", "1.5", "null"];

		for (const id of invalidIds) {
			const response = await request(app).get(`/internal/search/recipes/${id}`);

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		}
	});

	it("should return 404 for missing published internal search recipe", async () => {
		const response = await request(app).get("/internal/search/recipes/999999");

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("error");
	});

	it("should not expose draft recipes through internal search", async () => {
		let recipeId: number | null = null;

		try {
			await pool.query(
				`INSERT INTO users (id, username, role, status) VALUES ($1, $2, 'user', 'offline') ON CONFLICT (id) DO NOTHING`,
				[998, "search_draft_owner"],
			);

			const recipeRes = await pool.query(
				`INSERT INTO recipes (title, instructions, status, author_id)
				 VALUES ('Hidden Search Draft', ARRAY['step 1'], 'draft', $1)
				 RETURNING id`,
				[998],
			);
			recipeId = recipeRes.rows[0].id as number;

			const response = await request(app).get(
				`/internal/search/recipes/${recipeId}`,
			);

			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty("error");
		} finally {
			if (recipeId) {
				await pool.query(`DELETE FROM recipes WHERE id = $1`, [recipeId]);
			}
			await pool.query(`DELETE FROM users WHERE id = $1`, [998]);
		}
	});
});
