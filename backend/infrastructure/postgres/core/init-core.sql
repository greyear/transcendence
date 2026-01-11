CREATE TABLE "users" (
  "id" varchar PRIMARY KEY,
  "username" varchar(32) NOT NULL,
  "avatar" bytea,
  "status" varchar(16)
    CHECK (status IN ('online', 'offline')),
  "role" varchar(16) NOT NULL
    CHECK (role IN ('guest', 'user', 'admin')),
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE TABLE "followers" (
  "user_id" varchar NOT NULL,
  "followed_id" varchar NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "recipes" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "title" varchar(256) NOT NULL,
  "description" text,
  "instructions" text NOT NULL,
  "spiciness" smallint CHECK (spiciness BETWEEN 0 AND 3),
  "author_id" varchar NOT NULL,
  "status" varchar(16) NOT NULL
    CHECK (status IN ('draft', 'published', 'archived')),
  "rating_avg" numeric(3,2)
    CHECK (rating_avg BETWEEN 1.00 AND 5.00),
  "rating_count" integer NOT NULL DEFAULT 0
    CHECK (rating_count >= 0),
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE TABLE "ingredients" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "name" varchar(128) UNIQUE NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "recipe_ingredients" (
  "recipe_id" integer NOT NULL,
  "ingredient_id" integer NOT NULL,
  "amount" numeric
    CHECK (amount > 0),
  "unit" varchar(16)
    CHECK (unit IN ('g','kg','ml','l','tsp','tbsp','cup','oz','lb'))
);

CREATE TABLE "recipe_category_types" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "code" varchar(32) UNIQUE NOT NULL,
  "name" varchar(64) NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "recipe_categories" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "category_type_id" integer NOT NULL,
  "code" varchar(32) NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "recipe_category_map" (
  "recipe_id" integer NOT NULL,
  "category_id" integer NOT NULL
);

CREATE TABLE "ingredient_categories" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "code" varchar(32) UNIQUE NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "ingredient_category_correspondence" (
  "ingredient_id" integer NOT NULL,
  "category_id" integer NOT NULL
);

CREATE TABLE "allergens" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "code" varchar(32) UNIQUE NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "allergen_categories" (
  "allergen_id" integer NOT NULL,
  "category_id" integer NOT NULL
);

CREATE TABLE "diets" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "code" varchar(32) UNIQUE NOT NULL,
  "name" varchar(128) NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "diet_restricted_categories" (
  "diet_id" integer NOT NULL,
  "category_id" integer NOT NULL
);

CREATE TABLE "favorites" (
  "user_id" varchar NOT NULL,
  "recipe_id" integer NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "recipe_shares" (
  "user_id" varchar NOT NULL,
  "recipe_id" integer NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "recipe_media" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "recipe_id" integer NOT NULL,
  "type" varchar(16) NOT NULL
    CHECK (type IN ('image', 'video')),
  "url" varchar(2048) NOT NULL,
  "position" integer
    CHECK (position >= 0),
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "recipe_comments" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "recipe_id" integer NOT NULL,
  "author_id" varchar NOT NULL,
  "parent_comment_id" integer,
  "body" text NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE TABLE "recipe_ratings" (
  "user_id" varchar NOT NULL,
  "recipe_id" integer NOT NULL,
  "rating" smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX ON "followers" ("user_id", "followed_id");

CREATE UNIQUE INDEX ON "recipe_ingredients" ("recipe_id", "ingredient_id");

CREATE UNIQUE INDEX ON "recipe_categories" ("category_type_id", "code");

CREATE UNIQUE INDEX ON "recipe_category_map" ("recipe_id", "category_id");

CREATE UNIQUE INDEX ON "ingredient_category_correspondence" ("ingredient_id", "category_id");

CREATE UNIQUE INDEX ON "allergen_categories" ("allergen_id", "category_id");

CREATE UNIQUE INDEX ON "diet_restricted_categories" ("diet_id", "category_id");

CREATE UNIQUE INDEX ON "favorites" ("user_id", "recipe_id");

CREATE UNIQUE INDEX ON "recipe_shares" ("user_id", "recipe_id");

CREATE INDEX ON "recipe_comments" ("recipe_id", "created_at");

CREATE INDEX ON "recipe_comments" ("parent_comment_id");

CREATE UNIQUE INDEX ON "recipe_ratings" ("user_id", "recipe_id");

COMMENT ON COLUMN "users"."id" IS 'User ID from auth service (UUID, for example)';

COMMENT ON COLUMN "users"."avatar" IS 'Original pic is stored in the DB, we need to set the limit for the size';

COMMENT ON COLUMN "users"."status" IS 'online | offline (visible only to mutual followers)';

COMMENT ON COLUMN "users"."role" IS 'admin | user | guest';

COMMENT ON COLUMN "users"."updated_at" IS 'Used to detect profile changes or reset cache';

COMMENT ON COLUMN "followers"."user_id" IS 'User who follows';

COMMENT ON COLUMN "followers"."followed_id" IS 'User being followed';

COMMENT ON COLUMN "recipes"."description" IS 'Short recipe summary or preview text';

COMMENT ON COLUMN "recipes"."instructions" IS 'Full step-by-step cooking instructions';

COMMENT ON COLUMN "recipes"."spiciness" IS '0 = none, 1 = mild, 2 = medium, 3 = hot';

COMMENT ON COLUMN "recipes"."author_id" IS 'Reference to users.id (auth service user ID)';

COMMENT ON COLUMN "recipes"."status" IS 'draft | published | archived';

COMMENT ON COLUMN "recipes"."rating_avg" IS 'Average rating (1.0–5.0)';

COMMENT ON COLUMN "recipes"."rating_count" IS 'Total number of ratings';

COMMENT ON COLUMN "recipe_ingredients"."amount" IS 'Ingredient amount';

COMMENT ON COLUMN "recipe_ingredients"."unit" IS 'g, ml, pcs, etc.';

COMMENT ON COLUMN "recipe_category_types"."code" IS 'meal_time, dish_type, main_ingredient, cuisine';

COMMENT ON COLUMN "ingredient_categories"."code" IS 'nuts, dairy, meat, fish, grains, spices';

COMMENT ON COLUMN "allergens"."code" IS 'nuts, lactose, gluten, eggs';

COMMENT ON COLUMN "diets"."code" IS 'vegan, vegetarian';

COMMENT ON COLUMN "recipe_shares"."user_id" IS 'User who shared the recipe';

COMMENT ON COLUMN "recipe_media"."type" IS 'image | video';

COMMENT ON COLUMN "recipe_comments"."author_id" IS 'users.id';

COMMENT ON COLUMN "recipe_ratings"."user_id" IS 'User who rated the recipe';

COMMENT ON COLUMN "recipe_ratings"."rating" IS '1–5 stars';

ALTER TABLE "recipes" ADD FOREIGN KEY ("author_id") REFERENCES "users" ("id");

ALTER TABLE "recipe_ingredients" ADD FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id");

ALTER TABLE "recipe_ingredients" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id");

ALTER TABLE "followers" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "followers" ADD FOREIGN KEY ("followed_id") REFERENCES "users" ("id");

ALTER TABLE "recipe_categories" ADD FOREIGN KEY ("category_type_id") REFERENCES "recipe_category_types" ("id");

ALTER TABLE "recipe_category_map" ADD FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id");

ALTER TABLE "recipe_category_map" ADD FOREIGN KEY ("category_id") REFERENCES "recipe_categories" ("id");

ALTER TABLE "ingredient_category_correspondence" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id");

ALTER TABLE "ingredient_category_correspondence" ADD FOREIGN KEY ("category_id") REFERENCES "ingredient_categories" ("id");

ALTER TABLE "allergen_categories" ADD FOREIGN KEY ("allergen_id") REFERENCES "allergens" ("id");

ALTER TABLE "allergen_categories" ADD FOREIGN KEY ("category_id") REFERENCES "ingredient_categories" ("id");

ALTER TABLE "diet_restricted_categories" ADD FOREIGN KEY ("diet_id") REFERENCES "diets" ("id");

ALTER TABLE "diet_restricted_categories" ADD FOREIGN KEY ("category_id") REFERENCES "ingredient_categories" ("id");

ALTER TABLE "favorites" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "favorites" ADD FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id");

ALTER TABLE "recipe_shares" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "recipe_shares" ADD FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id");

ALTER TABLE "recipe_media" ADD FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id");

ALTER TABLE "recipe_comments" ADD FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id");

ALTER TABLE "recipe_comments" ADD FOREIGN KEY ("author_id") REFERENCES "users" ("id");

ALTER TABLE "recipe_comments" ADD FOREIGN KEY ("parent_comment_id") REFERENCES "recipe_comments" ("id");

ALTER TABLE "recipe_ratings" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "recipe_ratings" ADD FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id");
