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
 * z.string().uuid() - a string that must be a valid UUID format
 * UUID example: "550e8400-e29b-41d4-a716-446655440000"
 * 
 * This function tries to parse id and returns result:
 * - valid: true, value: "uuid-string" if OK
 * - valid: false, error: "error message" if NOT a valid UUID
 */
const recipeIdSchema = z.string().uuid();

export const validateRecipeId = (
  id: unknown
): { valid: true; value: string } | { valid: false; error: string } => {
  try {
    // parse() throws error if id is not a valid UUID
    const value = recipeIdSchema.parse(id);
    return { valid: true, value };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors[0]?.message || "Invalid recipe ID",
      };
    }
    return { valid: false, error: "Invalid recipe ID" };
  }
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
  id: z.string().uuid(), // ID must be UUID
  title: z.string(), // Title - string
  description: z.string().optional(), // Description - optional
  instructions: z.string().optional(), // Instructions - optional
  servings: z.number().optional(), // Servings - optional, but if present must be number
  spiciness: z.number().min(0).max(10).optional(), // 0 to 10
  author_id: z.string().uuid(), // Author - UUID
  rating_avg: z.number().optional(), // Rating - optional
  status: z.enum(["draft", "published", "archived"]), // ONLY these statuses
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
