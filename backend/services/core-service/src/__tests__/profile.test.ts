/**
 * Profile Routes Integration Tests
 *
 * Tests GET /profile and PUT /profile with:
 * - Happy path (valid requests)
 * - Authorization (unauthenticated requests → 401)
 * - Business rule errors (not-found, username-taken)
 * - File upload (avatar)
 */

import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { app } from "../app.js";
import { pool } from "../db/database.js";

// ── Shared helpers ────────────────────────────────────────────────────────────

const TEST_USER_BASE_ID = 4000;

const insertUser = (id: number, username: string) =>
	pool.query(
		`INSERT INTO users (id, username, role, status)
     VALUES ($1, $2, 'user', 'offline')
     ON CONFLICT (id) DO NOTHING`,
		[id, username],
	);

const deleteUsers = (...ids: number[]) =>
	pool.query(`DELETE FROM users WHERE id = ANY($1::int[])`, [ids]);

// ── GET /profile ──────────────────────────────────────────────────────────────

describe("GET /profile", () => {
	it("should return 401 when not authenticated", async () => {
		const response = await request(app).get("/profile");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 404 when user does not exist", async () => {
		const response = await request(app)
			.get("/profile")
			.set("X-User-Id", "999999");

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("error");
	});

	it("should return profile for authenticated user", async () => {
		const userId = TEST_USER_BASE_ID + 1;
		await insertUser(userId, "profile_get_user");

		try {
			const response = await request(app)
				.get("/profile")
				.set("X-User-Id", String(userId));

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveProperty("id", userId);
			expect(response.body.data).toHaveProperty("username", "profile_get_user");
			expect(response.body.data).toHaveProperty("avatar", null);
			// Should not expose sensitive fields
			expect(response.body.data).not.toHaveProperty("role");
			expect(response.body.data).not.toHaveProperty("status");
		} finally {
			await deleteUsers(userId);
		}
	});
});

// ── PUT /profile ──────────────────────────────────────────────────────────────

describe("PUT /profile", () => {
	it("should return 401 when not authenticated", async () => {
		const response = await request(app)
			.put("/profile")
			.field("username", "newname");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("error");
	});

	it("should return 400 when no fields are provided", async () => {
		const userId = TEST_USER_BASE_ID + 2;
		await insertUser(userId, "profile_put_empty");

		try {
			const response = await request(app)
				.put("/profile")
				.set("X-User-Id", String(userId))
				.send({});

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		} finally {
			await deleteUsers(userId);
		}
	});

	it("should return 400 for invalid username (too long)", async () => {
		const userId = TEST_USER_BASE_ID + 3;
		await insertUser(userId, "profile_put_toolong");

		try {
			const response = await request(app)
				.put("/profile")
				.set("X-User-Id", String(userId))
				.field("username", "a".repeat(33));

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		} finally {
			await deleteUsers(userId);
		}
	});

	it("should return 400 for invalid username (empty string)", async () => {
		const userId = TEST_USER_BASE_ID + 4;
		await insertUser(userId, "profile_put_emptystr");

		try {
			const response = await request(app)
				.put("/profile")
				.set("X-User-Id", String(userId))
				.field("username", "");

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		} finally {
			await deleteUsers(userId);
		}
	});

	it("should return 404 when user does not exist", async () => {
		const response = await request(app)
			.put("/profile")
			.set("X-User-Id", "999999")
			.field("username", "ghostuser");

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("error");
	});

	it("should update username successfully", async () => {
		const userId = TEST_USER_BASE_ID + 5;
		await insertUser(userId, "profile_put_oldname");

		try {
			const response = await request(app)
				.put("/profile")
				.set("X-User-Id", String(userId))
				.field("username", "profile_put_newname");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Profile updated");
			expect(response.body.data).toHaveProperty("id", userId);
			expect(response.body.data).toHaveProperty("username", "profile_put_newname");

			// Verify DB was actually updated
			const dbResult = await pool.query(
				`SELECT username FROM users WHERE id = $1`,
				[userId],
			);
			expect(dbResult.rows[0].username).toBe("profile_put_newname");
		} finally {
			await deleteUsers(userId);
		}
	});

	it("should return 409 when username is already taken", async () => {
		const userId1 = TEST_USER_BASE_ID + 6;
		const userId2 = TEST_USER_BASE_ID + 7;
		await insertUser(userId1, "profile_taken_name");
		await insertUser(userId2, "profile_other_user");

		try {
			const response = await request(app)
				.put("/profile")
				.set("X-User-Id", String(userId2))
				.field("username", "profile_taken_name");

			expect(response.status).toBe(409);
			expect(response.body).toHaveProperty("error");
		} finally {
			await deleteUsers(userId1, userId2);
		}
	});

	it("should upload avatar and store public URL in DB", async () => {
		const userId = TEST_USER_BASE_ID + 8;
		await insertUser(userId, "profile_avatar_user");

		// Create a minimal valid JPEG buffer (1x1 pixel)
		const minimalJpeg = Buffer.from(
			"/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
			"HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN" +
			"DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy" +
			"MjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAA" +
			"AAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAA" +
			"AAAA/9oADAMBAAIRAxEAPwCwABmX/9k=",
			"base64",
		);

		try {
			const response = await request(app)
				.put("/profile")
				.set("X-User-Id", String(userId))
				.attach("avatar", minimalJpeg, {
					filename: "avatar.jpg",
					contentType: "image/jpeg",
				});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("message", "Profile updated");
			expect(response.body.data.avatar).toMatch(/^\/avatars\//);

			// Verify avatar URL was persisted in DB
			const dbResult = await pool.query(
				`SELECT avatar FROM users WHERE id = $1`,
				[userId],
			);
			expect(dbResult.rows[0].avatar).toMatch(/^\/avatars\//);

			// Cleanup uploaded file
			const uploadedPath = path.resolve(
				"uploads/avatars",
				path.basename(dbResult.rows[0].avatar),
			);
			if (fs.existsSync(uploadedPath)) {
				fs.unlinkSync(uploadedPath);
			}
		} finally {
			await deleteUsers(userId);
		}
	});

	it("should return 400 for unsupported avatar file type", async () => {
		const userId = TEST_USER_BASE_ID + 9;
		await insertUser(userId, "profile_badfile_user");

		try {
			const response = await request(app)
				.put("/profile")
				.set("X-User-Id", String(userId))
				.attach("avatar", Buffer.from("fake gif content"), {
					filename: "avatar.gif",
					contentType: "image/gif",
				});

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		} finally {
			await deleteUsers(userId);
		}
	});

	it("should update both username and avatar in one request", async () => {
		const userId = TEST_USER_BASE_ID + 10;
		await insertUser(userId, "profile_combo_old");

		const minimalJpeg = Buffer.from(
			"/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
			"HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN" +
			"DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy" +
			"MjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAA" +
			"AAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAA" +
			"AAAA/9oADAMBAAIRAxEAPwCwABmX/9k=",
			"base64",
		);

		try {
			const response = await request(app)
				.put("/profile")
				.set("X-User-Id", String(userId))
				.field("username", "profile_combo_new")
				.attach("avatar", minimalJpeg, {
					filename: "avatar.jpg",
					contentType: "image/jpeg",
				});

			expect(response.status).toBe(200);
			expect(response.body.data).toHaveProperty("username", "profile_combo_new");
			expect(response.body.data.avatar).toMatch(/^\/avatars\//);

			// Cleanup uploaded file
			const dbResult = await pool.query(
				`SELECT avatar FROM users WHERE id = $1`,
				[userId],
			);
			if (dbResult.rows[0].avatar) {
				const uploadedPath = path.resolve(
					"uploads/avatars",
					path.basename(dbResult.rows[0].avatar),
				);
				if (fs.existsSync(uploadedPath)) {
					fs.unlinkSync(uploadedPath);
				}
			}
		} finally {
			await deleteUsers(userId);
		}
	});
});