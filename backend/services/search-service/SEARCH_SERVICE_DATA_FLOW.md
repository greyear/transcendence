# Search Service Data Flow

This file explains the current search feature in plain language for PR reviewers and teammates.

The goal of this feature is:

- keep recipe source-of-truth data in `core-service`
- build a separate searchable copy in `search-service`
- store embeddings and searchable text in `search-db`
- let frontend search through `api-gateway`
- return both matching recipes and a Gemini-generated summary when available

## Big Picture

There are 4 main moving parts.

1. `core-service`

File:
`backend/services/core-service/src/services/recipes.service.ts`

Purpose:
Owns the real recipe data in `core-db` and exposes internal read models for search indexing.

2. `search-service`

File:
`backend/services/search-service/app/main.py`

Purpose:
Fetches published recipe data from `core-service`, creates embeddings, stores search documents in `search-db`, and answers search requests.

3. `search-db`

File:
`backend/infrastructure/postgres/search/01-init-search.sql`

Purpose:
Stores indexed search documents in `recipe_search_docs`, including `searchable_text` and pgvector embeddings.

4. `api-gateway`

File:
`backend/services/api-gateway/src/routes/search.routes.ts`

Purpose:
Exposes `GET /search/recipes` to frontend and forwards the request to `search-service`.

## Why A Separate Search Service Exists

`search-service` does not connect directly to `core-db`.

Instead:

- `core-service` owns recipe data
- `search-service` consumes recipe data through internal HTTP endpoints
- `search-db` is only a derived search index, not the source of truth

This keeps the service boundary clear.

## Core-Service Internal Search Read Model

`search-service` gets source recipe data from these internal endpoints:

- `GET /internal/search/recipes`
- `GET /internal/search/recipes/:id`

These are mounted in core-service here:

File:
`backend/services/core-service/src/app.ts`

Route mount:
`app.use("/internal/search", internalSearchRouter)`

Router file:
`backend/services/core-service/src/routes/internalSearch.routes.ts`

Functions:
`getSearchRecipesHandler(...)`
`getSearchRecipeByIdHandler(...)`

Service file:
`backend/services/core-service/src/services/recipes.service.ts`

Functions:
`getSearchRecipes(...)`
`getSearchRecipeById(...)`

The internal read model only returns published recipes:

```sql
WHERE r.status = 'published'
```

This means drafts are not searchable.

The read model returns fields needed for indexing:

- `id`
- `title`
- `description`
- `instructions`
- `author_id`
- `servings`
- `spiciness`
- `rating_avg`
- `ingredients`
- `categories`
- `updated_at`

## Automatic Publish-To-Search Flow

This is the current important application flow.

When a recipe is published, core-service now automatically asks search-service to reindex that one recipe by ID.

### Step 1: User publishes a recipe

Frontend/API caller sends:

```http
POST /recipes/:id/publish
```

File:
`backend/services/api-gateway/src/routes/recipes.routes.ts`

Function:
`publishRecipeHandler(...)`

What happens next:
The API gateway forwards the publish request to core-service.

### Step 2: Core-service updates the recipe status

File:
`backend/services/core-service/src/routes/recipes.routes.ts`

Function:
`publishRecipeHandler(...)`

File:
`backend/services/core-service/src/services/recipes.service.ts`

Function:
`publishRecipe(...)`

What happens next:
`publishRecipe(...)` updates the recipe from `draft` to `published`.

Relevant SQL shape:

```sql
UPDATE recipes
SET status = 'published', updated_at = now()
WHERE id = $1 AND author_id = $2 AND status = 'draft'
```

### Step 3: Core-service schedules targeted search reindex

File:
`backend/services/core-service/src/services/recipes.service.ts`

Function:
`publishRecipe(...)`

Call:

```ts
scheduleRecipeSearchReindex(recipeId);
```

What happens next:
After the recipe is successfully published and loaded, core-service starts a fire-and-forget search reindex request.

### Step 4: Core-service calls search-service admin endpoint

File:
`backend/services/core-service/src/services/searchIndex.service.ts`

Function:
`scheduleRecipeSearchReindex(...)`

Function:
`reindexRecipeInSearch(...)`

What happens next:
Core-service sends an internal POST request to search-service:

```http
POST /admin/reindex/:recipeId
X-Internal-Service-Token: <INTERNAL_SERVICE_TOKEN>
```

This is fire-and-forget. Publishing does not wait for Gemini embedding to finish.

If reindexing fails, core-service logs the error and the recipe still stays published.

### Step 5: Search-service receives single recipe reindex request

File:
`backend/services/search-service/app/main.py`

Function:
`reindex_one(...)`

Endpoint:

```py
@app.post("/admin/reindex/{recipe_id}")
```

What happens next:
Search-service validates the internal token and fetches that one published recipe from core-service.

### Step 6: Search-service fetches the published recipe from core-service

File:
`backend/services/search-service/app/main.py`

Function:
`fetch_search_recipe_by_id(...)`

Function:
`fetch_core_json(...)`

Core endpoint called:

```http
GET /internal/search/recipes/:id
```

What happens next:
If core-service returns the recipe, search-service continues. If the recipe is not published or does not exist, core-service returns 404 and reindex fails.

### Step 7: Search-service normalizes the recipe into a search document

File:
`backend/services/search-service/app/main.py`

Function:
`normalize_recipe_document(...)`

Helper functions:
`normalize_ingredient_lines(...)`
`normalize_category_labels(...)`
`parse_core_timestamp(...)`

What happens next:
Search-service builds one `searchable_text` field from title, description, servings, spiciness, rating, ingredients, categories, and instructions.

### Step 8: Search-service creates the embedding

File:
`backend/services/search-service/app/main.py`

Function:
`embed_text(...)`

Function:
`get_embedding_client(...)`

What happens next:
Search-service sends `searchable_text` to Gemini embedding model and receives a vector.

If Gemini embedding fails, the reindex request fails and the error is logged by core-service because the call was fire-and-forget.

### Step 9: Search-service upserts into search-db

File:
`backend/services/search-service/app/main.py`

Function:
`upsert_search_document(...)`

Database table:
`recipe_search_docs`

What happens next:
The recipe search document is inserted or updated in `search-db`. After this, the newly published recipe can be found by search.

## Manual Reindex Admin Endpoints

Search-service has 3 admin endpoints.

File:
`backend/services/search-service/app/main.py`

Endpoints:

- `POST /admin/reindex`
- `GET /admin/reindex/jobs/{job_id}`
- `POST /admin/reindex/{recipe_id}`

All admin endpoints require:

```http
X-Internal-Service-Token: <INTERNAL_SERVICE_TOKEN>
```

Token check function:
`require_internal_service_token(...)`

Docker Compose requires `INTERNAL_SERVICE_TOKEN` to be set. There is no default fallback token.

## Full Reindex Flow

Full reindex is mainly an admin/debug/recovery tool. It is not the normal user flow.

### Step 1: Admin starts a full reindex job

Request:

```http
POST /admin/reindex
```

File:
`backend/services/search-service/app/main.py`

Function:
`reindex_all(...)`

What happens next:
Search-service creates or reuses an active in-memory job.

### Step 2: Search-service creates job metadata

File:
`backend/services/search-service/app/main.py`

Function:
`create_or_get_active_reindex_job(...)`

What happens next:
The job is stored in `_reindex_jobs` with status `queued`, counts, timestamps, and a generated `job_id`.

### Step 3: FastAPI starts the job as a background task

File:
`backend/services/search-service/app/main.py`

Function:
`reindex_all(...)`

Function called in background:
`run_reindex_job(...)`

What happens next:
The HTTP response returns quickly with `status: accepted`, `job_id`, and `status_url`.

### Step 4: Background worker fetches all published recipes

File:
`backend/services/search-service/app/main.py`

Function:
`run_reindex_job(...)`

Function:
`fetch_all_search_recipes(...)`

Function:
`fetch_core_json(...)`

Core endpoint called:

```http
GET /internal/search/recipes
```

What happens next:
Search-service receives all published recipe documents from core-service.

### Step 5: Each recipe is indexed

File:
`backend/services/search-service/app/main.py`

Function:
`run_reindex_job(...)`

Function:
`upsert_search_document(...)`

Function:
`normalize_recipe_document(...)`

Function:
`embed_text(...)`

What happens next:
Each recipe is normalized, embedded with Gemini, and upserted into `recipe_search_docs`.

### Step 6: Deleted or unpublished recipes are pruned from search-db

File:
`backend/services/search-service/app/main.py`

Function:
`run_reindex_job(...)`

Function:
`delete_search_document(...)`

What happens next:
Search-service compares active published recipe IDs from core-service against IDs currently in `recipe_search_docs`. IDs no longer active are deleted from `search-db`.

### Step 7: Admin checks full reindex progress

Request:

```http
GET /admin/reindex/jobs/{job_id}
```

File:
`backend/services/search-service/app/main.py`

Function:
`get_reindex_job_status(...)`

Function:
`get_reindex_job(...)`

What happens next:
Search-service returns current job status, indexed count, deleted count, and any error.

## Single Recipe Manual Reindex Flow

Single recipe reindex can be used manually as a repair command.

### Step 1: Admin requests one recipe reindex

Request:

```http
POST /admin/reindex/:recipeId
```

File:
`backend/services/search-service/app/main.py`

Function:
`reindex_one(...)`

What happens next:
Search-service validates the internal token and validates that `recipe_id` is positive.

### Step 2: Search-service fetches one published recipe

File:
`backend/services/search-service/app/main.py`

Function:
`fetch_search_recipe_by_id(...)`

Function:
`fetch_core_json(...)`

Core endpoint called:

```http
GET /internal/search/recipes/:id
```

What happens next:
If core-service returns the recipe, search-service indexes it. If the recipe is not published, the internal endpoint returns 404.

### Step 3: Search-service upserts the recipe into search-db

File:
`backend/services/search-service/app/main.py`

Function:
`upsert_search_document(...)`

What happens next:
The recipe row is inserted or updated in `recipe_search_docs`.

## What Gets Indexed

Each row in `recipe_search_docs` contains:

- `recipe_id`
- `title`
- `description`
- `instructions`
- `searchable_text`
- `embedding`
- `source_updated_at`
- `indexed_at`

Table definition file:
`backend/infrastructure/postgres/search/01-init-search.sql`

Search document builder:

File:
`backend/services/search-service/app/main.py`

Function:
`normalize_recipe_document(...)`

Current `searchable_text` includes:

- title
- description
- servings
- spiciness
- rating
- ingredients
- categories
- instructions

Important detail:
Ingredients, categories, and spiciness are included inside `searchable_text`. They are not separate filter columns in `search-db` yet.

## User Search Request Flow

Frontend should call:

```http
GET /search/recipes?q=...
```

Usually frontend does not need to send `limit`.

`limit` is still supported as optional:

```http
GET /search/recipes?q=beef&limit=3
```

If `limit` is missing, search-service returns up to `12` recipes. Explicit limits are still supported for smaller result sets and are capped at `12`.

### Step 1: Frontend sends search request to API gateway

Request:

```http
GET /search/recipes?q=...
```

File:
`backend/services/api-gateway/src/routes/search.routes.ts`

Function:
`getSearchRecipesHandler(...)`

What happens next:
API gateway reads `q` and optional `limit` from the query string.

### Step 2: API gateway forwards request to search-service

File:
`backend/services/api-gateway/src/routes/search.routes.ts`

Function:
`getSearchRecipesHandler(...)`

Helper:
`getInternalHeaders(...)`

What happens next:
API gateway calls search-service:

```http
GET /search/recipes?q=...
```

It forwards internal metadata headers through `getInternalHeaders(...)`.

### Step 3: Search-service validates query parameters

File:
`backend/services/search-service/app/main.py`

Function:
`search_recipes(...)`

Endpoint:

```py
@app.get("/search/recipes")
```

What happens next:
FastAPI validates `q` length and optional `limit`. The function trims the query and rejects blank input.

### Step 4: Search-service resolves result limit

File:
`backend/services/search-service/app/main.py`

Function:
`search_recipes(...)`

What happens next:
If `limit` was provided, it is used up to a maximum of `12`. If `limit` is missing, search-service defaults to `12`.

Why:
AI search is capped to keep Gemini embedding and summary work bounded. The service no longer calls Gemini just to infer the result count.

### Step 5: Search-service creates query embedding

File:
`backend/services/search-service/app/main.py`

Function:
`search_recipe_documents(...)`

Function:
`embed_text(...)`

What happens next:
The user query is embedded with Gemini so it can be compared against stored recipe embeddings.

### Step 6: Search-service queries search-db

File:
`backend/services/search-service/app/main.py`

Function:
`search_recipe_documents(...)`

Database table:
`recipe_search_docs`

What happens next:
PostgreSQL ranks recipes using semantic similarity.

Semantic ranking:

```sql
1 - (embedding <=> query_embedding)
```

Final order:

```sql
ORDER BY score DESC, source_updated_at DESC, recipe_id DESC
```

### Step 7: Search-service builds API result data

File:
`backend/services/search-service/app/main.py`

Function:
`search_recipes(...)`

What happens next:
Search-service strips internal fields like full `searchable_text` from the public result and returns recipe IDs, titles, descriptions, timestamps, and semantic score.

### Step 8: Search-service generates summary

File:
`backend/services/search-service/app/main.py`

Function:
`generate_search_summary(...)`

What happens next:
Gemini receives the user query and retrieved recipe context, then generates a short grounded summary.

Prompt-injection mitigation:
`generate_search_summary(...)` JSON-encodes the user query and recipe context and tells Gemini to treat both as untrusted data, not instructions.

Fallback:
If Gemini summary generation fails, search-service still returns the recipe results with:

```json
"summary_status": "unavailable"
```

and summary text:

```text
Summary temporarily unavailable, but matching recipes were found.
```

### Step 9: Search-service schedules stale repair and prune tasks

File:
`backend/services/search-service/app/main.py`

Function:
`search_recipes(...)`

Background functions:
`refresh_search_documents_if_stale(...)`
`prune_deleted_search_documents_if_due(...)`

What happens next:
After responding, search-service can repair stale indexed rows and periodically prune deleted/unpublished recipes.

### Step 10: API gateway returns response to frontend

File:
`backend/services/api-gateway/src/routes/search.routes.ts`

Function:
`getSearchRecipesHandler(...)`

What happens next:
API gateway returns the search-service JSON response to frontend.

Response shape:

```json
{
  "query": "beef recipe",
  "summary": "...",
  "summary_status": "ok",
  "count": 1,
  "limit": 1,
  "data": []
}
```

## Freshness And Stale Repair

Search-db is a derived index, so indexed rows can become stale if the source recipe changes.

### Step 1: Search response is returned first

File:
`backend/services/search-service/app/main.py`

Function:
`search_recipes(...)`

What happens next:
The user gets the current search result without waiting for maintenance work.

### Step 2: Search-service checks returned results against core-service

File:
`backend/services/search-service/app/main.py`

Function:
`refresh_search_documents_if_stale(...)`

Function:
`fetch_search_recipe_by_id(...)`

What happens next:
For returned recipes, search-service compares `source_updated_at` stored in `search-db` against current `updated_at` from core-service.

### Step 3: Stale rows are reindexed

File:
`backend/services/search-service/app/main.py`

Function:
`refresh_search_documents_if_stale(...)`

Function:
`upsert_search_document(...)`

What happens next:
If core-service has a newer `updated_at`, the recipe is reindexed.

### Step 4: Missing rows are deleted from search-db

File:
`backend/services/search-service/app/main.py`

Function:
`refresh_search_documents_if_stale(...)`

Function:
`delete_search_document(...)`

What happens next:
If core-service returns 404 for a previously indexed recipe, search-service deletes that row.

## Periodic Prune

Deleted or unpublished recipes can also be pruned by a periodic maintenance task.

### Step 1: Search endpoint schedules prune task

File:
`backend/services/search-service/app/main.py`

Function:
`search_recipes(...)`

Background function:
`prune_deleted_search_documents_if_due(...)`

What happens next:
The task runs after the response, but only if the cooldown interval has passed.

### Step 2: Prune task fetches all active published recipes

File:
`backend/services/search-service/app/main.py`

Function:
`prune_deleted_search_documents_if_due(...)`

Function:
`fetch_all_search_recipes(...)`

What happens next:
Search-service gets the current active published recipe IDs from core-service.

### Step 3: Prune task deletes stale search rows

File:
`backend/services/search-service/app/main.py`

Function:
`prune_deleted_search_documents_if_due(...)`

Function:
`delete_search_document(...)`

What happens next:
Rows in `recipe_search_docs` that are no longer active published recipe IDs are deleted.

## Failure Behavior

### Gemini embedding fails during publish-triggered reindex

File:
`backend/services/core-service/src/services/searchIndex.service.ts`

Function:
`scheduleRecipeSearchReindex(...)`

File:
`backend/services/search-service/app/main.py`

Function:
`embed_text(...)`

Behavior:
The recipe stays published. Core-service logs the reindex failure. The recipe may not appear in search until a manual retry or full reindex succeeds.

### Gemini summary generation fails during search

File:
`backend/services/search-service/app/main.py`

Function:
`generate_search_summary(...)`

Function:
`search_recipes(...)`

Behavior:
Search-service still returns matching recipes with `summary_status: unavailable`.

### Gemini summary generation fails during search

File:
`backend/services/search-service/app/main.py`

Function:
`generate_search_summary(...)`

Behavior:
Search-service still returns matching recipes with `summary_status: unavailable`.

### Internal token is missing or wrong

File:
`backend/services/search-service/app/main.py`

Function:
`require_internal_service_token(...)`

Behavior:
Admin reindex endpoints reject the request with `503` if the service token is not configured, or `403` if the header does not match.

## Current Practical Scope

This implementation is designed for the school-project deadline.

It provides:

- internal recipe export endpoints from `core-service`
- automatic single-recipe reindex after publish
- manual full reindex job support
- manual single-recipe reindex support
- separate `search-db`
- Gemini embeddings
- semantic recipe retrieval with pgvector
- Gemini-generated search summaries with fallback
- one frontend-facing search endpoint through `api-gateway`

It does not yet provide:

- a persistent retry queue for failed indexing
- structured metadata filters in `search-db`
- production-grade distributed job processing

## Short Summary

If you only remember one flow, remember this:

1. User publishes recipe.

File:
`backend/services/core-service/src/services/recipes.service.ts`

Function:
`publishRecipe(...)`

2. Core-service starts targeted search reindex.

File:
`backend/services/core-service/src/services/searchIndex.service.ts`

Function:
`scheduleRecipeSearchReindex(...)`

3. Search-service fetches the published recipe from core-service.

File:
`backend/services/search-service/app/main.py`

Function:
`fetch_search_recipe_by_id(...)`

4. Search-service builds searchable text and embedding.

File:
`backend/services/search-service/app/main.py`

Function:
`normalize_recipe_document(...)`
`embed_text(...)`

5. Search-service upserts the indexed document into search-db.

File:
`backend/services/search-service/app/main.py`

Function:
`upsert_search_document(...)`

6. Frontend search can now find the recipe.

File:
`backend/services/search-service/app/main.py`

Function:
`search_recipes(...)`
