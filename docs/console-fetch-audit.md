# Frontend Fetch Audit: Chrome Console Non-2xx Logging

## Background

Chrome DevTools auto-logs every `fetch()` that resolves with a non-2xx status to the Console (e.g. `GET … 403 (Forbidden)`). This logging is a **browser-native behavior** and **cannot be suppressed from JavaScript** — wrapping `console.error` in `if (import.meta.env.DEV)` does nothing for it. The only way to eliminate these logs is to ensure the request is either not fired in the first place, or that the backend returns a 2xx with explicit "not allowed / not found" data.

This audit covers every `fetch()` call site under `frontend/app/` and classifies whether it can produce a Chrome console entry during normal usage.

---

## 1. Fix Needed (logs in normal flow)

### 1.1 `GET /users/:id/favorites` — non-mutual followers

**Sites:**
- [user.tsx:140](frontend/app/routes/user.tsx:140) — fired on every authenticated view of another user's profile
- [RecipesGrid.tsx](frontend/app/components/RecipesGrid.tsx) — fired on `/recipes?favoritesOf=:id` views

**Symptom:** `GET https://localhost:8443/users/5/favorites 403 (Forbidden)`

**Root cause:** Backend returns 403 when the viewer is not a mutual follower. The frontend deliberately uses the 403 itself as the "are we mutual?" signal (see comment at [user.tsx:239-242](frontend/app/routes/user.tsx:239)).

**Recommended fix — backend (Option A, preferred):**
Add `is_mutual_follower: boolean` to the `GET /users/:id` response payload:

```jsonc
{
  "data": {
    "id": 5,
    "username": "alex",
    "avatar": "...",
    "status": "online",
    "is_following": true,
    "is_mutual_follower": true,   // NEW
    "recipes_count": 12
  }
}
```

**Frontend changes:**
- Update `UserResponseSchema` in [user.tsx:34](frontend/app/routes/user.tsx:34) to include `is_mutual_follower`.
- Replace the favorites pre-fetch on [user.tsx:139-144](frontend/app/routes/user.tsx:139) with a two-step flow: fetch profile first, then fetch favorites only if `is_mutual_follower === true`.
- Replace the `favorites !== null` gate at [user.tsx:243](frontend/app/routes/user.tsx:243) with `profile.is_mutual_follower`.
- For `RecipesGrid` (`favoritesOfUserId` mode): gate the fetch on the same flag fetched alongside the profile, or accept the parent passing a `canViewFavorites` prop.

**Why preferred:** REST-clean (separate resources stay separate), no protocol abuse, and removes a fragile "infer permissions from a status code" pattern. The backend already computes mutual-follow to enforce the 403 — exposing it is a one-line addition.

**Alternative (Option B):** Embed `favorites` directly in the `/users/:id` payload (`favorites: Recipe[] | null`). Saves a round trip but couples two resources and bloats the payload when the section isn't viewed.

**Avoid (Option C):** Returning 200 with empty array for non-mutuals. Breaks REST semantics — clients can no longer tell "no favorites" from "not allowed."

---

### 1.2 `GET /profile` — stale session on app mount

**Site:** [layout.tsx:64](frontend/app/layouts/layout.tsx:64)

**Symptom:** `GET https://localhost:8443/profile 401 (Unauthorized)` on page load when the session cookie is present but no longer valid server-side.

**Root cause:** The two-step auth restore flow ([layout.tsx:46-86](frontend/app/layouts/layout.tsx:46)) calls `/auth/session` first; if it returns `{ authenticated: true }`, it calls `/profile`. If the session is half-stale (cookie exists, session row gone), `/auth/session` may say authenticated but `/profile` returns 401.

**Recommended fix — backend (Option A, preferred):**
Make `/auth/session` authoritative — only return `{ authenticated: true }` after the same check `/profile` performs. Then a stale cookie produces `{ authenticated: false }` and the frontend never reaches `/profile`.

**Recommended fix — backend (Option B, even better):**
Have `/auth/session` return the user id directly:

```jsonc
{ "authenticated": true, "user_id": 5 }
// or, when not authenticated:
{ "authenticated": false }
```

**Frontend changes:**
- Drop the second `/profile` request in `restoreAuthState`.
- Update `SessionResponseSchema` at [layout.tsx:23](frontend/app/layouts/layout.tsx:23) and remove `ProfileResponseSchema` from the same file.
- Set `currentUserId` from the session response.

**Why preferred:** Eliminates an entire round trip, makes the auth check atomic, and removes the stale-state race.

---

### 1.3 `POST /users/me/heartbeat` — periodic 401 after session expiry

**Site:** [layout.tsx:108](frontend/app/layouts/layout.tsx:108)

**Symptom:** Every 30s, `POST https://localhost:8443/users/me/heartbeat 401 (Unauthorized)` is logged after a session expires, until the page is reloaded.

**Root cause:** The interval at [layout.tsx:123](frontend/app/layouts/layout.tsx:123) keeps firing as long as `isAuthenticated` is true in React state, but the cookie may have expired server-side.

**Recommended fix — frontend only:**
On the first 401, the existing handler at [layout.tsx:112-114](frontend/app/layouts/layout.tsx:112) calls `resetAuthState()`, which sets `isAuthenticated = false`. The effect's dependency array includes `isAuthenticated`, so the cleanup at [layout.tsx:124](frontend/app/layouts/layout.tsx:124) clears the interval. **This already works.** Only one 401 should fire per expiry — verify in production that the interval truly stops; if not, add an explicit `return` after `resetAuthState()` and a `clearInterval(interval)` call.

**No backend change required.**

---

## 2. Edge Cases Only (low priority)

These can log a 4xx, but only on a race (session expires between render and click) or genuine user error (wrong password). Acceptable for now.

| Site | Endpoint | Trigger |
|---|---|---|
| [recipe.tsx:355](frontend/app/routes/recipe.tsx:355) | `POST/DELETE /recipes/:id/favorite` | 401 if session expires mid-action |
| [recipe.tsx:465](frontend/app/routes/recipe.tsx:465) | `DELETE /recipes/:id` | 401 if session expires mid-action |
| [recipe.tsx:639](frontend/app/routes/recipe.tsx:639) | `GET /profile` (fetchCurrentUserId) | 401 if session expires |
| [recipe.tsx:719](frontend/app/routes/recipe.tsx:719) | `GET /users/me/favorites` | 401 if session expires |
| [profile.tsx:124](frontend/app/routes/profile.tsx:124) | `GET /auth/me` | 401 if session expires |
| [profile.tsx:166](frontend/app/routes/profile.tsx:166) | `GET /profile` | 401 if session expires |
| [profile.tsx:288](frontend/app/routes/profile.tsx:288) | `PUT /profile` | 409 (username taken) — already user-facing error |
| [AuthForm.tsx:153, 254](frontend/app/components/auth/AuthForm.tsx:153) | `POST /auth/google`, `/auth/login`, `/auth/register` | 401/409 on bad creds — user-facing |
| [ChangePasswordForm.tsx:53](frontend/app/components/auth/ChangePasswordForm.tsx:53) | `PATCH /auth/change-password` | 401 on wrong password — user-facing |
| [useRelationSet.ts:164](frontend/app/composables/useRelationSet.ts:164) | `POST/DELETE` follow/favorite | 409 if already member — handled |

**Optional improvement:** If the team wants a fully clean console even on session-expiry races, broadcast a "session expired" event from `resetAuthState()` and have all open in-flight requests short-circuit. Not worth the complexity for the current behavior.

---

## 3. Already Safe (no change)

These sites either guard with `isAuthenticated` before fetching, or hit fully public endpoints:

| Site | Endpoint | Why safe |
|---|---|---|
| [layout.tsx:48](frontend/app/layouts/layout.tsx:48) | `GET /auth/session` | Returns 200 for both states (assumed) |
| [user.tsx:133](frontend/app/routes/user.tsx:133) | `GET /users/:id` | 404 only on bad URL (handled with `<NotFoundView />`) |
| [recipes.tsx:123](frontend/app/routes/recipes.tsx:123) | `GET /users/:id` | Same |
| [search.tsx:270](frontend/app/routes/search.tsx:270) | `GET /search/*`, `/users`, `/recipes` | Public |
| [useTopCooks.ts:25](frontend/app/composables/useTopCooks.ts:25) | `GET /users` | Public |
| [useCategoryMap.ts:39](frontend/app/composables/useCategoryMap.ts:39) | `GET /recipes/:typeCode` | Public |
| [useRelationSet.ts:102](frontend/app/composables/useRelationSet.ts:102) | `GET /users/me/...` | Guarded by `isAuthenticated` |
| [UsersGrid.tsx](frontend/app/components/UsersGrid.tsx), [RecipesGrid.tsx](frontend/app/components/RecipesGrid.tsx) (non-favorites modes) | Various list endpoints | Guarded or public |
| [reviewForm.tsx](frontend/app/components/review/reviewForm.tsx), [ratingForm.tsx](frontend/app/components/rating/ratingForm.tsx) | Submit/delete | Behind authenticated UI |
| [recipe-create.tsx](frontend/app/routes/recipe-create.tsx) | `POST /recipes` + uploads | Behind authenticated route |
| [recipe.tsx:165](frontend/app/routes/recipe.tsx:165) | `GET /recipes/:id` | 404 only — handled with `<NotFoundView />` |
| [recipe.tsx:192](frontend/app/routes/recipe.tsx:192) | `GET /recipes/:id/reviews` | Public |

---

## Summary Table — Backend Changes Needed

| Endpoint | Change | Impact |
|---|---|---|
| `GET /users/:id` | Add `is_mutual_follower: boolean` to response | Eliminates §1.1 (favorites 403) |
| `GET /auth/session` | Return `user_id` when authenticated; ensure `authenticated: false` covers the same cases that would 401 from `/profile` | Eliminates §1.2 (profile 401) and removes one round trip |

## Summary Table — Frontend Changes Needed

| File | Change |
|---|---|
| [layout.tsx](frontend/app/layouts/layout.tsx) | Drop `/profile` call in `restoreAuthState`; read `user_id` from `/auth/session` response. Verify heartbeat interval clears on first 401. |
| [user.tsx](frontend/app/routes/user.tsx) | Add `is_mutual_follower` to schema; gate favorites fetch and presence indicator on it (instead of inferring from 403). |
| [RecipesGrid.tsx](frontend/app/components/RecipesGrid.tsx) | Accept a `canViewFavorites` prop or fetch profile first to gate the favorites-of-user request. |

After these changes, the Chrome console should be clean during normal browsing for both guests and authenticated users.
