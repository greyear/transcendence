import {
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
import {
	type AuthenticatedRequest,
	extractUser,
} from "../middleware/extractUser.js";
import {
	getFavoriteRecipesByUserId,
	getMyFavoriteRecipes,
	getMyRecipes,
	getPublishedRecipesByUserId,
} from "../services/recipes.service.js";
import {
	followUser,
	getAllUsers,
	getFollowers,
	getFollowing,
	getMyFriends,
	getUserById,
	unfollowUser,
} from "../services/users.service.js";
import { resolveRequestedLocale } from "../utils/locale.js";
import { validateUserId } from "../validation/schemas.js";

interface CustomError extends Error {
	statusCode?: number;
}

export const usersRouter: Router = Router();

const getAllUsersHandler = async (
	_req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const users = await getAllUsers();
		res.status(200).json({ data: users, count: users.length });
	} catch (error) {
		next(error);
	}
};

const getUserByIdHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const validation = validateUserId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const user = await getUserById(validation.value, req.userId);
		if (!user) {
			const error: CustomError = new Error("User not found");
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({ data: user });
	} catch (error) {
		next(error);
	}
};

/**
 * GET /users/:id/recipes - fetch all published recipes created by a user
 *
 * Errors:
 * - 400 Bad Request - if user ID is not a valid positive integer
 * - 404 Not Found - if user doesn't exist
 */
const getUserRecipesHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const validation = validateUserId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const locale = resolveRequestedLocale(req);
		const recipes = await getPublishedRecipesByUserId(validation.value, locale);
		if (!recipes) {
			const error: CustomError = new Error("User not found");
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({ data: recipes, count: recipes.length });
	} catch (error) {
		next(error);
	}
};

/**
 * GET /users/me/recipes - fetch all recipes created by current user
 *
 * Errors:
 * - 401 Unauthorized - if user is not authenticated
 */
const getMyRecipesHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const locale = resolveRequestedLocale(req);
		const recipes = await getMyRecipes(req.userId, locale);
		res.status(200).json({ data: recipes, count: recipes.length });
	} catch (error) {
		next(error);
	}
};

/**
 * GET /users/me/favorites - fetch all favorite recipes of current user
 *
 * Errors:
 * - 401 Unauthorized - if user is not authenticated
 */
const getMyFavoritesHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const locale = resolveRequestedLocale(req);
		const favorites = await getMyFavoriteRecipes(req.userId, locale);
		res.status(200).json({ data: favorites, count: favorites.length });
	} catch (error) {
		next(error);
	}
};

/**
 * GET /users/:id/favorites - fetch favorite recipes of another user
 *
 * Requires: User and target user must be mutual followers
 *
 * Errors:
 * - 400 Bad Request - if user ID is not a valid positive integer
 * - 401 Unauthorized - if user is not authenticated
 * - 403 Forbidden - if users are not mutual followers
 * - 404 Not Found - if user doesn't exist
 */
const getFavoritesHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const validation = validateUserId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const locale = resolveRequestedLocale(req);
		const favorites = await getFavoriteRecipesByUserId(
			validation.value,
			req.userId,
			locale,
		);

		if (favorites === null) {
			const error: CustomError = new Error("Access denied");
			error.statusCode = 403;
			throw error;
		}

		res.status(200).json({ data: favorites, count: favorites.length });
	} catch (error) {
		// Handle service errors with proper status code mapping
		if (
			error instanceof Error &&
			"code" in error &&
			typeof error.code === "string"
		) {
			switch (error.code) {
				case "USER_NOT_FOUND": {
					const customError: CustomError = new Error(error.message);
					customError.statusCode = 404;
					next(customError);
					break;
				}
				default:
					next(error);
			}
		} else {
			next(error);
		}
	}
};

/**
 * POST /users/:id/follow - follow another user
 *
 * Errors:
 * - 401 Unauthorized - if user is not authenticated
 * - 400 Bad Request - if user ID is not a valid positive integer or user tries to follow themselves
 * - 404 Not Found - if the authenticated user or target user does not exist
 * - 409 Conflict - if the follow relationship already exists
 */
const followUserHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const validation = validateUserId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const result = await followUser(req.userId, validation.value);
		if (!result.success) {
			const error: CustomError = new Error();

			switch (result.reason) {
				case "self-follow":
					error.message = "Cannot follow yourself";
					error.statusCode = 400;
					break;
				case "user-not-found":
					error.message = "User not found";
					error.statusCode = 404;
					break;
				case "already-followed":
					error.message = "User is already followed";
					error.statusCode = 409;
					break;
			}

			throw error;
		}

		res.status(200).json({
			data: {
				follower_id: req.userId,
				followed_id: validation.value,
			},
			message: "User followed",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * DELETE /users/:id/follow - unfollow another user
 *
 * Errors:
 * - 401 Unauthorized - if user is not authenticated
 * - 400 Bad Request - if user ID is not a valid positive integer or user tries to unfollow themselves
 * - 404 Not Found - if the authenticated user or target user does not exist
 */
const unfollowUserHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const validation = validateUserId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const result = await unfollowUser(req.userId, validation.value);
		if (!result.success) {
			const error: CustomError = new Error();

			switch (result.reason) {
				case "self-follow":
					error.message = "Cannot unfollow yourself";
					error.statusCode = 400;
					break;
				case "user-not-found":
					error.message = "User not found";
					error.statusCode = 404;
					break;
				case "not-followed":
					error.message = "User is not followed";
					error.statusCode = 404;
					break;
			}

			throw error;
		}

		res.status(200).json({
			message: "User unfollowed",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * GET /users/:id/followers - fetch all followers of a user
 *
 * Errors:
 * - 400 Bad Request - if user ID is not a valid positive integer
 * - 404 Not Found - if user doesn't exist
 */
const getFollowersHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const validation = validateUserId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const followers = await getFollowers(validation.value);
		res.status(200).json({ data: followers, count: followers.length });
	} catch (error) {
		if (error instanceof Error && error.message === "User not found") {
			const customError: CustomError = new Error(error.message);
			customError.statusCode = 404;
			next(customError);
		} else {
			next(error);
		}
	}
};

/**
 * GET /users/:id/following - fetch all users that a user is following
 *
 * Errors:
 * - 400 Bad Request - if user ID is not a valid positive integer
 * - 404 Not Found - if user doesn't exist
 */
const getFollowingHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const validation = validateUserId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const following = await getFollowing(validation.value);
		res.status(200).json({ data: following, count: following.length });
	} catch (error) {
		if (error instanceof Error && error.message === "User not found") {
			const customError: CustomError = new Error(error.message);
			customError.statusCode = 404;
			next(customError);
		} else {
			next(error);
		}
	}
};

/**
 * GET /users/me/followers - fetch all followers of current user
 *
 * Errors:
 * - 401 Unauthorized - if user is not authenticated
 * - 404 Not Found - if user doesn't exist
 */
const getMyFollowersHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const followers = await getFollowers(req.userId);
		res.status(200).json({ data: followers, count: followers.length });
	} catch (error) {
		if (error instanceof Error && error.message === "User not found") {
			const customError: CustomError = new Error(error.message);
			customError.statusCode = 404;
			next(customError);
		} else {
			next(error);
		}
	}
};

/**
 * GET /users/me/following - fetch all users that current user is following
 *
 * Errors:
 * - 401 Unauthorized - if user is not authenticated
 * - 404 Not Found - if user doesn't exist
 */
const getMyFollowingHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const following = await getFollowing(req.userId);
		res.status(200).json({ data: following, count: following.length });
	} catch (error) {
		if (error instanceof Error && error.message === "User not found") {
			const customError: CustomError = new Error(error.message);
			customError.statusCode = 404;
			next(customError);
		} else {
			next(error);
		}
	}
};

/**
 * GET /users/me/friends - fetch all mutual followers of current user
 *
 * Errors:
 * - 401 Unauthorized - if user is not authenticated
 * - 404 Not Found - if user doesn't exist
 */
const getMyFriendsHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const friends = await getMyFriends(req.userId);
		res.status(200).json({ data: friends, count: friends.length });
	} catch (error) {
		if (error instanceof Error && error.message === "User not found") {
			const customError: CustomError = new Error(error.message);
			customError.statusCode = 404;
			next(customError);
		} else {
			next(error);
		}
	}
};

/**
 * GET /users/me/heartbeat - check if current user is online
 *
 * Errors:
 * - 401 Unauthorized - if user is not authenticated
 */
const heartbeatHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}
		res.status(200).json({ message: "OK" });
	} catch (error) {
		next(error);
	}
};

// Register more specific routes FIRST, then less specific
usersRouter.post("/me/heartbeat", heartbeatHandler);
// /me/recipes and /me/favorites are most specific
usersRouter.get("/me/recipes", getMyRecipesHandler);
usersRouter.get("/me/favorites", getMyFavoritesHandler);
usersRouter.get("/me/followers", getMyFollowersHandler);
usersRouter.get("/me/following", getMyFollowingHandler);
usersRouter.get("/me/friends", getMyFriendsHandler);
usersRouter.post("/:id/follow", followUserHandler);
usersRouter.delete("/:id/follow", unfollowUserHandler);
// /:id/followers, /:id/following are more specific than /:id/recipes
usersRouter.get("/:id/followers", getFollowersHandler);
usersRouter.get("/:id/following", getFollowingHandler);
// /:id/favorites requires authentication (extractUser middleware)
usersRouter.get("/:id/favorites", extractUser, getFavoritesHandler);
// /:id/recipes is less specific, should be last before /:id
usersRouter.get("/:id/recipes", getUserRecipesHandler);
usersRouter.get("/:id", getUserByIdHandler);
usersRouter.get("/", getAllUsersHandler);
