/**
 * API Gateway health route tests.
 *
 * These tests mock downstream fetch calls so they are deterministic
 * and do not require running core-service.
 */

import request from "supertest";
import { jest } from "@jest/globals";
import { app } from "../app.js";

describe("API Gateway - Health Routes", () => {
	const fetchSpy = jest.spyOn(global, "fetch");

	afterEach(() => {
		fetchSpy.mockReset();
	});

	afterAll(() => {
		fetchSpy.mockRestore();
	});

	it("should proxy GET /health to core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 200,
			json: async () => ({ status: "ok", service: "core-service" }),
		} as unknown as Response);

		const response = await request(app).get("/health");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: "ok", service: "core-service" });
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/health"),
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	it("should proxy GET /health/db to core-service", async () => {
		fetchSpy.mockResolvedValue({
			status: 200,
			json: async () => ({ status: "ok", db: "connected" }),
		} as unknown as Response);

		const response = await request(app).get("/health/db");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: "ok", db: "connected" });
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/health/db"),
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	it("should return 504 when downstream request times out", async () => {
		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValue(timeoutError);

		const response = await request(app).get("/health");

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});
});
