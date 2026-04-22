# Search Service Test Guide

This file gives reviewers a quick way to test the current search flow without reading all implementation details first.

## What This Feature Covers

The search flow currently provides:

- recipe reindexing into `search-db`
- semantic recipe retrieval through `search-service`
- Gemini-generated search summaries
- fallback summary behavior when Gemini summary generation is unavailable
- optional result-count override through `limit`, capped at `12`
- default AI search result count of `12` when `limit` is omitted

## Services Involved

To test this feature, these services should be running:

- `api-gateway`
- `core-service`
- `core-db`
- `search-service`
- `search-db`

If needed, restart the relevant services with current code:

```bash
docker compose up -d --build search-service core-service api-gateway
```

## 1. Reindex Recipes

Full reindex:

```bash
set -a; source .env; set +a
curl -s -X POST http://localhost:8000/admin/reindex \
  -H "X-Internal-Service-Token: $INTERNAL_SERVICE_TOKEN" | jq
```

What to check:

- response returns quickly
- `status` is `accepted`
- response includes a `job_id`

Example expected shape:

```json
{
  "status": "accepted",
  "scope": "all",
  "job_id": "91e27f62-0d95-49a6-93ea-f9381c9d5669",
  "job_status": "queued",
  "status_url": "/admin/reindex/jobs/91e27f62-0d95-49a6-93ea-f9381c9d5669"
}
```

Check job progress:

```bash
JOB_ID="<job_id from the previous response>"
curl -s "http://localhost:8000/admin/reindex/jobs/$JOB_ID" \
  -H "X-Internal-Service-Token: $INTERNAL_SERVICE_TOKEN" | jq
```

What to check:

- `status` eventually becomes `completed`
- `indexed_count` looks reasonable for the seeded/local dataset

## 2. Inspect Indexed Search Data

Optional DB check:

```bash
docker compose exec search-db psql -U search_user -d search_db -c "SELECT recipe_id, title FROM recipe_search_docs ORDER BY recipe_id;"
```

What to check:

- rows exist in `recipe_search_docs`
- indexed recipes roughly match what exists in `core-db`

## 3. Test A Normal Search Query

Example:

```bash
curl -s "http://localhost:3000/search/recipes?q=chicken" | jq
```

What to check:

- response includes:
  - `query`
  - `summary`
  - `summary_status`
  - `count`
  - `limit`
  - `data`
- top matches are sensible for the query

## 4. Test Default AI Search Result Count

Example:

```bash
curl -s "http://localhost:3000/search/recipes?q=give%20me%20the%20best%20beef%20recipe" | jq
```

What to check:

- `limit` is `12`
- `count` is at most `12`
- matching recipes are returned

Broader example:

```bash
curl -s "http://localhost:3000/search/recipes?q=show%20me%20some%20chicken%20recipes" | jq
```

What to check:

- `limit` is `12`
- `count` is at most `12`

## 5. Test Explicit `limit` Override

Example:

```bash
curl -s "http://localhost:3000/search/recipes?q=chicken&limit=2" | jq
```

What to check:

- `limit` is `2`
- `count` is at most `2`
- explicit `limit` overrides the default result count

Also verify that requests above the AI max are rejected:

```bash
curl -s "http://localhost:3000/search/recipes?q=chicken&limit=13" | jq
```

What to check:

- response is a validation error
- AI search never returns more than `12` recipes

## 6. Test Summary Fallback Behavior

If Gemini summary generation is temporarily unavailable, the endpoint should still return recipe results.

What to check in that case:

- `summary_status` becomes `"unavailable"`
- `summary` becomes:

```text
Summary temporarily unavailable, but matching recipes were found.
```

- `data` still contains recipe results

This is expected and intentional.

## Reviewer Notes

The easiest high-value checks are:

1. run full reindex
2. run one normal search query
3. run one default query to confirm `limit` defaults to `12`
4. run one explicit `limit=2` query to confirm smaller limits work

If those pass, the current search flow is working as intended.
