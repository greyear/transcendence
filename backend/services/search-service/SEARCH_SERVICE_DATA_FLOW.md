# Search Service Data Flow

This file explains the current search feature in plain language for PR reviewers.

The goal of this feature is simple:

- keep recipe source-of-truth data in `core-service`
- build a separate search index in `search-service`
- let the frontend call one search endpoint through `api-gateway`
- return both:
  - a short Gemini-generated summary
  - the list of matching recipes

## Big Picture

There are 4 moving parts:

1. `core-service`
- owns the real recipe data in `core-db`

2. `search-service`
- fetches recipe data from `core-service`
- transforms it into search-ready documents
- stores those documents in `search-db`
- answers search requests

3. `search-db`
- separate PostgreSQL database for indexed search documents

4. `api-gateway`
- exposes the search endpoint to frontend
- forwards requests to `search-service`

## Why A Separate Search Service Exists

We do not want `search-service` to connect directly to `core-db`.

Instead:
- `core-service` owns recipe data
- `search-service` consumes recipe data through internal HTTP endpoints

This keeps service boundaries clean:
- `core-service` stays source of truth
- `search-service` stays consumer/indexer

## Core-Service Internal Endpoints

`search-service` gets its source data from:

- `GET /internal/search/recipes`
- `GET /internal/search/recipes/:id`

These endpoints are internal only.

They return the fields needed for search indexing, including:
- title
- description
- instructions
- servings
- spiciness
- rating
- ingredients
- categories
- updated_at

## Reindex Flow

Reindexing is how `search-db` gets populated or refreshed.

There are 2 admin endpoints in `search-service`:

- `POST /admin/reindex`
- `POST /admin/reindex/{recipe_id}`

### Full reindex

Flow:

1. `search-service` calls `core-service /internal/search/recipes`
2. it receives published recipe documents
3. each recipe is normalized into one search document
4. one combined `searchable_text` field is built
5. Gemini creates an embedding vector from that text
6. the document is inserted or updated in `search-db`

### Single recipe reindex

Flow:

1. `search-service` calls `core-service /internal/search/recipes/{id}`
2. it normalizes that one recipe
3. Gemini generates the embedding
4. the row is upserted into `search-db`

## What Gets Indexed

Each search document combines recipe data into text that is useful for semantic search.

Current indexed content includes:
- title
- description
- servings
- spiciness
- rating
- ingredients
- categories
- instructions

Important detail:

- ingredients, categories, and spiciness are currently included through `searchable_text`
- they are not separate structured columns in `search-db`
- this is enough for retrieval and embeddings, even if it is not yet full metadata filtering

## Search Request Flow

The frontend should call:

- `GET /search/recipes?q=...&limit=...`

through `api-gateway`, not directly through `search-service`.

### Full request path

1. user types a search query in frontend
2. frontend sends request to `api-gateway`
3. `api-gateway` route forwards the request to `search-service`
4. `search-service` searches `search-db`
5. `search-service` returns:
  - summary
  - matching recipes
6. `api-gateway` returns that response back to frontend

## What Happens Inside `/search/recipes`

When `/search/recipes` is called:

1. the query text is validated
2. Gemini creates an embedding for the query
3. `search-service` compares that query embedding against stored recipe embeddings in `search-db`
4. PostgreSQL returns the best matching recipe documents
5. Gemini generates a short summary from those retrieved documents
6. the endpoint returns:
  - `query`
  - `summary`
  - `count`
  - `data`

So this endpoint now does two things:
- retrieval
- grounded LLM summary

## Why Summary And Results Are Returned Together

We intentionally kept one frontend-facing search endpoint:

- `/search/recipes`

instead of creating a separate `/rag/ask` endpoint.

Reason:
- less frontend work
- simpler project structure
- easier to explain in a school project
- one search action gives both:
  - human-readable summary
  - raw recipe results

## Freshness / Stale Repair

After returning results, `search-service` can check whether those indexed recipes are stale.

It compares:
- `source_updated_at` stored in `search-db`
against
- current `updated_at` from `core-service`

If a mismatch is detected:
- the stale recipe is reindexed in the background

This means:
- users get the best current response immediately
- stale index entries get repaired after the response

## Databases

### `core-db`
- owned by `core-service`
- stores real recipe data

### `search-db`
- owned by `search-service`
- stores indexed search documents in `recipe_search_docs`

This separation is intentional.

`search-db` is not the source of truth.
It is a search index built from the source of truth.

## Current Practical Scope

This implementation is designed for the school-project deadline.

It currently provides:
- internal recipe export endpoints from `core-service`
- search indexing into a separate DB
- Gemini embeddings
- semantic recipe retrieval
- Gemini-generated search summary
- one frontend-facing search endpoint via `api-gateway`

It is not trying to be a full production search platform.

That is intentional.

## Short Summary

If you only remember one thing, it is this:

- `core-service` owns recipe data
- `search-service` copies and transforms that data into a search index
- frontend calls `/search/recipes` through `api-gateway`
- `search-service` returns both:
  - a Gemini summary
  - matching recipes from `search-db`
