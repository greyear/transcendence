/**
 * API Gateway Users Routes Tests
 *
 * Tests the proxying behavior of user endpoints:
 * - Ensures requests are routed to core-service correctly
 * - Verifies that authentication is enforced at the edge for private routes
 * - Ensures user context details (X-User-Id) are injected into requests
 */

import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";

describe("API Gateway - Users Routes", () => {
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

	describe("GET /users/:id/recipes", () => {
		/**
		 * Test: Proxy GET /users/:id/recipes
		 *
		 * What we're testing:
		 * - Gateway shouldn't block public endpoints
		 * - It correctly appends headers before proxying
		 */
		it("should proxy to core-service and forward the response", async () => {
			fetchSpy.mockResolvedValueOnce({
				status: 200,
				json: async () => ({
					data: [
						{
							id: 1,
							title: "Public Recipe",
							description: null,
							author_id: 1,
							rating_avg: null,
						},
					],
					count: 1,
				}),
			} as unknown as Response);

			const response = await request(app).get("/users/1/recipes");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				data: [
					{
						id: 1,
						title: "Public Recipe",
						description: null,
						author_id: 1,
						rating_avg: null,
					},
				],
				count: 1,
			});
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining("/users/1/recipes"),
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
					signal: expect.any(AbortSignal),
				}),
			);
		});

		it("should forward 400 from core-service for invalid user id", async () => {
			fetchSpy.mockResolvedValueOnce({
				status: 400,
				json: async () => ({
					error: "Must be a positive integer in range 1..2147483647",
				}),
			} as unknown as Response);

			const response = await request(app).get("/users/abc/recipes");

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Must be a positive integer in range 1..2147483647",
			});
		});

		it("should forward 404 from core-service when user does not exist", async () => {
			fetchSpy.mockResolvedValueOnce({
				status: 404,
				json: async () => ({ error: "User not found" }),
			} as unknown as Response);

			const response = await request(app).get("/users/999999/recipes");

			expect(response.status).toBe(404);
			expect(response.body).toEqual({ error: "User not found" });
		});

		it("should return 504 when downstream user recipes request times out", async () => {
			const timeoutError = new Error("Request timed out");
			timeoutError.name = "TimeoutError";
			fetchSpy.mockRejectedValueOnce(timeoutError);

			const response = await request(app).get("/users/1/recipes");

			expect(response.status).toBe(504);
			expect(response.body).toEqual({ error: "Gateway Timeout" });
		});

		it("should return 500 on unexpected proxy error for user recipes", async () => {
			fetchSpy.mockRejectedValueOnce(new Error("boom"));

			const response = await request(app).get("/users/1/recipes");

			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				error: "Failed to fetch user recipes from core-service",
			});
		});
	});

	describe("GET /users", () => {
		it("should proxy to core-service and forward users list", async () => {
			fetchSpy.mockResolvedValueOnce({
				status: 200,
				json: async () => ({
					data: [
						{ id: 1, username: "test_user", avatar: null, recipes_count: 2 },
					],
					count: 1,
				}),
			} as unknown as Response);

			const response = await request(app).get("/users");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				data: [
					{ id: 1, username: "test_user", avatar: null, recipes_count: 2 },
				],
				count: 1,
			});
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining("/users"),
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
					signal: expect.any(AbortSignal),
				}),
			);
		});

		it("should return 504 when downstream users list request times out", async () => {
			const timeoutError = new Error("Request timed out");
			timeoutError.name = "TimeoutError";
			fetchSpy.mockRejectedValueOnce(timeoutError);

			const response = await request(app).get("/users");

			expect(response.status).toBe(504);
			expect(response.body).toEqual({ error: "Gateway Timeout" });
		});

		it("should return 500 on unexpected proxy error for users list", async () => {
			fetchSpy.mockRejectedValueOnce(new Error("boom"));

			const response = await request(app).get("/users");

			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				error: "Failed to fetch users from core-service",
			});
		});
	});

	describe("GET /users/:id", () => {
		it("should proxy to core-service and forward user by id", async () => {
			fetchSpy.mockResolvedValueOnce({
				status: 200,
				json: async () => ({
					data: {
						id: 1,
						username: "test_user",
						avatar: null,
						status: "offline",
						role: "user",
						recipes_count: 2,
					},
				}),
			} as unknown as Response);

			const response = await request(app).get("/users/1");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				data: {
					id: 1,
					username: "test_user",
					avatar: null,
					status: "offline",
					role: "user",
					recipes_count: 2,
				},
			});
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining("/users/1"),
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
					signal: expect.any(AbortSignal),
				}),
			);
		});

		it("should forward 400 from core-service for invalid user id", async () => {
			fetchSpy.mockResolvedValueOnce({
				status: 400,
				json: async () => ({
					error: "Must be a positive integer in range 1..2147483647",
				}),
			} as unknown as Response);

			const response = await request(app).get("/users/abc");

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Must be a positive integer in range 1..2147483647",
			});
		});

		it("should forward 404 from core-service when user does not exist", async () => {
			fetchSpy.mockResolvedValueOnce({
				status: 404,
				json: async () => ({ error: "User not found" }),
			} as unknown as Response);

			const response = await request(app).get("/users/999999");

			expect(response.status).toBe(404);
			expect(response.body).toEqual({ error: "User not found" });
		});

		it("should return 504 when downstream user profile request times out", async () => {
			const timeoutError = new Error("Request timed out");
			timeoutError.name = "TimeoutError";
			fetchSpy.mockRejectedValueOnce(timeoutError);

			const response = await request(app).get("/users/1");

			expect(response.status).toBe(504);
			expect(response.body).toEqual({ error: "Gateway Timeout" });
		});

		it("should return 500 on unexpected proxy error for user profile", async () => {
			fetchSpy.mockRejectedValueOnce(new Error("boom"));

			const response = await request(app).get("/users/1");

			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				error: "Failed to fetch user from core-service",
			});
		});
	});

	describe("GET /users/me/recipes", () => {
		/**
		 * Test: Reject unauthenticated requests early
		 *
		 * Why this matters:
		 * - Gateway handles authentication checks for protected routes
		 * - core-service only accepts forwarded X-User-Id header
		 */
		it("should reject with 401 if no auth token is provided", async () => {
			const response = await request(app).get("/users/me/recipes");

			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: "Authentication required" });
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		/**
		 * Test: Route valid authenticated requests with custom headers
		 *
		 * What we're testing:
		 * - Intercepts user token
		 * - Checks token with auth-service (1st fetch)
		 * - Injects 'X-User-Id' header and calls core-service (2nd fetch)
		 */
		it("should validate token, proxy to core-service, and include X-User-Id header", async () => {
			// Mock 1: First fetch goes to auth-service to validate token
			fetchSpy.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 42 }), // returned by auth-service
			} as unknown as Response);

			// Mock 2: Second fetch goes to core-service for recipes
			fetchSpy.mockResolvedValueOnce({
				status: 200,
				json: async () => ({
					data: [
						{
							id: 2,
							title: "My Private Recipe",
							description: null,
							author_id: 42,
							rating_avg: null,
							status: "draft",
						},
					],
					count: 1,
				}),
			} as unknown as Response);

			const response = await request(app)
				.get("/users/me/recipes")
				.set("Authorization", "Bearer faketoken123");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				data: [
					{
						id: 2,
						title: "My Private Recipe",
						description: null,
						author_id: 42,
						rating_avg: null,
						status: "draft",
					},
				],
				count: 1,
			});

			// Verify auth-service check
			expect(fetchSpy).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining("/validate"),
				expect.objectContaining({
					method: "POST",
					headers: { Authorization: "Bearer faketoken123" },
				}),
			);

			// Verify core-service proxy
			expect(fetchSpy).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining("/users/me/recipes"),
				expect.objectContaining({
					headers: expect.objectContaining({
						"x-user-id": "42",
					}),
					signal: expect.any(AbortSignal),
				}),
			);
		});

		it("should return 504 when downstream my-recipes request times out", async () => {
			fetchSpy.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 42 }),
			} as unknown as Response);

			const timeoutError = new Error("Request timed out");
			timeoutError.name = "TimeoutError";
			fetchSpy.mockRejectedValueOnce(timeoutError);

			const response = await request(app)
				.get("/users/me/recipes")
				.set("Authorization", "Bearer faketoken123");

			expect(response.status).toBe(504);
			expect(response.body).toEqual({ error: "Gateway Timeout" });
		});

		it("should return 500 on unexpected proxy error for my-recipes", async () => {
			fetchSpy.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 42 }),
			} as unknown as Response);

			fetchSpy.mockRejectedValueOnce(new Error("boom"));

			const response = await request(app)
				.get("/users/me/recipes")
				.set("Authorization", "Bearer faketoken123");

			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				error: "Failed to fetch current user recipes from core-service",
			});
		});
	});

	describe("GET /users/:id/followers", () => {
		/**
		 * Test: Proxy GET /users/:id/followers
		 */
		it("should proxy to core-service and forward the response", async () => {
			fetchSpy.mockResolvedValueOnce({
				status: 200,
				json: async () => ({
					data: [
						{
							id: 2,
							username: "follower_user",
							avatar: null,
							recipes_count: 5,
						},
					],
					count: 1,
				}),
			} as unknown as Response);

			const response = await request(app).get("/users/1/followers");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				data: [
					{ id: 2, username: "follower_user", avatar: null, recipes_count: 5 },
				],
				count: 1,
			});
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining("/users/1/followers"),
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
					signal: expect.any(AbortSignal),
				}),
			);
		});

		/**
		 * Test: Forward 404 from core-service when user not found
		 */
		it("should forward 404 from core-service", async () => {
			fetchSpy.mockResolvedValueOnce({
				status: 404,
				json: async () => ({ error: "User not found" }),
			} as unknown as Response);

			const response = await request(app).get("/users/999999/followers");

			expect(response.status).toBe(404);
			expect(response.body).toEqual({ error: "User not found" });
		});
	});

	describe("GET /users/:id/following", () => {
		/**
		 * Test: Proxy GET /users/:id/following
		 */
		it("should proxy to core-service and forward the response", async () => {
			fetchSpy.mockResolvedValueOnce({
				status: 200,
				json: async () => ({
					data: [
						{
							id: 3,
							username: "followed_user",
							avatar: null,
							recipes_count: 10,
						},
					],
					count: 1,
				}),
			} as unknown as Response);

			const response = await request(app).get("/users/1/following");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				data: [
					{ id: 3, username: "followed_user", avatar: null, recipes_count: 10 },
				],
				count: 1,
			});
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining("/users/1/following"),
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
					signal: expect.any(AbortSignal),
				}),
			);
		});

		/**
		 * Test: Forward 404 from core-service when user not found
		 */
		it("should forward 404 from core-service", async () => {
			fetchSpy.mockResolvedValueOnce({
				status: 404,
				json: async () => ({ error: "User not found" }),
			} as unknown as Response);

			const response = await request(app).get("/users/999999/following");

			expect(response.status).toBe(404);
			expect(response.body).toEqual({ error: "User not found" });
		});
	});

	describe("GET /users/:id/favorites", () => {
		/**
		 * Test: GET /users/:id/favorites requires authentication
		 */
		it("should reject without authentication", async () => {
			const response = await request(app).get("/users/1/favorites");

			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: "Authentication required" });
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		/**
		 * Test: Proxy GET /users/:id/favorites to core-service with auth
		 *
		 * What we're testing:
		 * - Gateway validates token before proxying
		 * - Correctly proxies authenticated request
		 * - Response structure is preserved
		 */
		it("should validate token and proxy to core-service", async () => {
			// Mock 1: auth-service token validation
			fetchSpy.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 42 }),
			} as unknown as Response);

			// Mock 2: core-service favorites request
			fetchSpy.mockResolvedValueOnce({
				status: 200,
				json: async () => ({
					data: [
						{
							id: 5,
							title: "Favorite Recipe",
							description: "A delicious recipe",
							avatar: null,
						},
					],
					count: 1,
				}),
			} as unknown as Response);

			const response = await request(app)
				.get("/users/1/favorites")
				.set("Authorization", "Bearer validtoken");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				data: [
					{
						id: 5,
						title: "Favorite Recipe",
						description: "A delicious recipe",
						avatar: null,
					},
				],
				count: 1,
			});
			expect(fetchSpy).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining("/users/1/favorites"),
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/json",
						"x-user-id": "42",
					}),
					signal: expect.any(AbortSignal),
				}),
			);
		});

		/**
		 * Test: GET /users/:id/favorites returns 400 for invalid user ID
		 */
		it("should forward 400 from core-service for invalid user id", async () => {
			fetchSpy.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 42 }),
			} as unknown as Response);

			fetchSpy.mockResolvedValueOnce({
				status: 400,
				json: async () => ({
					error: "Must be a positive integer in range 1..2147483647",
				}),
			} as unknown as Response);

			const response = await request(app)
				.get("/users/abc/favorites")
				.set("Authorization", "Bearer validtoken");

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Must be a positive integer in range 1..2147483647",
			});
		});

		/**
		 * Test: GET /users/:id/favorites returns 403 when not mutual followers
		 */
		it("should forward 403 from core-service when not mutual followers", async () => {
			fetchSpy.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 42 }),
			} as unknown as Response);

			fetchSpy.mockResolvedValueOnce({
				status: 403,
				json: async () => ({ error: "Access denied" }),
			} as unknown as Response);

			const response = await request(app)
				.get("/users/999/favorites")
				.set("Authorization", "Bearer validtoken");

			expect(response.status).toBe(403);
			expect(response.body).toEqual({ error: "Access denied" });
		});

		/**
		 * Test: GET /users/:id/favorites returns 504 on timeout
		 */
		it("should return 504 Gateway Timeout when core-service is slow", async () => {
			fetchSpy.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 42 }),
			} as unknown as Response);

			fetchSpy.mockRejectedValueOnce(
				Object.assign(new Error("Request timed out"), {
					name: "TimeoutError",
				}),
			);

			const response = await request(app)
				.get("/users/1/favorites")
				.set("Authorization", "Bearer validtoken");

			expect(response.status).toBe(504);
			expect(response.body).toEqual({ error: "Gateway Timeout" });
		});
	});

});
