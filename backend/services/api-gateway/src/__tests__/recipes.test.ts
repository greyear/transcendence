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

	afterEach(() => {
		fetchSpy.mockReset();
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

	it("should return 504 when downstream request times out", async () => {
		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValue(timeoutError);

		const response = await request(app).get("/recipes");

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
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
});
