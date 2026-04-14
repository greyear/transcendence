import { z } from "zod";
import { pool } from "../db/database.js";
import {
	type UserListItem,
	type UserProfile,
	userListItemSchema,
	userProfileSchema,
} from "../validation/schemas.js";

export type FollowOperationResult =
	| { success: true }
	| {
			success: false;
			reason:
				| "self-follow"
				| "user-not-found"
				| "already-followed"
				| "not-followed";
	  };

// ── Online status ─────────────────────────────────────────────────────────────

/**
 * A user is considered online if their last activity was within 60 seconds.
 * Embedded directly in queries — no separate column read needed.
 */
const IS_ONLINE_SQL = `(u.last_seen_at > now() - interval '60 seconds')`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const doesUserExist = async (userId: number): Promise<boolean> => {
	const result = await pool.query("SELECT id FROM users WHERE id = $1", [
		userId,
	]);
	return (result.rowCount ?? 0) > 0;
};

const rowIdSchema = z
	.object({ id: z.union([z.number(), z.string()]) })
	.transform((row) => row.id)
	.catch("unknown");

const parseUserRows = <T>(
	rows: unknown[],
	schema: z.ZodType<T>,
	rowLabel: string,
): T[] => {
	return rows.reduce<T[]>((acc, row) => {
		const validation = schema.safeParse(row);
		if (validation.success) {
			acc.push(validation.data);
		} else {
			const rowId = rowIdSchema.parse(row);
			console.error(
				`Skipping invalid ${rowLabel} ID ${rowId}:`,
				z.prettifyError(validation.error),
			);
		}
		return acc;
	}, []);
};

// ── User queries ──────────────────────────────────────────────────────────────

export const getAllUsers = async (): Promise<UserListItem[]> => {
	try {
		const result = await pool.query(`
			SELECT
				u.id,
				u.username,
				u.avatar,
				COUNT(r.id)::int AS recipes_count
			FROM users u
			LEFT JOIN recipes r ON r.author_id = u.id
			GROUP BY u.id, u.username, u.avatar
			ORDER BY u.id ASC
		`);

		return parseUserRows(result.rows, userListItemSchema, "user");
	} catch (error) {
		console.error("Database error in getAllUsers:", error);
		throw error;
	}
};

export const getUserById = async (
	userId: number,
	requesterId?: number,
): Promise<UserProfile | null> => {
	try {
		const result = await pool.query(
			`
			SELECT
				u.id,
				u.username,
				u.avatar,
				CASE
					WHEN $2::int IS NOT NULL
						AND EXISTS (
							SELECT 1 FROM followers f1
							WHERE f1.user_id = $2 AND f1.followed_id = u.id
						)
						AND EXISTS (
							SELECT 1 FROM followers f2
							WHERE f2.user_id = u.id AND f2.followed_id = $2
						)
					THEN CASE
						WHEN ${IS_ONLINE_SQL} THEN 'online'
						ELSE 'offline'
					END
					ELSE NULL
				END AS status,
				(
					SELECT COUNT(*)::int
					FROM recipes r2
					WHERE r2.author_id = u.id
				) AS recipes_count
			FROM users u
			WHERE u.id = $1
			LIMIT 1
			`,
			[userId, requesterId ?? null],
		);

		if (result.rowCount === 0) {
			return null;
		}

		const parsed = userProfileSchema.safeParse(result.rows[0]);
		if (!parsed.success) {
			throw new Error(z.prettifyError(parsed.error));
		}

		return parsed.data;
	} catch (error) {
		console.error("Database error in getUserById:", error);
		throw error;
	}
};

export const getFollowers = async (userId: number) => {
	const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [
		userId,
	]);

	if (userExists.rows.length === 0) {
		throw new Error("User not found");
	}

	const result = await pool.query(
		`SELECT
			u.id,
			u.username,
			u.avatar,
			(SELECT COUNT(*) FROM recipes r WHERE r.author_id = u.id AND r.status = 'published') AS recipes_count
		FROM users u
		JOIN followers f ON u.id = f.user_id
		WHERE f.followed_id = $1
		ORDER BY u.username ASC`,
		[userId],
	);

	return userListItemSchema.array().parse(result.rows);
};

export const getFollowing = async (userId: number) => {
	const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [
		userId,
	]);

	if (userExists.rows.length === 0) {
		throw new Error("User not found");
	}

	const result = await pool.query(
		`SELECT
			u.id,
			u.username,
			u.avatar,
			(SELECT COUNT(*) FROM recipes r WHERE r.author_id = u.id AND r.status = 'published') AS recipes_count
		FROM users u
		JOIN followers f ON u.id = f.followed_id
		WHERE f.user_id = $1
		ORDER BY u.username ASC`,
		[userId],
	);

	return userListItemSchema.array().parse(result.rows);
};

// ── Follow / Unfollow ─────────────────────────────────────────────────────────

export const followUser = async (
	followerId: number,
	followedId: number,
): Promise<FollowOperationResult> => {
	if (followerId === followedId) {
		return { success: false, reason: "self-follow" };
	}

	const [followerExists, followedExists] = await Promise.all([
		doesUserExist(followerId),
		doesUserExist(followedId),
	]);

	if (!followerExists || !followedExists) {
		return { success: false, reason: "user-not-found" };
	}

	const result = await pool.query(
		"INSERT INTO followers (user_id, followed_id) VALUES ($1, $2) ON CONFLICT (user_id, followed_id) DO NOTHING",
		[followerId, followedId],
	);

	if ((result.rowCount ?? 0) === 0) {
		return { success: false, reason: "already-followed" };
	}

	return { success: true };
};

export const unfollowUser = async (
	followerId: number,
	followedId: number,
): Promise<FollowOperationResult> => {
	if (followerId === followedId) {
		return { success: false, reason: "self-follow" };
	}

	const [followerExists, followedExists] = await Promise.all([
		doesUserExist(followerId),
		doesUserExist(followedId),
	]);

	if (!followerExists || !followedExists) {
		return { success: false, reason: "user-not-found" };
	}

	const result = await pool.query(
		"DELETE FROM followers WHERE user_id = $1 AND followed_id = $2",
		[followerId, followedId],
	);

	if ((result.rowCount ?? 0) === 0) {
		return { success: false, reason: "not-followed" };
	}

	return { success: true };
};