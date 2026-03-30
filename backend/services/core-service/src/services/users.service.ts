import { pool } from "../db/database.js";
import { userListItemSchema } from "../validation/schemas.js";

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
