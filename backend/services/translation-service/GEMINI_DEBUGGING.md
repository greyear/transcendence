# Translation Service Gemini Debugging

Use this when `/translate` fails or recipe translation stays duplicated across locales.

## What Uses Gemini

Translation-service uses `GEMINI_GEN_MODEL` for all translation requests. It does not use embeddings.

Recipe create/update flows are designed to keep working if translation fails. In that case source text may remain duplicated across locales until translation succeeds.

## Check Container Environment

Do not print the API key value. Check only whether it exists:

```bash
docker compose exec translation-service sh -lc 'echo "GEMINI_GEN_MODEL=$GEMINI_GEN_MODEL"; test -n "$GEMINI_API_KEY" && echo "GEMINI_API_KEY=set" || echo "GEMINI_API_KEY=missing"'
```

Expected:

```text
GEMINI_API_KEY=set
```

If a value was added or changed in `.env`, recreate the service:

```bash
docker compose up -d --build --force-recreate translation-service
```

## Test Generation Directly

Use `-T` because heredoc input is not a TTY:

```bash
docker compose exec -T translation-service python - <<'PY'
import os
from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
try:
    response = client.models.generate_content(
        model=os.environ["GEMINI_GEN_MODEL"],
        contents='Return strict JSON only: {"translations":{"en":"Pasta"}}',
    )
    print("OK:", (response.text or "").strip())
except Exception as error:
    print("FAILED:", error)
PY
```

If this fails, `/translate` will fail too.

## Inspect Logs

For translation request failures:

```bash
docker compose logs --tail=250 translation-service \
  | sed -n '/Gemini translation request failed/,+100p'
```

For invalid JSON returned by Gemini:

```bash
docker compose logs --tail=250 translation-service \
  | sed -n '/Gemini translation payload was not valid JSON/,+80p'
```

## Common Errors

`429 RESOURCE_EXHAUSTED` means quota or rate limit is exhausted for that model and key. The response usually says which metric failed, for example request-per-minute, request-per-day, or input-token quota.

`403 PERMISSION_DENIED` usually means the key or project is not allowed to use that API/model.

`404 NOT_FOUND` usually means the configured model name is not available to the current API/key.

`GEMINI_API_KEY=missing` means Compose did not pass the key into the container. Check root `.env`, `docker-compose.yml`, and recreate the service.

`Gemini returned invalid translation JSON` means Gemini answered, but not in the strict JSON shape translation-service expects.

## Useful Recovery Checks

Run the internal translation request from the test guide again:

```bash
docker compose exec translation-service python -c "import json, os, urllib.request; req = urllib.request.Request('http://127.0.0.1:8001/translate', data=json.dumps({'source_language':'fi','target_languages':['en','ru'],'text':'Pasta'}).encode(), headers={'Content-Type':'application/json','X-Internal-Service-Token': os.environ.get('INTERNAL_SERVICE_TOKEN','')}, method='POST'); print(urllib.request.urlopen(req).read().decode())"
```

If direct Gemini generation works but `/translate` fails, inspect the translation-service logs for payload validation or JSON-shape errors.
