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
    CHECK (user_id <> followed_id),
  "created_at" timestamptz DEFAULT now(),

  CONSTRAINT "followers_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE,

  CONSTRAINT "followers_followed_id_fkey"
    FOREIGN KEY ("followed_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE
);

CREATE TABLE "recipes" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "title" varchar(256) NOT NULL,
  "description" text,
  "instructions" text NOT NULL,
  "servings" integer NOT NULL DEFAULT 1,
  "spiciness" smallint CHECK (spiciness BETWEEN 0 AND 3),
  "author_id" varchar NULL,
  "status" varchar(16) NOT NULL
    CHECK (status IN ('draft', 'published', 'archived')),
  "rating_avg" numeric(3,2)
    CHECK (rating_avg BETWEEN 1.00 AND 5.00),
  "rating_count" integer NOT NULL DEFAULT 0
    CHECK (rating_count >= 0),
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),

  CONSTRAINT "recipes_author_id_fkey"
    FOREIGN KEY ("author_id")
    REFERENCES "users" ("id")
    ON DELETE SET NULL
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
  "unit" varchar(16) NOT NULL

  CONSTRAINT "recipe_ingredients_recipe_id_fkey"
    FOREIGN KEY ("recipe_id")
    REFERENCES "recipes" ("id")
    ON DELETE CASCADE
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

CREATE TABLE "user_allergens" (
  "user_id" varchar NOT NULL,
  "allergen_id" integer NOT NULL,
  "created_at" timestamptz DEFAULT now(),

  CONSTRAINT "user_allergens_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE

  CONSTRAINT "user_allergens_allergen_id_fkey"
    FOREIGN KEY ("allergen_id")
    REFERENCES "allergens" ("id");
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

CREATE TABLE "user_diets" (
  "user_id" varchar NOT NULL,
  "diet_id" integer NOT NULL,
  "created_at" timestamptz DEFAULT now(),

  CONSTRAINT "user_diets_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE,

  CONSTRAINT "user_diets_diet_id_fkey"
    FOREIGN KEY ("diet_id")
    REFERENCES "diets" ("id")
);

CREATE TABLE "units" (
  "code" varchar PRIMARY KEY,
  "kind" varchar NOT NULL
    CHECK (kind IN ('mass', 'volume', 'portion'))
);

CREATE TABLE "ingredient_unit_conversions" (
  "ingredient_id" integer NOT NULL,
  "unit" varchar NOT NULL,
  "grams" numeric NOT NULL
    CHECK (grams > 0),
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "nutrition_facts" (
  "ingredient_id" integer PRIMARY KEY,
  "calories" numeric NOT NULL
    CHECK (calories >= 0),
  "protein" numeric NOT NULL
    CHECK (protein >= 0),
  "fat" numeric NOT NULL
    CHECK (fat >= 0),
  "carbs" numeric NOT NULL
    CHECK (carbs >= 0),
  "base_unit" varchar NOT NULL,
  "created_at" timestamptz DEFAULT now()
);


CREATE TABLE "ingredient_portions" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "ingredient_id" integer NOT NULL,

  "name" varchar NOT NULL,
  "weight_in_grams" numeric NOT NULL
    CHECK (weight_in_grams > 0),
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "favorites" (
  "user_id" varchar NOT NULL,
  "recipe_id" integer NOT NULL,
  "created_at" timestamptz DEFAULT now(),

  CONSTRAINT "favorites_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE,

  CONSTRAINT "favorites_recipe_id_fkey"
    FOREIGN KEY ("recipe_id")
    REFERENCES "recipes" ("id")
    ON DELETE CASCADE
);

CREATE TABLE "recipe_shares" (
  "user_id" varchar NOT NULL,
  "recipe_id" integer NOT NULL,
  "created_at" timestamptz DEFAULT now(),

  CONSTRAINT "recipe_shares_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE,

  CONSTRAINT "recipe_shares_recipe_id_fkey"
    FOREIGN KEY ("recipe_id")
    REFERENCES "recipes" ("id")
    ON DELETE CASCADE
);

CREATE TABLE "recipe_media" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "recipe_id" integer NOT NULL,
  "type" varchar(16) NOT NULL
    CHECK (type IN ('image', 'video')),
  "url" varchar(2048) NOT NULL,
  "position" integer
    CHECK (position >= 0),
  "created_at" timestamptz DEFAULT now(),

  CONSTRAINT "recipe_media_recipe_id_fkey"
    FOREIGN KEY ("recipe_id")
    REFERENCES "recipes" ("id")
    ON DELETE CASCADE
);

CREATE TABLE "recipe_comments" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "recipe_id" integer NOT NULL,
  "author_id" varchar NULL,
  "parent_comment_id" integer,
  "body" text NOT NULL,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),

  CONSTRAINT "recipe_comments_recipe_id_fkey"
    FOREIGN KEY ("recipe_id")
    REFERENCES "recipes" ("id")
    ON DELETE CASCADE,

  CONSTRAINT "recipe_comments_author_id_fkey"
    FOREIGN KEY ("author_id")
    REFERENCES "users" ("id")
    ON DELETE SET NULL,

  CONSTRAINT "recipe_comments_parent_comment_id_fkey"
    FOREIGN KEY ("parent_comment_id")
    REFERENCES "recipe_comments" ("id")
);


CREATE TABLE "recipe_ratings" (
  "user_id" varchar NOT NULL,
  "recipe_id" integer NOT NULL,
  "rating" smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),

  CONSTRAINT "recipe_ratings_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE,

  CONSTRAINT "recipe_ratings_recipe_id_fkey"
    FOREIGN KEY ("recipe_id")
    REFERENCES "recipes" ("id")
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX ON "followers" ("user_id", "followed_id");

CREATE UNIQUE INDEX ON "recipe_ingredients" ("recipe_id", "ingredient_id");

CREATE UNIQUE INDEX ON "recipe_categories" ("category_type_id", "code");

CREATE UNIQUE INDEX ON "recipe_category_map" ("recipe_id", "category_id");

CREATE UNIQUE INDEX ON "ingredient_category_correspondence" ("ingredient_id", "category_id");

CREATE UNIQUE INDEX ON "allergen_categories" ("allergen_id", "category_id");

CREATE UNIQUE INDEX ON "user_allergens" ("user_id", "allergen_id");

CREATE UNIQUE INDEX ON "diet_restricted_categories" ("diet_id", "category_id");

CREATE UNIQUE INDEX ON "user_diets" ("user_id", "diet_id");

CREATE UNIQUE INDEX ON "ingredient_unit_conversions" ("ingredient_id", "unit");

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

ALTER TABLE "recipe_ingredients" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id");

ALTER TABLE "recipe_ingredients" ADD FOREIGN KEY ("unit") REFERENCES "units" ("code");

ALTER TABLE "recipe_categories" ADD FOREIGN KEY ("category_type_id") REFERENCES "recipe_category_types" ("id");

ALTER TABLE "recipe_category_map" ADD FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id");

ALTER TABLE "recipe_category_map" ADD FOREIGN KEY ("category_id") REFERENCES "recipe_categories" ("id");

ALTER TABLE "ingredient_category_correspondence" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id");

ALTER TABLE "ingredient_category_correspondence" ADD FOREIGN KEY ("category_id") REFERENCES "ingredient_categories" ("id");

ALTER TABLE "allergen_categories" ADD FOREIGN KEY ("allergen_id") REFERENCES "allergens" ("id");

ALTER TABLE "allergen_categories" ADD FOREIGN KEY ("category_id") REFERENCES "ingredient_categories" ("id");

ALTER TABLE "diet_restricted_categories" ADD FOREIGN KEY ("diet_id") REFERENCES "diets" ("id");

ALTER TABLE "diet_restricted_categories" ADD FOREIGN KEY ("category_id") REFERENCES "ingredient_categories" ("id");

ALTER TABLE "ingredient_unit_conversions" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id");

ALTER TABLE "ingredient_unit_conversions" ADD FOREIGN KEY ("unit") REFERENCES "units" ("code");

ALTER TABLE "nutrition_facts" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id");

ALTER TABLE "nutrition_facts" ADD FOREIGN KEY ("base_unit") REFERENCES "units" ("code");

ALTER TABLE "ingredient_portions" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id");