CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS recipe_search_docs (
  recipe_id integer PRIMARY KEY,
  title varchar(256) NOT NULL,
  description text,
  instructions text NOT NULL,
  searchable_text text NOT NULL,
  embedding vector(768),
  source_updated_at timestamptz NOT NULL,
  indexed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipe_search_docs_source_updated_at
  ON recipe_search_docs (source_updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipe_search_docs_indexed_at
  ON recipe_search_docs (indexed_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipe_search_docs_embedding_cosine
  ON recipe_search_docs
  USING hnsw (embedding vector_cosine_ops);
