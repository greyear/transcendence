/**
 * Recipes Routes
 *
 * 2-layer structure:
 * - Routes: HTTP handling + validation + response formatting
 * - Services: business logic + database access
 */

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
import { getAllRecipes, getRecipeById } from "../services/recipes.service.js";
import { validateRecipeId } from "../validation/schemas.js";

interface CustomError extends Error {
	statusCode?: number;
}

// Create router for recipe endpoints
export const recipesRouter: Router = Router();

/**
 * GET /recipes - fetch all published recipes
 *
 * Note: No authentication needed - returns only published recipes
 */
const getAllRecipesHandler = async (
	_req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const recipes = await getAllRecipes();
		res.status(200).json({ data: recipes, count: recipes.length });
	} catch (error) {
		next(error);
	}
};

/**
 * GET /recipes/:id - fetch a specific recipe by id
 *
 * Errors:
 * - 400 Bad Request - if ID is not a valid positive integer
 * - 403 Forbidden - if recipe is restricted (draft of another user)
 * - 404 Not Found - if recipe doesn't exist
 */
const getRecipeByIdHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const { id } = req.params;

		const validation = validateRecipeId(id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const recipe = await getRecipeById(validation.value, req.userId);

		if (!recipe) {
			const error: CustomError = new Error("Recipe not found");
			error.statusCode = 404;
			throw error;
		}

		if ("restricted" in recipe && recipe.restricted) {
			const error: CustomError = new Error(
				"Access to this recipe is restricted",
			);
			error.statusCode = 403;
			throw error;
		}

		res.status(200).json({ data: recipe });
	} catch (error) {
		next(error);
	}
};

// extractUser middleware extracts userId from X-User-Id header
recipesRouter.get("/:id", extractUser, getRecipeByIdHandler);
recipesRouter.get("/", getAllRecipesHandler);
