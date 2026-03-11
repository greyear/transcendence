import os
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, Query

app = FastAPI(title="search-service", version="0.1.0")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "search-service",
        "time": utc_now_iso(),
    }


@app.post("/admin/reindex")
def reindex_all() -> dict[str, Any]:
    # Full indexing logic to be implemented
    return {
        "status": "accepted",
        "scope": "all",
        "provider": os.getenv("LLM_PROVIDER", "gemini"),
    }


@app.post("/admin/reindex/{recipe_id}")
def reindex_one(recipe_id: int) -> dict[str, Any]:
    if recipe_id <= 0:
        raise HTTPException(status_code=400, detail="recipe_id must be positive")

    # Single-record indexing logic to be iomplemented
    return {
        "status": "accepted",
        "scope": "single",
        "recipe_id": recipe_id,
    }


@app.get("/search/recipes")
def search_recipes(q: str = Query(..., min_length=1, max_length=500)) -> dict[str, Any]:
    # Vector search logic to be i9mplemented 
    return {
        "query": q.strip(),
        "count": 0,
        "data": [],
    }
