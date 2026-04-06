/**
 * API Gateway recipe ratings route tests.
 *
 * These tests mock downstream fetch calls so they do not depend on network
 * or running core-service containers.
 */

import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";

describe("API Gateway - Recipe Ratings Routes", () => {
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

	// ── POST /recipes/:id/rating ────────────────────────────────────────────────

	it("should reject POST /recipes/:id/rating without authentication", async () => {
		const response = await request(app)
			.post("/recipes/1/rating")
			.send({ rating: 4 });

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy POST /recipes/:id/rating to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 201,
			json: async () => ({ message: "Rating created" }),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken")
			.send({ rating: 4 });

		expect(response.status).toBe(201);
		expect(response.body).toEqual({ message: "Rating created" });

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
			expect.stringContaining("/recipes/77/rating"),
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ rating: 4 }),
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					"x-user-id": "42",
				}),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should forward 404 from core-service when recipe not found on POST rating", async () => {
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
			.post("/recipes/999999/rating")
			.set("Authorization", "Bearer validtoken")
			.send({ rating: 3 });

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Recipe not found" });
	});

	it("should forward 409 from core-service when user already rated on POST rating", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 409,
			json: async () => ({ error: "You have already rated this recipe" }),
		} as unknown as Response);

		const response = await request(app)
			.post("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken")
			.send({ rating: 5 });

		expect(response.status).toBe(409);
		expect(response.body).toEqual({ error: "You have already rated this recipe" });
	});

	it("should return 504 when downstream POST rating request times out", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValueOnce(timeoutError);

		const response = await request(app)
			.post("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken")
			.send({ rating: 4 });

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected proxy error for POST rating", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockRejectedValueOnce(new Error("boom"));

		const response = await request(app)
			.post("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken")
			.send({ rating: 4 });

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to create rating" });
	});

	// ── PUT /recipes/:id/rating ─────────────────────────────────────────────────

	it("should reject PUT /recipes/:id/rating without authentication", async () => {
		const response = await request(app)
			.put("/recipes/1/rating")
			.send({ rating: 3 });

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy PUT /recipes/:id/rating to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({ message: "Rating updated" }),
		} as unknown as Response);

		const response = await request(app)
			.put("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken")
			.send({ rating: 5 });

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ message: "Rating updated" });

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
			expect.stringContaining("/recipes/77/rating"),
			expect.objectContaining({
				method: "PUT",
				body: JSON.stringify({ rating: 5 }),
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					"x-user-id": "42",
				}),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should forward 404 from core-service when recipe not found on PUT rating", async () => {
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
			.put("/recipes/999999/rating")
			.set("Authorization", "Bearer validtoken")
			.send({ rating: 2 });

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Recipe not found" });
	});

	it("should forward 404 from core-service when user has not rated on PUT rating", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 404,
			json: async () => ({ error: "You have not rated this recipe" }),
		} as unknown as Response);

		const response = await request(app)
			.put("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken")
			.send({ rating: 2 });

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "You have not rated this recipe" });
	});

	it("should return 504 when downstream PUT rating request times out", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValueOnce(timeoutError);

		const response = await request(app)
			.put("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken")
			.send({ rating: 3 });

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected proxy error for PUT rating", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockRejectedValueOnce(new Error("boom"));

		const response = await request(app)
			.put("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken")
			.send({ rating: 3 });

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to update rating" });
	});

	// ── DELETE /recipes/:id/rating ──────────────────────────────────────────────

	it("should reject DELETE /recipes/:id/rating without authentication", async () => {
		const response = await request(app).delete("/recipes/1/rating");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy DELETE /recipes/:id/rating to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({ message: "Rating deleted" }),
		} as unknown as Response);

		const response = await request(app)
			.delete("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ message: "Rating deleted" });

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
			expect.stringContaining("/recipes/77/rating"),
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

	it("should forward 404 from core-service when recipe not found on DELETE rating", async () => {
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
			.delete("/recipes/999999/rating")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Recipe not found" });
	});

	it("should forward 404 from core-service when user has not rated on DELETE rating", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 404,
			json: async () => ({ error: "You have not rated this recipe" }),
		} as unknown as Response);

		const response = await request(app)
			.delete("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "You have not rated this recipe" });
	});

	it("should return 504 when downstream DELETE rating request times out", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValueOnce(timeoutError);

		const response = await request(app)
			.delete("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected proxy error for DELETE rating", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockRejectedValueOnce(new Error("boom"));

		const response = await request(app)
			.delete("/recipes/77/rating")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to delete rating" });
	});
});