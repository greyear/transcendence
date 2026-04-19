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
INSERT INTO recipe_categories (category_type_id, code, name)
SELECT t.id, v.code, v.name
FROM recipe_category_types t
JOIN (VALUES
  ('breakfast',    'Breakfast'),
  ('brunch',       'Brunch'),
  ('lunch',        'Lunch'),
  ('dinner',       'Dinner'),
  ('supper',       'Supper'),
  ('snack',        'Snack'),
  ('late_night',   'Late Night'),
  ('tea_time',     'Tea Time'),
  ('pre_workout',  'Pre Workout'),
  ('post_workout', 'Post Workout'),
  ('kids_meal',    'Kids Meal'),
  ('holiday',      'Holiday'),
  ('picnic',       'Picnic'),
  ('party',        'Party'),
  ('buffet',       'Buffet')
) AS v(code, name) ON true
WHERE t.code = 'meal_time'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Dish Type
INSERT INTO recipe_categories (category_type_id, code, name)
SELECT t.id, v.code, v.name
FROM recipe_category_types t
JOIN (VALUES
  ('soup',        'Soup'),
  ('stew',        'Stew'),
  ('salad',       'Salad'),
  ('main_course', 'Main Course'),
  ('side_dish',   'Side Dish'),
  ('dessert',     'Dessert'),
  ('beverage',    'Beverage'),
  ('cocktail',    'Cocktail'),
  ('smoothie',    'Smoothie'),
  ('appetizer',   'Appetizer'),
  ('sandwich',    'Sandwich'),
  ('wrap',        'Wrap'),
  ('burger',      'Burger'),
  ('pizza',       'Pizza'),
  ('pasta',       'Pasta'),
  ('noodles',     'Noodles'),
  ('rice_dish',   'Rice Dish'),
  ('casserole',   'Casserole'),
  ('curry',       'Curry'),
  ('stir_fry',    'Stir Fry'),
  ('bowl',        'Bowl'),
  ('porridge',    'Porridge'),
  ('omelette',    'Omelette'),
  ('quiche',      'Quiche'),
  ('pancake',     'Pancake'),
  ('waffle',      'Waffle'),
  ('crepe',       'Crepe'),
  ('dumpling',    'Dumpling'),
  ('roll',        'Roll'),
  ('skewer',      'Skewer'),
  ('grill',       'Grill'),
  ('barbecue',    'Barbecue'),
  ('roast',       'Roast'),
  ('hot_pot',     'Hot Pot'),
  ('pie',         'Pie'),
  ('tart',        'Tart'),
  ('cake',        'Cake'),
  ('cookie',      'Cookie'),
  ('pastry',      'Pastry'),
  ('bread',       'Bread'),
  ('ice_cream',   'Ice Cream'),
  ('dip',         'Dip'),
  ('sauce',       'Sauce'),
  ('pickle',      'Pickle'),
  ('preserve',    'Preserve'),
  ('risotto',     'Risotto'),
  ('taco',        'Taco')
) AS v(code, name) ON true
WHERE t.code = 'dish_type'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Main Ingredient (each code corresponds to an entry in the ingredients table — subset relationship)
INSERT INTO recipe_categories (category_type_id, code, name)
SELECT t.id, v.code, v.name
FROM recipe_category_types t
JOIN (VALUES
  ('chicken',     'Chicken'),
  ('turkey',      'Turkey'),
  ('duck',        'Duck'),
  ('beef',        'Beef'),
  ('pork',        'Pork'),
  ('lamb',        'Lamb'),
  ('salmon',      'Salmon'),
  ('tuna',        'Tuna'),
  ('cod',         'Cod'),
  ('trout',       'Trout'),
  ('shrimp',      'Shrimp'),
  ('crab',        'Crab'),
  ('lobster',     'Lobster'),
  ('eggs',        'Eggs'),
  ('tofu',        'Tofu'),
  ('tempeh',      'Tempeh'),
  ('beans',       'Beans'),
  ('lentils',     'Lentils'),
  ('chickpeas',   'Chickpeas'),
  ('rice',        'Rice'),
  ('pasta',       'Pasta'),
  ('quinoa',      'Quinoa'),
  ('potato',      'Potato'),
  ('mushroom',    'Mushroom'),
  ('cheese',      'Cheese'),
  ('avocado',     'Avocado'),
  ('broccoli',    'Broccoli'),
  ('spinach',     'Spinach'),
  ('tomato',      'Tomato'),
  ('eggplant',    'Eggplant'),
  ('cauliflower', 'Cauliflower'),
  ('pumpkin',     'Pumpkin')
) AS v(code, name) ON true
WHERE t.code = 'main_ingredient'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Cuisine
INSERT INTO recipe_categories (category_type_id, code, name)
SELECT t.id, v.code, v.name
FROM recipe_category_types t
JOIN (VALUES
  ('italian',        'Italian'),
  ('asian',          'Asian'),
  ('chinese',        'Chinese'),
  ('japanese',       'Japanese'),
  ('korean',         'Korean'),
  ('thai',           'Thai'),
  ('vietnamese',     'Vietnamese'),
  ('indian',         'Indian'),
  ('indonesian',     'Indonesian'),
  ('filipino',       'Filipino'),
  ('mexican',        'Mexican'),
  ('tex_mex',        'Tex Mex'),
  ('cajun',          'Cajun'),
  ('creole',         'Creole'),
  ('french',         'French'),
  ('american',       'American'),
  ('southern_us',    'Southern US'),
  ('mediterranean',  'Mediterranean'),
  ('spanish',        'Spanish'),
  ('portuguese',     'Portuguese'),
  ('greek',          'Greek'),
  ('turkish',        'Turkish'),
  ('moroccan',       'Moroccan'),
  ('ethiopian',      'Ethiopian'),
  ('middle_eastern', 'Middle Eastern'),
  ('lebanese',       'Lebanese'),
  ('persian',        'Persian'),
  ('israeli',        'Israeli'),
  ('finnish',        'Finnish'),
  ('swedish',        'Swedish'),
  ('norwegian',      'Norwegian'),
  ('danish',         'Danish'),
  ('nordic',         'Nordic'),
  ('russian',        'Russian'),
  ('ukrainian',      'Ukrainian'),
  ('georgian',       'Georgian'),
  ('polish',         'Polish'),
  ('hungarian',      'Hungarian'),
  ('czech',          'Czech'),
  ('german',         'German'),
  ('austrian',       'Austrian'),
  ('swiss',          'Swiss'),
  ('british',        'British'),
  ('irish',          'Irish'),
  ('scottish',       'Scottish'),
  ('brazilian',      'Brazilian'),
  ('peruvian',       'Peruvian'),
  ('argentinian',    'Argentinian'),
  ('caribbean',      'Caribbean'),
  ('cuban',          'Cuban'),
  ('jamaican',       'Jamaican'),
  ('fusion',         'Fusion')
) AS v(code, name) ON true
WHERE t.code = 'cuisine'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- ============================================
-- INGREDIENT CATEGORIES
-- ============================================
INSERT INTO ingredient_categories (code, name) VALUES
  ('nuts',       'Nuts'),
  ('dairy',      'Dairy'),
  ('meat',       'Meat'),
  ('fish',       'Fish'),
  ('grains',     'Grains'),
  ('spices',     'Spices'),
  ('vegetables', 'Vegetables'),
  ('fruits',     'Fruits'),
  ('legumes',    'Legumes'),
  ('eggs',       'Eggs')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- ALLERGENS
-- ============================================
INSERT INTO allergens (code, name) VALUES
  ('nuts',      'Nuts'),
  ('lactose',   'Lactose'),
  ('gluten',    'Gluten'),
  ('eggs',      'Eggs'),
  ('fish',      'Fish'),
  ('shellfish', 'Shellfish'),
  ('soy',       'Soy'),
  ('sesame',    'Sesame'),
  ('berries',   'Berries'),
  ('fruits',    'Fruits')
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
INSERT INTO ingredients (code, name) VALUES
  ('chicken', 'Chicken'),
  ('chicken_breast', 'Chicken Breast'),
  ('chicken_thigh', 'Chicken Thigh'),
  ('chicken_wings', 'Chicken Wings'),
  ('chicken_liver', 'Chicken Liver'),
  ('turkey', 'Turkey'),
  ('turkey_breast', 'Turkey Breast'),
  ('duck', 'Duck'),
  ('duck_breast', 'Duck Breast'),
  ('goose', 'Goose'),
  ('quail', 'Quail'),
  ('beef', 'Beef'),
  ('ground_beef', 'Ground Beef'),
  ('beef_steak', 'Beef Steak'),
  ('beef_ribs', 'Beef Ribs'),
  ('beef_tenderloin', 'Beef Tenderloin'),
  ('veal', 'Veal'),
  ('pork', 'Pork'),
  ('pork_chop', 'Pork Chop'),
  ('pork_belly', 'Pork Belly'),
  ('pork_loin', 'Pork Loin'),
  ('pork_ribs', 'Pork Ribs'),
  ('ground_pork', 'Ground Pork'),
  ('bacon', 'Bacon'),
  ('ham', 'Ham'),
  ('prosciutto', 'Prosciutto'),
  ('pancetta', 'Pancetta'),
  ('sausage', 'Sausage'),
  ('chorizo', 'Chorizo'),
  ('salami', 'Salami'),
  ('pepperoni', 'Pepperoni'),
  ('lamb', 'Lamb'),
  ('lamb_chop', 'Lamb Chop'),
  ('ground_lamb', 'Ground Lamb'),
  ('rabbit', 'Rabbit'),
  ('venison', 'Venison'),

  -- Fish & Seafood
  ('salmon', 'Salmon'),
  ('smoked_salmon', 'Smoked Salmon'),
  ('tuna', 'Tuna'),
  ('canned_tuna', 'Canned Tuna'),
  ('cod', 'Cod'),
  ('haddock', 'Haddock'),
  ('halibut', 'Halibut'),
  ('trout', 'Trout'),
  ('mackerel', 'Mackerel'),
  ('sardines', 'Sardines'),
  ('anchovies', 'Anchovies'),
  ('tilapia', 'Tilapia'),
  ('sea_bass', 'Sea Bass'),
  ('herring', 'Herring'),
  ('perch', 'Perch'),
  ('pike', 'Pike'),
  ('carp', 'Carp'),
  ('shrimp', 'Shrimp'),
  ('prawns', 'Prawns'),
  ('crab', 'Crab'),
  ('lobster', 'Lobster'),
  ('scallops', 'Scallops'),
  ('mussels', 'Mussels'),
  ('clams', 'Clams'),
  ('oysters', 'Oysters'),
  ('squid', 'Squid'),
  ('octopus', 'Octopus'),
  ('caviar', 'Caviar'),
  ('roe', 'Roe'),

  -- Eggs & Plant Protein
  ('eggs', 'Eggs'),
  ('egg_whites', 'Egg Whites'),
  ('quail_eggs', 'Quail Eggs'),
  ('tofu', 'Tofu'),
  ('firm_tofu', 'Firm Tofu'),
  ('silken_tofu', 'Silken Tofu'),
  ('tempeh', 'Tempeh'),
  ('seitan', 'Seitan'),

  -- Legumes
  ('beans', 'Beans'),
  ('black_beans', 'Black Beans'),
  ('kidney_beans', 'Kidney Beans'),
  ('pinto_beans', 'Pinto Beans'),
  ('navy_beans', 'Navy Beans'),
  ('white_beans', 'White Beans'),
  ('lima_beans', 'Lima Beans'),
  ('green_beans', 'Green Beans'),
  ('lentils', 'Lentils'),
  ('red_lentils', 'Red Lentils'),
  ('green_lentils', 'Green Lentils'),
  ('chickpeas', 'Chickpeas'),
  ('split_peas', 'Split Peas'),
  ('edamame', 'Edamame'),

  -- Grains & Carbs
  ('rice', 'Rice'),
  ('white_rice', 'White Rice'),
  ('brown_rice', 'Brown Rice'),
  ('basmati_rice', 'Basmati Rice'),
  ('jasmine_rice', 'Jasmine Rice'),
  ('arborio_rice', 'Arborio Rice'),
  ('wild_rice', 'Wild Rice'),
  ('pasta', 'Pasta'),
  ('spaghetti', 'Spaghetti'),
  ('penne', 'Penne'),
  ('fusilli', 'Fusilli'),
  ('macaroni', 'Macaroni'),
  ('lasagna_sheets', 'Lasagna Sheets'),
  ('ravioli', 'Ravioli'),
  ('gnocchi', 'Gnocchi'),
  ('egg_noodles', 'Egg Noodles'),
  ('rice_noodles', 'Rice Noodles'),
  ('udon_noodles', 'Udon Noodles'),
  ('soba_noodles', 'Soba Noodles'),
  ('ramen_noodles', 'Ramen Noodles'),
  ('bread', 'Bread'),
  ('white_bread', 'White Bread'),
  ('whole_wheat_bread', 'Whole Wheat Bread'),
  ('sourdough_bread', 'Sourdough Bread'),
  ('rye_bread', 'Rye Bread'),
  ('pita_bread', 'Pita Bread'),
  ('naan_bread', 'Naan Bread'),
  ('tortilla', 'Tortilla'),
  ('corn_tortilla', 'Corn Tortilla'),
  ('flour_tortilla', 'Flour Tortilla'),
  ('bagel', 'Bagel'),
  ('croissant', 'Croissant'),
  ('baguette', 'Baguette'),
  ('english_muffin', 'English Muffin'),
  ('breadcrumbs', 'Breadcrumbs'),
  ('panko', 'Panko'),
  ('oats', 'Oats'),
  ('rolled_oats', 'Rolled Oats'),
  ('steel_cut_oats', 'Steel Cut Oats'),
  ('quinoa', 'Quinoa'),
  ('couscous', 'Couscous'),
  ('bulgur', 'Bulgur'),
  ('barley', 'Barley'),
  ('buckwheat', 'Buckwheat'),
  ('millet', 'Millet'),
  ('semolina', 'Semolina'),
  ('cornmeal', 'Cornmeal'),
  ('polenta', 'Polenta'),
  ('flour', 'Flour'),
  ('all_purpose_flour', 'All Purpose Flour'),
  ('whole_wheat_flour', 'Whole Wheat Flour'),
  ('almond_flour', 'Almond Flour'),
  ('coconut_flour', 'Coconut Flour'),
  ('rice_flour', 'Rice Flour'),
  ('cornstarch', 'Cornstarch'),
  ('potato', 'Potato'),
  ('sweet_potato', 'Sweet Potato'),
  ('yam', 'Yam'),
  ('wheat', 'Wheat'),
  ('cassava', 'Cassava'),

  -- Vegetables
  ('broccoli', 'Broccoli'),
  ('cauliflower', 'Cauliflower'),
  ('brussels_sprouts', 'Brussels Sprouts'),
  ('cabbage', 'Cabbage'),
  ('red_cabbage', 'Red Cabbage'),
  ('napa_cabbage', 'Napa Cabbage'),
  ('bok_choy', 'Bok Choy'),
  ('chard', 'Chard'),
  ('spinach', 'Spinach'),
  ('kale', 'Kale'),
  ('arugula', 'Arugula'),
  ('lettuce', 'Lettuce'),
  ('romaine_lettuce', 'Romaine Lettuce'),
  ('iceberg_lettuce', 'Iceberg Lettuce'),
  ('watercress', 'Watercress'),
  ('endive', 'Endive'),
  ('radicchio', 'Radicchio'),
  ('carrots', 'Carrots'),
  ('parsnip', 'Parsnip'),
  ('turnip', 'Turnip'),
  ('beetroot', 'Beetroot'),
  ('radish', 'Radish'),
  ('daikon', 'Daikon'),
  ('celery', 'Celery'),
  ('celeriac', 'Celeriac'),
  ('fennel', 'Fennel'),
  ('leek', 'Leek'),
  ('shallot', 'Shallot'),
  ('scallion', 'Scallion'),
  ('chives', 'Chives'),
  ('onion', 'Onion'),
  ('red_onion', 'Red Onion'),
  ('white_onion', 'White Onion'),
  ('yellow_onion', 'Yellow Onion'),
  ('spring_onion', 'Spring Onion'),
  ('garlic', 'Garlic'),
  ('ginger', 'Ginger'),
  ('galangal', 'Galangal'),
  ('turmeric_root', 'Turmeric Root'),
  ('tomato', 'Tomato'),
  ('cherry_tomatoes', 'Cherry Tomatoes'),
  ('sun_dried_tomatoes', 'Sun Dried Tomatoes'),
  ('bell_pepper', 'Bell Pepper'),
  ('red_bell_pepper', 'Red Bell Pepper'),
  ('green_bell_pepper', 'Green Bell Pepper'),
  ('yellow_bell_pepper', 'Yellow Bell Pepper'),
  ('chili_pepper', 'Chili Pepper'),
  ('jalapeno', 'Jalapeno'),
  ('habanero', 'Habanero'),
  ('serrano', 'Serrano'),
  ('poblano', 'Poblano'),
  ('cucumber', 'Cucumber'),
  ('pickle', 'Pickle'),
  ('zucchini', 'Zucchini'),
  ('eggplant', 'Eggplant'),
  ('squash', 'Squash'),
  ('butternut_squash', 'Butternut Squash'),
  ('acorn_squash', 'Acorn Squash'),
  ('pumpkin', 'Pumpkin'),
  ('mushroom', 'Mushroom'),
  ('button_mushroom', 'Button Mushroom'),
  ('portobello', 'Portobello'),
  ('shiitake', 'Shiitake'),
  ('oyster_mushroom', 'Oyster Mushroom'),
  ('porcini', 'Porcini'),
  ('chanterelle', 'Chanterelle'),
  ('truffle', 'Truffle'),
  ('asparagus', 'Asparagus'),
  ('artichoke', 'Artichoke'),
  ('okra', 'Okra'),
  ('corn', 'Corn'),
  ('sweet_corn', 'Sweet Corn'),
  ('peas', 'Peas'),
  ('snow_peas', 'Snow Peas'),
  ('sugar_snap_peas', 'Sugar Snap Peas'),
  ('bamboo_shoots', 'Bamboo Shoots'),
  ('water_chestnuts', 'Water Chestnuts'),
  ('seaweed', 'Seaweed'),
  ('nori', 'Nori'),
  ('wakame', 'Wakame'),
  ('kelp', 'Kelp'),
  ('olives', 'Olives'),
  ('green_olives', 'Green Olives'),
  ('black_olives', 'Black Olives'),
  ('capers', 'Capers'),

  -- Fruits
  ('apple', 'Apple'),
  ('green_apple', 'Green Apple'),
  ('pear', 'Pear'),
  ('banana', 'Banana'),
  ('plantain', 'Plantain'),
  ('avocado', 'Avocado'),
  ('orange', 'Orange'),
  ('mandarin', 'Mandarin'),
  ('tangerine', 'Tangerine'),
  ('clementine', 'Clementine'),
  ('lemon', 'Lemon'),
  ('lime', 'Lime'),
  ('grapefruit', 'Grapefruit'),
  ('blueberries', 'Blueberries'),
  ('strawberries', 'Strawberries'),
  ('raspberries', 'Raspberries'),
  ('blackberries', 'Blackberries'),
  ('cranberries', 'Cranberries'),
  ('currants', 'Currants'),
  ('gooseberries', 'Gooseberries'),
  ('lingonberries', 'Lingonberries'),
  ('cloudberries', 'Cloudberries'),
  ('grapes', 'Grapes'),
  ('red_grapes', 'Red Grapes'),
  ('watermelon', 'Watermelon'),
  ('cantaloupe', 'Cantaloupe'),
  ('honeydew', 'Honeydew'),
  ('mango', 'Mango'),
  ('pineapple', 'Pineapple'),
  ('papaya', 'Papaya'),
  ('kiwi', 'Kiwi'),
  ('peach', 'Peach'),
  ('nectarine', 'Nectarine'),
  ('plum', 'Plum'),
  ('apricot', 'Apricot'),
  ('cherries', 'Cherries'),
  ('pomegranate', 'Pomegranate'),
  ('passion_fruit', 'Passion Fruit'),
  ('dragon_fruit', 'Dragon Fruit'),
  ('lychee', 'Lychee'),
  ('guava', 'Guava'),
  ('persimmon', 'Persimmon'),
  ('fig', 'Fig'),
  ('dates', 'Dates'),
  ('raisins', 'Raisins'),
  ('prunes', 'Prunes'),
  ('dried_apricots', 'Dried Apricots'),
  ('coconut', 'Coconut'),
  ('coconut_flakes', 'Coconut Flakes'),
  ('coconut_milk', 'Coconut Milk'),
  ('coconut_cream', 'Coconut Cream'),

  -- Dairy
  ('milk', 'Milk'),
  ('whole_milk', 'Whole Milk'),
  ('skim_milk', 'Skim Milk'),
  ('almond_milk', 'Almond Milk'),
  ('oat_milk', 'Oat Milk'),
  ('soy_milk', 'Soy Milk'),
  ('buttermilk', 'Buttermilk'),
  ('condensed_milk', 'Condensed Milk'),
  ('evaporated_milk', 'Evaporated Milk'),
  ('cream', 'Cream'),
  ('heavy_cream', 'Heavy Cream'),
  ('whipping_cream', 'Whipping Cream'),
  ('sour_cream', 'Sour Cream'),
  ('creme_fraiche', 'Creme Fraiche'),
  ('yogurt', 'Yogurt'),
  ('greek_yogurt', 'Greek Yogurt'),
  ('kefir', 'Kefir'),
  ('cheese', 'Cheese'),
  ('cheddar_cheese', 'Cheddar Cheese'),
  ('mozzarella', 'Mozzarella'),
  ('parmesan', 'Parmesan'),
  ('feta', 'Feta'),
  ('ricotta', 'Ricotta'),
  ('cream_cheese', 'Cream Cheese'),
  ('mascarpone', 'Mascarpone'),
  ('goat_cheese', 'Goat Cheese'),
  ('blue_cheese', 'Blue Cheese'),
  ('gouda', 'Gouda'),
  ('brie', 'Brie'),
  ('camembert', 'Camembert'),
  ('swiss_cheese', 'Swiss Cheese'),
  ('provolone', 'Provolone'),
  ('cottage_cheese', 'Cottage Cheese'),
  ('halloumi', 'Halloumi'),
  ('paneer', 'Paneer'),
  ('butter', 'Butter'),
  ('unsalted_butter', 'Unsalted Butter'),
  ('ghee', 'Ghee'),
  ('margarine', 'Margarine'),

  -- Fats & Oils
  ('olive_oil', 'Olive Oil'),
  ('extra_virgin_olive_oil', 'Extra Virgin Olive Oil'),
  ('coconut_oil', 'Coconut Oil'),
  ('sesame_oil', 'Sesame Oil'),
  ('sunflower_oil', 'Sunflower Oil'),
  ('vegetable_oil', 'Vegetable Oil'),
  ('canola_oil', 'Canola Oil'),
  ('avocado_oil', 'Avocado Oil'),
  ('peanut_oil', 'Peanut Oil'),
  ('truffle_oil', 'Truffle Oil'),
  ('lard', 'Lard'),

  -- Nuts & Seeds
  ('almonds', 'Almonds'),
  ('walnuts', 'Walnuts'),
  ('cashews', 'Cashews'),
  ('pistachios', 'Pistachios'),
  ('pecans', 'Pecans'),
  ('hazelnuts', 'Hazelnuts'),
  ('macadamia_nuts', 'Macadamia Nuts'),
  ('brazil_nuts', 'Brazil Nuts'),
  ('pine_nuts', 'Pine Nuts'),
  ('peanuts', 'Peanuts'),
  ('peanut_butter', 'Peanut Butter'),
  ('almond_butter', 'Almond Butter'),
  ('cashew_butter', 'Cashew Butter'),
  ('tahini', 'Tahini'),
  ('chia_seeds', 'Chia Seeds'),
  ('flax_seeds', 'Flax Seeds'),
  ('sunflower_seeds', 'Sunflower Seeds'),
  ('pumpkin_seeds', 'Pumpkin Seeds'),
  ('sesame_seeds', 'Sesame Seeds'),
  ('hemp_seeds', 'Hemp Seeds'),
  ('poppy_seeds', 'Poppy Seeds'),

  -- Herbs (fresh & dried)
  ('basil', 'Basil'),
  ('dried_basil', 'Dried Basil'),
  ('oregano', 'Oregano'),
  ('dried_oregano', 'Dried Oregano'),
  ('thyme', 'Thyme'),
  ('rosemary', 'Rosemary'),
  ('sage', 'Sage'),
  ('mint', 'Mint'),
  ('parsley', 'Parsley'),
  ('cilantro', 'Cilantro'),
  ('dill', 'Dill'),
  ('tarragon', 'Tarragon'),
  ('chervil', 'Chervil'),
  ('marjoram', 'Marjoram'),
  ('bay_leaves', 'Bay Leaves'),
  ('lemongrass', 'Lemongrass'),
  ('kaffir_lime_leaves', 'Kaffir Lime Leaves'),
  ('curry_leaves', 'Curry Leaves'),

  -- Spices
  ('salt', 'Salt'),
  ('sea_salt', 'Sea Salt'),
  ('kosher_salt', 'Kosher Salt'),
  ('black_pepper', 'Black Pepper'),
  ('white_pepper', 'White Pepper'),
  ('peppercorns', 'Peppercorns'),
  ('pink_peppercorns', 'Pink Peppercorns'),
  ('garlic_powder', 'Garlic Powder'),
  ('onion_powder', 'Onion Powder'),
  ('paprika', 'Paprika'),
  ('smoked_paprika', 'Smoked Paprika'),
  ('cayenne_pepper', 'Cayenne Pepper'),
  ('chili_powder', 'Chili Powder'),
  ('chili_flakes', 'Chili Flakes'),
  ('cumin', 'Cumin'),
  ('ground_cumin', 'Ground Cumin'),
  ('coriander', 'Coriander'),
  ('ground_coriander', 'Ground Coriander'),
  ('turmeric', 'Turmeric'),
  ('cinnamon', 'Cinnamon'),
  ('ground_cinnamon', 'Ground Cinnamon'),
  ('cinnamon_stick', 'Cinnamon Stick'),
  ('cardamom', 'Cardamom'),
  ('cloves', 'Cloves'),
  ('nutmeg', 'Nutmeg'),
  ('mace', 'Mace'),
  ('allspice', 'Allspice'),
  ('star_anise', 'Star Anise'),
  ('anise_seeds', 'Anise Seeds'),
  ('fennel_seeds', 'Fennel Seeds'),
  ('mustard_seeds', 'Mustard Seeds'),
  ('saffron', 'Saffron'),
  ('sumac', 'Sumac'),
  ('zaatar', 'Zaatar'),
  ('garam_masala', 'Garam Masala'),
  ('curry_powder', 'Curry Powder'),
  ('italian_seasoning', 'Italian Seasoning'),
  ('herbs_de_provence', 'Herbs de Provence'),
  ('five_spice_powder', 'Five Spice Powder'),
  ('old_bay_seasoning', 'Old Bay Seasoning'),
  ('cajun_seasoning', 'Cajun Seasoning'),
  ('taco_seasoning', 'Taco Seasoning'),
  ('ginger_powder', 'Ginger Powder'),
  ('vanilla_extract', 'Vanilla Extract'),
  ('vanilla_bean', 'Vanilla Bean'),
  ('vanilla_pod', 'Vanilla Pod'),

  -- Sauces & Condiments
  ('honey', 'Honey'),
  ('maple_syrup', 'Maple Syrup'),
  ('agave', 'Agave'),
  ('sugar', 'Sugar'),
  ('brown_sugar', 'Brown Sugar'),
  ('white_sugar', 'White Sugar'),
  ('powdered_sugar', 'Powdered Sugar'),
  ('stevia', 'Stevia'),
  ('molasses', 'Molasses'),
  ('soy_sauce', 'Soy Sauce'),
  ('dark_soy_sauce', 'Dark Soy Sauce'),
  ('tamari', 'Tamari'),
  ('fish_sauce', 'Fish Sauce'),
  ('oyster_sauce', 'Oyster Sauce'),
  ('hoisin_sauce', 'Hoisin Sauce'),
  ('teriyaki_sauce', 'Teriyaki Sauce'),
  ('sriracha', 'Sriracha'),
  ('hot_sauce', 'Hot Sauce'),
  ('tabasco', 'Tabasco'),
  ('worcestershire_sauce', 'Worcestershire Sauce'),
  ('ketchup', 'Ketchup'),
  ('mustard', 'Mustard'),
  ('dijon_mustard', 'Dijon Mustard'),
  ('wholegrain_mustard', 'Wholegrain Mustard'),
  ('yellow_mustard', 'Yellow Mustard'),
  ('mayonnaise', 'Mayonnaise'),
  ('bbq_sauce', 'BBQ Sauce'),
  ('tomato_sauce', 'Tomato Sauce'),
  ('tomato_paste', 'Tomato Paste'),
  ('pesto', 'Pesto'),
  ('tahini_sauce', 'Tahini Sauce'),
  ('hummus', 'Hummus'),
  ('salsa', 'Salsa'),
  ('guacamole', 'Guacamole'),
  ('vinegar', 'Vinegar'),
  ('apple_cider_vinegar', 'Apple Cider Vinegar'),
  ('white_vinegar', 'White Vinegar'),
  ('rice_vinegar', 'Rice Vinegar'),
  ('balsamic_vinegar', 'Balsamic Vinegar'),
  ('red_wine_vinegar', 'Red Wine Vinegar'),
  ('malt_vinegar', 'Malt Vinegar'),
  ('mirin', 'Mirin'),
  ('sake', 'Sake'),
  ('cooking_wine', 'Cooking Wine'),
  ('red_wine', 'Red Wine'),
  ('white_wine', 'White Wine'),
  ('beer', 'Beer'),
  ('rum', 'Rum'),
  ('brandy', 'Brandy'),
  ('vodka', 'Vodka'),

  -- Baking & Misc
  ('baking_powder', 'Baking Powder'),
  ('baking_soda', 'Baking Soda'),
  ('yeast', 'Yeast'),
  ('active_dry_yeast', 'Active Dry Yeast'),
  ('instant_yeast', 'Instant Yeast'),
  ('gelatin', 'Gelatin'),
  ('agar_agar', 'Agar Agar'),
  ('cocoa_powder', 'Cocoa Powder'),
  ('chocolate', 'Chocolate'),
  ('dark_chocolate', 'Dark Chocolate'),
  ('milk_chocolate', 'Milk Chocolate'),
  ('white_chocolate', 'White Chocolate'),
  ('chocolate_chips', 'Chocolate Chips'),
  ('marshmallows', 'Marshmallows'),
  ('sprinkles', 'Sprinkles'),
  ('food_coloring', 'Food Coloring'),

  -- Beverages (as ingredients)
  ('coffee', 'Coffee'),
  ('espresso', 'Espresso'),
  ('tea', 'Tea'),
  ('black_tea', 'Black Tea'),
  ('green_tea', 'Green Tea'),
  ('matcha', 'Matcha'),
  ('chai', 'Chai'),
  ('water', 'Water'),
  ('sparkling_water', 'Sparkling Water'),
  ('broth', 'Broth'),
  ('chicken_broth', 'Chicken Broth'),
  ('beef_broth', 'Beef Broth'),
  ('vegetable_broth', 'Vegetable Broth'),
  ('fish_stock', 'Fish Stock'),
  ('stock', 'Stock')
ON CONFLICT (name) DO NOTHING;

-- Additional ingredients (further enrichment)
INSERT INTO ingredients (code, name) VALUES
  -- Additional fish
  ('sea_bream', 'Sea Bream'),
  ('snapper', 'Snapper'),
  ('red_snapper', 'Red Snapper'),
  ('grouper', 'Grouper'),
  ('mahi_mahi', 'Mahi Mahi'),
  ('monkfish', 'Monkfish'),
  ('swordfish', 'Swordfish'),
  ('pollock', 'Pollock'),
  ('flounder', 'Flounder'),
  ('sole', 'Sole'),
  ('skate', 'Skate'),
  ('eel', 'Eel'),
  ('catfish', 'Catfish'),
  ('whitefish', 'Whitefish'),
  ('salted_cod', 'Salted Cod'),

  -- Additional shellfish/seafood
  ('crayfish', 'Crayfish'),
  ('abalone', 'Abalone'),
  ('sea_urchin', 'Sea Urchin'),
  ('cockles', 'Cockles'),
  ('whelks', 'Whelks'),
  ('cuttlefish', 'Cuttlefish'),
  ('calamari', 'Calamari'),
  ('barnacles', 'Barnacles'),

  -- Offal & specialty cuts
  ('beef_liver', 'Beef Liver'),
  ('pork_liver', 'Pork Liver'),
  ('kidney', 'Kidney'),
  ('heart', 'Heart'),
  ('tongue', 'Tongue'),
  ('oxtail', 'Oxtail'),
  ('tripe', 'Tripe'),
  ('sweetbreads', 'Sweetbreads'),
  ('bone_marrow', 'Bone Marrow'),
  ('trotters', 'Trotters'),
  ('brisket', 'Brisket'),
  ('short_ribs', 'Short Ribs'),
  ('flank_steak', 'Flank Steak'),
  ('skirt_steak', 'Skirt Steak'),
  ('ribeye', 'Ribeye'),
  ('sirloin', 'Sirloin'),
  ('t_bone_steak', 'T-Bone Steak'),
  ('porterhouse', 'Porterhouse'),
  ('chuck_roast', 'Chuck Roast'),

  -- Cured meats & charcuterie
  ('mortadella', 'Mortadella'),
  ('bresaola', 'Bresaola'),
  ('jamon_serrano', 'Jamon Serrano'),
  ('jamon_iberico', 'Jamon Iberico'),
  ('coppa', 'Coppa'),
  ('guanciale', 'Guanciale'),
  ('speck', 'Speck'),
  ('andouille', 'Andouille'),
  ('bratwurst', 'Bratwurst'),
  ('kielbasa', 'Kielbasa'),
  ('frankfurter', 'Frankfurter'),
  ('liverwurst', 'Liverwurst'),
  ('black_pudding', 'Black Pudding'),
  ('blood_sausage', 'Blood Sausage'),
  ('turkey_bacon', 'Turkey Bacon'),
  ('canadian_bacon', 'Canadian Bacon'),

  -- Game
  ('wild_boar', 'Wild Boar'),
  ('bison', 'Bison'),
  ('elk', 'Elk'),
  ('moose', 'Moose'),
  ('reindeer', 'Reindeer'),
  ('pheasant', 'Pheasant'),
  ('partridge', 'Partridge'),

  -- Extra legumes
  ('black_eyed_peas', 'Black Eyed Peas'),
  ('mung_beans', 'Mung Beans'),
  ('adzuki_beans', 'Adzuki Beans'),
  ('cannellini_beans', 'Cannellini Beans'),
  ('great_northern_beans', 'Great Northern Beans'),
  ('fava_beans', 'Fava Beans'),
  ('butter_beans', 'Butter Beans'),
  ('yellow_lentils', 'Yellow Lentils'),
  ('black_lentils', 'Black Lentils'),
  ('beluga_lentils', 'Beluga Lentils'),
  ('french_lentils', 'French Lentils'),

  -- Extra grains & flours
  ('spelt', 'Spelt'),
  ('farro', 'Farro'),
  ('amaranth', 'Amaranth'),
  ('teff', 'Teff'),
  ('freekeh', 'Freekeh'),
  ('kamut', 'Kamut'),
  ('wheat_germ', 'Wheat Germ'),
  ('wheat_bran', 'Wheat Bran'),
  ('puffed_rice', 'Puffed Rice'),
  ('puffed_quinoa', 'Puffed Quinoa'),
  ('rye_flour', 'Rye Flour'),
  ('chickpea_flour', 'Chickpea Flour'),
  ('buckwheat_flour', 'Buckwheat Flour'),
  ('tapioca_flour', 'Tapioca Flour'),
  ('tapioca_starch', 'Tapioca Starch'),
  ('arrowroot', 'Arrowroot'),
  ('masa_harina', 'Masa Harina'),
  ('self_rising_flour', 'Self-Rising Flour'),
  ('bread_flour', 'Bread Flour'),
  ('cake_flour', 'Cake Flour'),

  -- Extra pasta shapes
  ('orecchiette', 'Orecchiette'),
  ('rigatoni', 'Rigatoni'),
  ('farfalle', 'Farfalle'),
  ('linguine', 'Linguine'),
  ('fettuccine', 'Fettuccine'),
  ('pappardelle', 'Pappardelle'),
  ('orzo', 'Orzo'),
  ('cannelloni', 'Cannelloni'),
  ('tortellini', 'Tortellini'),
  ('angel_hair_pasta', 'Angel Hair Pasta'),
  ('conchiglie', 'Conchiglie'),
  ('cavatappi', 'Cavatappi'),
  ('ziti', 'Ziti'),
  ('bucatini', 'Bucatini'),
  ('tagliatelle', 'Tagliatelle'),

  -- Extra noodles
  ('glass_noodles', 'Glass Noodles'),
  ('cellophane_noodles', 'Cellophane Noodles'),
  ('shirataki_noodles', 'Shirataki Noodles'),
  ('chow_mein_noodles', 'Chow Mein Noodles'),
  ('lo_mein_noodles', 'Lo Mein Noodles'),
  ('vermicelli', 'Vermicelli'),
  ('pho_noodles', 'Pho Noodles'),

  -- Extra breads & doughs
  ('focaccia', 'Focaccia'),
  ('ciabatta', 'Ciabatta'),
  ('brioche', 'Brioche'),
  ('challah', 'Challah'),
  ('pumpernickel', 'Pumpernickel'),
  ('lavash', 'Lavash'),
  ('flatbread', 'Flatbread'),
  ('matzo', 'Matzo'),
  ('pretzel', 'Pretzel'),
  ('cornbread', 'Cornbread'),
  ('hamburger_bun', 'Hamburger Bun'),
  ('hot_dog_bun', 'Hot Dog Bun'),
  ('dinner_roll', 'Dinner Roll'),
  ('crackers', 'Crackers'),
  ('rice_cakes', 'Rice Cakes'),
  ('phyllo_dough', 'Phyllo Dough'),
  ('puff_pastry', 'Puff Pastry'),
  ('pie_crust', 'Pie Crust'),
  ('pizza_dough', 'Pizza Dough'),
  ('wonton_wrappers', 'Wonton Wrappers'),
  ('dumpling_wrappers', 'Dumpling Wrappers'),
  ('spring_roll_wrappers', 'Spring Roll Wrappers'),
  ('rice_paper', 'Rice Paper'),

  -- Extra vegetables
  ('sunchoke', 'Sunchoke'),
  ('jerusalem_artichoke', 'Jerusalem Artichoke'),
  ('jicama', 'Jicama'),
  ('kohlrabi', 'Kohlrabi'),
  ('salsify', 'Salsify'),
  ('taro', 'Taro'),
  ('lotus_root', 'Lotus Root'),
  ('burdock', 'Burdock'),
  ('rutabaga', 'Rutabaga'),
  ('rhubarb', 'Rhubarb'),
  ('swiss_chard', 'Swiss Chard'),
  ('mustard_greens', 'Mustard Greens'),
  ('collard_greens', 'Collard Greens'),
  ('dandelion_greens', 'Dandelion Greens'),
  ('microgreens', 'Microgreens'),
  ('alfalfa_sprouts', 'Alfalfa Sprouts'),
  ('bean_sprouts', 'Bean Sprouts'),
  ('broccoli_sprouts', 'Broccoli Sprouts'),
  ('mizuna', 'Mizuna'),
  ('purslane', 'Purslane'),
  ('samphire', 'Samphire'),
  ('nettles', 'Nettles'),
  ('sorrel', 'Sorrel'),
  ('horseradish_root', 'Horseradish Root'),
  ('wasabi_root', 'Wasabi Root'),
  ('lotus_seeds', 'Lotus Seeds'),

  -- Extra mushrooms
  ('enoki', 'Enoki'),
  ('morel', 'Morel'),
  ('lion_s_mane', 'Lion''s Mane'),
  ('maitake', 'Maitake'),
  ('cremini', 'Cremini'),
  ('king_oyster', 'King Oyster'),
  ('wood_ear_mushroom', 'Wood Ear Mushroom'),
  ('dried_mushrooms', 'Dried Mushrooms'),

  -- Extra fruits (tropical, stone, exotic)
  ('quince', 'Quince'),
  ('loquat', 'Loquat'),
  ('jackfruit', 'Jackfruit'),
  ('durian', 'Durian'),
  ('rambutan', 'Rambutan'),
  ('longan', 'Longan'),
  ('mangosteen', 'Mangosteen'),
  ('starfruit', 'Starfruit'),
  ('soursop', 'Soursop'),
  ('tamarind', 'Tamarind'),
  ('mulberries', 'Mulberries'),
  ('elderberries', 'Elderberries'),
  ('boysenberries', 'Boysenberries'),
  ('acai_berries', 'Acai Berries'),
  ('goji_berries', 'Goji Berries'),
  ('sea_buckthorn', 'Sea Buckthorn'),
  ('rosehip', 'Rosehip'),
  ('kumquat', 'Kumquat'),
  ('yuzu', 'Yuzu'),
  ('meyer_lemon', 'Meyer Lemon'),
  ('blood_orange', 'Blood Orange'),
  ('bergamot', 'Bergamot'),
  ('key_lime', 'Key Lime'),

  -- Extra dried fruit
  ('dried_cranberries', 'Dried Cranberries'),
  ('dried_cherries', 'Dried Cherries'),
  ('dried_mango', 'Dried Mango'),
  ('dried_blueberries', 'Dried Blueberries'),
  ('dried_figs', 'Dried Figs'),
  ('candied_peel', 'Candied Peel'),

  -- Extra dairy & alternatives
  ('quark', 'Quark'),
  ('fromage_blanc', 'Fromage Blanc'),
  ('clotted_cream', 'Clotted Cream'),
  ('labneh', 'Labneh'),
  ('smetana', 'Smetana'),
  ('ayran', 'Ayran'),
  ('skyr', 'Skyr'),
  ('rice_milk', 'Rice Milk'),
  ('cashew_milk', 'Cashew Milk'),
  ('hemp_milk', 'Hemp Milk'),
  ('vegan_butter', 'Vegan Butter'),
  ('vegan_cheese', 'Vegan Cheese'),
  ('nutritional_yeast', 'Nutritional Yeast'),

  -- Extra cheeses
  ('manchego', 'Manchego'),
  ('gruyere', 'Gruyere'),
  ('emmental', 'Emmental'),
  ('roquefort', 'Roquefort'),
  ('gorgonzola', 'Gorgonzola'),
  ('asiago', 'Asiago'),
  ('pecorino', 'Pecorino'),
  ('pecorino_romano', 'Pecorino Romano'),
  ('stilton', 'Stilton'),
  ('havarti', 'Havarti'),
  ('monterey_jack', 'Monterey Jack'),
  ('pepper_jack', 'Pepper Jack'),
  ('colby', 'Colby'),
  ('fontina', 'Fontina'),
  ('taleggio', 'Taleggio'),
  ('munster', 'Munster'),
  ('burrata', 'Burrata'),
  ('queso_fresco', 'Queso Fresco'),
  ('queso_blanco', 'Queso Blanco'),
  ('cotija', 'Cotija'),

  -- Extra nuts & seeds
  ('chestnuts', 'Chestnuts'),
  ('ginkgo_nuts', 'Ginkgo Nuts'),
  ('pepitas', 'Pepitas'),
  ('pine_kernels', 'Pine Kernels'),
  ('nigella_seeds', 'Nigella Seeds'),
  ('fenugreek_seeds', 'Fenugreek Seeds'),
  ('black_sesame_seeds', 'Black Sesame Seeds'),
  ('cacao_nibs', 'Cacao Nibs'),
  ('marzipan', 'Marzipan'),
  ('nougat', 'Nougat'),

  -- Extra herbs
  ('lavender', 'Lavender'),
  ('lemon_balm', 'Lemon Balm'),
  ('savory', 'Savory'),
  ('shiso', 'Shiso'),
  ('perilla', 'Perilla'),
  ('epazote', 'Epazote'),
  ('borage', 'Borage'),
  ('hyssop', 'Hyssop'),
  ('chervil_leaves', 'Chervil Leaves'),

  -- Extra spices
  ('fenugreek', 'Fenugreek'),
  ('asafoetida', 'Asafoetida'),
  ('sichuan_pepper', 'Sichuan Pepper'),
  ('urfa_biber', 'Urfa Biber'),
  ('aleppo_pepper', 'Aleppo Pepper'),
  ('dried_lime', 'Dried Lime'),
  ('juniper_berries', 'Juniper Berries'),
  ('black_cardamom', 'Black Cardamom'),
  ('long_pepper', 'Long Pepper'),
  ('annatto', 'Annatto'),
  ('mahlab', 'Mahlab'),
  ('grains_of_paradise', 'Grains of Paradise'),
  ('ras_el_hanout', 'Ras El Hanout'),
  ('berbere', 'Berbere'),
  ('dukkah', 'Dukkah'),
  ('chinese_five_spice', 'Chinese Five Spice'),
  ('baharat', 'Baharat'),
  ('pumpkin_pie_spice', 'Pumpkin Pie Spice'),
  ('apple_pie_spice', 'Apple Pie Spice'),
  ('everything_bagel_seasoning', 'Everything Bagel Seasoning'),
  ('lemon_pepper', 'Lemon Pepper'),
  ('celery_salt', 'Celery Salt'),
  ('onion_salt', 'Onion Salt'),
  ('msg', 'MSG'),
  ('bouillon_cube', 'Bouillon Cube'),
  ('chicken_bouillon', 'Chicken Bouillon'),
  ('beef_bouillon', 'Beef Bouillon'),
  ('vegetable_bouillon', 'Vegetable Bouillon'),

  -- Extra sweeteners
  ('corn_syrup', 'Corn Syrup'),
  ('golden_syrup', 'Golden Syrup'),
  ('treacle', 'Treacle'),
  ('date_syrup', 'Date Syrup'),
  ('birch_syrup', 'Birch Syrup'),
  ('xylitol', 'Xylitol'),
  ('monk_fruit', 'Monk Fruit'),
  ('erythritol', 'Erythritol'),
  ('palm_sugar', 'Palm Sugar'),
  ('coconut_sugar', 'Coconut Sugar'),
  ('jaggery', 'Jaggery'),
  ('muscovado', 'Muscovado'),
  ('demerara_sugar', 'Demerara Sugar'),
  ('turbinado_sugar', 'Turbinado Sugar'),
  ('caster_sugar', 'Caster Sugar'),
  ('confectioners_sugar', 'Confectioners Sugar'),

  -- Extra sauces, pastes & condiments
  ('aioli', 'Aioli'),
  ('tzatziki', 'Tzatziki'),
  ('chimichurri', 'Chimichurri'),
  ('gochujang', 'Gochujang'),
  ('doenjang', 'Doenjang'),
  ('miso_paste', 'Miso Paste'),
  ('white_miso', 'White Miso'),
  ('red_miso', 'Red Miso'),
  ('sambal_oelek', 'Sambal Oelek'),
  ('harissa', 'Harissa'),
  ('black_bean_sauce', 'Black Bean Sauce'),
  ('plum_sauce', 'Plum Sauce'),
  ('sweet_chili_sauce', 'Sweet Chili Sauce'),
  ('ponzu', 'Ponzu'),
  ('unagi_sauce', 'Unagi Sauce'),
  ('tartar_sauce', 'Tartar Sauce'),
  ('cocktail_sauce', 'Cocktail Sauce'),
  ('ranch_dressing', 'Ranch Dressing'),
  ('vinaigrette', 'Vinaigrette'),
  ('italian_dressing', 'Italian Dressing'),
  ('caesar_dressing', 'Caesar Dressing'),
  ('russian_dressing', 'Russian Dressing'),
  ('thousand_island_dressing', 'Thousand Island Dressing'),
  ('blue_cheese_dressing', 'Blue Cheese Dressing'),
  ('honey_mustard', 'Honey Mustard'),
  ('horseradish_sauce', 'Horseradish Sauce'),
  ('tartare', 'Tartare'),
  ('romesco', 'Romesco'),
  ('mole', 'Mole'),
  ('enchilada_sauce', 'Enchilada Sauce'),
  ('adobo_sauce', 'Adobo Sauce'),
  ('curry_paste', 'Curry Paste'),
  ('red_curry_paste', 'Red Curry Paste'),
  ('green_curry_paste', 'Green Curry Paste'),
  ('yellow_curry_paste', 'Yellow Curry Paste'),
  ('massaman_curry_paste', 'Massaman Curry Paste'),
  ('anchovy_paste', 'Anchovy Paste'),
  ('tamarind_paste', 'Tamarind Paste'),
  ('tomato_puree', 'Tomato Puree'),
  ('passata', 'Passata'),
  ('crushed_tomatoes', 'Crushed Tomatoes'),
  ('diced_tomatoes', 'Diced Tomatoes'),

  -- Pickles & ferments
  ('sauerkraut', 'Sauerkraut'),
  ('kimchi', 'Kimchi'),
  ('pickled_ginger', 'Pickled Ginger'),
  ('umeboshi', 'Umeboshi'),
  ('cornichons', 'Cornichons'),
  ('gherkins', 'Gherkins'),
  ('pickled_onions', 'Pickled Onions'),
  ('pickled_jalapenos', 'Pickled Jalapenos'),
  ('kombucha', 'Kombucha'),

  -- Preserves & spreads
  ('jam', 'Jam'),
  ('strawberry_jam', 'Strawberry Jam'),
  ('raspberry_jam', 'Raspberry Jam'),
  ('apricot_jam', 'Apricot Jam'),
  ('jelly', 'Jelly'),
  ('marmalade', 'Marmalade'),
  ('chutney', 'Chutney'),
  ('mango_chutney', 'Mango Chutney'),
  ('relish', 'Relish'),
  ('compote', 'Compote'),
  ('apple_sauce', 'Apple Sauce'),
  ('cranberry_sauce', 'Cranberry Sauce'),
  ('nutella', 'Nutella'),
  ('hazelnut_spread', 'Hazelnut Spread'),
  ('lemon_curd', 'Lemon Curd'),
  ('dulce_de_leche', 'Dulce de Leche'),

  -- Extracts & flavorings
  ('almond_extract', 'Almond Extract'),
  ('lemon_extract', 'Lemon Extract'),
  ('orange_extract', 'Orange Extract'),
  ('peppermint_extract', 'Peppermint Extract'),
  ('rose_water', 'Rose Water'),
  ('orange_blossom_water', 'Orange Blossom Water'),

  -- Cooking wines & spirits
  ('sherry', 'Sherry'),
  ('dry_sherry', 'Dry Sherry'),
  ('port', 'Port'),
  ('marsala', 'Marsala'),
  ('vermouth', 'Vermouth'),
  ('gin', 'Gin'),
  ('tequila', 'Tequila'),
  ('whiskey', 'Whiskey'),
  ('bourbon', 'Bourbon'),
  ('champagne', 'Champagne'),
  ('prosecco', 'Prosecco'),
  ('cider', 'Cider'),
  ('cognac', 'Cognac'),
  ('amaretto', 'Amaretto'),
  ('grand_marnier', 'Grand Marnier'),
  ('kirsch', 'Kirsch'),
  ('kahlua', 'Kahlua'),

  -- Baking extras
  ('cream_of_tartar', 'Cream of Tartar'),
  ('cocoa_butter', 'Cocoa Butter'),
  ('white_chocolate_chips', 'White Chocolate Chips'),
  ('dark_chocolate_chips', 'Dark Chocolate Chips'),
  ('chocolate_shavings', 'Chocolate Shavings'),
  ('candy_melts', 'Candy Melts'),
  ('pearl_sugar', 'Pearl Sugar'),
  ('sanding_sugar', 'Sanding Sugar'),

  -- Condiment/specialty
  ('wasabi', 'Wasabi'),
  ('horseradish', 'Horseradish'),
  ('liquid_smoke', 'Liquid Smoke'),
  ('liquid_aminos', 'Liquid Aminos'),
  ('coconut_aminos', 'Coconut Aminos'),
  ('pomegranate_molasses', 'Pomegranate Molasses'),
  ('verjuice', 'Verjuice')
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
