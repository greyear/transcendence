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

	it("should forward recipe search query parameters to core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 200,
			json: async () => ({
				data: [{ id: 1, title: "Beef Tacos" }],
				total_count: 1,
				total_pages: 1,
				page: 2,
				per_page: 12,
			}),
		} as unknown as Response);

		const response = await request(app).get("/recipes?q=beef&page=2&limit=12");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [{ id: 1, title: "Beef Tacos" }],
			total_count: 1,
			total_pages: 1,
			page: 2,
			per_page: 12,
		});
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/recipes?q=beef&page=2&limit=12"),
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
			expect.stringContaining("/validate"),
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
				data: { id: 77, status: "published" },
				message: "Recipe published",
			}),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/77/publish")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { id: 77, status: "published" },
			message: "Recipe published",
		});

		expect(fetchSpy).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("/validate"),
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
				error: "Recipe cannot be published from status published",
			}),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/77/publish")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(409);
		expect(response.body).toEqual({
			error: "Recipe cannot be published from status published",
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

	it("should reject PUT /recipes/:id without authentication", async () => {
		const response = await request(app)
			.put("/recipes/77")
			.send({
				title: "Updated",
				description: "Updated",
				instructions: ["step"],
				servings: 2,
				spiciness: 1,
				ingredients: [{ ingredient_id: 1, amount: 100, unit: "g" }],
				category_ids: [],
			});

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy PUT /recipes/:id to core-service", async () => {
		const payload = {
			title: "Updated via gateway",
			description: "Updated description",
			instructions: ["step 1", "step 2"],
			servings: 4,
			spiciness: 2,
			ingredients: [{ ingredient_id: 1, amount: 200, unit: "g" }],
			category_ids: [],
		};

		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				data: { id: 77, status: "draft", title: "Updated via gateway" },
				message: "Recipe updated",
			}),
		} as unknown as Response);

		const response = await request(app)
			.put("/recipes/77")
			.set("Authorization", "Bearer validtoken")
			.send(payload);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { id: 77, status: "draft", title: "Updated via gateway" },
			message: "Recipe updated",
		});

		expect(fetchSpy).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("/validate"),
			expect.objectContaining({
				method: "POST",
				headers: { Authorization: "Bearer validtoken" },
			}),
		);

		expect(fetchSpy).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("/recipes/77"),
			expect.objectContaining({
				method: "PUT",
				body: JSON.stringify(payload),
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					"x-user-id": "42",
				}),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should forward 403 from core-service for forbidden update", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 403,
			json: async () => ({ error: "No permission to update this recipe" }),
		} as unknown as Response);

		const response = await request(app)
			.put("/recipes/77")
			.set("Authorization", "Bearer validtoken")
			.send({
				title: "Updated",
				description: "Updated",
				instructions: ["step"],
				servings: 2,
				spiciness: 1,
				ingredients: [{ ingredient_id: 1, amount: 100, unit: "g" }],
				category_ids: [],
			});

		expect(response.status).toBe(403);
		expect(response.body).toEqual({
			error: "No permission to update this recipe",
		});
	});

	it("should return 504 when downstream update request times out", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValueOnce(timeoutError);

		const response = await request(app)
			.put("/recipes/77")
			.set("Authorization", "Bearer validtoken")
			.send({
				title: "Updated",
				description: "Updated",
				instructions: ["step"],
				servings: 2,
				spiciness: 1,
				ingredients: [{ ingredient_id: 1, amount: 100, unit: "g" }],
				category_ids: [],
			});

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should reject DELETE /recipes/:id without authentication", async () => {
		const response = await request(app).delete("/recipes/77");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy DELETE /recipes/:id to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				data: { id: 77, status: "archived" },
				message: "Recipe archived",
			}),
		} as unknown as Response);

		const response = await request(app)
			.delete("/recipes/77")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { id: 77, status: "archived" },
			message: "Recipe archived",
		});

		expect(fetchSpy).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("/validate"),
			expect.objectContaining({
				method: "POST",
				headers: { Authorization: "Bearer validtoken" },
			}),
		);

		expect(fetchSpy).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("/recipes/77"),
			expect.objectContaining({
				method: "DELETE",
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					"x-user-id": "42",
				}),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should forward 409 from core-service for invalid archive status", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 409,
			json: async () => ({
				error: "Recipe cannot be archived from status archived",
			}),
		} as unknown as Response);

		const response = await request(app)
			.delete("/recipes/77")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(409);
		expect(response.body).toEqual({
			error: "Recipe cannot be archived from status archived",
		});
	});

	it("should return 500 on unexpected proxy error for DELETE /recipes/:id", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockRejectedValueOnce(new Error("boom"));

		const response = await request(app)
			.delete("/recipes/77")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to archive recipe" });
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

	it("should reject PUT /recipes/:id/picture without authentication", async () => {
		const response = await request(app)
			.put("/recipes/1/picture")
			.attach("picture", Buffer.from("fake image"), {
				filename: "pic.jpg",
				contentType: "image/jpeg",
			});

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy PUT /recipes/:id/picture to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				data: { picture_url: "/recipe-pictures/1.jpg" },
				message: "Recipe picture updated",
			}),
		} as unknown as Response);

		const response = await request(app)
			.put("/recipes/1/picture")
			.set("Authorization", "Bearer validtoken")
			.attach("picture", Buffer.from("fake image"), {
				filename: "pic.jpg",
				contentType: "image/jpeg",
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { picture_url: "/recipe-pictures/1.jpg" },
			message: "Recipe picture updated",
		});

		expect(fetchSpy).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("/validate"),
			expect.objectContaining({
				method: "POST",
				headers: { Authorization: "Bearer validtoken" },
			}),
		);

		expect(fetchSpy).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("/recipes/1/picture"),
			expect.objectContaining({
				method: "PUT",
				headers: expect.objectContaining({
					"x-user-id": "42",
				}),
				duplex: "half",
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should forward 400 from core-service for invalid file type", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 400,
			json: async () => ({
				error: "Only JPEG, PNG and WebP images are allowed",
			}),
		} as unknown as Response);

		const response = await request(app)
			.put("/recipes/1/picture")
			.set("Authorization", "Bearer validtoken")
			.attach("picture", Buffer.from("fake gif"), {
				filename: "pic.gif",
				contentType: "image/gif",
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Only JPEG, PNG and WebP images are allowed",
		});
	});

	it("should forward 403 from core-service when user is not the author", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 403,
			json: async () => ({ error: "No permission to update this recipe" }),
		} as unknown as Response);

		const response = await request(app)
			.put("/recipes/1/picture")
			.set("Authorization", "Bearer validtoken")
			.attach("picture", Buffer.from("fake image"), {
				filename: "pic.jpg",
				contentType: "image/jpeg",
			});

		expect(response.status).toBe(403);
		expect(response.body).toEqual({
			error: "No permission to update this recipe",
		});
	});

	it("should forward 404 from core-service when recipe not found", async () => {
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
			.put("/recipes/999999/picture")
			.set("Authorization", "Bearer validtoken")
			.attach("picture", Buffer.from("fake image"), {
				filename: "pic.jpg",
				contentType: "image/jpeg",
			});

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Recipe not found" });
	});

	it("should forward 409 from core-service for invalid recipe status", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 409,
			json: async () => ({
				error: "Recipe picture cannot be updated from status moderation",
			}),
		} as unknown as Response);

		const response = await request(app)
			.put("/recipes/1/picture")
			.set("Authorization", "Bearer validtoken")
			.attach("picture", Buffer.from("fake image"), {
				filename: "pic.jpg",
				contentType: "image/jpeg",
			});

		expect(response.status).toBe(409);
		expect(response.body).toEqual({
			error: "Recipe picture cannot be updated from status moderation",
		});
	});

	it("should return 504 when picture request times out", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValueOnce(timeoutError);

		const response = await request(app)
			.put("/recipes/1/picture")
			.set("Authorization", "Bearer validtoken")
			.attach("picture", Buffer.from("fake image"), {
				filename: "pic.jpg",
				contentType: "image/jpeg",
			});

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected proxy error for PUT picture", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockRejectedValueOnce(new Error("boom"));

		const response = await request(app)
			.put("/recipes/1/picture")
			.set("Authorization", "Bearer validtoken")
			.attach("picture", Buffer.from("fake image"), {
				filename: "pic.jpg",
				contentType: "image/jpeg",
			});

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to update recipe picture" });
	});

	it("should reject POST /recipes/:id/reviews without authentication", async () => {
		const response = await request(app)
			.post("/recipes/77/reviews")
			.send({ body: "Great" });

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy POST /recipes/:id/reviews to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 201,
			json: async () => ({
				data: { recipe_id: 77, review_id: 501 },
				message: "Review published",
			}),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/77/reviews")
			.set("Authorization", "Bearer validtoken")
			.send({ body: "Great" });

		expect(response.status).toBe(201);
		expect(response.body).toEqual({
			data: { recipe_id: 77, review_id: 501 },
			message: "Review published",
		});

		expect(fetchSpy).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("/recipes/77/reviews"),
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					"x-user-id": "42",
				}),
				body: JSON.stringify({ body: "Great" }),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should forward 400 from core-service for invalid review payload", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 400,
			json: async () => ({ error: "Invalid review body" }),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/77/reviews")
			.set("Authorization", "Bearer validtoken")
			.send({ body: "x".repeat(1001) });

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Invalid review body" });
	});

	it("should proxy GET /recipes/:id/reviews to core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 200,
			json: async () => ({
				data: [{ id: 501, body: "Great" }],
				count: 1,
			}),
		} as unknown as Response);

		const response = await request(app).get("/recipes/77/reviews");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [{ id: 501, body: "Great" }],
			count: 1,
		});
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/recipes/77/reviews"),
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	it("should forward 404 from core-service for GET /recipes/:id/reviews", async () => {
		fetchSpy.mockResolvedValue({
			status: 404,
			json: async () => ({ error: "Recipe not found" }),
		} as unknown as Response);

		const response = await request(app).get("/recipes/999999/reviews");

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Recipe not found" });
	});

	it("should reject PUT /recipes/:id/reviews/:reviewId without authentication", async () => {
		const response = await request(app)
			.put("/recipes/77/reviews/501")
			.send({ body: "Updated review" });

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy PUT /recipes/:id/reviews/:reviewId to core-service", async () => {
		const payload = { body: "Updated review text" };

		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				data: { id: 501, recipe_id: 77, body: "Updated review text" },
				message: "Review updated",
			}),
		} as unknown as Response);

		const response = await request(app)
			.put("/recipes/77/reviews/501")
			.set("Authorization", "Bearer validtoken")
			.send(payload);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { id: 501, recipe_id: 77, body: "Updated review text" },
			message: "Review updated",
		});

		expect(fetchSpy).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("/validate"),
			expect.objectContaining({
				method: "POST",
				headers: { Authorization: "Bearer validtoken" },
			}),
		);

		expect(fetchSpy).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("/recipes/77/reviews/501"),
			expect.objectContaining({
				method: "PUT",
				body: JSON.stringify(payload),
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					"x-user-id": "42",
				}),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should forward 403 from core-service for forbidden review update", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 403,
			json: async () => ({ error: "No permission to update this review" }),
		} as unknown as Response);

		const response = await request(app)
			.put("/recipes/77/reviews/501")
			.set("Authorization", "Bearer validtoken")
			.send({ body: "Updated" });

		expect(response.status).toBe(403);
		expect(response.body).toEqual({
			error: "No permission to update this review",
		});
	});

	it("should forward 404 from core-service for missing review on update", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 404,
			json: async () => ({ error: "Review not found" }),
		} as unknown as Response);

		const response = await request(app)
			.put("/recipes/77/reviews/999999")
			.set("Authorization", "Bearer validtoken")
			.send({ body: "Updated" });

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Review not found" });
	});

	it("should return 504 when downstream update review request times out", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValueOnce(timeoutError);

		const response = await request(app)
			.put("/recipes/77/reviews/501")
			.set("Authorization", "Bearer validtoken")
			.send({ body: "Updated" });

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected proxy error for PUT /recipes/:id/reviews/:reviewId", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockRejectedValueOnce(new Error("boom"));

		const response = await request(app)
			.put("/recipes/77/reviews/501")
			.set("Authorization", "Bearer validtoken")
			.send({ body: "Updated" });

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to update review" });
	});

	it("should reject DELETE /recipes/:id/reviews/:reviewId without authentication", async () => {
		const response = await request(app).delete("/recipes/77/reviews/501");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy DELETE /recipes/:id/reviews/:reviewId to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				data: {
					id: 501,
					recipe_id: 77,
					updated_at: "2026-04-13T12:00:00.000Z",
				},
				message: "Review deleted",
			}),
		} as unknown as Response);

		const response = await request(app)
			.delete("/recipes/77/reviews/501")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { id: 501, recipe_id: 77, updated_at: "2026-04-13T12:00:00.000Z" },
			message: "Review deleted",
		});

		expect(fetchSpy).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("/validate"),
			expect.objectContaining({
				method: "POST",
				headers: { Authorization: "Bearer validtoken" },
			}),
		);

		expect(fetchSpy).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("/recipes/77/reviews/501"),
			expect.objectContaining({
				method: "DELETE",
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					"x-user-id": "42",
				}),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should forward 403 from core-service for forbidden review delete", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 403,
			json: async () => ({ error: "No permission to delete this review" }),
		} as unknown as Response);

		const response = await request(app)
			.delete("/recipes/77/reviews/501")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(403);
		expect(response.body).toEqual({
			error: "No permission to delete this review",
		});
	});

	it("should forward 404 from core-service for missing review on delete", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 404,
			json: async () => ({ error: "Review not found" }),
		} as unknown as Response);

		const response = await request(app)
			.delete("/recipes/77/reviews/999999")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Review not found" });
	});

	it("should return 504 when downstream delete review request times out", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValueOnce(timeoutError);

		const response = await request(app)
			.delete("/recipes/77/reviews/501")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected proxy error for DELETE /recipes/:id/reviews/:reviewId", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockRejectedValueOnce(new Error("boom"));

		const response = await request(app)
			.delete("/recipes/77/reviews/501")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to delete review" });
	});

	it("should proxy GET /recipes/meal_time to core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 200,
			json: async () => ({
				meal_time: ["breakfast", "dinner", "lunch", "snack"],
			}),
		} as unknown as Response);

		const response = await request(app).get("/recipes/meal_time");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			meal_time: ["breakfast", "dinner", "lunch", "snack"],
		});
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/recipes/meal_time"),
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	it("should proxy GET /recipes/dish_type to core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 200,
			json: async () => ({
				dish_type: [
					"appetizer",
					"beverage",
					"dessert",
					"main_course",
					"salad",
					"soup",
				],
			}),
		} as unknown as Response);

		const response = await request(app).get("/recipes/dish_type");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("dish_type");
		expect(Array.isArray(response.body.dish_type)).toBe(true);
	});

	it("should proxy GET /recipes/main_ingredient to core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 200,
			json: async () => ({
				main_ingredient: [
					"beef",
					"fish",
					"poultry",
					"pork",
					"seafood",
					"vegetables",
				],
			}),
		} as unknown as Response);

		const response = await request(app).get("/recipes/main_ingredient");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("main_ingredient");
		expect(Array.isArray(response.body.main_ingredient)).toBe(true);
	});

	it("should proxy GET /recipes/cuisine to core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 200,
			json: async () => ({
				cuisine: [
					"american",
					"asian",
					"finnish",
					"french",
					"german",
					"italian",
					"mediterranean",
					"mexican",
					"russian",
					"ukrainian",
				],
			}),
		} as unknown as Response);

		const response = await request(app).get("/recipes/cuisine");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("cuisine");
		expect(Array.isArray(response.body.cuisine)).toBe(true);
	});

	it("should proxy GET /recipes/ingredients to core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 200,
			json: async () => ({
				ingredients: [
					{ id: 1, name: "Almonds" },
					{ id: 2, name: "Avocado" },
				],
			}),
		} as unknown as Response);

		const response = await request(app).get("/recipes/ingredients");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("ingredients");
		expect(Array.isArray(response.body.ingredients)).toBe(true);
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/recipes/ingredients"),
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	it("should return 504 when GET /recipes/meal_time times out", async () => {
		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValue(timeoutError);

		const response = await request(app).get("/recipes/meal_time");

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected error for GET /recipes/ingredients", async () => {
		fetchSpy.mockRejectedValue(new Error("boom"));

		const response = await request(app).get("/recipes/ingredients");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to fetch ingredients" });
	});
});
