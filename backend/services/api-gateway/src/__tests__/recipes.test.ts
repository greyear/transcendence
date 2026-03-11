/**
 * API Gateway recipe route tests.
 *
 * These tests mock downstream fetch calls so they do not depend on network
 * or running core-service containers.
 */

import request from "supertest";
import { jest } from "@jest/globals";
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
		expect(response.body).toEqual({ data: [{ id: 1, title: "Test" }], count: 1 });
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/recipes"),
			expect.objectContaining({
				headers: expect.objectContaining({ "Content-Type": "application/json" }),
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
});
