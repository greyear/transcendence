# Search Service Gemini Debugging

Use this when search results, summaries, or reindexing fail in ways that mention Gemini.

## What Uses Gemini

Search-service uses Gemini in two different paths:

- embeddings: `GEMINI_EMBED_MODEL`, used for reindexing recipes and embedding user search queries
- summaries: `GEMINI_GEN_MODEL`, used after matching recipes are found

Embeddings can work while generation fails. In that case search can still return recipe results, but `summary_status` may be `"unavailable"`.

## Check Container Environment

Do not print the API key value. Check only whether it exists:

```bash
docker compose exec search-service sh -lc 'echo "GEMINI_GEN_MODEL=$GEMINI_GEN_MODEL"; echo "GEMINI_EMBED_MODEL=$GEMINI_EMBED_MODEL"; test -n "$GEMINI_API_KEY" && echo "GEMINI_API_KEY=set" || echo "GEMINI_API_KEY=missing"'
```

Expected:

```text
GEMINI_API_KEY=set
```

If a value was added or changed in `.env`, recreate the service:

```bash
docker compose up -d --build --force-recreate search-service
```

## Test Generation Directly

Use `-T` because heredoc input is not a TTY:

```bash
docker compose exec -T search-service python - <<'PY'
import os
from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
try:
    response = client.models.generate_content(
        model=os.environ["GEMINI_GEN_MODEL"],
        contents="Return only: ok",
    )
    print("OK:", (response.text or "").strip())
except Exception as error:
    print("FAILED:", error)
PY
```

If this fails, summary generation will fail too.

## Test Embeddings Directly

```bash
docker compose exec -T search-service python - <<'PY'
import os
from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
try:
    response = client.models.embed_content(
        model=os.environ.get("GEMINI_EMBED_MODEL", "gemini-embedding-001"),
        contents="chicken recipe",
    )
    values = response.embeddings[0].values
    print("OK: embedding dimensions =", len(values))
except Exception as error:
    print("FAILED:", error)
PY
```

If this fails, reindexing and search queries cannot create vectors.

## Inspect Logs

For summary generation failures:

```bash
docker compose logs --tail=250 search-service \
  | sed -n '/Gemini summary generation failed/,+100p'
```

For embedding failures:

```bash
docker compose logs --tail=250 search-service \
  | sed -n '/Gemini embedding request failed/,+100p'
```

## Common Errors

`429 RESOURCE_EXHAUSTED` means quota or rate limit is exhausted for that model and key. The response usually says which metric failed, for example request-per-minute, request-per-day, or input-token quota.

`403 PERMISSION_DENIED` usually means the key or project is not allowed to use that API/model.

`404 NOT_FOUND` usually means the configured model name is not available to the current API/key.

`GEMINI_API_KEY=missing` means Compose did not pass the key into the container. Check root `.env`, `docker-compose.yml`, and recreate the service.

## Useful Recovery Checks

Verify search still degrades safely when summary generation fails:

```bash
curl -s "http://localhost:8000/search/recipes?q=chicken" | jq '.summary_status,.count,.data[0].score'
```

If `summary_status` is `"unavailable"` but `data` contains recipes, semantic search is still working and only Gemini generation is unavailable.
