/**
 * Validation Schemas
 * 
 * Uses Zod for RUNTIME data validation
 * Runtime = we validate when data arrives from client (not just at compile time)
 * 
 * TypeScript types validate during development, but don't help if client sends wrong data
 * Zod validates ACTUAL data during runtime
 */

import { z } from "zod";

/**
 * VALIDATIONS (checking data from client)
 */

/**
 * Recipe ID validation - must be a positive integer
 * Database uses integer GENERATED ALWAYS AS IDENTITY for recipe IDs
 * 
 * This function tries to parse id and returns result:
 * - valid: true, value: "id-string" if OK
 * - valid: false, error: "error message" if NOT a valid positive integer
 */
const recipeIdSchema = z.string().regex(/^\d+$/, "Must be a positive integer");

type ValidationResult =
  | { valid: true; value: string }
  | { valid: false; error: string };

export const validateRecipeId = (
  id: unknown
): ValidationResult => {
  const result = recipeIdSchema.safeParse(id);

  if (result.success) {
    return { valid: true, value: result.data };
  }

  return {
    valid: false,
    error: result.error.issues[0]?.message || "Invalid recipe ID",
  };
};

/**
 * TYPES (describes Recipe object structure)
 */

/**
 * Zod schema for Recipe - describes what fields should exist and their types
 * 
 * z.object({...}) - object with fields
 * z.string() - string type
 * z.number() - number type
 * z.enum([...]) - can ONLY be one of the values in array
 * .optional() - field can be omitted
 * .min().max() - minimum and maximum value
 */
export const recipeSchema = z.object({
  id: z.number().int().positive(), // ID must be positive integer
  title: z.string(), // Title - string
  author_id: z.string(), // Author - user ID string
  status: z.enum(["draft", "published", "archived"]), // ONLY these statuses
  description: z.string().optional(), // Description - optional
  instructions: z.string().optional(), // Instructions - optional
  servings: z.number().optional(), // Servings - optional, but if present must be number
  spiciness: z.number().min(0).max(10).optional(), // 0 to 10
  rating_avg: z.number().optional(), // Rating - optional
});

/**
 * Zod schema for RecipeListItem - minimal recipe info for list view
 * Used by getAllRecipes() endpoint
 */
export const recipeListItemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  author_id: z.string(),
  description: z.string().optional(),
  rating_avg: z.number().optional(),
});

/**
 * z.infer<typeof recipeSchema> - "extract TypeScript type from Zod schema"
 * 
 * This means Recipe type will contain all fields from recipeSchema above
 * If recipeSchema changes - Recipe types automatically update
 * (DRY principle - don't repeat code)
 * 
 * Usage: const recipe: Recipe = { id: "...", title: "..." }
 */
export type Recipe = z.infer<typeof recipeSchema>;
