-- ============================================
-- SEED DATA FOR CORE DATABASE
-- ============================================
-- This script populates reference/dictionary tables
-- with initial data: units, categories, allergens, diets, etc.

-- ============================================
-- UNITS (mass, volume, portions)
-- ============================================
INSERT INTO units (code, kind) VALUES
  -- Mass
  ('g', 'mass'),
  ('kg', 'mass'),
  ('mg', 'mass'),
  
  -- Volume
  ('ml', 'volume'),
  ('l', 'volume'),
  ('cup', 'volume'),
  ('tbsp', 'volume'),
  ('tsp', 'volume'),
  
  -- Portions
  ('pcs', 'portion'),
  ('slice', 'portion'),
  ('clove', 'portion'),
  ('whole', 'portion')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- RECIPE CATEGORY TYPES
-- ============================================
INSERT INTO recipe_category_types (code, name) VALUES
  ('meal_time', 'Meal Time'),
  ('dish_type', 'Dish Type'),
  ('main_ingredient', 'Main Ingredient'),
  ('cuisine', 'Cuisine')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- RECIPE CATEGORIES
-- ============================================
-- Meal Time
INSERT INTO recipe_categories (category_type_id, code)
SELECT id, 'breakfast' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'lunch' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'dinner' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'snack' FROM recipe_category_types WHERE code = 'meal_time'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Dish Type
INSERT INTO recipe_categories (category_type_id, code)
SELECT id, 'soup' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'salad' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'main_course' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'dessert' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'beverage' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'appetizer' FROM recipe_category_types WHERE code = 'dish_type'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Main Ingredient
INSERT INTO recipe_categories (category_type_id, code)
SELECT id, 'poultry' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'beef' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'pork' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'fish' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'seafood' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'vegetables' FROM recipe_category_types WHERE code = 'main_ingredient'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Cuisine
INSERT INTO recipe_categories (category_type_id, code)
SELECT id, 'italian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'asian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'mexican' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'french' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'american' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'mediterranean' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'finnish' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'russian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'ukrainian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'german' FROM recipe_category_types WHERE code = 'cuisine'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- ============================================
-- INGREDIENT CATEGORIES
-- ============================================
INSERT INTO ingredient_categories (code) VALUES
  ('nuts'),
  ('dairy'),
  ('meat'),
  ('fish'),
  ('grains'),
  ('spices'),
  ('vegetables'),
  ('fruits'),
  ('legumes'),
  ('eggs')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- ALLERGENS
-- ============================================
INSERT INTO allergens (code) VALUES
  ('nuts'),
  ('lactose'),
  ('gluten'),
  ('eggs'),
  ('fish'),
  ('shellfish'),
  ('soy'),
  ('sesame'),
  ('berries'),
  ('fruits')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- ALLERGEN ↔ INGREDIENT CATEGORIES
-- ============================================
-- Nuts allergen → nuts category
INSERT INTO allergen_categories (allergen_id, category_id)
SELECT a.id, c.id 
FROM allergens a, ingredient_categories c
WHERE a.code = 'nuts' AND c.code = 'nuts'
ON CONFLICT (allergen_id, category_id) DO NOTHING;

-- Lactose allergen → dairy category
INSERT INTO allergen_categories (allergen_id, category_id)
SELECT a.id, c.id 
FROM allergens a, ingredient_categories c
WHERE a.code = 'lactose' AND c.code = 'dairy'
ON CONFLICT (allergen_id, category_id) DO NOTHING;

-- Gluten allergen → grains category
INSERT INTO allergen_categories (allergen_id, category_id)
SELECT a.id, c.id 
FROM allergens a, ingredient_categories c
WHERE a.code = 'gluten' AND c.code = 'grains'
ON CONFLICT (allergen_id, category_id) DO NOTHING;

-- Eggs allergen → eggs category
INSERT INTO allergen_categories (allergen_id, category_id)
SELECT a.id, c.id 
FROM allergens a, ingredient_categories c
WHERE a.code = 'eggs' AND c.code = 'eggs'
ON CONFLICT (allergen_id, category_id) DO NOTHING;

-- Shellfish allergen → seafood category (if exists, otherwise just shellfish handling)
INSERT INTO allergen_categories (allergen_id, category_id)
SELECT a.id, c.id 
FROM allergens a, ingredient_categories c
WHERE a.code = 'fish' AND c.code = 'fish'
ON CONFLICT (allergen_id, category_id) DO NOTHING;

-- Berries allergen → fruits category
INSERT INTO allergen_categories (allergen_id, category_id)
SELECT a.id, c.id 
FROM allergens a, ingredient_categories c
WHERE a.code = 'berries' AND c.code = 'fruits'
ON CONFLICT (allergen_id, category_id) DO NOTHING;

-- Fruits allergen → fruits category
INSERT INTO allergen_categories (allergen_id, category_id)
SELECT a.id, c.id 
FROM allergens a, ingredient_categories c
WHERE a.code = 'fruits' AND c.code = 'fruits'
ON CONFLICT (allergen_id, category_id) DO NOTHING;

-- ============================================
-- DIETS
-- ============================================
INSERT INTO diets (code, name) VALUES
  ('vegan', 'Vegan'),
  ('vegetarian', 'Vegetarian'),
  ('pescatarian', 'Pescatarian'),
  ('keto', 'Ketogenic'),
  ('paleo', 'Paleo')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- DIET RESTRICTIONS (DIET ↔ INGREDIENT CATEGORIES)
-- ============================================
-- Vegan: no meat, dairy, eggs, fish
INSERT INTO diet_restricted_categories (diet_id, category_id)
SELECT d.id, c.id 
FROM diets d, ingredient_categories c
WHERE d.code = 'vegan' AND c.code IN ('meat', 'dairy', 'eggs', 'fish')
ON CONFLICT (diet_id, category_id) DO NOTHING;

-- Vegetarian: no meat, fish
INSERT INTO diet_restricted_categories (diet_id, category_id)
SELECT d.id, c.id 
FROM diets d, ingredient_categories c
WHERE d.code = 'vegetarian' AND c.code IN ('meat', 'fish')
ON CONFLICT (diet_id, category_id) DO NOTHING;

-- Pescatarian: no meat
INSERT INTO diet_restricted_categories (diet_id, category_id)
SELECT d.id, c.id 
FROM diets d, ingredient_categories c
WHERE d.code = 'pescatarian' AND c.code = 'meat'
ON CONFLICT (diet_id, category_id) DO NOTHING;

-- Low Carb: no grains, legumes, fruits (limited)
INSERT INTO diet_restricted_categories (diet_id, category_id)
SELECT d.id, c.id 
FROM diets d, ingredient_categories c
WHERE d.code = 'low_carb' AND c.code IN ('grains', 'legumes', 'fruits')
ON CONFLICT (diet_id, category_id) DO NOTHING;

-- Low Fat: no nuts, dairy (most)
INSERT INTO diet_restricted_categories (diet_id, category_id)
SELECT d.id, c.id 
FROM diets d, ingredient_categories c
WHERE d.code = 'low_fat' AND c.code IN ('nuts', 'dairy')
ON CONFLICT (diet_id, category_id) DO NOTHING;

-- ============================================
-- COMMON INGREDIENTS WITH NUTRITION FACTS
-- ============================================
-- Proteins & Meats
INSERT INTO ingredients (name) VALUES
  ('Chicken Breast'),
  ('Salmon'),
  ('Beef'),
  ('Pork'),
  ('Turkey'),
  ('Eggs'),
  ('Tofu'),
  ('Beans'),
  ('Lentils'),
  ('Cottage Cheese'),
  
  -- Grains & Carbs
  ('Rice'),
  ('Pasta'),
  ('Bread'),
  ('Oats'),
  ('Quinoa'),
  ('Potato'),
  ('Sweet Potato'),
  ('Wheat'),
  
  -- Vegetables
  ('Broccoli'),
  ('Spinach'),
  ('Carrots'),
  ('Tomato'),
  ('Lettuce'),
  ('Bell Pepper'),
  ('Cucumber'),
  ('Zucchini'),
  ('Mushroom'),
  ('Onion'),
  ('Garlic'),
  ('Kale'),
  
  -- Fruits
  ('Apple'),
  ('Banana'),
  ('Avocado'),
  ('Blueberries'),
  ('Strawberries'),
  ('Orange'),
  ('Grapes'),
  ('Watermelon'),
  ('Mango'),
  
  -- Dairy & Fats
  ('Milk'),
  ('Yogurt'),
  ('Cheddar Cheese'),
  ('Mozzarella'),
  ('Butter'),
  ('Olive Oil'),
  ('Coconut Oil'),
  
  -- Nuts & Seeds
  ('Almonds'),
  ('Walnuts'),
  ('Peanut Butter'),
  ('Chia Seeds'),
  ('Flax Seeds'),
  
  -- Condiments & Spices
  ('Salt'),
  ('Black Pepper'),
  ('Garlic Powder'),
  ('Paprika'),
  ('Cinnamon'),
  ('Honey'),
  ('Soy Sauce'),
  ('Vinegar')
ON CONFLICT (name) DO NOTHING;

-- Nutrition Facts (per 100g/100ml)
INSERT INTO nutrition_facts (ingredient_id, calories, protein, fat, carbs, base_unit)
SELECT id, 165, 31, 3.6, 0, 'g' FROM ingredients WHERE name = 'Chicken Breast' UNION ALL
SELECT id, 208, 20, 13, 0, 'g' FROM ingredients WHERE name = 'Salmon' UNION ALL
SELECT id, 250, 26, 15, 0, 'g' FROM ingredients WHERE name = 'Beef' UNION ALL
SELECT id, 242, 27, 14, 0, 'g' FROM ingredients WHERE name = 'Pork' UNION ALL
SELECT id, 189, 29, 7, 0, 'g' FROM ingredients WHERE name = 'Turkey' UNION ALL
SELECT id, 155, 13, 11, 1.1, 'g' FROM ingredients WHERE name = 'Eggs' UNION ALL
SELECT id, 76, 8, 4.8, 1.9, 'g' FROM ingredients WHERE name = 'Tofu' UNION ALL
SELECT id, 127, 8, 0.3, 23, 'g' FROM ingredients WHERE name = 'Beans' UNION ALL
SELECT id, 116, 9, 0.4, 20, 'g' FROM ingredients WHERE name = 'Lentils' UNION ALL
SELECT id, 98, 11, 5, 3.3, 'g' FROM ingredients WHERE name = 'Cottage Cheese' UNION ALL

SELECT id, 130, 2.7, 0.3, 28, 'g' FROM ingredients WHERE name = 'Rice' UNION ALL
SELECT id, 131, 5, 1.1, 25, 'g' FROM ingredients WHERE name = 'Pasta' UNION ALL
SELECT id, 265, 9, 3.3, 49, 'g' FROM ingredients WHERE name = 'Bread' UNION ALL
SELECT id, 389, 17, 7, 66, 'g' FROM ingredients WHERE name = 'Oats' UNION ALL
SELECT id, 120, 4.4, 0.9, 21, 'g' FROM ingredients WHERE name = 'Quinoa' UNION ALL
SELECT id, 77, 2, 0.1, 17, 'g' FROM ingredients WHERE name = 'Potato' UNION ALL
SELECT id, 86, 1.6, 0.1, 20, 'g' FROM ingredients WHERE name = 'Sweet Potato' UNION ALL
SELECT id, 364, 13, 1.7, 71, 'g' FROM ingredients WHERE name = 'Wheat' UNION ALL

SELECT id, 34, 2.8, 0.4, 7, 'g' FROM ingredients WHERE name = 'Broccoli' UNION ALL
SELECT id, 23, 2.7, 0.4, 3.6, 'g' FROM ingredients WHERE name = 'Spinach' UNION ALL
SELECT id, 41, 0.9, 0.2, 10, 'g' FROM ingredients WHERE name = 'Carrots' UNION ALL
SELECT id, 18, 0.9, 0.2, 3.9, 'g' FROM ingredients WHERE name = 'Tomato' UNION ALL
SELECT id, 15, 1.4, 0.2, 2.9, 'g' FROM ingredients WHERE name = 'Lettuce' UNION ALL
SELECT id, 31, 1, 0.3, 5.5, 'g' FROM ingredients WHERE name = 'Bell Pepper' UNION ALL
SELECT id, 16, 0.7, 0.1, 3.6, 'g' FROM ingredients WHERE name = 'Cucumber' UNION ALL
SELECT id, 21, 1.5, 0.4, 3.5, 'g' FROM ingredients WHERE name = 'Zucchini' UNION ALL
SELECT id, 22, 3.1, 0.3, 3.3, 'g' FROM ingredients WHERE name = 'Mushroom' UNION ALL
SELECT id, 40, 1.1, 0.1, 9, 'g' FROM ingredients WHERE name = 'Onion' UNION ALL
SELECT id, 149, 6.6, 0.5, 33, 'g' FROM ingredients WHERE name = 'Garlic' UNION ALL
SELECT id, 49, 3.3, 0.9, 9, 'g' FROM ingredients WHERE name = 'Kale' UNION ALL

SELECT id, 52, 0.3, 0.4, 14, 'g' FROM ingredients WHERE name = 'Apple' UNION ALL
SELECT id, 89, 1.1, 0.3, 23, 'g' FROM ingredients WHERE name = 'Banana' UNION ALL
SELECT id, 160, 2, 15, 9, 'g' FROM ingredients WHERE name = 'Avocado' UNION ALL
SELECT id, 57, 0.7, 0.3, 14, 'g' FROM ingredients WHERE name = 'Blueberries' UNION ALL
SELECT id, 32, 0.7, 0.3, 7.7, 'g' FROM ingredients WHERE name = 'Strawberries' UNION ALL
SELECT id, 47, 0.9, 0.3, 12, 'g' FROM ingredients WHERE name = 'Orange' UNION ALL
SELECT id, 67, 0.6, 0.2, 17, 'g' FROM ingredients WHERE name = 'Grapes' UNION ALL
SELECT id, 30, 0.6, 0.2, 7.6, 'g' FROM ingredients WHERE name = 'Watermelon' UNION ALL
SELECT id, 60, 0.8, 0.4, 15, 'g' FROM ingredients WHERE name = 'Mango' UNION ALL

SELECT id, 61, 3.2, 3.3, 4.8, 'ml' FROM ingredients WHERE name = 'Milk' UNION ALL
SELECT id, 59, 3.5, 0.4, 4.7, 'ml' FROM ingredients WHERE name = 'Yogurt' UNION ALL
SELECT id, 403, 25, 33, 1.3, 'g' FROM ingredients WHERE name = 'Cheddar Cheese' UNION ALL
SELECT id, 280, 28, 17, 3.1, 'g' FROM ingredients WHERE name = 'Mozzarella' UNION ALL
SELECT id, 717, 0.9, 81, 0, 'g' FROM ingredients WHERE name = 'Butter' UNION ALL
SELECT id, 884, 0, 100, 0, 'ml' FROM ingredients WHERE name = 'Olive Oil' UNION ALL
SELECT id, 892, 0, 99, 0, 'ml' FROM ingredients WHERE name = 'Coconut Oil' UNION ALL

SELECT id, 579, 25, 51, 0, 'g' FROM ingredients WHERE name = 'Almonds' UNION ALL
SELECT id, 654, 15, 65, 14, 'g' FROM ingredients WHERE name = 'Walnuts' UNION ALL
SELECT id, 588, 25, 50, 20, 'g' FROM ingredients WHERE name = 'Peanut Butter' UNION ALL
SELECT id, 486, 16, 30, 42, 'g' FROM ingredients WHERE name = 'Chia Seeds' UNION ALL
SELECT id, 534, 18, 42, 29, 'g' FROM ingredients WHERE name = 'Flax Seeds' UNION ALL

SELECT id, 0, 0, 0, 0, 'g' FROM ingredients WHERE name = 'Salt' UNION ALL
SELECT id, 251, 10, 3.3, 64, 'g' FROM ingredients WHERE name = 'Black Pepper' UNION ALL
SELECT id, 331, 13, 5, 66, 'g' FROM ingredients WHERE name = 'Garlic Powder' UNION ALL
SELECT id, 282, 10, 12, 53, 'g' FROM ingredients WHERE name = 'Paprika' UNION ALL
SELECT id, 247, 3.1, 0.3, 81, 'g' FROM ingredients WHERE name = 'Cinnamon' UNION ALL
SELECT id, 304, 0.3, 0, 82, 'g' FROM ingredients WHERE name = 'Honey' UNION ALL
SELECT id, 61, 8, 1, 5.7, 'ml' FROM ingredients WHERE name = 'Soy Sauce' UNION ALL
SELECT id, 18, 0.4, 0.04, 0.9, 'ml' FROM ingredients WHERE name = 'Vinegar'
ON CONFLICT (ingredient_id) DO NOTHING;

-- ============================================
-- INGREDIENT UNIT CONVERSIONS (portion → grams)
-- ============================================
-- Garlic
INSERT INTO ingredient_unit_conversions (ingredient_id, unit, grams)
SELECT id, 'clove', 3 FROM ingredients WHERE name = 'Garlic' UNION ALL
SELECT id, 'tbsp', 9 FROM ingredients WHERE name = 'Garlic' UNION ALL

-- Eggs
SELECT id, 'pcs', 50 FROM ingredients WHERE name = 'Eggs' UNION ALL

-- Bread
SELECT id, 'slice', 30 FROM ingredients WHERE name = 'Bread' UNION ALL

-- Butter
SELECT id, 'tbsp', 15 FROM ingredients WHERE name = 'Butter' UNION ALL

-- Olive Oil
SELECT id, 'tbsp', 15 FROM ingredients WHERE name = 'Olive Oil' UNION ALL
SELECT id, 'tsp', 5 FROM ingredients WHERE name = 'Olive Oil' UNION ALL

-- Honey
SELECT id, 'tbsp', 20 FROM ingredients WHERE name = 'Honey' UNION ALL
SELECT id, 'tsp', 7 FROM ingredients WHERE name = 'Honey' UNION ALL

-- Peanut Butter
SELECT id, 'tbsp', 16 FROM ingredients WHERE name = 'Peanut Butter' UNION ALL

-- Almonds
SELECT id, 'tbsp', 9 FROM ingredients WHERE name = 'Almonds' UNION ALL

-- Walnuts
SELECT id, 'tbsp', 7 FROM ingredients WHERE name = 'Walnuts' UNION ALL

-- Onion
SELECT id, 'tbsp', 10 FROM ingredients WHERE name = 'Onion' UNION ALL

-- Apple
SELECT id, 'pcs', 182 FROM ingredients WHERE name = 'Apple' UNION ALL

-- Banana
SELECT id, 'pcs', 118 FROM ingredients WHERE name = 'Banana' UNION ALL

-- Avocado
SELECT id, 'pcs', 150 FROM ingredients WHERE name = 'Avocado' UNION ALL

-- Tomato
SELECT id, 'pcs', 123 FROM ingredients WHERE name = 'Tomato' UNION ALL

-- Bell Pepper
SELECT id, 'pcs', 149 FROM ingredients WHERE name = 'Bell Pepper' UNION ALL

-- Cucumber
SELECT id, 'pcs', 301 FROM ingredients WHERE name = 'Cucumber' UNION ALL

-- Carrot
SELECT id, 'pcs', 61 FROM ingredients WHERE name = 'Carrots' UNION ALL

-- Potato
SELECT id, 'pcs', 173 FROM ingredients WHERE name = 'Potato'
ON CONFLICT (ingredient_id, unit) DO NOTHING;

-- ============================================
-- INGREDIENT PORTIONS (named portions with weights)
-- ============================================
-- Chicken Breast
INSERT INTO ingredient_portions (ingredient_id, name, weight_in_grams)
SELECT id, '1 medium fillet', 175 FROM ingredients WHERE name = 'Chicken Breast' UNION ALL
SELECT id, '1 large fillet', 225 FROM ingredients WHERE name = 'Chicken Breast' UNION ALL

-- Salmon
SELECT id, '1 fillet', 180 FROM ingredients WHERE name = 'Salmon' UNION ALL
SELECT id, '100g fillet', 100 FROM ingredients WHERE name = 'Salmon' UNION ALL

-- Eggs
SELECT id, '1 large egg', 50 FROM ingredients WHERE name = 'Eggs' UNION ALL
SELECT id, '1 egg white', 33 FROM ingredients WHERE name = 'Eggs' UNION ALL
SELECT id, '1 egg yolk', 17 FROM ingredients WHERE name = 'Eggs' UNION ALL

-- Avocado
SELECT id, '1 medium avocado', 150 FROM ingredients WHERE name = 'Avocado' UNION ALL
SELECT id, '1/2 avocado', 75 FROM ingredients WHERE name = 'Avocado' UNION ALL

-- Apple
SELECT id, '1 medium apple', 182 FROM ingredients WHERE name = 'Apple' UNION ALL
SELECT id, '1 small apple', 149 FROM ingredients WHERE name = 'Apple' UNION ALL

-- Banana
SELECT id, '1 medium banana', 118 FROM ingredients WHERE name = 'Banana' UNION ALL
SELECT id, '1 large banana', 136 FROM ingredients WHERE name = 'Banana' UNION ALL

-- Tomato
SELECT id, '1 medium tomato', 123 FROM ingredients WHERE name = 'Tomato' UNION ALL
SELECT id, '1 large tomato', 182 FROM ingredients WHERE name = 'Tomato' UNION ALL

-- Bell Pepper
SELECT id, '1 medium pepper', 149 FROM ingredients WHERE name = 'Bell Pepper' UNION ALL

-- Cucumber
SELECT id, '1 whole cucumber', 301 FROM ingredients WHERE name = 'Cucumber' UNION ALL
SELECT id, '1 cup sliced', 104 FROM ingredients WHERE name = 'Cucumber' UNION ALL

-- Carrot
SELECT id, '1 medium carrot', 61 FROM ingredients WHERE name = 'Carrots' UNION ALL
SELECT id, '1 cup chopped', 128 FROM ingredients WHERE name = 'Carrots' UNION ALL

-- Potato
SELECT id, '1 medium potato', 173 FROM ingredients WHERE name = 'Potato' UNION ALL
SELECT id, '1 large potato', 299 FROM ingredients WHERE name = 'Potato' UNION ALL

-- Broccoli
SELECT id, '1 cup chopped', 91 FROM ingredients WHERE name = 'Broccoli' UNION ALL
SELECT id, '1 head', 588 FROM ingredients WHERE name = 'Broccoli' UNION ALL

-- Spinach
SELECT id, '1 cup raw', 30 FROM ingredients WHERE name = 'Spinach' UNION ALL
SELECT id, '1 cup cooked', 180 FROM ingredients WHERE name = 'Spinach' UNION ALL

-- Almonds
SELECT id, '23 almonds', 23 FROM ingredients WHERE name = 'Almonds' UNION ALL
SELECT id, '1 ounce (oz)', 28 FROM ingredients WHERE name = 'Almonds' UNION ALL

-- Walnuts
SELECT id, '14 halves', 28 FROM ingredients WHERE name = 'Walnuts' UNION ALL

-- Peanut Butter
SELECT id, '2 tbsp', 32 FROM ingredients WHERE name = 'Peanut Butter' UNION ALL

-- Rice
SELECT id, '1 cup cooked', 195 FROM ingredients WHERE name = 'Rice' UNION ALL

-- Pasta
SELECT id, '1 cup cooked', 220 FROM ingredients WHERE name = 'Pasta' UNION ALL

-- Bread
SELECT id, '1 slice', 30 FROM ingredients WHERE name = 'Bread' UNION ALL

-- Oats
SELECT id, '1 cup cooked', 234 FROM ingredients WHERE name = 'Oats' UNION ALL
SELECT id, '1/2 cup dry', 40 FROM ingredients WHERE name = 'Oats'
ON CONFLICT (ingredient_id, name) DO NOTHING;

COMMENT ON SCHEMA public IS 'Seed data loaded successfully';
