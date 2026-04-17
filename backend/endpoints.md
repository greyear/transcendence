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

---

## Auth Service (port 3001, internal)

| Endpoint | Method | Auth | Parameters |
|---|---|---|---|
| `/register` | POST | — | body: `username`, `email`, `password` |
| `/login` | POST | — | body: `username` (or email), `password` |
| `/validate` | POST | JWT (header) | `Authorization: Bearer <token>` |
| `/users/:username` | DELETE | JWT (header) | `username` (path), `Authorization: Bearer <token>` |
| `/users/:username/change-password` | PATCH | JWT (header) | `username` (path), body: `password`, `newPassword` |

---

## Auth notes

- **optional** auth — JWT via `cookie: token` or `Authorization: Bearer <token>`; guests allowed, proceed without identity
- **required** auth — same token sources; returns `401` if missing/invalid, `503` if auth-service is down
- `X-User-Id` is an **internal** header set by the gateway after token validation — never sent by clients directly
