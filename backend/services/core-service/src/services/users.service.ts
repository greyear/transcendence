import { pool } from "../db/database.js";
import { z } from "zod";
import {
	type UserListItem,
	type UserProfile,
	userListItemSchema,
	userProfileSchema,
} from "../validation/schemas.js";

/**
 * Retrieves a list of users who are followers of a specific user.
 * @param userId - The ID of the user whose followers are to be retrieved.
 * @returns A promise that resolves to an array of user list items.
 */
export const getFollowers = async (userId: number) => {
	// First, verify that the user exists
	const userExists = await pool.query(
		"SELECT id FROM users WHERE id = $1",
		[userId],
	);

	if (userExists.rows.length === 0) {
		throw new Error("User not found");
	}

	// Get all followers of this user
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

	// Validate each user object against the schema
	return userListItemSchema.array().parse(result.rows);
};

/**
 * Retrieves a list of users that a specific user is following.
 * @param userId - The ID of the user whose followed users are to be retrieved.
 * @returns A promise that resolves to an array of user list items.
 */
export const getFollowing = async (userId: number) => {
	// First, verify that the user exists
	const userExists = await pool.query(
		"SELECT id FROM users WHERE id = $1",
		[userId],
	);

	if (userExists.rows.length === 0) {
		throw new Error("User not found");
	}

	// Get all users that this user is following
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

	// Validate each user object against the schema
	return userListItemSchema.array().parse(result.rows);
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
		// requesterId is optional: guests call this endpoint without X-User-Id,
		// so we pass null to the SQL check and keep status hidden for them.
		const result = await pool.query(
			`
			SELECT
				u.id,
				u.username,
				u.avatar,
				CASE
					WHEN $2::int IS NOT NULL
						AND EXISTS (
							SELECT 1
							FROM followers f1
							WHERE f1.user_id = $2
								AND f1.followed_id = u.id
						)
						AND EXISTS (
							SELECT 1
							FROM followers f2
							WHERE f2.user_id = u.id
								AND f2.followed_id = $2
						)
					THEN u.status
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
