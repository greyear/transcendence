import { z } from "zod";

// Recipe ID validation schema
// Must be a positive integer
export const recipeIdSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "ID must be a number" })
    .int("ID must be an integer")
    .positive("ID must be positive"),
});

// Parse and validate recipe ID from string
export const validateRecipeId = (id) => {
  try {
    const validated = recipeIdSchema.parse({ id });
    return { valid: true, value: validated.id };
  } catch (error) {
    // Zod throws ZodError with detailed messages
    return { valid: false, error: error.errors[0]?.message || "Invalid ID" };
  }
};
