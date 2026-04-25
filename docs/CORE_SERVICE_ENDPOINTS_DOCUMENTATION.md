# Core Service Endpoints - GitHub PR Documentation

## Overview
This document consolidates all pull requests created by greyear that are dedicated to adding new endpoints to the core-service in the greyear/transcendence project, including review comments and remarks.

**Scope**: Core-service only (excludes api-gateway, auth-service, and notification-service)

---

## Pull Requests Summary

### PR #39: Implemented 2 GET recipes endpoints
- **Status**: Merged
- **Author**: greyear
- **Description**: Initial recipe endpoints implementation for core-service
  - Closes #22, #38
  - All setup for testing included

#### Endpoints Implemented:
- `GET /recipes` - Retrieve all recipes
- `GET /recipes/{id}` - Retrieve a specific recipe

#### Implementation Details:
- Input Validation with Zod library
- Error Handling Middleware added (e.g. 404 handler for undefined routes)
- Tests added

#### Review Comments:
- Reviewer: "Great foundation! The recipes endpoints and the API gateway makes it easy for frontend to start connecting to the backend. Really nice validation + error handling added, and the docker/Makefile improvements will help everyone run the project locally. Useful adds, nice job!"

---

### PR #46: Core service db and api: 403/404 error handling
- **Status**: Merged
- **Author**: greyear
- **Description**: Added error handling for core-service and file structure improvements
  - Added 403/404 error handling for GET /recipes endpoints
  - Small file structure fix
  - API gateway middleware JWT token improvements

#### Review Comments & Remarks:

1. **JWT Token Extraction Unification**
   - Comment: "This can be unified for all types. Since we might have something else than \"Bearer\". This also protects in case if someone put something else after the token."
   - Context: Token extraction should be unified across different authorization types

2. **Authorization Header Best Practice**
   - Comment: "In body we usually provide the data like `username`, `password`, `name`. It's a good practice to keep the token in `headers.autorization`. And no need to use JSON.stringify."
   - Context: Moved JWT token from request body to headers (following HTTP standards)

3. **Query Optimization Suggestion**
   - Comment: "Just as a suggestion, if you're not reusing `existsQuery` it might also be inside the `pool.query()`, but it's up to you =)"
   - Context: Code structure preference for query variables

---

### PR #107: Get users recipes, get my recipes endpoints
- **Status**: Merged (Mar 17, 2026)
- **Author**: greyear
- **Description**: Implements two new recipe retrieval endpoints for core-service

#### Endpoints Implemented:
- `GET /users/:id/recipes` - Returns a list of published recipes for the specified user
  - Handles invalid IDs and non-existent users
- `GET /users/me/recipes` - Returns all recipes for the logged-in user
  - Returns 401 for guests (authentication required)

#### Related Issues:
- Closes: "Implement get all users's recipes"
- Closes: "Implement get all my recipes"

#### Review Comments:
- Reviewer @FPyMEHTAPIU: "Look nice! 😉"

---

### PR #132: Post recipes endpoints
- **Status**: Merged (Mar 27, 2026)
- **Author**: greyear
- **Description**: Added POST endpoints for recipe creation and publishing to core-service

#### Endpoints Implemented:
- `POST /recipes` (closes #21) - Create a new recipe
- `POST /recipes/{id}/publish` (closes #122) - Publish a recipe

#### Review Comments & Remarks:

1. **Use switch statement for error handling**
   - Comment: "This looks like nested if/else tree but less readable. You can try switch instead."
   - Context: For handling publish recipe errors

2. **Zod validation and avoid "as" casting**
   - Comment: "Consider replacing it by Zod and always avoid \"as\" casting."
   - Context: For parsing row IDs

3. **SQL Performance optimization**
   - Comment: "This might be a performance bottleneck since you're doing many queries in a for loop."
   - Suggestion: Use a single SQL query with "unnest" for inserting recipe ingredients

4. **Schema naming clarification**
   - Comment: "We use intIdSchema for the servings. It seems confusing. Consider renaming it to positiveIntSchema."
   - Context: Related to moderation status for recipes

5. **Validation structure templates**
   - Comment: "Since now we use similar structure we can use templates."
   - Context: For validation result structure reuse

6. **Description parsing simplification**
   - Comment: "Since description is not optional and you have trim() in parsing stage, it can be simplified."

7. **Function reuse - validateIntId**
   - Comment: "Missed it last time, it's the same code. Might be used as..."
   - Context: Reuse validateIntId function for both recipe and user IDs

#### Implementation Notes:
- Reviewer noted: "A huge job. 💪 Unfortunately didn't have time to test the endpoints, but found a few parts that we should change. Mostly, everything looks really good and clear to understand. 😉"
- Author response on moderation: "I was gonna keep the draft but remove moderaton in one of the next PRs. So draft can be just used for users who fill in the form slowly, adding steps one by one or smth like that."

---

## Complete Endpoint Summary

### Core-Service Recipe Endpoints (by greyear)

| Method | Endpoint | PR | Purpose |
|--------|----------|----|---------|
| GET | `/recipes` | #39 | Retrieve all recipes |
| GET | `/recipes/{id}` | #39 | Retrieve specific recipe |
| GET | `/users/:id/recipes` | #107 | Get published recipes for a user |
| GET | `/users/me/recipes` | #107 | Get authenticated user's recipes |
| POST | `/recipes` | #132 | Create a new recipe |
| POST | `/recipes/{id}/publish` | #132 | Publish a recipe |

---

## Key Review Themes Across PRs

### Code Quality & Patterns
- **Error Handling**: Use switch statements instead of nested if/else for readability
- **Type Safety**: Avoid TypeScript "as" casting; use Zod validation consistently
- **Code Reuse**: Consolidate similar validation functions (e.g., `validateIntId`) across endpoints
- **Query Optimization**: Avoid N+1 query patterns; use SQL features like UNNEST for batch operations

### Best Practices
- **Authorization**: Keep JWT tokens in `Authorization` headers, not request body
- **Validation**: Use Zod for consistent, reusable input validation
- **Naming**: Use clear schema names (e.g., `positiveIntSchema` vs `intIdSchema`)
- **Schema Structure**: Reuse validation templates for consistent error structures

### HTTP Standards
- Proper error codes (401 for auth-required endpoints, 404 for not found, 403 for forbidden)
- Consistent error handling middleware
- Input validation before processing

---

## Related Issues
- #21 - POST /recipes endpoint
- #22 - GET recipes endpoints
- #38 - Additional GET recipes setup
- #122 - POST /recipes/{id}/publish endpoint
