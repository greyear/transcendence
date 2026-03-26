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
import {
	createRecipe,
	getAllRecipes,
	getRecipeById,
	publishRecipe,
} from "../services/recipes.service.js";
import {
	validateCreateRecipeInput,
	validateRecipeId,
} from "../validation/schemas.js";

interface CustomError extends Error {
	statusCode?: number;
}

// Create router for recipe endpoints
export const recipesRouter: Router = Router();

const createRecipeHandler = async (
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

		const validation = validateCreateRecipeInput(req.body);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const recipe = await createRecipe(req.userId, validation.value);
		res.status(201).json({ data: recipe });
	} catch (error) {
		next(error);
	}
};

const publishRecipeHandler = async (
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

		const validation = validateRecipeId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const publishResult = await publishRecipe(validation.value, req.userId);

		if (!publishResult.success) {
			const error: CustomError = new Error();

			switch (publishResult.reason) {
				case "not-found":
					error.message = "Recipe not found";
					error.statusCode = 404;
					break;
				case "forbidden":
					error.message = "No permission to publish this recipe";
					error.statusCode = 403;
					break;
				default:
					error.message = `Recipe cannot be sent to moderation from status ${publishResult.currentStatus}`;
					error.statusCode = 409;
					break;
			}

			throw error;
		}

		res.status(200).json({
			data: publishResult.recipe,
			message: "Recipe sent to moderation",
		});
	} catch (error) {
		next(error);
	}
};

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
recipesRouter.post("/", extractUser, createRecipeHandler);
recipesRouter.post("/:id/publish", extractUser, publishRecipeHandler);
recipesRouter.get("/:id", extractUser, getRecipeByIdHandler);
recipesRouter.get("/", getAllRecipesHandler);
