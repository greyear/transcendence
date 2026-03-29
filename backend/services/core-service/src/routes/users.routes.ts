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
import { getAllUsers, getUserById } from "../services/users.service.js";
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

		const user = await getUserById(validation.value);
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

usersRouter.get("/me/recipes", extractUser, getMyRecipesHandler);
usersRouter.get("/:id/recipes", getUserRecipesHandler);
usersRouter.get("/:id", getUserByIdHandler);
usersRouter.get("/", getAllUsersHandler);
