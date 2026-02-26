import express from "express";
import * as recipesController from "../controllers/recipes.controller.js";
import { extractUser } from "../middleware/extractUser.js";

// Create router for recipe endpoints
const router = express.Router();

// Apply extractUser middleware to all recipe routes
router.use(extractUser);

// GET /recipes - fetch all published recipes
router.get("/", recipesController.getAllRecipes);

// GET /recipes/:id - fetch a specific recipe by id
router.get("/:id", recipesController.getRecipeById);

export default router;
