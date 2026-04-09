# Manual CURL Tests

Use these commands to manually test API endpoints.

## 1. Token Variable

```bash
TOKEN=""   # put your JWT token here for protected endpoints
```

## 2. Health

```bash
curl -i "http://localhost:3000/health"
curl -i "http://localhost:3000/health/db"
```

## 3. Recipes (Public)

```bash
curl -i "http://localhost:3000/recipes"
curl -i "http://localhost:3000/recipes/1"
curl -i "http://localhost:3000/recipes/999999"
```

## 4. Recipes Validation Errors

```bash
curl -i "http://localhost:3000/recipes/abc"
curl -i "http://localhost:3000/recipes/12.4"
curl -i "http://localhost:3000/recipes/-5"
```

## 5. Users (Public)

```bash
curl -i "http://localhost:3000/users"
curl -i "http://localhost:3000/users/1"
curl -i "http://localhost:3000/users/999999"
curl -i "http://localhost:3000/users/abc"
```

## 6. User Recipes (Public + Private)

```bash
curl -i "http://localhost:3000/users/1/recipes"
curl -i "http://localhost:3000/users/999999/recipes"
curl -i "http://localhost:3000/users/abc/recipes"

# should return 401 without token
curl -i "http://localhost:3000/users/me/recipes"

# authorized request
curl -i -H "Authorization: Bearer $TOKEN" "http://localhost:3000/users/me/recipes"
```

## 7. Create Recipe (Protected)

```bash
curl -i -X POST "http://localhost:3000/recipes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Manual CURL Recipe",
    "description": "Created from MANUAL_CURL_TESTS.md",
    "instructions": ["Prepare", "Cook", "Serve"],
    "servings": 2,
    "spiciness": 1,
    "ingredients": [
      { "ingredient_id": 1, "amount": 150, "unit": "g" }
    ],
    "category_ids": []
  }'
```

## 8. Publish Recipe (Protected)

Replace RECIPE_ID with a real recipe id (typically a draft owned by your user).

```bash
RECIPE_ID=1
curl -i -X POST "http://localhost:3000/recipes/$RECIPE_ID/publish" \
  -H "Authorization: Bearer $TOKEN"
```

## 9. Update Recipe (Protected)

Replace RECIPE_ID with a real draft recipe id owned by your user.

```bash
RECIPE_ID=1
curl -i -X PUT "http://localhost:3000/recipes/$RECIPE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Updated from CURL",
    "description": "Updated via manual curl",
    "instructions": ["Prep", "Cook", "Serve"],
    "servings": 3,
    "spiciness": 2,
    "ingredients": [
      { "ingredient_id": 1, "amount": 180, "unit": "g" }
    ],
    "category_ids": []
  }'
```

Validation and auth checks:

```bash
# no token -> 401
curl -i -X PUT "http://localhost:3000/recipes/$RECIPE_ID" \
  -H "Content-Type: application/json" \
  -d '{"title":"x","description":"x","instructions":["x"],"servings":1,"spiciness":0,"ingredients":[{"ingredient_id":1,"amount":1,"unit":"g"}],"category_ids":[]}'

# invalid id -> 400
curl -i -X PUT "http://localhost:3000/recipes/abc" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"x","description":"x","instructions":["x"],"servings":1,"spiciness":0,"ingredients":[{"ingredient_id":1,"amount":1,"unit":"g"}],"category_ids":[]}'
```

## 10. Archive Recipe (Protected Soft Delete)

Replace RECIPE_ID with a real recipe id.

```bash
RECIPE_ID=1
curl -i -X DELETE "http://localhost:3000/recipes/$RECIPE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Validation and auth checks:

```bash
# no token -> 401
curl -i -X DELETE "http://localhost:3000/recipes/$RECIPE_ID"

# invalid id -> 400
curl -i -X DELETE "http://localhost:3000/recipes/abc" \
  -H "Authorization: Bearer $TOKEN"
```

## 11. Favorites (Protected)

Replace RECIPE_ID with an existing published recipe id.

```bash
RECIPE_ID=1

# should return 401 without token
curl -i -X POST "http://localhost:3000/recipes/$RECIPE_ID/favorite"
curl -i -X DELETE "http://localhost:3000/recipes/$RECIPE_ID/favorite"
curl -i "http://localhost:3000/users/me/favorites"

# add to favorites
curl -i -X POST "http://localhost:3000/recipes/$RECIPE_ID/favorite" \
  -H "Authorization: Bearer $TOKEN"

# duplicate add should return 409
curl -i -X POST "http://localhost:3000/recipes/$RECIPE_ID/favorite" \
  -H "Authorization: Bearer $TOKEN"

# list my favorites
curl -i "http://localhost:3000/users/me/favorites" \
  -H "Authorization: Bearer $TOKEN"

# remove from favorites
curl -i -X DELETE "http://localhost:3000/recipes/$RECIPE_ID/favorite" \
  -H "Authorization: Bearer $TOKEN"

# second remove should return 409 (not in favorites)
curl -i -X DELETE "http://localhost:3000/recipes/$RECIPE_ID/favorite" \
  -H "Authorization: Bearer $TOKEN"
```

## 12. Expected Status Quick Map

- GET /health -> 200
- GET /health/db -> 200
- GET /recipes -> 200
- GET /recipes/:id -> 200 or 404 or 403
- GET /recipes/abc -> 400
- GET /users -> 200
- GET /users/:id -> 200 or 404
- GET /users/abc -> 400
- GET /users/:id/recipes -> 200 or 404
- GET /users/me/recipes (no token) -> 401
- GET /users/me/favorites (no token) -> 401

- POST /recipes (no token) -> 401
- POST /recipes/:id/publish (no token) -> 401
- POST /recipes/:id/favorite (no token) -> 401
- POST /recipes/:id/favorite (with token) -> 200 or 404 or 409

- PUT /recipes/:id -> 200 or 400 or 401 or 403 or 404 or 409

- DELETE /recipes/:id -> 200 or 400 or 401 or 403 or 404 or 409
- DELETE /recipes/:id/favorite (no token) -> 401
- DELETE /recipes/:id/favorite (with token) -> 200 or 404 or 409
