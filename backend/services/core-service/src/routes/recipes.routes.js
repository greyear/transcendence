import express from "express";
import * as recipesController from "../controllers/recipes.controller.js";

// Create router for recipe endpoints
const router = express.Router();

// GET /recipes - fetch all published recipes
router.get("/", recipesController.getAllRecipes);

// GET /recipes/:id - fetch a specific recipe by id
router.get("/:id", recipesController.getRecipeById);

export default router;
