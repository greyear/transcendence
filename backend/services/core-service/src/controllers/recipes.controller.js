import * as recipesService from "../services/recipes.service.js";
import { validateRecipeId } from "../validation/schemas.js";

// GET /recipes - get all published recipes
export const getAllRecipes = async (req, res, next) => {
  try {
    // Call service layer to fetch recipes
    const recipes = await recipesService.getAllRecipes();
    
    res.status(200).json({
      data: recipes,
      count: recipes.length,
    });
  } catch (error) {
    next(error);
  }
};

// GET /recipes/:id - get a specific recipe by id
export const getRecipeById = async (req, res, next) => {
  try {
    // Extract id from URL parameter
    const { id } = req.params;
    
    // Validate using Zod schema
    const validation = validateRecipeId(id);
    if (!validation.valid) {
      const error = new Error(validation.error);
      error.statusCode = 400;
      throw error;
    }

    // Call service layer to fetch recipe
    const recipe = await recipesService.getRecipeById(validation.value);

    // If recipe not found, return 404
    if (!recipe) {
      const error = new Error("Recipe not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      data: recipe,
    });
  } catch (error) {
    next(error);
  }
};
