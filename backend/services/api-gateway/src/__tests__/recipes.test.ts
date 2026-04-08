/**
 * API Gateway recipe route tests.
 *
 * These tests mock downstream fetch calls so they do not depend on network
 * or running core-service containers.
 */

import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";

describe("API Gateway - Recipes Routes", () => {
	const fetchSpy = jest.spyOn(global, "fetch");
	let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

	beforeEach(() => {
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		fetchSpy.mockReset();
		consoleErrorSpy.mockRestore();
	});

	afterAll(() => {
		fetchSpy.mockRestore();
	});

	it("should proxy GET /recipes to core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 200,
			json: async () => ({ data: [{ id: 1, title: "Test" }], count: 1 }),
		} as unknown as Response);

		const response = await request(app).get("/recipes");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [{ id: 1, title: "Test" }],
			count: 1,
		});
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/recipes"),
			expect.objectContaining({
				headers: expect.objectContaining({
					"Content-Type": "application/json",
				}),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should proxy GET /recipes/:id to core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 200,
			json: async () => ({ data: { id: 1, title: "One recipe" } }),
		} as unknown as Response);

		const response = await request(app).get("/recipes/1");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ data: { id: 1, title: "One recipe" } });
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/recipes/1"),
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	it("should forward validation error from core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 400,
			json: async () => ({ error: "Invalid recipe id" }),
		} as unknown as Response);

		const response = await request(app).get("/recipes/invalid");

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Invalid recipe id" });
	});

	it("should forward 403 from core-service for restricted recipe", async () => {
		fetchSpy.mockResolvedValue({
			status: 403,
			json: async () => ({ error: "Access to this recipe is restricted" }),
		} as unknown as Response);

		const response = await request(app).get("/recipes/10");

		expect(response.status).toBe(403);
		expect(response.body).toEqual({
			error: "Access to this recipe is restricted",
		});
	});

	it("should forward 404 from core-service for missing recipe", async () => {
		fetchSpy.mockResolvedValue({
			status: 404,
			json: async () => ({ error: "Recipe not found" }),
		} as unknown as Response);

		const response = await request(app).get("/recipes/999999");

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Recipe not found" });
	});

	it("should return 504 when downstream request times out", async () => {
		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValue(timeoutError);

		const response = await request(app).get("/recipes");

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected proxy error for GET /recipes", async () => {
		fetchSpy.mockRejectedValue(new Error("boom"));

		const response = await request(app).get("/recipes");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({
			error: "Failed to fetch recipes from core-service",
		});
	});

	it("should reject POST /recipes without authentication", async () => {
		const response = await request(app)
			.post("/recipes")
			.send({
				title: "Draft",
				instructions: ["step"],
				ingredients: [{ ingredient_id: 1, amount: 100, unit: "g" }],
			});

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy POST /recipes to core-service", async () => {
		const payload = {
			title: "Gateway Draft",
			description: "Created via gateway",
			instructions: ["Prep", "Cook"],
			servings: 2,
			spiciness: 1,
			ingredients: [{ ingredient_id: 1, amount: 150, unit: "g" }],
		};

		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 201,
			json: async () => ({
				data: {
					id: 77,
					status: "draft",
					author_id: 42,
					ingredients: [
						{
							ingredient_id: 1,
							name: "Chicken Breast",
							amount: 150,
							unit: "g",
						},
					],
				},
			}),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes")
			.set("Authorization", "Bearer validtoken")
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toEqual({
			data: {
				id: 77,
				status: "draft",
				author_id: 42,
				ingredients: [
					{ ingredient_id: 1, name: "Chicken Breast", amount: 150, unit: "g" },
				],
			},
		});

		expect(fetchSpy).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("/auth/validate"),
			expect.objectContaining({
				method: "POST",
				headers: { Authorization: "Bearer validtoken" },
			}),
		);

		expect(fetchSpy).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("/recipes"),
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify(payload),
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					"x-user-id": "42",
				}),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should return 504 when downstream create recipe request times out", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValueOnce(timeoutError);

		const response = await request(app)
			.post("/recipes")
			.set("Authorization", "Bearer validtoken")
			.send({ title: "Draft", instructions: ["step"] });

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected proxy error for POST /recipes", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockRejectedValueOnce(new Error("boom"));

		const response = await request(app)
			.post("/recipes")
			.set("Authorization", "Bearer validtoken")
			.send({ title: "Draft", instructions: ["step"] });

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to create recipe" });
	});

	it("should validate token and proxy POST /recipes/:id/publish to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				data: { id: 77, status: "moderation" },
				message: "Recipe sent to moderation",
			}),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/77/publish")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { id: 77, status: "moderation" },
			message: "Recipe sent to moderation",
		});

		expect(fetchSpy).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("/auth/validate"),
			expect.objectContaining({
				method: "POST",
				headers: { Authorization: "Bearer validtoken" },
			}),
		);

		expect(fetchSpy).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("/recipes/77/publish"),
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					"x-user-id": "42",
				}),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should forward 403 from core-service for forbidden publish", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 403,
			json: async () => ({ error: "No permission to publish this recipe" }),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/77/publish")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(403);
		expect(response.body).toEqual({
			error: "No permission to publish this recipe",
		});
	});

	it("should forward 404 from core-service for missing recipe on publish", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 404,
			json: async () => ({ error: "Recipe not found" }),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/999999/publish")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Recipe not found" });
	});

	it("should forward 409 from core-service for invalid publish status", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 409,
			json: async () => ({
				error: "Recipe cannot be sent to moderation from status moderation",
			}),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/77/publish")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(409);
		expect(response.body).toEqual({
			error: "Recipe cannot be sent to moderation from status moderation",
		});
	});

	it("should return 504 when downstream publish request times out", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValueOnce(timeoutError);

		const response = await request(app)
			.post("/recipes/77/publish")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected proxy error for publish", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockRejectedValueOnce(new Error("boom"));

		const response = await request(app)
			.post("/recipes/77/publish")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to publish recipe" });
	});

	it("should reject POST /recipes/:id/favorite without authentication", async () => {
		const response = await request(app).post("/recipes/77/favorite");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy POST /recipes/:id/favorite to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				data: { recipe_id: 77 },
				message: "Recipe added to favorites",
			}),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/77/favorite")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { recipe_id: 77 },
			message: "Recipe added to favorites",
		});
	});

	it("should forward 409 from core-service for duplicate favorite", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 409,
			json: async () => ({ error: "Recipe is already in favorites" }),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/77/favorite")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(409);
		expect(response.body).toEqual({ error: "Recipe is already in favorites" });
	});

	it("should reject DELETE /recipes/:id/favorite without authentication", async () => {
		const response = await request(app).delete("/recipes/77/favorite");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy DELETE /recipes/:id/favorite to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				data: { recipe_id: 77 },
				message: "Recipe removed from favorites",
			}),
		} as unknown as Response);

		const response = await request(app)
			.delete("/recipes/77/favorite")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { recipe_id: 77 },
			message: "Recipe removed from favorites",
		});
	});

	it("should reject GET /users/me/favorites without authentication", async () => {
		const response = await request(app).get("/users/me/favorites");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy GET /users/me/favorites to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({ data: [{ id: 77, title: "Fav" }], count: 1 }),
		} as unknown as Response);

		const response = await request(app)
			.get("/users/me/favorites")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [{ id: 77, title: "Fav" }],
			count: 1,
		});
	});
});
