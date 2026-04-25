import {
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
import {
	getSearchRecipeById,
	getSearchRecipes,
} from "../services/recipes.service.js";
import { validateRecipeId } from "../validation/schemas.js";

interface CustomError extends Error {
	statusCode?: number;
}

export const internalSearchRouter: Router = Router();

const getSearchRecipesHandler = async (
	_req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const recipes = await getSearchRecipes();
		res.status(200).json({ data: recipes, count: recipes.length });
	} catch (error) {
		next(error);
	}
};

const getSearchRecipeByIdHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const validation = validateRecipeId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const recipe = await getSearchRecipeById(validation.value);
		if (!recipe) {
			const error: CustomError = new Error("Recipe not found");
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({ data: recipe });
	} catch (error) {
		next(error);
	}
};

internalSearchRouter.get("/recipes", getSearchRecipesHandler);
internalSearchRouter.get("/recipes/:id", getSearchRecipeByIdHandler);
