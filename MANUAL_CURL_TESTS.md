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

## 9. Expected Status Quick Map

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
- POST /recipes (no token) -> 401
- POST /recipes/:id/publish (no token) -> 401
