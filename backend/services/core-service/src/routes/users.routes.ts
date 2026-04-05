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
	getMyRecipes,
	getPublishedRecipesByUserId,
} from "../services/recipes.service.js";
import {
	getAllUsers,
	getFollowers,
	getFollowing,
	getUserById,
} from "../services/users.service.js";
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

		const recipes = await getPublishedRecipesByUserId(validation.value);
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

		const recipes = await getMyRecipes(req.userId);
		res.status(200).json({ data: recipes, count: recipes.length });
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

// Register more specific routes FIRST, then less specific
// /me/recipes is most specific
usersRouter.get("/me/recipes", extractUser, getMyRecipesHandler);
// /:id/followers and /:id/following are more specific than /:id/recipes
usersRouter.get("/:id/followers", getFollowersHandler);
usersRouter.get("/:id/following", getFollowingHandler);
// /:id/recipes is less specific, should be last
usersRouter.get("/:id/recipes", getUserRecipesHandler);
usersRouter.get("/:id", extractUser, getUserByIdHandler);
usersRouter.get("/", getAllUsersHandler);
