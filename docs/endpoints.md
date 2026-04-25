# API Endpoints

## API Gateway (port 3000 → proxies to core-service)

| Endpoint | Method | Auth | Parameters |
|---|---|---|---|
| `/health` | GET | — | — |
| `/health/db` | GET | — | — |
| `/recipes` | GET | optional | — |
| `/recipes/:id` | GET | optional | `id` (path, positive int) |
| `/recipes` | POST | **required** | body: `title`, `description`, `instructions[]`, `servings`, `spiciness`, `ingredients[]`, `category_ids[]` |
| `/recipes/:id/publish` | POST | **required** | `id` (path, positive int) |
| `/users/:id/recipes` | GET | — | `id` (path, positive int) |
| `/users/:id/favorites` | GET | **required** | `id` (path, positive int) |
| `/users/me/recipes` | GET | **required** | — |
| `/users/me/favorites` | GET | **required** | — |

### POST `/recipes` body schema

| Field | Type | Constraints |
|---|---|---|
| `title` | string | 1–256 chars |
| `description` | string \| null | max 5000 chars |
| `instructions` | string[] | min 1 item, each non-empty |
| `servings` | int | positive |
| `spiciness` | int | 0–3 |
| `ingredients` | object[] | min 1 item, unique `ingredient_id`s |
| `ingredients[].ingredient_id` | int | positive |
| `ingredients[].amount` | number | positive |
| `ingredients[].unit` | string | 1–16 chars |
| `category_ids` | int[] | unique, defaults to `[]` |

### Recipe review endpoints

| Endpoint | Method | Auth | Parameters |
|---|---|---|---|
| `GET /recipes/:id/reviews` | GET | — | `id` (path, positive int) → get all reviews for recipe |
| `POST /recipes/:id/reviews` | POST | **required** | `id` (path, positive int), body: `rating` (1–5), `comment` (optional string) (leave a review) |
| `PUT /recipes/:id/reviews/:reviewId` | PUT | **required** | `id`, `reviewId` (path params), body: `rating`, `comment` (update own review) |
| `DELETE /recipes/:id/reviews/:reviewId` | DELETE | **required** | `id`, `reviewId` (path params) (delete own review) |

### Recipe favourite endpoints

| Endpoint | Method | Auth | Parameters |
|---|---|---|---|
| `POST /recipes/:id/favorite` | POST | **required** | `id` (path, positive int) (add recipe to favourites) |
| `DELETE /recipes/:id/favorite` | DELETE | **required** | `id` (path, positive int) (remove recipe from favourites) |

### User recipe endpoints

| Endpoint | Method | Auth | Parameters |
|---|---|---|---|
| `GET /users/:id/recipes` | GET | — | `id` (path, positive int) → get all public recipes by user |
| `GET /users/me/recipes` | GET | **required** | Get all recipes for authenticated user (including private) |
| `GET /users/:id/favorites` | GET | — | `id` (path, positive int) → get user's favourite recipes |
| `GET /users/me/favorites` | GET | **required** | Get authenticated user's favourite recipes |

---

## User and social endpoints

### User profile and relationship endpoints

| Endpoint | Method | Auth | Parameters |
|---|---|---|---|
| `GET /users/:id/followers` | GET | — | `id` (path, positive int) → get list of users following this user |
| `GET /users/:id/following` | GET | — | `id` (path, positive int) → get list of users this user is following |
| `POST /users/:id/follow` | POST | **required** | `id` (path, positive int) (follow user) |
| `DELETE /users/:id/follow` | DELETE | **required** | `id` (path, positive int) (unfollow user) |

---

## Authentication service (port 3001, internal only)

### User account endpoints

| Endpoint | Method | Auth | Parameters |
|---|---|---|---|
| `POST /auth/register` | POST | — | Body: `email`, `password` (register new user with email and password) |
| `POST /auth/login` | POST | — | Body: `email`, `password` (log in existing user) |
| `GET /auth/me` | GET | **required** | JWT (header), returns current authenticated user details |
| `POST /auth/delete` | POST | **required** | Body: `userId` (delete user account) |
| `POST /auth/change-password` | POST | **required** | Body: `userId`, `currentPassword`, `newPassword` (change user password) |

### Google authentication endpoints

| Endpoint | Method | Auth | Parameters |
|---|---|---|---|
| `POST /auth/validate` | POST | JWT (header) | `Authorization: Bearer <token>` (validate JWT token) |
| `POST /auth/google` | POST | — | Body: Google ID token (Google Sign-In authentication) |

---

## Authentication requirements

### Token sources
Authentication tokens are accepted from:
- Cookie: `token=<jwt>`
- Header: `Authorization: Bearer <jwt>`

### Optional authentication
Endpoints marked **optional** auth allow guest access. If a valid token is provided, the user's identity is set in the `X-User-Id` header. If no token or invalid token, the request continues as a guest.

### Required authentication
Endpoints marked **required** auth reject requests with:
- `401 Unauthorised` if token is missing or invalid
- `503 Service Unavailable` if auth service is temporarily down

### Internal headers
- `X-User-Id`: Set by API gateway after successful token validation. Never sent by clients directly. Contains the authenticated user's ID.

---

## Error responses

All endpoints follow consistent error response format:

| Status | Meaning |
|---|---|
| `200 OK` | Request succeeded |
| `201 Created` | Resource created successfully |
| `400 Bad Request` | Validation failed (e.g. invalid input format) |
| `401 Unauthorised` | Authentication required or token invalid |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Resource already exists (e.g. duplicate email) |
| `500 Internal Server Error` | Unexpected server error |
| `503 Service Unavailable` | Required service temporarily unavailable |
