# Translation Service Data Flow

This file explains the current translation feature in plain language for PR reviewers.

The goal of this feature is simple:

- keep recipe create/update responses fast
- store multilingual recipe text in `core-db`
- translate recipe content in the background
- support reads in `en`, `fi`, and `ru`

## Big Picture

There are 4 moving parts:

1. `frontend`
- sends recipe create/update requests
- tells backend what language the user wrote in through `X-Source-Language`
- can request a read locale through `?lang=` or `X-Language`

2. `api-gateway`
- exposes public recipe endpoints
- forwards recipe requests to `core-service`
- now preserves query strings like `?lang=fi`

3. `core-service`
- owns the real recipe data in `core-db`
- stores placeholder multilingual JSONB immediately
- calls the translation service after commit
- returns the requested locale when recipes are fetched

4. `translation-service`
- small Gemini-backed HTTP service
- accepts either one text or many texts
- returns strict JSON translations for the requested target languages
- is intended for internal service-to-service use, not direct public access

## Why A Separate Translation Service Exists

We do not call Gemini directly from every recipe route.

Instead:
- `core-service` owns recipe logic and DB writes
- `translation-service` owns LLM translation calls

This keeps responsibilities separate:
- `core-service` stays source of truth and orchestration layer
- `translation-service` stays an adapter around Gemini

## Source Locale Vs Requested Locale

These are different ideas:

- source locale
  - the language the user originally wrote the recipe in
  - comes from `X-Source-Language`

- requested locale
  - the language the client wants in the response
  - comes from `?lang=` or `X-Language`

Example:
- user writes recipe in Finnish
- frontend sends `X-Source-Language: fi`
- frontend may still request `?lang=en` for the response

## Recipe Create/Update Flow

When a recipe is created or updated:

1. frontend sends the recipe body
2. `core-service` resolves:
  - requested locale
  - source locale
3. `core-service` duplicates the source text into all locales temporarily
4. recipe is saved immediately to `core-db`
5. response returns quickly
6. after commit, a background localization task starts
7. that task calls `translation-service`
8. translated values are written back into JSONB fields

This gives fast writes without forcing the user to wait for translation.

## Placeholder-First Strategy

Before real translations exist, `core-service` stores placeholders like:

```json
{
  "en": "Pasta",
  "fi": "Pasta",
  "ru": "Pasta"
}
```

That means:
- the row is immediately usable
- all locales have at least some content
- later the async translation replaces the non-source locales with real translations

## What Gets Translated

Current scope:

- `title`
- `description`
- `instructions`

Important detail:

- `title` and `description` are translated as single text values
- `instructions` is translated as a batch because it is an array of step strings

Ingredients and categories are not translated by this service right now.

## Translation Endpoint

There is one endpoint in `translation-service`:

- `POST /translate`

If `INTERNAL_SERVICE_TOKEN` is configured, callers must send `X-Internal-Service-Token`.

It supports 2 payload shapes.

### Single text

Used for:
- `title`
- `description`

Request:

```json
{
  "source_language": "fi",
  "target_languages": ["en", "ru"],
  "text": "Pasta"
}
```

Response:

```json
{
  "translations": {
    "en": "Pasta",
    "ru": "Паста"
  }
}
```

### Batch texts

Used for:
- `instructions`

Request:

```json
{
  "source_language": "fi",
  "target_languages": ["en", "ru"],
  "texts": ["Keita vesi", "Lisää pasta"]
}
```

Response:

```json
{
  "translations": {
    "en": ["Boil water", "Add pasta"],
    "ru": ["Вскипятите воду", "Добавьте пасту"]
  }
}
```

## What Happens Inside `translation-service`

When `/translate` is called:

1. request body is validated with Pydantic
2. service confirms:
  - source locale is supported
  - target locales are supported
  - source locale is not also a target
  - exactly one of `text` or `texts` exists
3. service builds a strict JSON-only prompt for Gemini
4. Gemini generates translations
5. response text is parsed as JSON
6. translations are sanitized and shape-checked
7. service returns `{ "translations": ... }`

If Gemini returns invalid JSON or invalid values:
- `translation-service` returns an error

## Core-Service Fallback Behavior

If translation fails or times out, `core-service` does not fail the recipe write.

Instead:
- it keeps the placeholder source text in all locales

That fallback is intentional.

It means:
- users can still create and update recipes
- multilingual structure still exists in DB
- translation failure does not block recipe writes

## Read Flow

When recipes are fetched:

1. client sends `?lang=fi` or `X-Language: fi`
2. `api-gateway` forwards that query/header
3. `core-service` resolves the requested locale
4. SQL reads the localized JSONB value
5. if the requested locale is missing, English fallback is used

So even though the DB stores multilingual JSONB objects, the API returns one selected locale value to the client.

## Why JSONB Is Used

Recipe text fields are stored in PostgreSQL as JSONB objects like:

```json
{
  "en": "Apple pie",
  "fi": "Omenapiirakka",
  "ru": "Яблочный пирог"
}
```

This is a good fit because:
- one field can hold all locale variants
- SQL can read one locale by key
- English fallback is easy to express in queries

## Current Practical Scope

This implementation is designed for the school-project deadline.

It currently provides:
- multilingual recipe text storage
- async translation after create/update
- Gemini-backed translation microservice
- support for `en`, `fi`, `ru`
- public locale selection through gateway and core-service

It is not trying to localize every user-facing string in the whole project yet.

That is intentional.

## Short Summary

If you only remember one thing, it is this:

- frontend tells backend what language the user wrote in
- `core-service` saves placeholder multilingual JSONB immediately
- background localization calls `translation-service`
- `translation-service` asks Gemini for translations
- later recipe reads return the requested locale through normal recipe endpoints
