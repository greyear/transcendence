# Translation Service Test Guide

This file gives a quick way for reviewers to test the translation feature without reading all implementation details first.

## What This Feature Covers

The translation flow currently applies to recipe text fields:

- `title`
- `description`
- `instructions`

It supports 3 locales:

- `en`
- `fi`
- `ru`

## Services Involved

To test this feature, these services should be running:

- `api-gateway`
- `core-service`
- `core-db`
- `translation-service`

If needed, restart the relevant services with current code:

```bash
docker compose up -d --build translation-service core-service api-gateway
```

## 1. Test Translation Service From Inside The Container

### Health check

```bash
docker compose exec translation-service python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8001/health').read().decode())"
```

Expected:

```json
{"status":"ok","service":"translation-service"}
```

### Single text translation

```bash
docker compose exec translation-service python -c "import json, os, urllib.request; req = urllib.request.Request('http://127.0.0.1:8001/translate', data=json.dumps({'source_language':'fi','target_languages':['en','ru'],'text':'Pasta'}).encode(), headers={'Content-Type':'application/json','X-Internal-Service-Token': os.environ.get('INTERNAL_SERVICE_TOKEN','')}, method='POST'); print(urllib.request.urlopen(req).read().decode())"
```

What to check:

- response has `translations`
- response includes only requested target languages
- values are strings

### Batch translation

```bash
docker compose exec translation-service python -c "import json, os, urllib.request; req = urllib.request.Request('http://127.0.0.1:8001/translate', data=json.dumps({'source_language':'fi','target_languages':['en','ru'],'texts':['Keita vesi','Lisää pasta']}).encode(), headers={'Content-Type':'application/json','X-Internal-Service-Token': os.environ.get('INTERNAL_SERVICE_TOKEN','')}, method='POST'); print(urllib.request.urlopen(req).read().decode())"
```

What to check:

- response has `translations`
- each target language maps to an array
- arrays preserve input order
- array lengths match the input list length

## 2. Test Recipe Create Flow With Source Language

Create a recipe through the public API:

```bash
curl -s -X POST http://localhost:3000/recipes \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -H "X-Source-Language: fi" \
  -d '{
    "title": "Pasta",
    "description": "Helppo pasta",
    "instructions": ["Keita vesi", "Lisää pasta"],
    "servings": 2,
    "spiciness": 1,
    "ingredients": [
      { "ingredient_id": 1, "amount": 200, "unit": "g" }
    ],
    "category_ids": []
  }' | jq
```

What to check:

- request succeeds
- recipe is created immediately
- user does not need to wait for translation to finish

## 3. Inspect Stored Translations In `core-db`

Check the newest recipe row:

```bash
docker compose exec core-db psql -U core_user -d core_db -c "SELECT id, title, description, instructions FROM recipes ORDER BY id DESC LIMIT 1;"
```

What to check:

- `title`, `description`, and `instructions` are stored as multilingual JSONB
- initially, values may be duplicated from the source text
- shortly after, translated values should appear for the non-source locales

If needed, wait a few seconds and run the query again:

```bash
sleep 3
docker compose exec core-db psql -U core_user -d core_db -c "SELECT id, title, description, instructions FROM recipes ORDER BY id DESC LIMIT 1;"
```

## 4. Test Localized Reads Through Public API

Replace `ID_HERE` with the created recipe ID.

```bash
curl -s "http://localhost:3000/recipes/ID_HERE?lang=fi" | jq
curl -s "http://localhost:3000/recipes/ID_HERE?lang=en" | jq
curl -s "http://localhost:3000/recipes/ID_HERE?lang=ru" | jq
```

What to check:

- the same recipe can be fetched in different locales
- `api-gateway` preserves `?lang=`
- `core-service` returns the requested locale value
- English fallback is used if a locale value is missing

## 5. Test Fallback Behavior

The system is designed so recipe create/update does not fail just because translation is unavailable.

If translation fails:

- recipe write should still succeed
- placeholder text may remain duplicated across locales

This is acceptable current behavior for project scope.

## Reviewer Notes

The easiest high-value checks are:

1. internal `/translate` single-text request
2. internal `/translate` batch request
3. one recipe create with `X-Source-Language`
4. one localized recipe read with `?lang=fi`

If those pass, the core translation flow is working.
