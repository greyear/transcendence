/**
 * Profile Service (Business Logic Layer)
 *
 * Handles authenticated user's own profile:
 * - Get profile (id, username, avatar)
 * - Update username and/or avatar
 */

import { z } from "zod";
import { pool } from "../db/database.js";
import {
	type ProfileData,
	profileDataSchema,
	type UpdateProfileInput,
} from "../validation/schemas.js";

// ── Result types ──────────────────────────────────────────────────────────────

export type UpdateProfileResult =
	| { success: true; profile: ProfileData }
	| { success: false; reason: "not-found" | "username-taken" };

export type RegisterProfileResult = {
	success: true;
	profile: ProfileData;
	created: boolean;
};

// ── Internal helpers ──────────────────────────────────────────────────────────

/** PostgreSQL SQLSTATE for unique_violation (duplicate username). */
const PG_UNIQUE_VIOLATION = "23505";

const isUniqueViolation = (error: unknown): boolean =>
	!!error &&
	typeof error === "object" &&
	"code" in error &&
	error.code === PG_UNIQUE_VIOLATION;

const parseProfileRow = (row: unknown): ProfileData | null => {
	const result = profileDataSchema.safeParse(row);
	if (!result.success) {
		console.error(
			"Invalid profile data from DB:",
			z.prettifyError(result.error),
		);
		return null;
	}
	return result.data;
};

const buildDefaultUsername = (userId: number): string => `username_${userId}`;

// ── Exported service functions ────────────────────────────────────────────────

/**
 * Get the authenticated user's profile.
 *
 * Returns null if the user row doesn't exist (e.g. deleted after token issued).
 */
export const getProfile = async (
	userId: number,
): Promise<ProfileData | null> => {
	try {
		const result = await pool.query(
			`SELECT id, username, avatar FROM users WHERE id = $1 LIMIT 1`,
			[userId],
		);

		if (result.rowCount === 0) {
			return null;
		}

		return parseProfileRow(result.rows[0]);
	} catch (error) {
		console.error("Database error in getProfile:", error);
		throw error;
	}
};

/**
 * Create a new core profile for a freshly registered auth user.
 *
 * This is an internal, idempotent operation:
 * - creates the row if it does not exist
 * - returns the existing profile if the row already exists
 */
export const registerProfile = async (
	userId: number,
): Promise<RegisterProfileResult> => {
	try {
		const resolvedUsername = buildDefaultUsername(userId);
		console.info(
			`[core-service] registerProfile:attempt userId=${userId} username=${resolvedUsername}`,
		);

		const result = await pool.query(
			`
			INSERT INTO users (id, username, role, status)
			VALUES ($1, $2, 'user', 'offline')
			ON CONFLICT (id) DO NOTHING
			RETURNING id, username, avatar
			`,
			[userId, resolvedUsername],
		);

		if (result.rowCount === 0) {
			console.info(
				`[core-service] registerProfile:already-exists userId=${userId}`,
			);
			const profile = await getProfile(userId);
			if (!profile) {
				throw new Error(`User ${userId} could not be loaded after register`);
			}
			console.info(
				`[core-service] registerProfile:existing-profile userId=${userId} username=${profile.username}`,
			);
			return { success: true, profile, created: false };
		}

		const profile = parseProfileRow(result.rows[0]);
		if (!profile) {
			throw new Error(`Created profile for user ${userId} could not be parsed`);
		}

		console.info(`[core-service] registerProfile:created userId=${userId}`);
		return { success: true, profile, created: true };
	} catch (error) {
		console.error("Database error in registerProfile:", error);
		throw error;
	}
};

/**
 * Update the authenticated user's profile.
 *
 * Only fields present in the input are updated (partial update).
 * Returns the updated profile on success.
 *
 * Failures:
 * - not-found      : user row doesn't exist
 * - username-taken : another user already has this username
 */
export const updateProfile = async (
	userId: number,
	input: UpdateProfileInput,
): Promise<UpdateProfileResult> => {
	try {
		// Build SET clause dynamically from provided fields only
		const fields: string[] = [];
		const values: unknown[] = [];
		let paramIndex = 1;

		if (input.username !== undefined) {
			fields.push(`username = $${paramIndex++}`);
			values.push(input.username);
		}

		if (input.avatar !== undefined) {
			fields.push(`avatar = $${paramIndex++}`);
			values.push(input.avatar);
		}

		// Nothing to update - just return current profile
		if (fields.length === 0) {
			const profile = await getProfile(userId);
			if (!profile) {
				return { success: false, reason: "not-found" };
			}
			return { success: true, profile };
		}

		fields.push(`updated_at = now()`);
		values.push(userId); // last param for WHERE id = $n

		const result = await pool.query(
			`
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, username, avatar
      `,
			values,
		);

		if (result.rowCount === 0) {
			return { success: false, reason: "not-found" };
		}

		const profile = parseProfileRow(result.rows[0]);
		if (!profile) {
			throw new Error(`Updated profile for user ${userId} could not be parsed`);
		}

		return { success: true, profile };
	} catch (error) {
		if (isUniqueViolation(error)) {
			return { success: false, reason: "username-taken" };
		}

		console.error("Database error in updateProfile:", error);
		throw error;
	}
};
