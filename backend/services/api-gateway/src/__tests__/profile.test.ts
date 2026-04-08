/**
 * API Gateway Profile Routes Tests
 *
 * These tests mock downstream fetch calls so they do not depend on network
 * or running core-service containers.
 */

import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";

describe("API Gateway - Profile Routes", () => {
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

	// ── GET /my/profile ─────────────────────────────────────────────────────────

	it("should reject GET /profile without authentication", async () => {
		const response = await request(app).get("/profile");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy GET /profile to core-service", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				data: { id: 42, username: "john", avatar: null },
			}),
		} as unknown as Response);

		const response = await request(app)
			.get("/profile")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { id: 42, username: "john", avatar: null },
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
			expect.stringContaining("/profile"),
			expect.objectContaining({
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					"x-user-id": "42",
				}),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("should forward 404 from core-service when user not found on GET profile", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 404,
			json: async () => ({ error: "User not found" }),
		} as unknown as Response);

		const response = await request(app)
			.get("/profile")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "User not found" });
	});

	it("should return 504 when downstream GET profile request times out", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValueOnce(timeoutError);

		const response = await request(app)
			.get("/profile")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected proxy error for GET profile", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockRejectedValueOnce(new Error("boom"));

		const response = await request(app)
			.get("/profile")
			.set("Authorization", "Bearer validtoken");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to fetch profile" });
	});

	// ── PUT /profile ─────────────────────────────────────────────────────────

	it("should reject PUT /profile without authentication", async () => {
		const response = await request(app)
			.put("/profile")
			.send({ username: "newname" });

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Authentication required" });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should validate token and proxy PUT /profile to core-service", async () => {
		const payload = { username: "newname" };

		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				data: { id: 42, username: "newname", avatar: null },
				message: "Profile updated",
			}),
		} as unknown as Response);

		const response = await request(app)
			.put("/profile")
			.set("Authorization", "Bearer validtoken")
			.send(payload);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { id: 42, username: "newname", avatar: null },
			message: "Profile updated",
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
			expect.stringContaining("/profile"),
			expect.objectContaining({
				method: "PUT",
				// body is the raw req stream, not asserting its content
				headers: expect.objectContaining({
					"x-user-id": "42",
				}),
				duplex: "half",
			}),
		);
	});

	it("should forward 400 from core-service for invalid update payload", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 400,
			json: async () => ({
				error: "Username must be between 1 and 32 characters",
			}),
		} as unknown as Response);

		const response = await request(app)
			.put("/profile")
			.set("Authorization", "Bearer validtoken")
			.send({ username: "" });

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Username must be between 1 and 32 characters",
		});
	});

	it("should forward 409 from core-service when username is already taken", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockResolvedValueOnce({
			status: 409,
			json: async () => ({ error: "Username is already taken" }),
		} as unknown as Response);

		const response = await request(app)
			.put("/profile")
			.set("Authorization", "Bearer validtoken")
			.send({ username: "takenname" });

		expect(response.status).toBe(409);
		expect(response.body).toEqual({ error: "Username is already taken" });
	});

	it("should return 504 when downstream PUT profile request times out", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		const timeoutError = new Error("Request timed out");
		timeoutError.name = "TimeoutError";
		fetchSpy.mockRejectedValueOnce(timeoutError);

		const response = await request(app)
			.put("/profile")
			.set("Authorization", "Bearer validtoken")
			.send({ username: "newname" });

		expect(response.status).toBe(504);
		expect(response.body).toEqual({ error: "Gateway Timeout" });
	});

	it("should return 500 on unexpected proxy error for PUT profile", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ id: 42 }),
		} as unknown as Response);

		fetchSpy.mockRejectedValueOnce(new Error("boom"));

		const response = await request(app)
			.put("/profile")
			.set("Authorization", "Bearer validtoken")
			.send({ username: "newname" });

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Failed to update profile" });
	});
});
