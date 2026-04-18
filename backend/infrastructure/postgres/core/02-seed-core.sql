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
SELECT id, 'brunch' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'lunch' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'dinner' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'supper' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'snack' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'late_night' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'tea_time' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'pre_workout' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'post_workout' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'kids_meal' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'holiday' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'picnic' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'party' FROM recipe_category_types WHERE code = 'meal_time'
UNION ALL
SELECT id, 'buffet' FROM recipe_category_types WHERE code = 'meal_time'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Dish Type
INSERT INTO recipe_categories (category_type_id, code)
SELECT id, 'soup' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'stew' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'salad' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'main_course' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'side_dish' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'dessert' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'beverage' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'cocktail' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'smoothie' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'appetizer' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'sandwich' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'wrap' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'burger' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'pizza' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'pasta' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'noodles' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'rice_dish' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'casserole' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'curry' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'stir_fry' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'bowl' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'porridge' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'omelette' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'quiche' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'pancake' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'waffle' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'crepe' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'dumpling' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'roll' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'skewer' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'grill' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'barbecue' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'roast' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'hot_pot' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'pie' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'tart' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'cake' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'cookie' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'pastry' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'bread' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'ice_cream' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'dip' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'sauce' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'pickle' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'preserve' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'risotto' FROM recipe_category_types WHERE code = 'dish_type'
UNION ALL
SELECT id, 'taco' FROM recipe_category_types WHERE code = 'dish_type'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Main Ingredient (each code corresponds to an entry in the ingredients table — subset relationship)
INSERT INTO recipe_categories (category_type_id, code)
SELECT id, 'chicken' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'turkey' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'duck' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'beef' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'pork' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'lamb' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'salmon' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'tuna' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'cod' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'trout' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'shrimp' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'crab' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'lobster' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'eggs' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'tofu' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'tempeh' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'beans' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'lentils' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'chickpeas' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'rice' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'pasta' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'quinoa' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'potato' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'mushroom' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'cheese' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'avocado' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'broccoli' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'spinach' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'tomato' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'eggplant' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'cauliflower' FROM recipe_category_types WHERE code = 'main_ingredient'
UNION ALL
SELECT id, 'pumpkin' FROM recipe_category_types WHERE code = 'main_ingredient'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Cuisine
INSERT INTO recipe_categories (category_type_id, code)
SELECT id, 'italian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'asian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'chinese' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'japanese' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'korean' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'thai' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'vietnamese' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'indian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'indonesian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'filipino' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'mexican' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'tex_mex' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'cajun' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'creole' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'french' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'american' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'southern_us' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'mediterranean' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'spanish' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'portuguese' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'greek' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'turkish' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'moroccan' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'ethiopian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'middle_eastern' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'lebanese' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'persian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'israeli' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'finnish' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'swedish' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'norwegian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'danish' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'nordic' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'russian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'ukrainian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'georgian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'polish' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'hungarian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'czech' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'german' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'austrian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'swiss' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'british' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'irish' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'scottish' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'brazilian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'peruvian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'argentinian' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'caribbean' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'cuban' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'jamaican' FROM recipe_category_types WHERE code = 'cuisine'
UNION ALL
SELECT id, 'fusion' FROM recipe_category_types WHERE code = 'cuisine'
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
  ('Chicken'),
  ('Chicken Breast'),
  ('Chicken Thigh'),
  ('Chicken Wings'),
  ('Chicken Liver'),
  ('Turkey'),
  ('Turkey Breast'),
  ('Duck'),
  ('Duck Breast'),
  ('Goose'),
  ('Quail'),
  ('Beef'),
  ('Ground Beef'),
  ('Beef Steak'),
  ('Beef Ribs'),
  ('Beef Tenderloin'),
  ('Veal'),
  ('Pork'),
  ('Pork Chop'),
  ('Pork Belly'),
  ('Pork Loin'),
  ('Pork Ribs'),
  ('Ground Pork'),
  ('Bacon'),
  ('Ham'),
  ('Prosciutto'),
  ('Pancetta'),
  ('Sausage'),
  ('Chorizo'),
  ('Salami'),
  ('Pepperoni'),
  ('Lamb'),
  ('Lamb Chop'),
  ('Ground Lamb'),
  ('Rabbit'),
  ('Venison'),

  -- Fish & Seafood
  ('Salmon'),
  ('Smoked Salmon'),
  ('Tuna'),
  ('Canned Tuna'),
  ('Cod'),
  ('Haddock'),
  ('Halibut'),
  ('Trout'),
  ('Mackerel'),
  ('Sardines'),
  ('Anchovies'),
  ('Tilapia'),
  ('Sea Bass'),
  ('Herring'),
  ('Perch'),
  ('Pike'),
  ('Carp'),
  ('Shrimp'),
  ('Prawns'),
  ('Crab'),
  ('Lobster'),
  ('Scallops'),
  ('Mussels'),
  ('Clams'),
  ('Oysters'),
  ('Squid'),
  ('Octopus'),
  ('Caviar'),
  ('Roe'),

  -- Eggs & Plant Protein
  ('Eggs'),
  ('Egg Whites'),
  ('Quail Eggs'),
  ('Tofu'),
  ('Firm Tofu'),
  ('Silken Tofu'),
  ('Tempeh'),
  ('Seitan'),

  -- Legumes
  ('Beans'),
  ('Black Beans'),
  ('Kidney Beans'),
  ('Pinto Beans'),
  ('Navy Beans'),
  ('White Beans'),
  ('Lima Beans'),
  ('Green Beans'),
  ('Lentils'),
  ('Red Lentils'),
  ('Green Lentils'),
  ('Chickpeas'),
  ('Split Peas'),
  ('Edamame'),

  -- Grains & Carbs
  ('Rice'),
  ('White Rice'),
  ('Brown Rice'),
  ('Basmati Rice'),
  ('Jasmine Rice'),
  ('Arborio Rice'),
  ('Wild Rice'),
  ('Pasta'),
  ('Spaghetti'),
  ('Penne'),
  ('Fusilli'),
  ('Macaroni'),
  ('Lasagna Sheets'),
  ('Ravioli'),
  ('Gnocchi'),
  ('Egg Noodles'),
  ('Rice Noodles'),
  ('Udon Noodles'),
  ('Soba Noodles'),
  ('Ramen Noodles'),
  ('Bread'),
  ('White Bread'),
  ('Whole Wheat Bread'),
  ('Sourdough Bread'),
  ('Rye Bread'),
  ('Pita Bread'),
  ('Naan Bread'),
  ('Tortilla'),
  ('Corn Tortilla'),
  ('Flour Tortilla'),
  ('Bagel'),
  ('Croissant'),
  ('Baguette'),
  ('English Muffin'),
  ('Breadcrumbs'),
  ('Panko'),
  ('Oats'),
  ('Rolled Oats'),
  ('Steel Cut Oats'),
  ('Quinoa'),
  ('Couscous'),
  ('Bulgur'),
  ('Barley'),
  ('Buckwheat'),
  ('Millet'),
  ('Semolina'),
  ('Cornmeal'),
  ('Polenta'),
  ('Flour'),
  ('All Purpose Flour'),
  ('Whole Wheat Flour'),
  ('Almond Flour'),
  ('Coconut Flour'),
  ('Rice Flour'),
  ('Cornstarch'),
  ('Potato'),
  ('Sweet Potato'),
  ('Yam'),
  ('Wheat'),
  ('Cassava'),

  -- Vegetables
  ('Broccoli'),
  ('Cauliflower'),
  ('Brussels Sprouts'),
  ('Cabbage'),
  ('Red Cabbage'),
  ('Napa Cabbage'),
  ('Bok Choy'),
  ('Chard'),
  ('Spinach'),
  ('Kale'),
  ('Arugula'),
  ('Lettuce'),
  ('Romaine Lettuce'),
  ('Iceberg Lettuce'),
  ('Watercress'),
  ('Endive'),
  ('Radicchio'),
  ('Carrots'),
  ('Parsnip'),
  ('Turnip'),
  ('Beetroot'),
  ('Radish'),
  ('Daikon'),
  ('Celery'),
  ('Celeriac'),
  ('Fennel'),
  ('Leek'),
  ('Shallot'),
  ('Scallion'),
  ('Chives'),
  ('Onion'),
  ('Red Onion'),
  ('White Onion'),
  ('Yellow Onion'),
  ('Spring Onion'),
  ('Garlic'),
  ('Ginger'),
  ('Galangal'),
  ('Turmeric Root'),
  ('Tomato'),
  ('Cherry Tomatoes'),
  ('Sun Dried Tomatoes'),
  ('Bell Pepper'),
  ('Red Bell Pepper'),
  ('Green Bell Pepper'),
  ('Yellow Bell Pepper'),
  ('Chili Pepper'),
  ('Jalapeno'),
  ('Habanero'),
  ('Serrano'),
  ('Poblano'),
  ('Cucumber'),
  ('Pickle'),
  ('Zucchini'),
  ('Eggplant'),
  ('Squash'),
  ('Butternut Squash'),
  ('Acorn Squash'),
  ('Pumpkin'),
  ('Mushroom'),
  ('Button Mushroom'),
  ('Portobello'),
  ('Shiitake'),
  ('Oyster Mushroom'),
  ('Porcini'),
  ('Chanterelle'),
  ('Truffle'),
  ('Asparagus'),
  ('Artichoke'),
  ('Okra'),
  ('Corn'),
  ('Sweet Corn'),
  ('Peas'),
  ('Snow Peas'),
  ('Sugar Snap Peas'),
  ('Bamboo Shoots'),
  ('Water Chestnuts'),
  ('Seaweed'),
  ('Nori'),
  ('Wakame'),
  ('Kelp'),
  ('Olives'),
  ('Green Olives'),
  ('Black Olives'),
  ('Capers'),

  -- Fruits
  ('Apple'),
  ('Green Apple'),
  ('Pear'),
  ('Banana'),
  ('Plantain'),
  ('Avocado'),
  ('Orange'),
  ('Mandarin'),
  ('Tangerine'),
  ('Clementine'),
  ('Lemon'),
  ('Lime'),
  ('Grapefruit'),
  ('Blueberries'),
  ('Strawberries'),
  ('Raspberries'),
  ('Blackberries'),
  ('Cranberries'),
  ('Currants'),
  ('Gooseberries'),
  ('Lingonberries'),
  ('Cloudberries'),
  ('Grapes'),
  ('Red Grapes'),
  ('Watermelon'),
  ('Cantaloupe'),
  ('Honeydew'),
  ('Mango'),
  ('Pineapple'),
  ('Papaya'),
  ('Kiwi'),
  ('Peach'),
  ('Nectarine'),
  ('Plum'),
  ('Apricot'),
  ('Cherries'),
  ('Pomegranate'),
  ('Passion Fruit'),
  ('Dragon Fruit'),
  ('Lychee'),
  ('Guava'),
  ('Persimmon'),
  ('Fig'),
  ('Dates'),
  ('Raisins'),
  ('Prunes'),
  ('Dried Apricots'),
  ('Coconut'),
  ('Coconut Flakes'),
  ('Coconut Milk'),
  ('Coconut Cream'),

  -- Dairy
  ('Milk'),
  ('Whole Milk'),
  ('Skim Milk'),
  ('Almond Milk'),
  ('Oat Milk'),
  ('Soy Milk'),
  ('Buttermilk'),
  ('Condensed Milk'),
  ('Evaporated Milk'),
  ('Cream'),
  ('Heavy Cream'),
  ('Whipping Cream'),
  ('Sour Cream'),
  ('Creme Fraiche'),
  ('Yogurt'),
  ('Greek Yogurt'),
  ('Kefir'),
  ('Cheese'),
  ('Cheddar Cheese'),
  ('Mozzarella'),
  ('Parmesan'),
  ('Feta'),
  ('Ricotta'),
  ('Cream Cheese'),
  ('Mascarpone'),
  ('Goat Cheese'),
  ('Blue Cheese'),
  ('Gouda'),
  ('Brie'),
  ('Camembert'),
  ('Swiss Cheese'),
  ('Provolone'),
  ('Cottage Cheese'),
  ('Halloumi'),
  ('Paneer'),
  ('Butter'),
  ('Unsalted Butter'),
  ('Ghee'),
  ('Margarine'),

  -- Fats & Oils
  ('Olive Oil'),
  ('Extra Virgin Olive Oil'),
  ('Coconut Oil'),
  ('Sesame Oil'),
  ('Sunflower Oil'),
  ('Vegetable Oil'),
  ('Canola Oil'),
  ('Avocado Oil'),
  ('Peanut Oil'),
  ('Truffle Oil'),
  ('Lard'),

  -- Nuts & Seeds
  ('Almonds'),
  ('Walnuts'),
  ('Cashews'),
  ('Pistachios'),
  ('Pecans'),
  ('Hazelnuts'),
  ('Macadamia Nuts'),
  ('Brazil Nuts'),
  ('Pine Nuts'),
  ('Peanuts'),
  ('Peanut Butter'),
  ('Almond Butter'),
  ('Cashew Butter'),
  ('Tahini'),
  ('Chia Seeds'),
  ('Flax Seeds'),
  ('Sunflower Seeds'),
  ('Pumpkin Seeds'),
  ('Sesame Seeds'),
  ('Hemp Seeds'),
  ('Poppy Seeds'),

  -- Herbs (fresh & dried)
  ('Basil'),
  ('Dried Basil'),
  ('Oregano'),
  ('Dried Oregano'),
  ('Thyme'),
  ('Rosemary'),
  ('Sage'),
  ('Mint'),
  ('Parsley'),
  ('Cilantro'),
  ('Dill'),
  ('Tarragon'),
  ('Chervil'),
  ('Marjoram'),
  ('Bay Leaves'),
  ('Lemongrass'),
  ('Kaffir Lime Leaves'),
  ('Curry Leaves'),

  -- Spices
  ('Salt'),
  ('Sea Salt'),
  ('Kosher Salt'),
  ('Black Pepper'),
  ('White Pepper'),
  ('Peppercorns'),
  ('Pink Peppercorns'),
  ('Garlic Powder'),
  ('Onion Powder'),
  ('Paprika'),
  ('Smoked Paprika'),
  ('Cayenne Pepper'),
  ('Chili Powder'),
  ('Chili Flakes'),
  ('Cumin'),
  ('Ground Cumin'),
  ('Coriander'),
  ('Ground Coriander'),
  ('Turmeric'),
  ('Cinnamon'),
  ('Ground Cinnamon'),
  ('Cinnamon Stick'),
  ('Cardamom'),
  ('Cloves'),
  ('Nutmeg'),
  ('Mace'),
  ('Allspice'),
  ('Star Anise'),
  ('Anise Seeds'),
  ('Fennel Seeds'),
  ('Mustard Seeds'),
  ('Saffron'),
  ('Sumac'),
  ('Zaatar'),
  ('Garam Masala'),
  ('Curry Powder'),
  ('Italian Seasoning'),
  ('Herbs de Provence'),
  ('Five Spice Powder'),
  ('Old Bay Seasoning'),
  ('Cajun Seasoning'),
  ('Taco Seasoning'),
  ('Ginger Powder'),
  ('Vanilla Extract'),
  ('Vanilla Bean'),
  ('Vanilla Pod'),

  -- Sauces & Condiments
  ('Honey'),
  ('Maple Syrup'),
  ('Agave'),
  ('Sugar'),
  ('Brown Sugar'),
  ('White Sugar'),
  ('Powdered Sugar'),
  ('Stevia'),
  ('Molasses'),
  ('Soy Sauce'),
  ('Dark Soy Sauce'),
  ('Tamari'),
  ('Fish Sauce'),
  ('Oyster Sauce'),
  ('Hoisin Sauce'),
  ('Teriyaki Sauce'),
  ('Sriracha'),
  ('Hot Sauce'),
  ('Tabasco'),
  ('Worcestershire Sauce'),
  ('Ketchup'),
  ('Mustard'),
  ('Dijon Mustard'),
  ('Wholegrain Mustard'),
  ('Yellow Mustard'),
  ('Mayonnaise'),
  ('BBQ Sauce'),
  ('Tomato Sauce'),
  ('Tomato Paste'),
  ('Pesto'),
  ('Tahini Sauce'),
  ('Hummus'),
  ('Salsa'),
  ('Guacamole'),
  ('Vinegar'),
  ('Apple Cider Vinegar'),
  ('White Vinegar'),
  ('Rice Vinegar'),
  ('Balsamic Vinegar'),
  ('Red Wine Vinegar'),
  ('Malt Vinegar'),
  ('Mirin'),
  ('Sake'),
  ('Cooking Wine'),
  ('Red Wine'),
  ('White Wine'),
  ('Beer'),
  ('Rum'),
  ('Brandy'),
  ('Vodka'),

  -- Baking & Misc
  ('Baking Powder'),
  ('Baking Soda'),
  ('Yeast'),
  ('Active Dry Yeast'),
  ('Instant Yeast'),
  ('Gelatin'),
  ('Agar Agar'),
  ('Cocoa Powder'),
  ('Chocolate'),
  ('Dark Chocolate'),
  ('Milk Chocolate'),
  ('White Chocolate'),
  ('Chocolate Chips'),
  ('Marshmallows'),
  ('Sprinkles'),
  ('Food Coloring'),

  -- Beverages (as ingredients)
  ('Coffee'),
  ('Espresso'),
  ('Tea'),
  ('Black Tea'),
  ('Green Tea'),
  ('Matcha'),
  ('Chai'),
  ('Water'),
  ('Sparkling Water'),
  ('Broth'),
  ('Chicken Broth'),
  ('Beef Broth'),
  ('Vegetable Broth'),
  ('Fish Stock'),
  ('Stock')
ON CONFLICT (name) DO NOTHING;

-- Additional ingredients (further enrichment)
INSERT INTO ingredients (name) VALUES
  -- Additional fish
  ('Sea Bream'),
  ('Snapper'),
  ('Red Snapper'),
  ('Grouper'),
  ('Mahi Mahi'),
  ('Monkfish'),
  ('Swordfish'),
  ('Pollock'),
  ('Flounder'),
  ('Sole'),
  ('Skate'),
  ('Eel'),
  ('Catfish'),
  ('Whitefish'),
  ('Salted Cod'),

  -- Additional shellfish/seafood
  ('Crayfish'),
  ('Abalone'),
  ('Sea Urchin'),
  ('Cockles'),
  ('Whelks'),
  ('Cuttlefish'),
  ('Calamari'),
  ('Barnacles'),

  -- Offal & specialty cuts
  ('Beef Liver'),
  ('Pork Liver'),
  ('Kidney'),
  ('Heart'),
  ('Tongue'),
  ('Oxtail'),
  ('Tripe'),
  ('Sweetbreads'),
  ('Bone Marrow'),
  ('Trotters'),
  ('Brisket'),
  ('Short Ribs'),
  ('Flank Steak'),
  ('Skirt Steak'),
  ('Ribeye'),
  ('Sirloin'),
  ('T-Bone Steak'),
  ('Porterhouse'),
  ('Chuck Roast'),

  -- Cured meats & charcuterie
  ('Mortadella'),
  ('Bresaola'),
  ('Jamon Serrano'),
  ('Jamon Iberico'),
  ('Coppa'),
  ('Guanciale'),
  ('Speck'),
  ('Andouille'),
  ('Bratwurst'),
  ('Kielbasa'),
  ('Frankfurter'),
  ('Liverwurst'),
  ('Black Pudding'),
  ('Blood Sausage'),
  ('Turkey Bacon'),
  ('Canadian Bacon'),

  -- Game
  ('Wild Boar'),
  ('Bison'),
  ('Elk'),
  ('Moose'),
  ('Reindeer'),
  ('Pheasant'),
  ('Partridge'),

  -- Extra legumes
  ('Black Eyed Peas'),
  ('Mung Beans'),
  ('Adzuki Beans'),
  ('Cannellini Beans'),
  ('Great Northern Beans'),
  ('Fava Beans'),
  ('Butter Beans'),
  ('Yellow Lentils'),
  ('Black Lentils'),
  ('Beluga Lentils'),
  ('French Lentils'),

  -- Extra grains & flours
  ('Spelt'),
  ('Farro'),
  ('Amaranth'),
  ('Teff'),
  ('Freekeh'),
  ('Kamut'),
  ('Wheat Germ'),
  ('Wheat Bran'),
  ('Puffed Rice'),
  ('Puffed Quinoa'),
  ('Rye Flour'),
  ('Chickpea Flour'),
  ('Buckwheat Flour'),
  ('Tapioca Flour'),
  ('Tapioca Starch'),
  ('Arrowroot'),
  ('Masa Harina'),
  ('Self-Rising Flour'),
  ('Bread Flour'),
  ('Cake Flour'),

  -- Extra pasta shapes
  ('Orecchiette'),
  ('Rigatoni'),
  ('Farfalle'),
  ('Linguine'),
  ('Fettuccine'),
  ('Pappardelle'),
  ('Orzo'),
  ('Cannelloni'),
  ('Tortellini'),
  ('Angel Hair Pasta'),
  ('Conchiglie'),
  ('Cavatappi'),
  ('Ziti'),
  ('Bucatini'),
  ('Tagliatelle'),

  -- Extra noodles
  ('Glass Noodles'),
  ('Cellophane Noodles'),
  ('Shirataki Noodles'),
  ('Chow Mein Noodles'),
  ('Lo Mein Noodles'),
  ('Vermicelli'),
  ('Pho Noodles'),

  -- Extra breads & doughs
  ('Focaccia'),
  ('Ciabatta'),
  ('Brioche'),
  ('Challah'),
  ('Pumpernickel'),
  ('Lavash'),
  ('Flatbread'),
  ('Matzo'),
  ('Pretzel'),
  ('Cornbread'),
  ('Hamburger Bun'),
  ('Hot Dog Bun'),
  ('Dinner Roll'),
  ('Crackers'),
  ('Rice Cakes'),
  ('Phyllo Dough'),
  ('Puff Pastry'),
  ('Pie Crust'),
  ('Pizza Dough'),
  ('Wonton Wrappers'),
  ('Dumpling Wrappers'),
  ('Spring Roll Wrappers'),
  ('Rice Paper'),

  -- Extra vegetables
  ('Sunchoke'),
  ('Jerusalem Artichoke'),
  ('Jicama'),
  ('Kohlrabi'),
  ('Salsify'),
  ('Taro'),
  ('Lotus Root'),
  ('Burdock'),
  ('Rutabaga'),
  ('Rhubarb'),
  ('Swiss Chard'),
  ('Mustard Greens'),
  ('Collard Greens'),
  ('Dandelion Greens'),
  ('Microgreens'),
  ('Alfalfa Sprouts'),
  ('Bean Sprouts'),
  ('Broccoli Sprouts'),
  ('Mizuna'),
  ('Purslane'),
  ('Samphire'),
  ('Nettles'),
  ('Sorrel'),
  ('Horseradish Root'),
  ('Wasabi Root'),
  ('Lotus Seeds'),

  -- Extra mushrooms
  ('Enoki'),
  ('Morel'),
  ('Lion''s Mane'),
  ('Maitake'),
  ('Cremini'),
  ('King Oyster'),
  ('Wood Ear Mushroom'),
  ('Dried Mushrooms'),

  -- Extra fruits (tropical, stone, exotic)
  ('Quince'),
  ('Loquat'),
  ('Jackfruit'),
  ('Durian'),
  ('Rambutan'),
  ('Longan'),
  ('Mangosteen'),
  ('Starfruit'),
  ('Soursop'),
  ('Tamarind'),
  ('Mulberries'),
  ('Elderberries'),
  ('Boysenberries'),
  ('Acai Berries'),
  ('Goji Berries'),
  ('Sea Buckthorn'),
  ('Rosehip'),
  ('Kumquat'),
  ('Yuzu'),
  ('Meyer Lemon'),
  ('Blood Orange'),
  ('Bergamot'),
  ('Key Lime'),

  -- Extra dried fruit
  ('Dried Cranberries'),
  ('Dried Cherries'),
  ('Dried Mango'),
  ('Dried Blueberries'),
  ('Dried Figs'),
  ('Candied Peel'),

  -- Extra dairy & alternatives
  ('Quark'),
  ('Fromage Blanc'),
  ('Clotted Cream'),
  ('Labneh'),
  ('Smetana'),
  ('Ayran'),
  ('Skyr'),
  ('Rice Milk'),
  ('Cashew Milk'),
  ('Hemp Milk'),
  ('Vegan Butter'),
  ('Vegan Cheese'),
  ('Nutritional Yeast'),

  -- Extra cheeses
  ('Manchego'),
  ('Gruyere'),
  ('Emmental'),
  ('Roquefort'),
  ('Gorgonzola'),
  ('Asiago'),
  ('Pecorino'),
  ('Pecorino Romano'),
  ('Stilton'),
  ('Havarti'),
  ('Monterey Jack'),
  ('Pepper Jack'),
  ('Colby'),
  ('Fontina'),
  ('Taleggio'),
  ('Munster'),
  ('Burrata'),
  ('Queso Fresco'),
  ('Queso Blanco'),
  ('Cotija'),
  ('Mascarpone'),

  -- Extra nuts & seeds
  ('Chestnuts'),
  ('Ginkgo Nuts'),
  ('Pepitas'),
  ('Pine Kernels'),
  ('Nigella Seeds'),
  ('Fenugreek Seeds'),
  ('Black Sesame Seeds'),
  ('Cacao Nibs'),
  ('Marzipan'),
  ('Nougat'),

  -- Extra herbs
  ('Lavender'),
  ('Lemon Balm'),
  ('Savory'),
  ('Shiso'),
  ('Perilla'),
  ('Epazote'),
  ('Borage'),
  ('Hyssop'),
  ('Chervil Leaves'),

  -- Extra spices
  ('Fenugreek'),
  ('Asafoetida'),
  ('Sichuan Pepper'),
  ('Urfa Biber'),
  ('Aleppo Pepper'),
  ('Dried Lime'),
  ('Juniper Berries'),
  ('Black Cardamom'),
  ('Long Pepper'),
  ('Annatto'),
  ('Mahlab'),
  ('Grains of Paradise'),
  ('Ras El Hanout'),
  ('Berbere'),
  ('Dukkah'),
  ('Chinese Five Spice'),
  ('Baharat'),
  ('Pumpkin Pie Spice'),
  ('Apple Pie Spice'),
  ('Everything Bagel Seasoning'),
  ('Lemon Pepper'),
  ('Celery Salt'),
  ('Onion Salt'),
  ('MSG'),
  ('Bouillon Cube'),
  ('Chicken Bouillon'),
  ('Beef Bouillon'),
  ('Vegetable Bouillon'),

  -- Extra sweeteners
  ('Corn Syrup'),
  ('Golden Syrup'),
  ('Treacle'),
  ('Date Syrup'),
  ('Birch Syrup'),
  ('Xylitol'),
  ('Monk Fruit'),
  ('Erythritol'),
  ('Palm Sugar'),
  ('Coconut Sugar'),
  ('Jaggery'),
  ('Muscovado'),
  ('Demerara Sugar'),
  ('Turbinado Sugar'),
  ('Caster Sugar'),
  ('Confectioners Sugar'),

  -- Extra sauces, pastes & condiments
  ('Aioli'),
  ('Tzatziki'),
  ('Chimichurri'),
  ('Gochujang'),
  ('Doenjang'),
  ('Miso Paste'),
  ('White Miso'),
  ('Red Miso'),
  ('Sambal Oelek'),
  ('Harissa'),
  ('Black Bean Sauce'),
  ('Plum Sauce'),
  ('Sweet Chili Sauce'),
  ('Ponzu'),
  ('Unagi Sauce'),
  ('Tartar Sauce'),
  ('Cocktail Sauce'),
  ('Ranch Dressing'),
  ('Vinaigrette'),
  ('Italian Dressing'),
  ('Caesar Dressing'),
  ('Russian Dressing'),
  ('Thousand Island Dressing'),
  ('Blue Cheese Dressing'),
  ('Honey Mustard'),
  ('Horseradish Sauce'),
  ('Tartare'),
  ('Romesco'),
  ('Mole'),
  ('Enchilada Sauce'),
  ('Adobo Sauce'),
  ('Curry Paste'),
  ('Red Curry Paste'),
  ('Green Curry Paste'),
  ('Yellow Curry Paste'),
  ('Massaman Curry Paste'),
  ('Anchovy Paste'),
  ('Tamarind Paste'),
  ('Tomato Puree'),
  ('Passata'),
  ('Crushed Tomatoes'),
  ('Diced Tomatoes'),

  -- Pickles & ferments
  ('Sauerkraut'),
  ('Kimchi'),
  ('Pickled Ginger'),
  ('Umeboshi'),
  ('Cornichons'),
  ('Gherkins'),
  ('Pickled Onions'),
  ('Pickled Jalapenos'),
  ('Kombucha'),

  -- Preserves & spreads
  ('Jam'),
  ('Strawberry Jam'),
  ('Raspberry Jam'),
  ('Apricot Jam'),
  ('Jelly'),
  ('Marmalade'),
  ('Chutney'),
  ('Mango Chutney'),
  ('Relish'),
  ('Compote'),
  ('Apple Sauce'),
  ('Cranberry Sauce'),
  ('Nutella'),
  ('Hazelnut Spread'),
  ('Lemon Curd'),
  ('Dulce de Leche'),

  -- Extracts & flavorings
  ('Almond Extract'),
  ('Lemon Extract'),
  ('Orange Extract'),
  ('Peppermint Extract'),
  ('Rose Water'),
  ('Orange Blossom Water'),

  -- Cooking wines & spirits
  ('Sherry'),
  ('Dry Sherry'),
  ('Port'),
  ('Marsala'),
  ('Vermouth'),
  ('Gin'),
  ('Tequila'),
  ('Whiskey'),
  ('Bourbon'),
  ('Champagne'),
  ('Prosecco'),
  ('Cider'),
  ('Cognac'),
  ('Amaretto'),
  ('Grand Marnier'),
  ('Kirsch'),
  ('Kahlua'),

  -- Baking extras
  ('Cream of Tartar'),
  ('Cocoa Butter'),
  ('White Chocolate Chips'),
  ('Dark Chocolate Chips'),
  ('Chocolate Shavings'),
  ('Candy Melts'),
  ('Pearl Sugar'),
  ('Sanding Sugar'),

  -- Condiment/specialty
  ('Wasabi'),
  ('Horseradish'),
  ('Liquid Smoke'),
  ('Liquid Aminos'),
  ('Coconut Aminos'),
  ('Pomegranate Molasses'),
  ('Verjuice')
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
-- Garlic, Eggs, Bread, Butter, Oils, Honey, Nuts, Vegetables, Fruits
INSERT INTO ingredient_unit_conversions (ingredient_id, unit, grams)
SELECT id, 'clove', 3 FROM ingredients WHERE name = 'Garlic' UNION ALL
SELECT id, 'tbsp', 9 FROM ingredients WHERE name = 'Garlic' UNION ALL

SELECT id, 'pcs', 50 FROM ingredients WHERE name = 'Eggs' UNION ALL
SELECT id, 'slice', 30 FROM ingredients WHERE name = 'Bread' UNION ALL
SELECT id, 'tbsp', 15 FROM ingredients WHERE name = 'Butter' UNION ALL
SELECT id, 'tbsp', 15 FROM ingredients WHERE name = 'Olive Oil' UNION ALL
SELECT id, 'tsp', 5 FROM ingredients WHERE name = 'Olive Oil' UNION ALL
SELECT id, 'tbsp', 20 FROM ingredients WHERE name = 'Honey' UNION ALL
SELECT id, 'tsp', 7 FROM ingredients WHERE name = 'Honey' UNION ALL
SELECT id, 'tbsp', 16 FROM ingredients WHERE name = 'Peanut Butter' UNION ALL
SELECT id, 'tbsp', 9 FROM ingredients WHERE name = 'Almonds' UNION ALL
SELECT id, 'tbsp', 7 FROM ingredients WHERE name = 'Walnuts' UNION ALL
SELECT id, 'tbsp', 10 FROM ingredients WHERE name = 'Onion' UNION ALL
SELECT id, 'pcs', 182 FROM ingredients WHERE name = 'Apple' UNION ALL
SELECT id, 'pcs', 118 FROM ingredients WHERE name = 'Banana' UNION ALL
SELECT id, 'pcs', 150 FROM ingredients WHERE name = 'Avocado' UNION ALL
SELECT id, 'pcs', 123 FROM ingredients WHERE name = 'Tomato' UNION ALL
SELECT id, 'pcs', 149 FROM ingredients WHERE name = 'Bell Pepper' UNION ALL
SELECT id, 'pcs', 301 FROM ingredients WHERE name = 'Cucumber' UNION ALL
SELECT id, 'pcs', 61 FROM ingredients WHERE name = 'Carrots' UNION ALL
SELECT id, 'pcs', 173 FROM ingredients WHERE name = 'Potato'
ON CONFLICT (ingredient_id, unit) DO NOTHING;

-- ============================================
-- INGREDIENT PORTIONS (named portions with weights)
-- ============================================
-- All ingredient portions
INSERT INTO ingredient_portions (ingredient_id, name, weight_in_grams)
SELECT id, '1 medium fillet', 175 FROM ingredients WHERE name = 'Chicken Breast' UNION ALL
SELECT id, '1 large fillet', 225 FROM ingredients WHERE name = 'Chicken Breast' UNION ALL
SELECT id, '1 fillet', 180 FROM ingredients WHERE name = 'Salmon' UNION ALL
SELECT id, '100g fillet', 100 FROM ingredients WHERE name = 'Salmon' UNION ALL
SELECT id, '1 large egg', 50 FROM ingredients WHERE name = 'Eggs' UNION ALL
SELECT id, '1 egg white', 33 FROM ingredients WHERE name = 'Eggs' UNION ALL
SELECT id, '1 egg yolk', 17 FROM ingredients WHERE name = 'Eggs' UNION ALL
SELECT id, '1 medium avocado', 150 FROM ingredients WHERE name = 'Avocado' UNION ALL
SELECT id, '1/2 avocado', 75 FROM ingredients WHERE name = 'Avocado' UNION ALL
SELECT id, '1 medium apple', 182 FROM ingredients WHERE name = 'Apple' UNION ALL
SELECT id, '1 small apple', 149 FROM ingredients WHERE name = 'Apple' UNION ALL
SELECT id, '1 medium banana', 118 FROM ingredients WHERE name = 'Banana' UNION ALL
SELECT id, '1 large banana', 136 FROM ingredients WHERE name = 'Banana' UNION ALL
SELECT id, '1 medium tomato', 123 FROM ingredients WHERE name = 'Tomato' UNION ALL
SELECT id, '1 large tomato', 182 FROM ingredients WHERE name = 'Tomato' UNION ALL
SELECT id, '1 medium pepper', 149 FROM ingredients WHERE name = 'Bell Pepper' UNION ALL
SELECT id, '1 whole cucumber', 301 FROM ingredients WHERE name = 'Cucumber' UNION ALL
SELECT id, '1 cup sliced', 104 FROM ingredients WHERE name = 'Cucumber' UNION ALL
SELECT id, '1 medium carrot', 61 FROM ingredients WHERE name = 'Carrots' UNION ALL
SELECT id, '1 cup chopped', 128 FROM ingredients WHERE name = 'Carrots' UNION ALL
SELECT id, '1 medium potato', 173 FROM ingredients WHERE name = 'Potato' UNION ALL
SELECT id, '1 large potato', 299 FROM ingredients WHERE name = 'Potato' UNION ALL
SELECT id, '1 cup chopped', 91 FROM ingredients WHERE name = 'Broccoli' UNION ALL
SELECT id, '1 head', 588 FROM ingredients WHERE name = 'Broccoli' UNION ALL
SELECT id, '1 cup raw', 30 FROM ingredients WHERE name = 'Spinach' UNION ALL
SELECT id, '1 cup cooked', 180 FROM ingredients WHERE name = 'Spinach' UNION ALL
SELECT id, '23 almonds', 23 FROM ingredients WHERE name = 'Almonds' UNION ALL
SELECT id, '1 ounce (oz)', 28 FROM ingredients WHERE name = 'Almonds' UNION ALL
SELECT id, '14 halves', 28 FROM ingredients WHERE name = 'Walnuts' UNION ALL
SELECT id, '2 tbsp', 32 FROM ingredients WHERE name = 'Peanut Butter' UNION ALL
SELECT id, '1 cup cooked', 195 FROM ingredients WHERE name = 'Rice' UNION ALL
SELECT id, '1 cup cooked', 220 FROM ingredients WHERE name = 'Pasta' UNION ALL
SELECT id, '1 slice', 30 FROM ingredients WHERE name = 'Bread' UNION ALL
SELECT id, '1 cup cooked', 234 FROM ingredients WHERE name = 'Oats' UNION ALL
SELECT id, '1/2 cup dry', 40 FROM ingredients WHERE name = 'Oats'
ON CONFLICT (ingredient_id, name) DO NOTHING;

-- ============================================
-- TEST USER (for recipe ownership tests)
-- ============================================
INSERT INTO users (id, username, role, status) VALUES
  (1, 'demo_chef', 'user', 'offline')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEST RECIPE (for smoke tests)
-- ============================================
INSERT INTO recipes (
  title, 
  description, 
  instructions, 
  servings, 
  spiciness, 
  author_id, 
  status,
  rating_avg,
  rating_count
) VALUES (
  jsonb_build_object('en', 'Classic Pancakes', 'fi', 'Classic Pancakes', 'ru', 'Classic Pancakes'),
  jsonb_build_object('en', 'Fluffy and delicious homemade pancakes perfect for breakfast', 'fi', 'Fluffy and delicious homemade pancakes perfect for breakfast', 'ru', 'Fluffy and delicious homemade pancakes perfect for breakfast'),
  jsonb_build_object(
    'en', to_jsonb(ARRAY[
      'Mix flour, sugar, baking powder and salt in a large bowl',
      'In another bowl, whisk together milk, egg and melted butter',
      'Pour wet ingredients into dry ingredients and stir until just combined',
      'Heat a lightly oiled griddle over medium-high heat',
      'Pour batter onto the griddle and cook until bubbles form on surface',
      'Flip and cook until golden brown on both sides'
    ]),
    'fi', to_jsonb(ARRAY[
      'Mix flour, sugar, baking powder and salt in a large bowl',
      'In another bowl, whisk together milk, egg and melted butter',
      'Pour wet ingredients into dry ingredients and stir until just combined',
      'Heat a lightly oiled griddle over medium-high heat',
      'Pour batter onto the griddle and cook until bubbles form on surface',
      'Flip and cook until golden brown on both sides'
    ]),
    'ru', to_jsonb(ARRAY[
      'Mix flour, sugar, baking powder and salt in a large bowl',
      'In another bowl, whisk together milk, egg and melted butter',
      'Pour wet ingredients into dry ingredients and stir until just combined',
      'Heat a lightly oiled griddle over medium-high heat',
      'Pour batter onto the griddle and cook until bubbles form on surface',
      'Flip and cook until golden brown on both sides'
    ])
  ),
  4,
  0,
  1,
  'published',
  4.50,
  10
) ON CONFLICT DO NOTHING;

COMMENT ON SCHEMA public IS 'Seed data loaded successfully';
