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
	type UpdateProfileInput,
	profileDataSchema,
} from "../validation/schemas.js";

// ── Result types ──────────────────────────────────────────────────────────────

export type UpdateProfileResult =
	| { success: true; profile: ProfileData }
	| { success: false; reason: "not-found" | "username-taken" };

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