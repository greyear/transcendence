-- ============================================
-- SEED DATA FOR CORE DATABASE
-- ============================================
-- This script populates reference/dictionary tables
-- with initial data: units, categories, allergens, diets, etc.

-- ============================================
-- UNITS (mass, volume, portions)
-- ============================================
INSERT INTO units (code, kind, name) VALUES
  -- Mass
  ('g', 'mass', '{"en":"Gram","fi":"Gramma","ru":"Грамм"}'::jsonb),
  ('kg', 'mass', '{"en":"Kilogram","fi":"Kilogramma","ru":"Килограмм"}'::jsonb),
  ('mg', 'mass', '{"en":"Milligram","fi":"Milligramma","ru":"Миллиграмм"}'::jsonb),
  
  -- Volume
  ('ml', 'volume', '{"en":"Milliliter","fi":"Millilitra","ru":"Миллилитр"}'::jsonb),
  ('l', 'volume', '{"en":"Liter","fi":"Litra","ru":"Литр"}'::jsonb),
  ('cup', 'volume', '{"en":"Cup","fi":"Kuppi","ru":"Чашка"}'::jsonb),
  ('tbsp', 'volume', '{"en":"Tablespoon","fi":"Ruokalusikka","ru":"Столовая ложка"}'::jsonb),
  ('tsp', 'volume', '{"en":"Teaspoon","fi":"Teelusikka","ru":"Чайная ложка"}'::jsonb),
  
  -- Portions
  ('pcs', 'portion', '{"en":"Pieces","fi":"Kappaletta","ru":"Штуки"}'::jsonb),
  ('slice', 'portion', '{"en":"Slice","fi":"Viipale","ru":"Ломтик"}'::jsonb),
  ('clove', 'portion', '{"en":"Clove","fi":"Kynsi","ru":"Зубчик"}'::jsonb),
  ('whole', 'portion', '{"en":"Whole","fi":"Kokonainen","ru":"Целый"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- RECIPE CATEGORY TYPES
-- ============================================
INSERT INTO recipe_category_types (code, name)
SELECT v.code,
  jsonb_build_object('en', v.name_en, 'fi', v.name_fi, 'ru', v.name_ru)
FROM (VALUES
  ('meal_time', 'Meal Time', 'Ateria-aika', 'Время приёма пищи'),
  ('dish_type', 'Dish Type', 'Ruokalaji', 'Тип блюда'),
  ('main_ingredient', 'Main Ingredient', 'Pääraaka-aine', 'Главный ингредиент'),
  ('cuisine', 'Cuisine', 'Keittiö', 'Кухня')
) AS v(code, name_en, name_fi, name_ru)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- RECIPE CATEGORIES
-- ============================================
-- Meal Time
INSERT INTO recipe_categories (category_type_id, code, name)
SELECT t.id, v.code,
  jsonb_build_object('en', v.name_en, 'fi', v.name_fi, 'ru', v.name_ru)
FROM recipe_category_types t
JOIN (VALUES
  ('breakfast',    'Breakfast',    'Aamiainen',      'Завтрак'),
  ('brunch',       'Brunch',       'Brunssi',        'Бранч'),
  ('lunch',        'Lunch',        'Lounas',         'Обед'),
  ('dinner',       'Dinner',       'Päivällinen',    'Ужин'),
  ('supper',       'Supper',       'Illallinen',     'Поздний ужин'),
  ('snack',        'Snack',        'Välipala',       'Перекус'),
  ('late_night',   'Late Night',   'Iltapala',       'Ночной перекус'),
  ('tea_time',     'Tea Time',     'Teehetki',       'Чаепитие'),
  ('pre_workout',  'Pre Workout',  'Ennen treeniä',  'До тренировки'),
  ('post_workout', 'Post Workout', 'Treenin jälkeen','После тренировки'),
  ('kids_meal',    'Kids Meal',    'Lasten ateria',  'Детское меню'),
  ('holiday',      'Holiday',      'Juhlapäivä',     'Праздник'),
  ('picnic',       'Picnic',       'Piknik',         'Пикник'),
  ('party',        'Party',        'Juhlat',         'Вечеринка'),
  ('buffet',       'Buffet',       'Buffet',         'Фуршет')
) AS v(code, name_en, name_fi, name_ru) ON true
WHERE t.code = 'meal_time'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Dish Type
INSERT INTO recipe_categories (category_type_id, code, name)
SELECT t.id, v.code,
  jsonb_build_object('en', v.name_en, 'fi', v.name_fi, 'ru', v.name_ru)
FROM recipe_category_types t
JOIN (VALUES
  ('soup',        'Soup',        'Keitto',           'Суп'),
  ('stew',        'Stew',        'Pataruoka',        'Рагу'),
  ('salad',       'Salad',       'Salaatti',         'Салат'),
  ('main_course', 'Main Course', 'Pääruoka',         'Основное блюдо'),
  ('side_dish',   'Side Dish',   'Lisäke',           'Гарнир'),
  ('dessert',     'Dessert',     'Jälkiruoka',       'Десерт'),
  ('beverage',    'Beverage',    'Juoma',            'Напиток'),
  ('cocktail',    'Cocktail',    'Cocktail',         'Коктейль'),
  ('smoothie',    'Smoothie',    'Smoothie',         'Смузи'),
  ('appetizer',   'Appetizer',   'Alkupala',         'Закуска'),
  ('sandwich',    'Sandwich',    'Voileipä',         'Бутерброд'),
  ('wrap',        'Wrap',        'Wrap',             'Ролл'),
  ('burger',      'Burger',      'Burgeri',          'Бургер'),
  ('pizza',       'Pizza',       'Pizza',            'Пицца'),
  ('pasta',       'Pasta',       'Pasta',            'Паста'),
  ('noodles',     'Noodles',     'Nuudelit',         'Лапша'),
  ('rice_dish',   'Rice Dish',   'Riisiruoka',       'Блюдо из риса'),
  ('casserole',   'Casserole',   'Vuokaruoka',       'Запеканка'),
  ('curry',       'Curry',       'Curry',            'Карри'),
  ('stir_fry',    'Stir Fry',    'Wok-ruoka',        'Вок'),
  ('bowl',        'Bowl',        'Bowl',             'Боул'),
  ('porridge',    'Porridge',    'Puuro',            'Каша'),
  ('omelette',    'Omelette',    'Munakas',          'Омлет'),
  ('quiche',      'Quiche',      'Quiche',           'Киш'),
  ('pancake',     'Pancake',     'Pannukakku',       'Блин'),
  ('waffle',      'Waffle',      'Vohveli',          'Вафля'),
  ('crepe',       'Crepe',       'Ohukanen',         'Крепп'),
  ('dumpling',    'Dumpling',    'Nyytit',           'Пельмени'),
  ('roll',        'Roll',        'Rulla',            'Ролл'),
  ('skewer',      'Skewer',      'Varras',           'Шашлык'),
  ('grill',       'Grill',       'Grilli',           'Гриль'),
  ('barbecue',    'Barbecue',    'Grillaus',         'Барбекю'),
  ('roast',       'Roast',       'Paisti',           'Жаркое'),
  ('hot_pot',     'Hot Pot',     'Hot Pot',          'Хот-пот'),
  ('pie',         'Pie',         'Piirakka',         'Пирог'),
  ('tart',        'Tart',        'Torttu',           'Тарт'),
  ('cake',        'Cake',        'Kakku',            'Торт'),
  ('cookie',      'Cookie',      'Keksi',            'Печенье'),
  ('pastry',      'Pastry',      'Leivonnainen',     'Выпечка'),
  ('bread',       'Bread',       'Leipä',            'Хлеб'),
  ('ice_cream',   'Ice Cream',   'Jäätelö',          'Мороженое'),
  ('dip',         'Dip',         'Dippi',            'Дип'),
  ('sauce',       'Sauce',       'Kastike',          'Соус'),
  ('pickle',      'Pickle',      'Pikkelsi',         'Маринад'),
  ('preserve',    'Preserve',    'Säilyke',          'Консервация'),
  ('risotto',     'Risotto',     'Risotto',          'Ризотто'),
  ('taco',        'Taco',        'Taco',             'Тако')
) AS v(code, name_en, name_fi, name_ru) ON true
WHERE t.code = 'dish_type'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Main Ingredient (each code corresponds to an entry in the ingredients table — subset relationship)
INSERT INTO recipe_categories (category_type_id, code, name)
SELECT t.id, v.code,
  jsonb_build_object('en', v.name_en, 'fi', v.name_fi, 'ru', v.name_ru)
FROM recipe_category_types t
JOIN (VALUES
  ('chicken',     'Chicken',     'Kana',          'Курица'),
  ('turkey',      'Turkey',      'Kalkkuna',      'Индейка'),
  ('duck',        'Duck',        'Ankka',         'Утка'),
  ('beef',        'Beef',        'Nauta',         'Говядина'),
  ('pork',        'Pork',        'Sianliha',      'Свинина'),
  ('lamb',        'Lamb',        'Karitsa',       'Баранина'),
  ('salmon',      'Salmon',      'Lohi',          'Лосось'),
  ('tuna',        'Tuna',        'Tonnikala',     'Тунец'),
  ('cod',         'Cod',         'Turska',        'Треска'),
  ('trout',       'Trout',       'Taimen',        'Форель'),
  ('shrimp',      'Shrimp',      'Katkarapu',     'Креветки'),
  ('crab',        'Crab',        'Rapu',          'Краб'),
  ('lobster',     'Lobster',     'Hummeri',       'Омар'),
  ('eggs',        'Eggs',        'Munat',         'Яйца'),
  ('tofu',        'Tofu',        'Tofu',          'Тофу'),
  ('tempeh',      'Tempeh',      'Tempeh',        'Темпе'),
  ('beans',       'Beans',       'Pavut',         'Фасоль'),
  ('lentils',     'Lentils',     'Linssit',       'Чечевица'),
  ('chickpeas',   'Chickpeas',   'Kikherneet',    'Нут'),
  ('rice',        'Rice',        'Riisi',         'Рис'),
  ('pasta',       'Pasta',       'Pasta',         'Паста'),
  ('quinoa',      'Quinoa',      'Kvinoa',        'Киноа'),
  ('potato',      'Potato',      'Peruna',        'Картофель'),
  ('mushroom',    'Mushroom',    'Sieni',         'Грибы'),
  ('cheese',      'Cheese',      'Juusto',        'Сыр'),
  ('avocado',     'Avocado',     'Avokado',       'Авокадо'),
  ('broccoli',    'Broccoli',    'Parsakaali',    'Брокколи'),
  ('spinach',     'Spinach',     'Pinaatti',      'Шпинат'),
  ('tomato',      'Tomato',      'Tomaatti',      'Помидор'),
  ('eggplant',    'Eggplant',    'Munakoiso',     'Баклажан'),
  ('cauliflower', 'Cauliflower', 'Kukkakaali',    'Цветная капуста'),
  ('pumpkin',     'Pumpkin',     'Kurpitsa',      'Тыква')
) AS v(code, name_en, name_fi, name_ru) ON true
WHERE t.code = 'main_ingredient'
ON CONFLICT (category_type_id, code) DO NOTHING;

-- Cuisine
INSERT INTO recipe_categories (category_type_id, code, name)
SELECT t.id, v.code,
  jsonb_build_object('en', v.name_en, 'fi', v.name_fi, 'ru', v.name_ru)
FROM recipe_category_types t
JOIN (VALUES
  ('italian',        'Italian',       'Italialainen',         'Итальянская'),
  ('asian',          'Asian',         'Aasialainen',          'Азиатская'),
  ('chinese',        'Chinese',       'Kiinalainen',          'Китайская'),
  ('japanese',       'Japanese',      'Japanilainen',         'Японская'),
  ('korean',         'Korean',        'Korealainen',          'Корейская'),
  ('thai',           'Thai',          'Thaimaalainen',        'Тайская'),
  ('vietnamese',     'Vietnamese',    'Vietnamilainen',       'Вьетнамская'),
  ('indian',         'Indian',        'Intialainen',          'Индийская'),
  ('indonesian',     'Indonesian',    'Indonesialainen',      'Индонезийская'),
  ('filipino',       'Filipino',      'Filippiiniläinen',     'Филиппинская'),
  ('mexican',        'Mexican',       'Meksikolainen',        'Мексиканская'),
  ('tex_mex',        'Tex Mex',       'Tex Mex',              'Техасско-мексиканская'),
  ('cajun',          'Cajun',         'Cajun',                'Каджунская'),
  ('creole',         'Creole',        'Kreoli',               'Креольская'),
  ('french',         'French',        'Ranskalainen',         'Французская'),
  ('american',       'American',      'Amerikkalainen',       'Американская'),
  ('southern_us',    'Southern US',   'Amerikan etelävaltiot','Южноамериканская'),
  ('mediterranean',  'Mediterranean', 'Välimeren',            'Средиземноморская'),
  ('spanish',        'Spanish',       'Espanjalainen',        'Испанская'),
  ('portuguese',     'Portuguese',    'Portugalilainen',      'Португальская'),
  ('greek',          'Greek',         'Kreikkalainen',        'Греческая'),
  ('turkish',        'Turkish',       'Turkkilainen',         'Турецкая'),
  ('moroccan',       'Moroccan',      'Marokkolainen',        'Марокканская'),
  ('ethiopian',      'Ethiopian',     'Etiopialainen',        'Эфиопская'),
  ('middle_eastern', 'Middle Eastern','Lähi-itäinen',         'Ближневосточная'),
  ('lebanese',       'Lebanese',      'Libanonilainen',       'Ливанская'),
  ('persian',        'Persian',       'Persialainen',         'Персидская'),
  ('israeli',        'Israeli',       'Israelilainen',        'Израильская'),
  ('finnish',        'Finnish',       'Suomalainen',          'Финская'),
  ('swedish',        'Swedish',       'Ruotsalainen',         'Шведская'),
  ('norwegian',      'Norwegian',     'Norjalainen',          'Норвежская'),
  ('danish',         'Danish',        'Tanskalainen',         'Датская'),
  ('nordic',         'Nordic',        'Pohjoismainen',        'Скандинавская'),
  ('russian',        'Russian',       'Venäläinen',           'Русская'),
  ('ukrainian',      'Ukrainian',     'Ukrainalainen',        'Украинская'),
  ('georgian',       'Georgian',      'Georgialainen',        'Грузинская'),
  ('polish',         'Polish',        'Puolalainen',          'Польская'),
  ('hungarian',      'Hungarian',     'Unkarilainen',         'Венгерская'),
  ('czech',          'Czech',         'Tšekkiläinen',         'Чешская'),
  ('german',         'German',        'Saksalainen',          'Немецкая'),
  ('austrian',       'Austrian',      'Itävaltalainen',       'Австрийская'),
  ('swiss',          'Swiss',         'Sveitsiläinen',        'Швейцарская'),
  ('british',        'British',       'Brittiläinen',         'Британская'),
  ('irish',          'Irish',         'Irlantilainen',        'Ирландская'),
  ('scottish',       'Scottish',      'Skotlantilainen',      'Шотландская'),
  ('brazilian',      'Brazilian',     'Brasilialainen',       'Бразильская'),
  ('peruvian',       'Peruvian',      'Perulainen',           'Перуанская'),
  ('argentinian',    'Argentinian',   'Argentiinalainen',     'Аргентинская'),
  ('caribbean',      'Caribbean',     'Karibialainen',        'Карибская'),
  ('cuban',          'Cuban',         'Kuubalainen',          'Кубинская'),
  ('jamaican',       'Jamaican',      'Jamaikalainen',        'Ямайская'),
  ('fusion',         'Fusion',        'Fuusiokeittiö',        'Фьюжн')
) AS v(code, name_en, name_fi, name_ru) ON true
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
INSERT INTO ingredients (code, name)
SELECT v.code,
  jsonb_build_object('en', v.name_en, 'fi', v.name_fi, 'ru', v.name_ru)
FROM (VALUES
  ('chicken',           'Chicken',           'Kana',               'Курица'),
  ('chicken_breast',    'Chicken Breast',    'Kananrinta',         'Куриная грудка'),
  ('chicken_thigh',     'Chicken Thigh',     'Kanankoipi',         'Куриное бедро'),
  ('chicken_wings',     'Chicken Wings',     'Kanansiivet',        'Куриные крылья'),
  ('chicken_liver',     'Chicken Liver',     'Kananmaksa',         'Куриная печень'),
  ('turkey',            'Turkey',            'Kalkkuna',           'Индейка'),
  ('turkey_breast',     'Turkey Breast',     'Kalkkunanrinta',     'Грудка индейки'),
  ('duck',              'Duck',              'Ankka',              'Утка'),
  ('duck_breast',       'Duck Breast',       'Ankanrinta',         'Утиная грудка'),
  ('goose',             'Goose',             'Hanhi',              'Гусь'),
  ('quail',             'Quail',             'Viiriäinen',         'Перепел'),
  ('beef',              'Beef',              'Naudanliha',         'Говядина'),
  ('ground_beef',       'Ground Beef',       'Jauheliha',          'Говяжий фарш'),
  ('beef_steak',        'Beef Steak',        'Pihvi',              'Говяжий стейк'),
  ('beef_ribs',         'Beef Ribs',         'Naudan kylkiluut',   'Говяжьи рёбра'),
  ('beef_tenderloin',   'Beef Tenderloin',   'Naudan sisäfile',    'Говяжья вырезка'),
  ('veal',              'Veal',              'Vasikanliha',        'Телятина'),
  ('pork',              'Pork',              'Sianliha',           'Свинина'),
  ('pork_chop',         'Pork Chop',         'Porsaankyljys',      'Свиная отбивная'),
  ('pork_belly',        'Pork Belly',        'Porsaan kylki',      'Свиная грудинка'),
  ('pork_loin',         'Pork Loin',         'Porsaan ulkofile',   'Свиная корейка'),
  ('pork_ribs',         'Pork Ribs',         'Porsaan kylkiluut',  'Свиные рёбра'),
  ('ground_pork',       'Ground Pork',       'Porsaan jauheliha',  'Свиной фарш'),
  ('bacon',             'Bacon',             'Pekoni',             'Бекон'),
  ('ham',               'Ham',               'Kinkku',             'Ветчина'),
  ('prosciutto',        'Prosciutto',        'Prosciutto',         'Прошутто'),
  ('pancetta',          'Pancetta',          'Pancetta',           'Панчетта'),
  ('sausage',           'Sausage',           'Makkara',            'Колбаса'),
  ('chorizo',           'Chorizo',           'Chorizo',            'Чоризо'),
  ('salami',            'Salami',            'Salami',             'Салями'),
  ('pepperoni',         'Pepperoni',         'Pepperoni',          'Пепперони'),
  ('lamb',              'Lamb',              'Karitsa',            'Баранина'),
  ('lamb_chop',         'Lamb Chop',         'Karitsan kyljys',    'Бараньи отбивные'),
  ('ground_lamb',       'Ground Lamb',       'Karitsan jauheliha', 'Бараний фарш'),
  ('rabbit',            'Rabbit',            'Kaniini',            'Кролик'),
  ('venison',           'Venison',           'Hirvenliha',         'Оленина'),

  -- Fish & Seafood
  ('salmon',          'Salmon',         'Lohi',               'Лосось'),
  ('smoked_salmon',   'Smoked Salmon',  'Savulohi',           'Копчёный лосось'),
  ('tuna',            'Tuna',           'Tonnikala',          'Тунец'),
  ('canned_tuna',     'Canned Tuna',    'Tonnikalasäilyke',   'Консервированный тунец'),
  ('cod',             'Cod',            'Turska',             'Треска'),
  ('haddock',         'Haddock',        'Kolja',              'Пикша'),
  ('halibut',         'Halibut',        'Ruijanpallas',       'Палтус'),
  ('trout',           'Trout',          'Taimen',             'Форель'),
  ('mackerel',        'Mackerel',       'Makrilli',           'Скумбрия'),
  ('sardines',        'Sardines',       'Sardiinit',          'Сардины'),
  ('anchovies',       'Anchovies',      'Anjoviskalat',       'Анчоусы'),
  ('tilapia',         'Tilapia',        'Tilapia',            'Тилапия'),
  ('sea_bass',        'Sea Bass',       'Meribassi',          'Морской окунь'),
  ('herring',         'Herring',        'Silli',              'Сельдь'),
  ('perch',           'Perch',          'Ahven',              'Окунь'),
  ('pike',            'Pike',           'Hauki',              'Щука'),
  ('carp',            'Carp',           'Karppi',             'Карп'),
  ('shrimp',          'Shrimp',         'Katkarapu',          'Креветки'),
  ('prawns',          'Prawns',         'Jättikatkarapu',     'Крупные креветки'),
  ('crab',            'Crab',           'Rapu',               'Краб'),
  ('lobster',         'Lobster',        'Hummeri',            'Омар'),
  ('scallops',        'Scallops',       'Kampasimpukat',      'Гребешки'),
  ('mussels',         'Mussels',        'Simpukat',           'Мидии'),
  ('clams',           'Clams',          'Venussimpukat',      'Моллюски'),
  ('oysters',         'Oysters',        'Osterit',            'Устрицы'),
  ('squid',           'Squid',          'Kalmari',            'Кальмар'),
  ('octopus',         'Octopus',        'Tintakalapata',      'Осьминог'),
  ('caviar',          'Caviar',         'Kaviaari',           'Икра'),
  ('roe',             'Roe',            'Kalanmäti',          'Рыбная икра'),

  -- Eggs & Plant Protein
  ('eggs',            'Eggs',           'Munat',              'Яйца'),
  ('egg_whites',      'Egg Whites',     'Munanvalkuaiset',    'Яичные белки'),
  ('quail_eggs',      'Quail Eggs',     'Viiriäisenmunat',    'Перепелиные яйца'),
  ('tofu',            'Tofu',           'Tofu',               'Тофу'),
  ('firm_tofu',       'Firm Tofu',      'Kova tofu',          'Твёрдый тофу'),
  ('silken_tofu',     'Silken Tofu',    'Silkkinen tofu',     'Шёлковый тофу'),
  ('tempeh',          'Tempeh',         'Tempeh',             'Темпе'),
  ('seitan',          'Seitan',         'Seitan',             'Сейтан'),

  -- Legumes
  ('beans',               'Beans',               'Pavut',                  'Фасоль'),
  ('black_beans',         'Black Beans',         'Mustat pavut',           'Чёрная фасоль'),
  ('kidney_beans',        'Kidney Beans',        'Kidneypaput',            'Фасоль кидни'),
  ('pinto_beans',         'Pinto Beans',         'Pintopaput',             'Пёстрая фасоль'),
  ('navy_beans',          'Navy Beans',          'Valkoiset pavut',        'Белая фасоль'),
  ('white_beans',         'White Beans',         'Valkoiset pavut',        'Белая фасоль'),
  ('lima_beans',          'Lima Beans',          'Limapaput',              'Лимская фасоль'),
  ('green_beans',         'Green Beans',         'Vihreät pavut',          'Стручковая фасоль'),
  ('lentils',             'Lentils',             'Linssit',                'Чечевица'),
  ('red_lentils',         'Red Lentils',         'Punaiset linssit',       'Красная чечевица'),
  ('green_lentils',       'Green Lentils',       'Vihreät linssit',        'Зелёная чечевица'),
  ('chickpeas',           'Chickpeas',           'Kikherneet',             'Нут'),
  ('split_peas',          'Split Peas',          'Halkaistut herneet',     'Колотый горох'),
  ('edamame',             'Edamame',             'Edamame',                'Эдамаме'),

  -- Grains & Carbs
  ('rice',                'Rice',                'Riisi',                  'Рис'),
  ('white_rice',          'White Rice',          'Valkoinen riisi',        'Белый рис'),
  ('brown_rice',          'Brown Rice',          'Ruskea riisi',           'Коричневый рис'),
  ('basmati_rice',        'Basmati Rice',        'Basmatiriisi',           'Рис басмати'),
  ('jasmine_rice',        'Jasmine Rice',        'Jasmiiniriisi',          'Жасминовый рис'),
  ('arborio_rice',        'Arborio Rice',        'Arborioriisi',           'Рис арборио'),
  ('wild_rice',           'Wild Rice',           'Villiriisi',             'Дикий рис'),
  ('pasta',               'Pasta',               'Pasta',                  'Паста'),
  ('spaghetti',           'Spaghetti',           'Spagetti',               'Спагетти'),
  ('penne',               'Penne',               'Penne',                  'Пенне'),
  ('fusilli',             'Fusilli',             'Fusilli',                'Фузилли'),
  ('macaroni',            'Macaroni',            'Makaroni',               'Макароны'),
  ('lasagna_sheets',      'Lasagna Sheets',      'Lasagnelevyt',           'Листы для лазаньи'),
  ('ravioli',             'Ravioli',             'Ravioli',                'Равиоли'),
  ('gnocchi',             'Gnocchi',             'Gnocchi',                'Ньокки'),
  ('egg_noodles',         'Egg Noodles',         'Munanudeelit',           'Яичная лапша'),
  ('rice_noodles',        'Rice Noodles',        'Riisinudeelit',          'Рисовая лапша'),
  ('udon_noodles',        'Udon Noodles',        'Udon-nudeelit',          'Удон'),
  ('soba_noodles',        'Soba Noodles',        'Soba-nudeelit',          'Соба'),
  ('ramen_noodles',       'Ramen Noodles',       'Ramen-nudeelit',         'Рамен'),
  ('bread',               'Bread',               'Leipä',                  'Хлеб'),
  ('white_bread',         'White Bread',         'Valkoinen leipä',        'Белый хлеб'),
  ('whole_wheat_bread',   'Whole Wheat Bread',   'Täysjyväleipä',          'Цельнозерновой хлеб'),
  ('sourdough_bread',     'Sourdough Bread',     'Hapanjuurileipä',        'Хлеб на закваске'),
  ('rye_bread',           'Rye Bread',           'Ruisleipä',              'Ржаной хлеб'),
  ('pita_bread',          'Pita Bread',          'Pitaleipä',              'Пита'),
  ('naan_bread',          'Naan Bread',          'Naan-leipä',             'Наан'),
  ('tortilla',            'Tortilla',            'Tortilla',               'Тортилья'),
  ('corn_tortilla',       'Corn Tortilla',       'Maissi-tortilla',        'Кукурузная тортилья'),
  ('flour_tortilla',      'Flour Tortilla',      'Vehnä-tortilla',         'Пшеничная тортилья'),
  ('bagel',               'Bagel',               'Bagel',                  'Бейгл'),
  ('croissant',           'Croissant',           'Croissant',              'Круассан'),
  ('baguette',            'Baguette',            'Patonki',                'Багет'),
  ('english_muffin',      'English Muffin',      'Englantilainen muffini', 'Английский маффин'),
  ('breadcrumbs',         'Breadcrumbs',         'Korppujauhot',           'Панировочные сухари'),
  ('panko',               'Panko',               'Panko',                  'Панко'),
  ('oats',                'Oats',                'Kaura',                  'Овёс'),
  ('rolled_oats',         'Rolled Oats',         'Kaurahiutaleet',         'Овсяные хлопья'),
  ('steel_cut_oats',      'Steel Cut Oats',      'Teräsleikkakaura',       'Резаный овёс'),
  ('quinoa',              'Quinoa',              'Kvinoa',                 'Киноа'),
  ('couscous',            'Couscous',            'Couscous',               'Кускус'),
  ('bulgur',              'Bulgur',              'Bulgur',                 'Булгур'),
  ('barley',              'Barley',              'Ohra',                   'Ячмень'),
  ('buckwheat',           'Buckwheat',           'Tattari',                'Гречка'),
  ('millet',              'Millet',              'Hirssi',                 'Пшено'),
  ('semolina',            'Semolina',            'Mannasuurimo',           'Манная крупа'),
  ('cornmeal',            'Cornmeal',            'Maissijauhot',           'Кукурузная мука'),
  ('polenta',             'Polenta',             'Polenta',                'Полента'),
  ('flour',               'Flour',               'Jauhot',                 'Мука'),
  ('all_purpose_flour',   'All Purpose Flour',   'Vehnäjauhot',            'Пшеничная мука'),
  ('whole_wheat_flour',   'Whole Wheat Flour',   'Täysjyvävehnäjauhot',    'Цельнозерновая мука'),
  ('almond_flour',        'Almond Flour',        'Mantelijauhot',          'Миндальная мука'),
  ('coconut_flour',       'Coconut Flour',       'Kookosjauhot',           'Кокосовая мука'),
  ('rice_flour',          'Rice Flour',          'Riisijauhot',            'Рисовая мука'),
  ('cornstarch',          'Cornstarch',          'Maissijauhot',           'Кукурузный крахмал'),
  ('potato',              'Potato',              'Peruna',                 'Картофель'),
  ('sweet_potato',        'Sweet Potato',        'Bataatti',               'Батат'),
  ('yam',                 'Yam',                 'Jamssi',                 'Ямс'),
  ('wheat',               'Wheat',               'Vehnä',                  'Пшеница'),
  ('cassava',             'Cassava',             'Kassava',                'Кассава'),

-- Vegetables
  ('broccoli',            'Broccoli',            'Parsakaali',             'Брокколи'),
  ('cauliflower',         'Cauliflower',         'Kukkakaali',             'Цветная капуста'),
  ('brussels_sprouts',    'Brussels Sprouts',    'Ruusukaali',             'Брюссельская капуста'),
  ('cabbage',             'Cabbage',             'Kaali',                  'Капуста'),
  ('red_cabbage',         'Red Cabbage',         'Punakaali',              'Красная капуста'),
  ('napa_cabbage',        'Napa Cabbage',        'Kiinankaali',            'Пекинская капуста'),
  ('bok_choy',            'Bok Choy',            'Pak choi',               'Бок-чой'),
  ('chard',               'Chard',               'Lehtimangoldi',          'Мангольд'),
  ('spinach',             'Spinach',             'Pinaatti',               'Шпинат'),
  ('kale',                'Kale',                'Lehtikaali',             'Кейл'),
  ('arugula',             'Arugula',             'Rucola',                 'Руккола'),
  ('lettuce',             'Lettuce',             'Salaatti',               'Салат-латук'),
  ('romaine_lettuce',     'Romaine Lettuce',     'Roomansalaatti',         'Салат ромэн'),
  ('iceberg_lettuce',     'Iceberg Lettuce',     'Jäävuorisalaatti',       'Айсберг'),
  ('watercress',          'Watercress',          'Vesikrassi',             'Водяной кресс'),
  ('endive',              'Endive',              'Endiiivi',               'Эндивий'),
  ('radicchio',           'Radicchio',           'Radicchio',              'Радиккьо'),
  ('carrots',             'Carrots',             'Porkkanat',              'Морковь'),
  ('parsnip',             'Parsnip',             'Pastinaakki',            'Пастернак'),
  ('turnip',              'Turnip',              'Nauris',                 'Репа'),
  ('beetroot',            'Beetroot',            'Punajuuri',              'Свёкла'),
  ('radish',              'Radish',              'Retiisi',                'Редис'),
  ('daikon',              'Daikon',              'Daikon',                 'Дайкон'),
  ('celery',              'Celery',              'Selleri',                'Сельдерей'),
  ('celeriac',            'Celeriac',            'Juuriselleri',           'Корневой сельдерей'),
  ('fennel',              'Fennel',              'Fenkoli',                'Фенхель'),
  ('leek',                'Leek',                'Purjo',                  'Лук-порей'),
  ('shallot',             'Shallot',             'Salottisipuli',          'Лук-шалот'),
  ('scallion',            'Scallion',            'Kevätsipuli',            'Зелёный лук'),
  ('chives',              'Chives',              'Ruohosipuli',            'Шнитт-лук'),
  ('onion',               'Onion',               'Sipuli',                 'Лук'),
  ('red_onion',           'Red Onion',           'Punasipuli',             'Красный лук'),
  ('white_onion',         'White Onion',         'Valkosipuli',            'Белый лук'),
  ('yellow_onion',        'Yellow Onion',        'Keltasipuli',            'Жёлтый лук'),
  ('spring_onion',        'Spring Onion',        'Kevätsipuli',            'Весенний лук'),
  ('garlic',              'Garlic',              'Valkosipuli',            'Чеснок'),
  ('ginger',              'Ginger',              'Inkivääri',              'Имбирь'),
  ('galangal',            'Galangal',            'Galangal',               'Галангал'),
  ('turmeric_root',       'Turmeric Root',       'Kurkumajuuri',           'Корень куркумы'),
  ('tomato',              'Tomato',              'Tomaatti',               'Помидор'),
  ('cherry_tomatoes',     'Cherry Tomatoes',     'Kirsikkatomaatit',       'Помидоры черри'),
  ('sun_dried_tomatoes',  'Sun Dried Tomatoes',  'Aurinkokuivatut tomaatit','Вяленые помидоры'),
  ('bell_pepper',         'Bell Pepper',         'Paprika',                'Болгарский перец'),
  ('red_bell_pepper',     'Red Bell Pepper',     'Punainen paprika',       'Красный перец'),
  ('green_bell_pepper',   'Green Bell Pepper',   'Vihreä paprika',         'Зелёный перец'),
  ('yellow_bell_pepper',  'Yellow Bell Pepper',  'Keltainen paprika',      'Жёлтый перец'),
  ('chili_pepper',        'Chili Pepper',        'Chilijpaprika',          'Чили'),
  ('jalapeno',            'Jalapeno',            'Jalapeño',               'Халапеньо'),
  ('habanero',            'Habanero',            'Habanero',               'Хабанеро'),
  ('serrano',             'Serrano',             'Serrano',                'Серрано'),
  ('poblano',             'Poblano',             'Poblano',                'Поблано'),
  ('cucumber',            'Cucumber',            'Kurkku',                 'Огурец'),
  ('pickle',              'Pickle',              'Pikkelsi',               'Маринованный огурец'),
  ('zucchini',            'Zucchini',            'Kesäkurpitsa',           'Кабачок'),
  ('eggplant',            'Eggplant',            'Munakoiso',              'Баклажан'),
  ('squash',              'Squash',              'Squash-kurpitsa',        'Тыква-сквош'),
  ('butternut_squash',    'Butternut Squash',    'Myskikurpitsa',          'Мускатная тыква'),
  ('acorn_squash',        'Acorn Squash',        'Tammenterho-kurpitsa',   'Желудёвая тыква'),
  ('pumpkin',             'Pumpkin',             'Kurpitsa',               'Тыква'),
  ('mushroom',            'Mushroom',            'Sieni',                  'Гриб'),
  ('button_mushroom',     'Button Mushroom',     'Herkkusieni',            'Шампиньон'),
  ('portobello',          'Portobello',          'Portobello-sieni',       'Портобелло'),
  ('shiitake',            'Shiitake',            'Siitake',                'Шиитаке'),
  ('oyster_mushroom',     'Oyster Mushroom',     'Osterivinokas',          'Вешенка'),
  ('porcini',             'Porcini',             'Herkkutatti',            'Белый гриб'),
  ('chanterelle',         'Chanterelle',         'Kantarelli',             'Лисичка'),
  ('truffle',             'Truffle',             'Tryffeli',               'Трюфель'),
  ('asparagus',           'Asparagus',           'Parsa',                  'Спаржа'),
  ('artichoke',           'Artichoke',           'Artisokka',              'Артишок'),
  ('okra',                'Okra',                'Okra',                   'Окра'),
  ('corn',                'Corn',                'Maissi',                 'Кукуруза'),
  ('sweet_corn',          'Sweet Corn',          'Makea maissi',           'Сладкая кукуруза'),
  ('peas',                'Peas',                'Herneet',                'Горох'),
  ('snow_peas',           'Snow Peas',           'Lumiherneet',            'Снежный горох'),
  ('sugar_snap_peas',     'Sugar Snap Peas',     'Sokeripapuherneet',      'Сахарный горох'),
  ('bamboo_shoots',       'Bamboo Shoots',       'Bambuversot',            'Побеги бамбука'),
  ('water_chestnuts',     'Water Chestnuts',     'Vesikastanjat',          'Водяные каштаны'),
  ('seaweed',             'Seaweed',             'Merilevä',               'Морские водоросли'),
  ('nori',                'Nori',                'Nori',                   'Нори'),
  ('wakame',              'Wakame',              'Wakame',                 'Вакаме'),
  ('kelp',                'Kelp',                'Kelp',                   'Ламинария'),
  ('olives',              'Olives',              'Oliivit',                'Маслины'),
  ('green_olives',        'Green Olives',        'Vihreät oliivit',        'Зелёные оливки'),
  ('black_olives',        'Black Olives',        'Mustat oliivit',         'Чёрные маслины'),
  ('capers',              'Capers',              'Kaprikset',              'Каперсы'),

-- Fruits
  ('apple',               'Apple',               'Omena',                  'Яблоко'),
  ('green_apple',         'Green Apple',         'Vihreä omena',           'Зелёное яблоко'),
  ('pear',                'Pear',                'Päärynä',                'Груша'),
  ('banana',              'Banana',              'Banaani',                'Банан'),
  ('plantain',            'Plantain',            'Plantaani',              'Плантан'),
  ('avocado',             'Avocado',             'Avokado',                'Авокадо'),
  ('orange',              'Orange',              'Appelsiini',             'Апельсин'),
  ('mandarin',            'Mandarin',            'Mandariini',             'Мандарин'),
  ('tangerine',           'Tangerine',           'Tangeliini',             'Танжерин'),
  ('clementine',          'Clementine',          'Klementiini',            'Клементин'),
  ('lemon',               'Lemon',               'Sitruuna',               'Лимон'),
  ('lime',                'Lime',                'Lime',                   'Лайм'),
  ('grapefruit',          'Grapefruit',          'Greippi',                'Грейпфрут'),
  ('blueberries',         'Blueberries',         'Mustikat',               'Черника'),
  ('strawberries',        'Strawberries',        'Mansikat',               'Клубника'),
  ('raspberries',         'Raspberries',         'Vadelmat',               'Малина'),
  ('blackberries',        'Blackberries',        'Karhunvatukat',          'Ежевика'),
  ('cranberries',         'Cranberries',         'Karpalo',                'Клюква'),
  ('currants',            'Currants',            'Herukat',                'Смородина'),
  ('gooseberries',        'Gooseberries',        'Karviainen',             'Крыжовник'),
  ('lingonberries',       'Lingonberries',       'Puolukat',               'Брусника'),
  ('cloudberries',        'Cloudberries',        'Lakka',                  'Морошка'),
  ('grapes',              'Grapes',              'Viinirypäleet',          'Виноград'),
  ('red_grapes',          'Red Grapes',          'Punaiset viinirypäleet', 'Красный виноград'),
  ('watermelon',          'Watermelon',          'Vesimeloni',             'Арбуз'),
  ('cantaloupe',          'Cantaloupe',          'Cantaloupe-meloni',      'Канталупа'),
  ('honeydew',            'Honeydew',            'Hunajameloni',           'Медовая дыня'),
  ('mango',               'Mango',               'Mango',                  'Манго'),
  ('pineapple',           'Pineapple',           'Ananas',                 'Ананас'),
  ('papaya',              'Papaya',              'Papaija',                'Папайя'),
  ('kiwi',                'Kiwi',                'Kiivi',                  'Киви'),
  ('peach',               'Peach',               'Persikka',               'Персик'),
  ('nectarine',           'Nectarine',           'Nektariini',             'Нектарин'),
  ('plum',                'Plum',                'Luumu',                  'Слива'),
  ('apricot',             'Apricot',             'Aprikoosi',              'Абрикос'),
  ('cherries',            'Cherries',            'Kirsikat',               'Вишня'),
  ('pomegranate',         'Pomegranate',         'Granaattiomena',         'Гранат'),
  ('passion_fruit',       'Passion Fruit',       'Passionhedelmä',         'Маракуйя'),
  ('dragon_fruit',        'Dragon Fruit',        'Lohikäärmeen hedelmä',   'Питайя'),
  ('lychee',              'Lychee',              'Lychee',                 'Личи'),
  ('guava',               'Guava',               'Guava',                  'Гуава'),
  ('persimmon',           'Persimmon',           'Kakihedelmä',            'Хурма'),
  ('fig',                 'Fig',                 'Viikuna',                'Инжир'),
  ('dates',               'Dates',               'Taatelit',               'Финики'),
  ('raisins',             'Raisins',             'Rusinat',                'Изюм'),
  ('prunes',              'Prunes',              'Luumut',                 'Чернослив'),
  ('dried_apricots',      'Dried Apricots',      'Kuivatut aprikoosit',    'Курага'),
  ('coconut',             'Coconut',             'Kookospähkinä',          'Кокос'),
  ('coconut_flakes',      'Coconut Flakes',      'Kookoshiutaleet',        'Кокосовая стружка'),
  ('coconut_milk',        'Coconut Milk',        'Kookosmaito',            'Кокосовое молоко'),
  ('coconut_cream',       'Coconut Cream',       'Kookoskerma',            'Кокосовые сливки'),

  -- Dairy
  ('milk',                'Milk',                'Maito',                  'Молоко'),
  ('whole_milk',          'Whole Milk',          'Täysmaito',              'Цельное молоко'),
  ('skim_milk',           'Skim Milk',           'Rasvaton maito',         'Обезжиренное молоко'),
  ('almond_milk',         'Almond Milk',         'Mantelimaito',           'Миндальное молоко'),
  ('oat_milk',            'Oat Milk',            'Kauramaito',             'Овсяное молоко'),
  ('soy_milk',            'Soy Milk',            'Soijamaito',             'Соевое молоко'),
  ('buttermilk',          'Buttermilk',          'Piimä',                  'Пахта'),
  ('condensed_milk',      'Condensed Milk',      'Kondensoitu maito',      'Сгущённое молоко'),
  ('evaporated_milk',     'Evaporated Milk',     'Haihdutusmaito',         'Топлёное молоко'),
  ('cream',               'Cream',               'Kerma',                  'Сливки'),
  ('heavy_cream',         'Heavy Cream',         'Kuohukerma',             'Жирные сливки'),
  ('whipping_cream',      'Whipping Cream',      'Vispattava kerma',       'Взбитые сливки'),
  ('sour_cream',          'Sour Cream',          'Smetana',                'Сметана'),
  ('creme_fraiche',       'Creme Fraiche',       'Crème fraîche',          'Крем-фреш'),
  ('yogurt',              'Yogurt',              'Jogurtti',               'Йогурт'),
  ('greek_yogurt',        'Greek Yogurt',        'Kreikkalainen jogurtti', 'Греческий йогурт'),
  ('kefir',               'Kefir',               'Kefiiri',                'Кефир'),
  ('cheese',              'Cheese',              'Juusto',                 'Сыр'),
  ('cheddar_cheese',      'Cheddar Cheese',      'Cheddar-juusto',         'Чеддер'),
  ('mozzarella',          'Mozzarella',          'Mozzarella',             'Моцарелла'),
  ('parmesan',            'Parmesan',            'Parmesaani',             'Пармезан'),
  ('feta',                'Feta',                'Feta',                   'Фета'),
  ('ricotta',             'Ricotta',             'Ricotta',                'Рикотта'),
  ('cream_cheese',        'Cream Cheese',        'Tuorejuusto',            'Сливочный сыр'),
  ('mascarpone',          'Mascarpone',          'Mascarpone',             'Маскарпоне'),
  ('goat_cheese',         'Goat Cheese',         'Vuohenjuusto',           'Козий сыр'),
  ('blue_cheese',         'Blue Cheese',         'Homejuusto',             'Голубой сыр'),
  ('gouda',               'Gouda',               'Gouda',                  'Гауда'),
  ('brie',                'Brie',                'Brie',                   'Бри'),
  ('camembert',           'Camembert',           'Camembert',              'Камамбер'),
  ('swiss_cheese',        'Swiss Cheese',        'Sveitsiläinen juusto',   'Швейцарский сыр'),
  ('provolone',           'Provolone',           'Provolone',              'Проволоне'),
  ('cottage_cheese',      'Cottage Cheese',      'Raejuusto',              'Творог'),
  ('halloumi',            'Halloumi',            'Halloumi',               'Халлуми'),
  ('paneer',              'Paneer',              'Paneer',                 'Панир'),
  ('butter',              'Butter',              'Voi',                    'Сливочное масло'),
  ('unsalted_butter',     'Unsalted Butter',     'Suolaton voi',           'Несолёное масло'),
  ('ghee',                'Ghee',                'Ghee',                   'Гхи'),
  ('margarine',           'Margarine',           'Margariini',             'Маргарин'),

 -- Fats & Oils
  ('olive_oil',                'Olive Oil',                'Oliiviöljy',               'Оливковое масло'),
  ('extra_virgin_olive_oil',   'Extra Virgin Olive Oil',   'Ekstra-neitsytoliiviöljy', 'Оливковое масло Extra Virgin'),
  ('coconut_oil',              'Coconut Oil',              'Kookosöljy',               'Кокосовое масло'),
  ('sesame_oil',               'Sesame Oil',               'Seesamiöljy',              'Кунжутное масло'),
  ('sunflower_oil',            'Sunflower Oil',            'Auringonkukkaöljy',        'Подсолнечное масло'),
  ('vegetable_oil',            'Vegetable Oil',            'Kasviöljy',                'Растительное масло'),
  ('canola_oil',               'Canola Oil',               'Rypsiöljy',                'Масло канолы'),
  ('avocado_oil',              'Avocado Oil',              'Avokadoöljy',              'Масло авокадо'),
  ('peanut_oil',               'Peanut Oil',               'Maapähkinäöljy',           'Арахисовое масло'),
  ('truffle_oil',              'Truffle Oil',              'Tryffeliöljy',             'Трюфельное масло'),
  ('lard',                     'Lard',                     'Laardi',                   'Сало'),

  -- Nuts & Seeds
  ('almonds',                  'Almonds',                  'Mantelit',                 'Миндаль'),
  ('walnuts',                  'Walnuts',                  'Saksanpähkinät',           'Грецкие орехи'),
  ('cashews',                  'Cashews',                  'Cashew-pähkinät',          'Кешью'),
  ('pistachios',               'Pistachios',               'Pistaasipähkinät',         'Фисташки'),
  ('pecans',                   'Pecans',                   'Pekaanipähkinät',          'Орехи пекан'),
  ('hazelnuts',                'Hazelnuts',                'Hasselpähkinät',           'Лесные орехи'),
  ('macadamia_nuts',           'Macadamia Nuts',           'Macadamiapähkinät',        'Орехи макадамия'),
  ('brazil_nuts',              'Brazil Nuts',              'Parapähkinät',             'Бразильские орехи'),
  ('pine_nuts',                'Pine Nuts',                'Pinjansiemenet',           'Кедровые орехи'),
  ('peanuts',                  'Peanuts',                  'Maapähkinät',              'Арахис'),
  ('peanut_butter',            'Peanut Butter',            'Maapähkinävoi',            'Арахисовая паста'),
  ('almond_butter',            'Almond Butter',            'Mantelivoi',               'Миндальная паста'),
  ('cashew_butter',            'Cashew Butter',            'Cashew-voi',               'Паста кешью'),
  ('tahini',                   'Tahini',                   'Tahini',                   'Тахини'),
  ('chia_seeds',               'Chia Seeds',               'Chia-siemenet',            'Семена чиа'),
  ('flax_seeds',               'Flax Seeds',               'Pellavansiemenet',         'Льняные семена'),
  ('sunflower_seeds',          'Sunflower Seeds',          'Auringonkukansiemenet',    'Семена подсолнечника'),
  ('pumpkin_seeds',            'Pumpkin Seeds',            'Kurpitsansiemenet',        'Тыквенные семечки'),
  ('sesame_seeds',             'Sesame Seeds',             'Seesamisiemenet',          'Кунжут'),
  ('hemp_seeds',               'Hemp Seeds',               'Hampunsiemenet',           'Семена конопли'),
  ('poppy_seeds',              'Poppy Seeds',              'Unikonsiemenet',           'Семена мака'),

  -- Herbs (fresh & dried)
  ('basil',                    'Basil',                    'Basilika',                 'Базилик'),
  ('dried_basil',              'Dried Basil',              'Kuivattu basilika',        'Сушёный базилик'),
  ('oregano',                  'Oregano',                  'Oregano',                  'Орегано'),
  ('dried_oregano',            'Dried Oregano',            'Kuivattu oregano',         'Сушёный орегано'),
  ('thyme',                    'Thyme',                    'Timjami',                  'Тимьян'),
  ('rosemary',                 'Rosemary',                 'Rosmariini',               'Розмарин'),
  ('sage',                     'Sage',                     'Salvia',                   'Шалфей'),
  ('mint',                     'Mint',                     'Minttu',                   'Мята'),
  ('parsley',                  'Parsley',                  'Persilja',                 'Петрушка'),
  ('cilantro',                 'Cilantro',                 'Korianteri',               'Кинза'),
  ('dill',                     'Dill',                     'Tilli',                    'Укроп'),
  ('tarragon',                 'Tarragon',                 'Rakuuna',                  'Эстрагон'),
  ('chervil',                  'Chervil',                  'Kirveli',                  'Кервель'),
  ('marjoram',                 'Marjoram',                 'Meirami',                  'Майоран'),
  ('bay_leaves',               'Bay Leaves',               'Laakerinlehdet',           'Лавровый лист'),
  ('lemongrass',               'Lemongrass',               'Sitruunaruoho',            'Лемонграсс'),
  ('kaffir_lime_leaves',       'Kaffir Lime Leaves',       'Kaffirlimenlehdet',        'Листья каффир-лайма'),
  ('curry_leaves',             'Curry Leaves',             'Currylehdet',              'Листья карри'),

  -- Spices
  ('salt',                     'Salt',                     'Suola',                    'Соль'),
  ('sea_salt',                 'Sea Salt',                 'Merisuola',                'Морская соль'),
  ('kosher_salt',              'Kosher Salt',              'Kosher-suola',             'Кошерная соль'),
  ('black_pepper',             'Black Pepper',             'Mustapippuri',             'Чёрный перец'),
  ('white_pepper',             'White Pepper',             'Valkopippuri',             'Белый перец'),
  ('peppercorns',              'Peppercorns',              'Pippurit',                 'Перец горошком'),
  ('pink_peppercorns',         'Pink Peppercorns',         'Vaaleanpunaiset pippurit', 'Розовый перец'),
  ('garlic_powder',            'Garlic Powder',            'Valkosipulijauhe',         'Чесночный порошок'),
  ('onion_powder',             'Onion Powder',             'Sipulijauhe',              'Луковый порошок'),
  ('paprika',                  'Paprika',                  'Paprika',                  'Паприка'),
  ('smoked_paprika',           'Smoked Paprika',           'Savupaprika',              'Копчёная паприка'),
  ('cayenne_pepper',           'Cayenne Pepper',           'Cayennepippuri',           'Кайенский перец'),
  ('chili_powder',             'Chili Powder',             'Chilijauhe',               'Порошок чили'),
  ('chili_flakes',             'Chili Flakes',             'Chilihiutaleet',           'Хлопья чили'),
  ('cumin',                    'Cumin',                    'Kumina',                   'Кумин'),
  ('ground_cumin',             'Ground Cumin',             'Jauhettu kumina',          'Молотый кумин'),
  ('coriander',                'Coriander',                'Korianteri',               'Кориандр'),
  ('ground_coriander',         'Ground Coriander',         'Jauhettu korianteri',      'Молотый кориандр'),
  ('turmeric',                 'Turmeric',                 'Kurkuma',                  'Куркума'),
  ('cinnamon',                 'Cinnamon',                 'Kaneli',                   'Корица'),
  ('ground_cinnamon',          'Ground Cinnamon',          'Jauhettu kaneli',          'Молотая корица'),
  ('cinnamon_stick',           'Cinnamon Stick',           'Kanelikepit',              'Палочка корицы'),
  ('cardamom',                 'Cardamom',                 'Kardemumma',               'Кардамон'),
  ('cloves',                   'Cloves',                   'Neilikka',                 'Гвоздика'),
  ('nutmeg',                   'Nutmeg',                   'Muskottipähkinä',          'Мускатный орех'),
  ('mace',                     'Mace',                     'Muskottikukka',            'Мускатный цвет'),
  ('allspice',                 'Allspice',                 'Maustepippuri',            'Душистый перец'),
  ('star_anise',               'Star Anise',               'Tähtianis',                'Бадьян'),
  ('anise_seeds',              'Anise Seeds',              'Anissiemenet',             'Семена аниса'),
  ('fennel_seeds',             'Fennel Seeds',             'Fenkolinsiemenet',         'Семена фенхеля'),
  ('mustard_seeds',            'Mustard Seeds',            'Sinapinsiemenet',          'Семена горчицы'),
  ('saffron',                  'Saffron',                  'Sahrami',                  'Шафран'),
  ('sumac',                    'Sumac',                    'Sumakki',                  'Сумах'),
  ('zaatar',                   'Zaatar',                   'Zaatar',                 'Заатар'),
  ('garam_masala',             'Garam Masala',             'Garam masala',             'Гарам масала'),
  ('curry_powder',             'Curry Powder',             'Curryjauhe',               'Порошок карри'),
  ('italian_seasoning',        'Italian Seasoning',        'Italialainen mausteseos',  'Итальянские травы'),
  ('herbs_de_provence',        'Herbs de Provence',        'Provence-yrtit',           'Прованские травы'),
  ('five_spice_powder',        'Five Spice Powder',        'Viiden mausteen jauhe',    'Смесь пяти специй'),
  ('old_bay_seasoning',        'Old Bay Seasoning',        'Old Bay -mauste',          'Приправа Old Bay'),
  ('cajun_seasoning',          'Cajun Seasoning',          'Cajun-mauste',             'Приправа каджун'),
  ('taco_seasoning',           'Taco Seasoning',           'Taco-mauste',              'Приправа для тако'),
  ('ginger_powder',            'Ginger Powder',            'Inkiväärijauhe',           'Молотый имбирь'),
  ('vanilla_extract',          'Vanilla Extract',          'Vaniljauute',              'Экстракт ванили'),
  ('vanilla_bean',             'Vanilla Bean',             'Vaniljapapu',              'Стручок ванили'),
  ('vanilla_pod',              'Vanilla Pod',              'Vaniljapapu',              'Ванильный стручок'),

-- Sauces & Condiments
  ('honey',                    'Honey',                    'Hunaja',                   'Мёд'),
  ('maple_syrup',              'Maple Syrup',              'Vaahterasiirappi',         'Кленовый сироп'),
  ('agave',                    'Agave',                    'Agave',                    'Агава'),
  ('sugar',                    'Sugar',                    'Sokeri',                   'Сахар'),
  ('brown_sugar',              'Brown Sugar',              'Ruskea sokeri',            'Коричневый сахар'),
  ('white_sugar',              'White Sugar',              'Valkoinen sokeri',         'Белый сахар'),
  ('powdered_sugar',           'Powdered Sugar',           'Tomusokeri',               'Сахарная пудра'),
  ('stevia',                   'Stevia',                   'Stevia',                   'Стевия'),
  ('molasses',                 'Molasses',                 'Melassi',                  'Патока'),
  ('soy_sauce',                'Soy Sauce',                'Soijakastike',             'Соевый соус'),
  ('dark_soy_sauce',           'Dark Soy Sauce',           'Tumma soijakastike',       'Тёмный соевый соус'),
  ('tamari',                   'Tamari',                   'Tamari',                   'Тамари'),
  ('fish_sauce',               'Fish Sauce',               'Kalakastike',              'Рыбный соус'),
  ('oyster_sauce',             'Oyster Sauce',             'Osterikastike',            'Устричный соус'),
  ('hoisin_sauce',             'Hoisin Sauce',             'Hoisin-kastike',           'Хойсин'),
  ('teriyaki_sauce',           'Teriyaki Sauce',           'Teriyaki-kastike',         'Соус терияки'),
  ('sriracha',                 'Sriracha',                 'Sriracha',                 'Шрирача'),
  ('hot_sauce',                'Hot Sauce',                'Tulinen kastike',          'Острый соус'),
  ('tabasco',                  'Tabasco',                  'Tabasco',                  'Табаско'),
  ('worcestershire_sauce',     'Worcestershire Sauce',     'Worcestershire-kastike',   'Вустерский соус'),
  ('ketchup',                  'Ketchup',                  'Ketsuppi',                 'Кетчуп'),
  ('mustard',                  'Mustard',                  'Sinappi',                  'Горчица'),
  ('dijon_mustard',            'Dijon Mustard',            'Dijon-sinappi',            'Дижонская горчица'),
  ('wholegrain_mustard',       'Wholegrain Mustard',       'Täysjyväsinappi',          'Зернистая горчица'),
  ('yellow_mustard',           'Yellow Mustard',           'Keltainen sinappi',        'Жёлтая горчица'),
  ('mayonnaise',               'Mayonnaise',               'Majoneesi',                'Майонез'),
  ('bbq_sauce',                'BBQ Sauce',                'BBQ-kastike',              'Соус BBQ'),
  ('tomato_sauce',             'Tomato Sauce',             'Tomaattikastike',          'Томатный соус'),
  ('tomato_paste',             'Tomato Paste',             'Tomaattipyree',            'Томатная паста'),
  ('pesto',                    'Pesto',                    'Pesto',                    'Песто'),
  ('tahini_sauce',             'Tahini Sauce',             'Tahini-kastike',           'Соус тахини'),
  ('hummus',                   'Hummus',                   'Hummus',                   'Хумус'),
  ('salsa',                    'Salsa',                    'Salsa',                    'Сальса'),
  ('guacamole',                'Guacamole',                'Guacamole',                'Гуакамоле'),
  ('vinegar',                  'Vinegar',                  'Etikka',                   'Уксус'),
  ('apple_cider_vinegar',      'Apple Cider Vinegar',      'Omenasiiderietikka',       'Яблочный уксус'),
  ('white_vinegar',            'White Vinegar',            'Valkoinen etikka',         'Белый уксус'),
  ('rice_vinegar',             'Rice Vinegar',             'Riisietikka',              'Рисовый уксус'),
  ('balsamic_vinegar',         'Balsamic Vinegar',         'Balsamietikka',            'Бальзамический уксус'),
  ('red_wine_vinegar',         'Red Wine Vinegar',         'Punaviinietikka',          'Красный винный уксус'),
  ('malt_vinegar',             'Malt Vinegar',             'Maltasetikka',             'Солодовый уксус'),
  ('mirin',                    'Mirin',                    'Mirin',                    'Мирин'),
  ('sake',                     'Sake',                     'Sake',                     'Сакэ'),
  ('cooking_wine',             'Cooking Wine',             'Ruokaviini',               'Кулинарное вино'),
  ('red_wine',                 'Red Wine',                 'Punaviini',                'Красное вино'),
  ('white_wine',               'White Wine',               'Valkoviini',               'Белое вино'),
  ('beer',                     'Beer',                     'Olut',                     'Пиво'),
  ('rum',                      'Rum',                      'Rommi',                    'Ром'),
  ('brandy',                   'Brandy',                   'Brandy',                   'Бренди'),
  ('vodka',                    'Vodka',                    'Vodka',                    'Водка'),

  -- Baking & Misc
  ('baking_powder',            'Baking Powder',            'Leivinjauhe',              'Разрыхлитель'),
  ('baking_soda',              'Baking Soda',              'Ruokasooda',               'Пищевая сода'),
  ('yeast',                    'Yeast',                    'Hiiva',                    'Дрожжи'),
  ('active_dry_yeast',         'Active Dry Yeast',         'Aktiivinen kuivahiiva',    'Сухие активные дрожжи'),
  ('instant_yeast',            'Instant Yeast',            'Pikahiiva',                'Быстродействующие дрожжи'),
  ('gelatin',                  'Gelatin',                  'Gelatiini',                'Желатин'),
  ('agar_agar',                'Agar Agar',                'Agar-agar',                'Агар-агар'),
  ('cocoa_powder',             'Cocoa Powder',             'Kaakaojauhe',              'Какао-порошок'),
  ('chocolate',                'Chocolate',                'Suklaa',                   'Шоколад'),
  ('dark_chocolate',           'Dark Chocolate',           'Tumma suklaa',             'Тёмный шоколад'),
  ('milk_chocolate',           'Milk Chocolate',           'Maitosuklaa',              'Молочный шоколад'),
  ('white_chocolate',          'White Chocolate',          'Valkoinen suklaa',         'Белый шоколад'),
  ('chocolate_chips',          'Chocolate Chips',          'Suklaapalat',              'Шоколадные капли'),
  ('marshmallows',             'Marshmallows',             'Vaahtokarkit',             'Маршмэллоу'),
  ('sprinkles',                'Sprinkles',                'Koristeströsselit',        'Кондитерская посыпка'),
  ('food_coloring',            'Food Coloring',            'Elintarvikeväri',          'Пищевой краситель'),

  -- Beverages (as ingredients)
  ('coffee',                   'Coffee',                   'Kahvi',                    'Кофе'),
  ('espresso',                 'Espresso',                 'Espresso',                 'Эспрессо'),
  ('tea',                      'Tea',                      'Tee',                      'Чай'),
  ('black_tea',                'Black Tea',                'Musta tee',                'Чёрный чай'),
  ('green_tea',                'Green Tea',                'Vihreä tee',               'Зелёный чай'),
  ('matcha',                   'Matcha',                   'Matcha',                   'Матча'),
  ('chai',                     'Chai',                     'Chai',                     'Масала-чай'),
  ('water',                    'Water',                    'Vesi',                     'Вода'),
  ('sparkling_water',          'Sparkling Water',          'Hiilihapollinen vesi',     'Газированная вода'),
  ('broth',                    'Broth',                    'Liemi',                    'Бульон'),
  ('chicken_broth',            'Chicken Broth',            'Kanaliemi',                'Куриный бульон'),
  ('beef_broth',               'Beef Broth',               'Naudanliemiliemi',         'Говяжий бульон'),
  ('vegetable_broth',          'Vegetable Broth',          'Kasvisliemi',              'Овощной бульон'),
  ('fish_stock',               'Fish Stock',               'Kalaliemi',                'Рыбный бульон'),
  ('stock',                    'Stock',                    'Lihaliemi',                'Бульон')
) AS v(code, name_en, name_fi, name_ru)
ON CONFLICT (code) DO NOTHING;

-- Additional ingredients (further enrichment)
INSERT INTO ingredients (code, name)
SELECT v.code,
  jsonb_build_object('en', v.name_en, 'fi', v.name_fi, 'ru', v.name_ru)
FROM (VALUES
  -- Additional fish
  ('sea_bream',         'Sea Bream',       'Kultaotsa-ahven',      'Дорада'),
  ('snapper',           'Snapper',         'Snapper-kala',         'Луциан'),
  ('red_snapper',       'Red Snapper',     'Punainen snapper',     'Красный луциан'),
  ('grouper',           'Grouper',         'Meribassi',            'Групер'),
  ('bass',              'Bass',            'Ahven',                'Окунь'),
  ('cod',               'Cod',             'Turska',               'Треска'),
  ('haddock',           'Haddock',         'Seiti',                'Пикша'),
  ('halibut',           'Halibut',         'Lohifileet',           'Палтус'),
  ('salmon',            'Salmon',          'Lohi',                 'Лосось'),
  ('trout',             'Trout',           'Taimen',               'Форель'),
  ('tuna',              'Tuna',            'Tonnikala',            'Тунец'),
  ('mackerel',          'Mackerel',        'Makrilli',			   'Скумбрия'),
  ('sardines',          'Sardines',        'Sardiinit',            'Сардины'),
  ('anchovies',         'Anchovies',       'Anjovis',              'Анчоусы'),
  ('herring',           'Herring',         'Silli',                'Сельдь'),
  ('mullet',            'Mullet',          'Mullus',               'Кефаль'),
  ('sablefish',         'Sablefish',       'Kohokala',             'Черная треска'),
  ('monkfish',          'Monkfish',        'Merikrotti',           'Морской чёрт'),
  ('swordfish',         'Swordfish',       'Miekkakala',           'Рыба-меч'),
  ('pollock',           'Pollock',         'Seiti',                'Минтай'),
  ('flounder',          'Flounder',        'Kampela',              'Камбала'),
  ('sole',              'Sole',            'Meriantura',           'Солея'),
  ('skate',             'Skate',           'Rausku',               'Скат'),
  ('eel',               'Eel',             'Ankerias',             'Угорь'),
  ('catfish',           'Catfish',         'Monni',                'Сом'),
  ('whitefish',         'Whitefish',       'Siika',                'Сиг'),
  ('salted_cod',        'Salted Cod',      'Suolattu turska',      'Солёная треска'),

  -- Additional shellfish/seafood
  ('crayfish',          'Crayfish',        'Jokirapu',             'Речной рак'),
  ('abalone',           'Abalone',         'Merikorva',            'Морское ушко'),
  ('sea_urchin',        'Sea Urchin',      'Merisiilit',           'Морской ёж'),
  ('cockles',           'Cockles',         'Sydänsimpukat',        'Сердцевидки'),
  ('whelks',            'Whelks',          'Merikotilot',          'Трубачи'),
  ('cuttlefish',        'Cuttlefish',      'Seepia',               'Каракатица'),
  ('calamari',          'Calamari',        'Kalamari',             'Кальмари'),
  ('barnacles',         'Barnacles',       'Merirokot',            'Морские уточки'),

  -- Offal & specialty cuts
  ('beef_liver',        'Beef Liver',      'Naudanmaksa',          'Говяжья печень'),
  ('pork_liver',        'Pork Liver',      'Sianlihasta maksa',    'Свиная печень'),
  ('kidney',            'Kidney',          'Munuainen',            'Почки'),
  ('heart',             'Heart',           'Sydän',                'Сердце'),
  ('tongue',            'Tongue',          'Kieli',                'Язык'),
  ('oxtail',            'Oxtail',          'Häränhäntä',           'Бычий хвост'),
  ('tripe',             'Tripe',           'Pötsi',                'Рубец'),
  ('sweetbreads',       'Sweetbreads',     'Kateenkorva',          'Зобная железа'),
  ('bone_marrow',       'Bone Marrow',     'Luuydin',              'Костный мозг'),
  ('trotters',          'Trotters',        'Siansorkka',           'Свиные ножки'),
  ('brisket',           'Brisket',         'Rintakehä',            'Брискет'),
  ('short_ribs',        'Short Ribs',      'Lyhyet kylkiluut',     'Короткие рёбра'),
  ('flank_steak',       'Flank Steak',     'Kylkipihvi',           'Фланк-стейк'),
  ('skirt_steak',       'Skirt Steak',     'Skirt-pihvi',          'Скёрт-стейк'),
  ('ribeye',            'Ribeye',          'Ribeye-pihvi',         'Рибай'),
  ('sirloin',           'Sirloin',         'Ulkofile',             'Сирлойн'),
  ('t_bone_steak',      'T-Bone Steak',    'T-luupihvi',           'Стейк Т-боун'),
  ('porterhouse',       'Porterhouse',     'Porterhouse-pihvi',    'Портерхаус'),
  ('chuck_roast',       'Chuck Roast',     'Lapa-paisti',          'Чак-ростбиф'),

-- Cured meats & charcuterie
  ('mortadella',            'Mortadella',           'Mortadella',               'Мортаделла'),
  ('bresaola',              'Bresaola',             'Bresaola',                 'Брезаола'),
  ('jamon_serrano',         'Jamon Serrano',        'Jamon Serrano',            'Хамон серрано'),
  ('jamon_iberico',         'Jamon Iberico',        'Jamon Iberico',            'Хамон иберико'),
  ('coppa',                 'Coppa',                'Coppa',                    'Коппа'),
  ('guanciale',             'Guanciale',            'Guanciale',                'Гуанчале'),
  ('speck',                 'Speck',                'Speck',                    'Шпек'),
  ('andouille',             'Andouille',            'Andouille-makkara',        'Андуй'),
  ('bratwurst',             'Bratwurst',            'Bratwurst',                'Братвурст'),
  ('kielbasa',              'Kielbasa',             'Kielbasa',                 'Колбаса'),
  ('frankfurter',           'Frankfurter',          'Nakkimakkara',             'Сосиска франкфуртская'),
  ('liverwurst',            'Liverwurst',           'Maksapasteja',             'Ливерная колбаса'),
  ('blood_sausage',         'Blood Sausage',        'Verimakkara',              'Кровяная колбаса'),
  ('turkey_bacon',          'Turkey Bacon',         'Kalkkunapekoni',           'Индюшиный бекон'),
  ('canadian_bacon',        'Canadian Bacon',       'Kanadalainen pekoni',      'Канадский бекон'),

  -- Game
  ('wild_boar',             'Wild Boar',            'Villisika',                'Кабан'),
  ('bison',                 'Bison',                'Biisoni',                  'Бизон'),
  ('elk',                   'Elk',                  'Wapiti',                   'Вапити'),
  ('moose',                 'Moose',                'Hirvi',                    'Лось'),
  ('reindeer',              'Reindeer',             'Poro',                     'Олень'),
  ('pheasant',              'Pheasant',             'Fasaani',                  'Фазан'),
  ('partridge',             'Partridge',            'Peltopyy',                 'Куропатка'),

  -- Extra legumes
  ('mung_beans',            'Mung Beans',           'Mungpavut',                'Маш'),
  ('adzuki_beans',          'Adzuki Beans',         'Adzuki-pavut',             'Адзуки'),
  ('cannellini_beans',      'Cannellini Beans',     'Cannellini-pavut',         'Каннеллини'),
  ('great_northern_beans',  'Great Northern Beans', 'Pohjoispavut',             'Белая фасоль крупная'),
  ('fava_beans',            'Fava Beans',           'Härkäpavut',               'Бобы'),
  ('butter_beans',          'Butter Beans',         'Voipavut',                 'Масляная фасоль'),
  ('yellow_lentils',        'Yellow Lentils',       'Keltaiset linssit',        'Жёлтая чечевица'),
  ('black_lentils',         'Black Lentils',        'Mustat linssit',           'Чёрная чечевица'),
  ('beluga_lentils',        'Beluga Lentils',       'Beluga-linssit',           'Чечевица белуга'),
  ('french_lentils',        'French Lentils',       'Ranskalaiset linssit',     'Французская чечевица'),

  -- Extra grains & flours
  ('spelt',                 'Spelt',                'Speltti',                  'Полба'),
  ('amaranth',              'Amaranth',             'Amarantti',                'Амарант'),
  ('wheat_germ',            'Wheat Germ',           'Vehnänalkio',              'Пшеничные отруби'),
  ('puffed_rice',           'Puffed Rice',          'Puffattu riisi',           'Воздушный рис'),
  ('puffed_quinoa',         'Puffed Quinoa',        'Puffattu kvinoa',          'Воздушная киноа'),
  ('rye_flour',             'Rye Flour',            'Ruisjauhot',               'Ржаная мука'),
  ('chickpea_flour',        'Chickpea Flour',       'Kikhernejauho',            'Нутовая мука'),
  ('buckwheat_flour',       'Buckwheat Flour',      'Tattarijauhot',            'Гречневая мука'),
  ('tapioca_flour',         'Tapioca Flour',        'Tapiokajauhot',            'Мука тапиока'),
  ('tapioca_starch',        'Tapioca Starch',       'Tapiokatärkkelys',         'Крахмал тапиока'),
  ('arrowroot',             'Arrowroot',            'Arrowroot',                'Аррорут'),
  ('masa_harina',           'Masa Harina',          'Masa harina',              'Маса харина'),
  ('self_rising_flour',     'Self-Rising Flour',    'Itsestään kohoava jauho',  'Самоподнимающаяся мука'),
  ('bread_flour',           'Bread Flour',          'Leipäjauhot',              'Хлебная мука'),
  ('cake_flour',            'Cake Flour',           'Kakkujauhot',              'Мука для выпечки'),

-- Extra pasta shapes
  ('orecchiette',           'Orecchiette',          'Orecchiette',              'Орекьетте'),
  ('rigatoni',              'Rigatoni',             'Rigatoni',                 'Ригатони'),
  ('farfalle',              'Farfalle',             'Farfalle',                 'Фарфалле'),
  ('linguine',              'Linguine',             'Linguine',                 'Лингуине'),
  ('fettuccine',            'Fettuccine',           'Fettuccine',               'Феттуччине'),
  ('pappardelle',           'Pappardelle',          'Pappardelle',              'Паппарделле'),
  ('orzo',                  'Orzo',                 'Orzo',                     'Орзо'),
  ('cannelloni',            'Cannelloni',           'Cannelloni',               'Каннеллони'),
  ('tortellini',            'Tortellini',           'Tortellini',               'Тортеллини'),
  ('angel_hair_pasta',      'Angel Hair Pasta',     'Enkelin hiuspasta',        'Паста капеллини'),
  ('conchiglie',            'Conchiglie',           'Conchiglie',               'Конкилье'),
  ('cavatappi',             'Cavatappi',            'Cavatappi',                'Каватаппи'),
  ('ziti',                  'Ziti',                 'Ziti',                     'Зити'),
  ('bucatini',              'Bucatini',             'Bucatini',                 'Букатини'),
  ('tagliatelle',           'Tagliatelle',          'Tagliatelle',              'Тальятелле'),

  -- Extra noodles
  ('glass_noodles',         'Glass Noodles',        'Lasinudeelit',             'Стеклянная лапша'),
  ('shirataki_noodles',     'Shirataki Noodles',    'Shirataki-nudeelit',       'Ширатаки'),
  ('chow_mein_noodles',     'Chow Mein Noodles',    'Chow mein -nudeelit',      'Лапша чау-мейн'),
  ('lo_mein_noodles',       'Lo Mein Noodles',      'Lo mein -nudeelit',        'Лапша ло-мейн'),
  ('vermicelli',            'Vermicelli',           'Vermicelli',               'Вермишель'),
  ('pho_noodles',           'Pho Noodles',          'Pho-nudeelit',             'Лапша для фо'),

  -- Extra breads & doughs
  ('focaccia',              'Focaccia',             'Focaccia',                 'Фокачча'),
  ('ciabatta',              'Ciabatta',             'Ciabatta',                 'Чиабатта'),
  ('brioche',               'Brioche',              'Brioche',                  'Бриошь'),
  ('challah',               'Challah',              'Challah',                  'Халла'),
  ('pumpernickel',          'Pumpernickel',         'Pumpernickel',             'Пумперникель'),
  ('lavash',                'Lavash',               'Lavash',                   'Лаваш'),
  ('flatbread',             'Flatbread',            'Litteä leipä',             'Лепёшка'),
  ('matzo',                 'Matzo',                'Matzo',                    'Маца'),
  ('pretzel',               'Pretzel',              'Pretzel',                  'Крендель'),
  ('cornbread',             'Cornbread',            'Maissilimppu',             'Кукурузный хлеб'),
  ('hamburger_bun',         'Hamburger Bun',        'Hampurilaissämpylä',       'Булочка для бургера'),
  ('hot_dog_bun',           'Hot Dog Bun',          'Hodari-sämpylä',           'Булочка для хот-дога'),
  ('dinner_roll',           'Dinner Roll',          'Pikkuleipä',               'Обеденная булочка'),
  ('crackers',              'Crackers',             'Keksit',                   'Крекеры'),
  ('rice_cakes',            'Rice Cakes',           'Riisikakut',               'Рисовые хлебцы'),
  ('phyllo_dough',          'Phyllo Dough',         'Filotaikina',              'Тесто фило'),
  ('puff_pastry',           'Puff Pastry',          'Lehtitaikina',             'Слоёное тесто'),
  ('pie_crust',             'Pie Crust',            'Piirakkataikinapohja',     'Тесто для пирога'),
  ('pizza_dough',           'Pizza Dough',          'Pizzataikina',             'Тесто для пиццы'),
  ('wonton_wrappers',       'Wonton Wrappers',      'Wonton-kuoret',            'Обёртки для вонтонов'),
  ('spring_roll_wrappers',  'Spring Roll Wrappers', 'Kevätrulla-kuoret',        'Бумага для спринг-роллов'),
  ('rice_paper',            'Rice Paper',           'Riisipaperi',              'Рисовая бумага'),

-- Extra vegetables
  ('sunchoke',              'Sunchoke',             'Maa-artisokka',            'Топинамбур'),
  ('jerusalem_artichoke',   'Jerusalem Artichoke',  'Maa-artisokka',            'Топинамбур'),
  ('jicama',                'Jicama',               'Jicama',                   'Хикама'),
  ('kohlrabi',              'Kohlrabi',             'Kyssäkaali',               'Кольраби'),
  ('salsify',               'Salsify',              'Kaurajuuri',               'Козелец'),
  ('taro',                  'Taro',                 'Taro',                     'Таро'),
  ('lotus_root',            'Lotus Root',           'Lootuksen juuri',          'Корень лотоса'),
  ('burdock',               'Burdock',              'Takiainen',                'Лопух'),
  ('rutabaga',              'Rutabaga',             'Lanttu',                   'Брюква'),
  ('rhubarb',               'Rhubarb',              'Raparperi',                'Ревень'),
  ('swiss_chard',           'Swiss Chard',          'Mangoldi',                 'Мангольд'),
  ('mustard_greens',        'Mustard Greens',       'Sinapinvihreät',           'Листовая горчица'),
  ('collard_greens',        'Collard Greens',       'Lehtikaali',               'Листовая капуста'),
  ('dandelion_greens',      'Dandelion Greens',     'Voikukanvihreät',          'Листья одуванчика'),
  ('microgreens',           'Microgreens',          'Mikroversot',              'Микрозелень'),
  ('alfalfa_sprouts',       'Alfalfa Sprouts',      'Alfalfaversot',            'Ростки люцерны'),
  ('bean_sprouts',          'Bean Sprouts',         'Pavunversot',              'Ростки фасоли'),
  ('broccoli_sprouts',      'Broccoli Sprouts',     'Parsakaaliversot',         'Ростки брокколи'),
  ('mizuna',                'Mizuna',               'Mizuna',                   'Мидзуна'),
  ('purslane',              'Purslane',             'Portulakka',               'Портулак'),
  ('samphire',              'Samphire',             'Merihapero',               'Самфир'),
  ('nettles',               'Nettles',              'Nokkonen',                 'Крапива'),
  ('sorrel',                'Sorrel',               'Suolaheinä',               'Щавель'),
  ('horseradish_root',      'Horseradish Root',     'Piparjuurijuuri',          'Корень хрена'),
  ('wasabi_root',           'Wasabi Root',          'Wasabi-juuri',             'Корень васаби'),
  ('lotus_seeds',           'Lotus Seeds',          'Lootuksensiemenet',        'Семена лотоса'),

  -- Extra mushrooms
  ('enoki',                 'Enoki',                'Enoki-sieni',              'Эноки'),
  ('morel',                 'Morel',                'Huhtasieni',               'Сморчок'),
  ('lion_s_mane',           'Lion''s Mane',         'Leijonanharja-sieni',      'Ежовик гребенчатый'),
  ('maitake',               'Maitake',              'Maitake-sieni',            'Майтаке'),
  ('cremini',               'Cremini',              'Cremini-sieni',            'Кремини'),
  ('king_oyster',           'King Oyster',          'Kuningasvinokas',          'Королевская вешенка'),
  ('wood_ear_mushroom',     'Wood Ear Mushroom',    'Puunkorvasieni',           'Древесное ухо'),
  ('dried_mushrooms',       'Dried Mushrooms',      'Kuivatut sienet',          'Сушёные грибы'),

  -- Extra fruits (tropical, stone, exotic)
  ('quince',                'Quince',               'Kvitteni',                 'Айва'),
  ('loquat',                'Loquat',               'Japaninmispeli',           'Мушмула'),
  ('jackfruit',             'Jackfruit',            'Jakkipuu',                 'Джекфрут'),
  ('durian',                'Durian',               'Durian',                   'Дуриан'),
  ('rambutan',              'Rambutan',             'Rambutan',                 'Рамбутан'),
  ('longan',                'Longan',               'Longan',                   'Лонган'),
  ('mangosteen',            'Mangosteen',           'Mangosteen',               'Мангостин'),
  ('starfruit',             'Starfruit',            'Tähtihedelmä',             'Карамбола'),
  ('soursop',               'Soursop',              'Annona',                   'Саусеп'),
  ('tamarind',              'Tamarind',             'Tamarindi',                'Тамаринд'),
  ('mulberries',            'Mulberries',           'Mulpperit',                'Шелковица'),
  ('elderberries',          'Elderberries',         'Seläpensaan marjat',       'Бузина'),
  ('boysenberries',         'Boysenberries',        'Boysenmarjat',             'Бойзенова ягода'),
  ('acai_berries',          'Acai Berries',         'Acai-marjat',              'Ягоды асаи'),
  ('goji_berries',          'Goji Berries',         'Goji-marjat',              'Ягоды годжи'),
  ('sea_buckthorn',         'Sea Buckthorn',        'Tyrni',                    'Облепиха'),
  ('rosehip',               'Rosehip',              'Ruusunmarja',              'Шиповник'),
  ('kumquat',               'Kumquat',              'Kumkvatti',                'Кумкват'),
  ('yuzu',                  'Yuzu',                 'Yuzu',                     'Юзу'),
  ('meyer_lemon',           'Meyer Lemon',          'Meyer-sitruuna',           'Лимон мейер'),
  ('blood_orange',          'Blood Orange',         'Veriappelsiini',           'Кровавый апельсин'),
  ('bergamot',              'Bergamot',             'Bergamotti',               'Бергамот'),
  ('key_lime',              'Key Lime',             'Key-lime',                 'Лайм кей'),

  -- Extra dried fruit
  ('dried_cranberries',     'Dried Cranberries',    'Kuivattu karpalo',         'Сушёная клюква'),
  ('dried_cherries',        'Dried Cherries',       'Kuivatut kirsikat',        'Сушёная вишня'),
  ('dried_mango',           'Dried Mango',          'Kuivattu mango',           'Сушёное манго'),
  ('dried_blueberries',     'Dried Blueberries',    'Kuivatut mustikat',        'Сушёная черника'),
  ('dried_figs',            'Dried Figs',           'Kuivatut viikunat',        'Сушёный инжир'),
  ('candied_peel',          'Candied Peel',         'Sokeroidut kuoret',        'Цукаты из цедры'),

 -- Extra dairy & alternatives
  ('quark',                         'Quark',                        'Rahka',                        'Творог кварк'),
  ('fromage_blanc',                 'Fromage Blanc',                'Fromage blanc',                'Фромаж блан'),
  ('clotted_cream',                 'Clotted Cream',                'Clotted cream',                'Топлёные сливки'),
  ('labneh',                        'Labneh',                       'Labneh',                       'Лабне'),
  ('smetana',                       'Smetana',                      'Smetana',                      'Сметана'),
  ('ayran',                         'Ayran',                        'Ayran',                        'Айран'),
  ('skyr',                          'Skyr',                         'Skyr',                         'Скир'),
  ('rice_milk',                     'Rice Milk',                    'Riisimaito',                   'Рисовое молоко'),
  ('cashew_milk',                   'Cashew Milk',                  'Cashew-maito',                 'Молоко кешью'),
  ('hemp_milk',                     'Hemp Milk',                    'Hampumaito',                   'Конопляное молоко'),
  ('vegan_butter',                  'Vegan Butter',                 'Vegaaninen voi',               'Веганское масло'),
  ('vegan_cheese',                  'Vegan Cheese',                 'Vegaaninen juusto',            'Веганский сыр'),
  ('nutritional_yeast',             'Nutritional Yeast',            'Ravintohiiva',                 'Пищевые дрожжи'),

  -- Extra cheeses
  ('manchego',                      'Manchego',                     'Manchego',                     'Манчего'),
  ('gruyere',                       'Gruyere',                      'Gruyère',                      'Грюйер'),
  ('emmental',                      'Emmental',                     'Emmental',                     'Эмменталь'),
  ('roquefort',                     'Roquefort',                    'Roquefort',                    'Рокфор'),
  ('gorgonzola',                    'Gorgonzola',                   'Gorgonzola',                   'Горгонзола'),
  ('asiago',                        'Asiago',                       'Asiago',                       'Азиаго'),
  ('pecorino',                      'Pecorino',                     'Pecorino',                     'Пекорино'),
  ('pecorino_romano',               'Pecorino Romano',              'Pecorino Romano',              'Пекорино романо'),
  ('stilton',                       'Stilton',                      'Stilton',                      'Стилтон'),
  ('havarti',                       'Havarti',                      'Havarti',                      'Хаварти'),
  ('monterey_jack',                 'Monterey Jack',                'Monterey Jack',                'Монтерей джек'),
  ('pepper_jack',                   'Pepper Jack',                  'Pepper Jack',                  'Пеппер джек'),
  ('colby',                         'Colby',                        'Colby',                        'Колби'),
  ('fontina',                       'Fontina',                      'Fontina',                      'Фонтина'),
  ('taleggio',                      'Taleggio',                     'Taleggio',                     'Талледжо'),
  ('munster',                       'Munster',                      'Munster',                      'Мюнстер'),
  ('burrata',                       'Burrata',                      'Burrata',                      'Буррата'),
  ('queso_fresco',                  'Queso Fresco',                 'Queso fresco',                 'Кесо фреско'),
  ('queso_blanco',                  'Queso Blanco',                 'Queso blanco',                 'Кесо бланко'),
  ('cotija',                        'Cotija',                       'Cotija',                       'Котиха'),

  -- Extra nuts & seeds
  ('chestnuts',                     'Chestnuts',                    'Kastanjat',                    'Каштаны'),
  ('ginkgo_nuts',                   'Ginkgo Nuts',                  'Ginkgo-pähkinät',              'Орехи гинкго'),
  ('pepitas',                       'Pepitas',                      'Pepitas',                      'Пепитас'),
  ('pine_kernels',                  'Pine Kernels',                 'Pinjansiemenet',               'Кедровые орешки'),
  ('nigella_seeds',                 'Nigella Seeds',                'Nigellansiemenet',             'Чернушка'),
  ('fenugreek_seeds',               'Fenugreek Seeds',              'Sarviapilan siemenet',         'Семена пажитника'),
  ('black_sesame_seeds',            'Black Sesame Seeds',           'Mustat seesamisiemenet',       'Чёрный кунжут'),
  ('cacao_nibs',                    'Cacao Nibs',                   'Kaakaomurut',                  'Дроблёные какао-бобы'),
  ('marzipan',                      'Marzipan',                     'Marsipaani',                   'Марципан'),
  ('nougat',                        'Nougat',                       'Nugaa',                        'Нуга'),

  -- Extra herbs
  ('lavender',                      'Lavender',                     'Laventeli',                    'Лаванда'),
  ('lemon_balm',                    'Lemon Balm',                   'Sitruunamelissa',              'Мелисса'),
  ('savory',                        'Savory',                       'Kynteli',                      'Чабер'),
  ('shiso',                         'Shiso',                        'Shiso',                        'Шисо'),
  ('perilla',                       'Perilla',                      'Perilla',                      'Периlla'),
  ('epazote',                       'Epazote',                      'Epazote',                      'Эпазоте'),
  ('borage',                        'Borage',                       'Purasruoho',                   'Огуречник'),
  ('hyssop',                        'Hyssop',                       'Iisoppi',                      'Иссоп'),
  ('chervil_leaves',                'Chervil Leaves',               'Kirvelin lehdet',              'Листья кервеля'),

  -- Extra spices
  ('fenugreek',                     'Fenugreek',                    'Sarviapila',                   'Пажитник'),
  ('asafoetida',                    'Asafoetida',                   'Asafoetida',                   'Асафетида'),
  ('sichuan_pepper',                'Sichuan Pepper',               'Sichuanpippuri',               'Сычуаньский перец'),
  ('urfa_biber',                    'Urfa Biber',                   'Urfa biber',                   'Урфа бибер'),
  ('aleppo_pepper',                 'Aleppo Pepper',                'Aleppo-pippuri',               'Перец алеппо'),
  ('dried_lime',                    'Dried Lime',                   'Kuivattu lime',                'Сушёный лайм'),
  ('juniper_berries',               'Juniper Berries',              'Katajanmarjat',                'Ягоды можжевельника'),
  ('black_cardamom',                'Black Cardamom',               'Musta kardemumma',             'Чёрный кардамон'),
  ('long_pepper',                   'Long Pepper',                  'Pitkäpippuri',                 'Длинный перец'),
  ('annatto',                       'Annatto',                      'Annatto',                      'Аннато'),
  ('mahlab',                        'Mahlab',                       'Mahlab',                       'Махлаб'),
  ('grains_of_paradise',            'Grains of Paradise',           'Paratiisinjyvät',              'Райские зёрна'),
  ('ras_el_hanout',                 'Ras El Hanout',                'Ras el hanout',                'Рас-эль-ханут'),
  ('berbere',                       'Berbere',                      'Berbere',                      'Бербере'),
  ('dukkah',                        'Dukkah',                       'Dukkah',                       'Дуккa'),
  ('chinese_five_spice',            'Chinese Five Spice',           'Kiinalainen viiden mausteen seos', 'Смесь пяти специй'),
  ('baharat',                       'Baharat',                      'Baharat',                      'Бахарат'),
  ('pumpkin_pie_spice',             'Pumpkin Pie Spice',            'Kurpitsapiiras-mauste',        'Приправа для тыквенного пирога'),
  ('apple_pie_spice',               'Apple Pie Spice',              'Omenapiirasmauste',            'Приправа для яблочного пирога'),
  ('everything_bagel_seasoning',    'Everything Bagel Seasoning',   'Everything bagel -mauste',     'Приправа для бейгла'),
  ('lemon_pepper',                  'Lemon Pepper',                 'Sitruunapippuri',              'Лимонный перец'),
  ('celery_salt',                   'Celery Salt',                  'Sellerinsuola',                'Сельдерейная соль'),
  ('onion_salt',                    'Onion Salt',                   'Sipulisuola',                  'Луковая соль'),
  ('msg',                           'MSG',                          'MSG',                          'Глутамат натрия'),
  ('bouillon_cube',                 'Bouillon Cube',                'Liemikuutio',                  'Бульонный кубик'),
  ('chicken_bouillon',              'Chicken Bouillon',             'Kanaliemikuutio',              'Куриный бульон кубик'),
  ('beef_bouillon',                 'Beef Bouillon',                'Naudanliemikuutio',            'Говяжий бульон кубик'),
  ('vegetable_bouillon',            'Vegetable Bouillon',           'Kasvisliemikuutio',            'Овощной бульон кубик'),

 -- Extra sweeteners
  ('corn_syrup',                    'Corn Syrup',                   'Maissisiirappi',               'Кукурузный сироп'),
  ('golden_syrup',                  'Golden Syrup',                 'Kultainen siirappi',           'Золотой сироп'),
  ('treacle',                       'Treacle',                      'Melassi',                      'Чёрная патока'),
  ('date_syrup',                    'Date Syrup',                   'Taatelisiirappi',              'Финиковый сироп'),
  ('birch_syrup',                   'Birch Syrup',                  'Koivusiirappi',                'Берёзовый сироп'),
  ('xylitol',                       'Xylitol',                      'Ksylitoli',                    'Ксилит'),
  ('monk_fruit',                    'Monk Fruit',                   'Munkkihedelmä',                'Архат'),
  ('erythritol',                    'Erythritol',                   'Erytritoli',                   'Эритритол'),
  ('palm_sugar',                    'Palm Sugar',                   'Palmusokeri',                  'Пальмовый сахар'),
  ('coconut_sugar',                 'Coconut Sugar',                'Kookossokeri',                 'Кокосовый сахар'),
  ('jaggery',                       'Jaggery',                      'Jaggery',                      'Джаггери'),
  ('muscovado',                     'Muscovado',                    'Muscovado-sokeri',             'Мусковадо'),
  ('demerara_sugar',                'Demerara Sugar',               'Demerara-sokeri',              'Демерара'),
  ('turbinado_sugar',               'Turbinado Sugar',              'Turbinadosokeri',              'Турбинадо'),
  ('caster_sugar',                  'Caster Sugar',                 'Hienosokeri',                  'Сахарная пудра мелкая'),
  ('confectioners_sugar',           'Confectioners Sugar',          'Tomusokeri',                   'Сахарная пудра'),

  -- Extra sauces, pastes & condiments
  ('aioli',                         'Aioli',                        'Aioli',                        'Айоли'),
  ('tzatziki',                      'Tzatziki',                     'Tzatziki',                     'Дзадзики'),
  ('chimichurri',                   'Chimichurri',                  'Chimichurri',                  'Чимичурри'),
  ('gochujang',                     'Gochujang',                    'Gochujang',                    'Кочуджан'),
  ('doenjang',                      'Doenjang',                     'Doenjang',                     'Твенджан'),
  ('miso_paste',                    'Miso Paste',                   'Misotahna',                    'Паста мисо'),
  ('white_miso',                    'White Miso',                   'Valkoinen miso',               'Белое мисо'),
  ('red_miso',                      'Red Miso',                     'Punainen miso',                'Красное мисо'),
  ('sambal_oelek',                  'Sambal Oelek',                 'Sambal oelek',                 'Самбал олек'),
  ('harissa',                       'Harissa',                      'Harissa',                      'Харисса'),
  ('black_bean_sauce',              'Black Bean Sauce',             'Mustapapukastike',             'Соус из чёрной фасоли'),
  ('plum_sauce',                    'Plum Sauce',                   'Luumukastike',                 'Сливовый соус'),
  ('sweet_chili_sauce',             'Sweet Chili Sauce',            'Makea chilikastike',           'Сладкий соус чили'),
  ('ponzu',                         'Ponzu',                        'Ponzu',                        'Понзу'),
  ('unagi_sauce',                   'Unagi Sauce',                  'Unagi-kastike',                'Соус унаги'),
  ('tartar_sauce',                  'Tartar Sauce',                 'Tartarkastike',                'Соус тартар'),
  ('cocktail_sauce',                'Cocktail Sauce',               'Cocktailkastike',              'Коктейльный соус'),
  ('ranch_dressing',                'Ranch Dressing',               'Ranch-kastike',                'Соус ранч'),
  ('vinaigrette',                   'Vinaigrette',                  'Vinaigrette',                  'Винегрет'),
  ('italian_dressing',              'Italian Dressing',             'Italialainen salaattikastike', 'Итальянская заправка'),
  ('caesar_dressing',               'Caesar Dressing',              'Caesar-kastike',               'Заправка цезарь'),
  ('russian_dressing',              'Russian Dressing',             'Venäläinen salaattikastike',   'Русская заправка'),
  ('thousand_island_dressing',      'Thousand Island Dressing',     'Tuhat saarta -kastike',        'Тысяча островов'),
  ('blue_cheese_dressing',          'Blue Cheese Dressing',         'Homejuustokastike',            'Заправка с голубым сыром'),
  ('honey_mustard',                 'Honey Mustard',                'Hunaja-sinappi',               'Медовая горчица'),
  ('horseradish_sauce',             'Horseradish Sauce',            'Piparjuurikastike',            'Соус хрен'),
  ('tartare',                       'Tartare',                      'Tartare',                      'Тартар'),
  ('romesco',                       'Romesco',                      'Romesco',                      'Ромеско'),
  ('mole',                          'Mole',                         'Mole',                         'Моле'),
  ('enchilada_sauce',               'Enchilada Sauce',              'Enchilada-kastike',            'Соус энчилада'),
  ('adobo_sauce',                   'Adobo Sauce',                  'Adobo-kastike',                'Соус адобо'),
  ('curry_paste',                   'Curry Paste',                  'Currytahna',                   'Паста карри'),
  ('red_curry_paste',               'Red Curry Paste',              'Punainen currytahna',          'Красная паста карри'),
  ('green_curry_paste',             'Green Curry Paste',            'Vihreä currytahna',            'Зелёная паста карри'),
  ('yellow_curry_paste',            'Yellow Curry Paste',           'Keltainen currytahna',         'Жёлтая паста карри'),
  ('massaman_curry_paste',          'Massaman Curry Paste',         'Massaman-currytahna',          'Паста карри массаман'),
  ('anchovy_paste',                 'Anchovy Paste',                'Anjovistahna',                 'Анчоусная паста'),
  ('tamarind_paste',                'Tamarind Paste',               'Tamarinditahna',               'Паста тамаринд'),
  ('tomato_puree',                  'Tomato Puree',                 'Tomaattisose',                 'Томатное пюре'),
  ('passata',                       'Passata',                      'Passata',                      'Пассата'),
  ('crushed_tomatoes',              'Crushed Tomatoes',             'Murskatut tomaatit',           'Дроблёные томаты'),
  ('diced_tomatoes',                'Diced Tomatoes',               'Pilkotut tomaatit',            'Нарезанные томаты'),

  -- Pickles & ferments
  ('sauerkraut',                    'Sauerkraut',                   'Hapankaali',                   'Квашеная капуста'),
  ('kimchi',                        'Kimchi',                       'Kimchi',                       'Кимчи'),
  ('pickled_ginger',                'Pickled Ginger',               'Marinoitu inkivääri',          'Маринованный имбирь'),
  ('umeboshi',                      'Umeboshi',                     'Umeboshi',                     'Умэбоси'),
  ('cornichons',                    'Cornichons',                   'Cornichonit',                  'Корнишоны'),
  ('gherkins',                      'Gherkins',                     'Pikkelöidyt kurkut',           'Огурчики маринованные'),
  ('pickled_onions',                'Pickled Onions',               'Marinoitu sipuli',             'Маринованный лук'),
  ('pickled_jalapenos',             'Pickled Jalapenos',            'Marinoitu jalapeño',           'Маринованные халапеньо'),
  ('kombucha',                      'Kombucha',                     'Kombucha',                     'Чайный гриб'),

 -- Preserves & spreads
  ('jam',                           'Jam',                          'Hillo',                        'Джем'),
  ('strawberry_jam',                'Strawberry Jam',               'Mansikkahillo',                'Клубничный джем'),
  ('raspberry_jam',                 'Raspberry Jam',                'Vadelmahillo',                 'Малиновый джем'),
  ('apricot_jam',                   'Apricot Jam',                  'Aprikoosihillo',               'Абрикосовый джем'),
  ('jelly',                         'Jelly',                        'Hyytelö',                      'Желе'),
  ('marmalade',                     'Marmalade',                    'Marmeladi',                    'Мармелад'),
  ('chutney',                       'Chutney',                      'Chutney',                      'Чатни'),
  ('mango_chutney',                 'Mango Chutney',                'Mangochutney',                 'Манговый чатни'),
  ('relish',                        'Relish',                       'Relish',                       'Релиш'),
  ('compote',                       'Compote',                      'Kompotti',                     'Компот'),
  ('apple_sauce',                   'Apple Sauce',                  'Omenasose',                    'Яблочный соус'),
  ('cranberry_sauce',               'Cranberry Sauce',              'Karpalokastike',               'Клюквенный соус'),
  ('nutella',                       'Nutella',                      'Nutella',                      'Нутелла'),
  ('hazelnut_spread',               'Hazelnut Spread',              'Hasselpähkinälevite',          'Ореховая паста'),
  ('lemon_curd',                    'Lemon Curd',                   'Sitruunatahna',                'Лимонный курд'),
  ('dulce_de_leche',                'Dulce de Leche',               'Dulce de leche',               'Варёная сгущёнка'),

  -- Extracts & flavorings
  ('almond_extract',                'Almond Extract',               'Manteliuute',                  'Миндальный экстракт'),
  ('lemon_extract',                 'Lemon Extract',                'Sitruunauute',                 'Лимонный экстракт'),
  ('orange_extract',                'Orange Extract',               'Appelsiiniuute',               'Апельсиновый экстракт'),
  ('peppermint_extract',            'Peppermint Extract',           'Piparminttuuute',              'Экстракт мяты перечной'),
  ('rose_water',                    'Rose Water',                   'Ruusuvesi',                    'Розовая вода'),
  ('orange_blossom_water',          'Orange Blossom Water',         'Appelsiininkukkavesi',         'Вода из цветков апельсина'),

  -- Cooking wines & spirits
  ('sherry',                        'Sherry',                       'Sherry',                       'Херес'),
  ('dry_sherry',                    'Dry Sherry',                   'Kuiva sherry',                 'Сухой херес'),
  ('port',                          'Port',                         'Portviini',                    'Портвейн'),
  ('marsala',                       'Marsala',                      'Marsala',                      'Марсала'),
  ('vermouth',                      'Vermouth',                     'Vermutti',                     'Вермут'),
  ('gin',                           'Gin',                          'Gin',                          'Джин'),
  ('tequila',                       'Tequila',                      'Tequila',                      'Текила'),
  ('whiskey',                       'Whiskey',                      'Viski',                        'Виски'),
  ('bourbon',                       'Bourbon',                      'Bourbon',                      'Бурбон'),
  ('champagne',                     'Champagne',                    'Samppanja',                    'Шампанское'),
  ('prosecco',                      'Prosecco',                     'Prosecco',                     'Просекко'),
  ('cider',                         'Cider',                        'Siideri',                      'Сидр'),
  ('cognac',                        'Cognac',                       'Konjakki',                     'Коньяк'),
  ('amaretto',                      'Amaretto',                     'Amaretto',                     'Амаретто'),
  ('grand_marnier',                 'Grand Marnier',                'Grand Marnier',                'Гран Марнье'),
  ('kirsch',                        'Kirsch',                       'Kirsch',                       'Киршвассер'),
  ('kahlua',                        'Kahlua',                       'Kahlúa',                       'Калуа'),

  -- Baking extras
  ('cream_of_tartar',               'Cream of Tartar',              'Viinihappo',                   'Винный камень'),
  ('cocoa_butter',                  'Cocoa Butter',                 'Kaakaovoi',                    'Масло какао'),
  ('white_chocolate_chips',         'White Chocolate Chips',        'Valkosuklaapalat',             'Капли белого шоколада'),
  ('dark_chocolate_chips',          'Dark Chocolate Chips',         'Tummasuklaapalat',             'Капли тёмного шоколада'),
  ('chocolate_shavings',            'Chocolate Shavings',           'Suklaahöyleet',                'Шоколадная стружка'),
  ('candy_melts',                   'Candy Melts',                  'Candy melts',                  'Кэнди мелтс'),
  ('pearl_sugar',                   'Pearl Sugar',                  'Helmisokeri',                  'Жемчужный сахар'),
  ('sanding_sugar',                 'Sanding Sugar',                'Koristelusokeri',              'Декоративный сахар'),

  -- Condiment/specialty
  ('wasabi',                        'Wasabi',                       'Wasabi',                       'Васаби'),
  ('horseradish',                   'Horseradish',                  'Piparjuuri',                   'Хрен'),
  ('liquid_smoke',                  'Liquid Smoke',                 'Nestesavu',                    'Жидкий дым'),
  ('liquid_aminos',                 'Liquid Aminos',                'Nestemäiset aminohapot',       'Жидкие аминокислоты'),
  ('coconut_aminos',                'Coconut Aminos',               'Kookos-aminohapot',            'Кокосовые аминокислоты'),
  ('pomegranate_molasses',          'Pomegranate Molasses',         'Granaattiomelamelassi',        'Гранатовая патока'),
  ('verjuice',                      'Verjuice',                     'Verjuice',                     'Верджус')
) AS v(code, name_en, name_fi, name_ru)
ON CONFLICT (code) DO NOTHING;

-- Nutrition Facts (per 100g/100ml)
INSERT INTO nutrition_facts (ingredient_id, calories, protein, fat, carbs, base_unit)
SELECT id, 165, 31, 3.6, 0, 'g' FROM ingredients WHERE name->>'en' = 'Chicken Breast' UNION ALL
SELECT id, 208, 20, 13, 0, 'g' FROM ingredients WHERE name->>'en' = 'Salmon' UNION ALL
SELECT id, 250, 26, 15, 0, 'g' FROM ingredients WHERE name->>'en' = 'Beef' UNION ALL
SELECT id, 242, 27, 14, 0, 'g' FROM ingredients WHERE name->>'en' = 'Pork' UNION ALL
SELECT id, 189, 29, 7, 0, 'g' FROM ingredients WHERE name->>'en' = 'Turkey' UNION ALL
SELECT id, 155, 13, 11, 1.1, 'g' FROM ingredients WHERE name->>'en' = 'Eggs' UNION ALL
SELECT id, 76, 8, 4.8, 1.9, 'g' FROM ingredients WHERE name->>'en' = 'Tofu' UNION ALL
SELECT id, 127, 8, 0.3, 23, 'g' FROM ingredients WHERE name->>'en' = 'Beans' UNION ALL
SELECT id, 116, 9, 0.4, 20, 'g' FROM ingredients WHERE name->>'en' = 'Lentils' UNION ALL
SELECT id, 98, 11, 5, 3.3, 'g' FROM ingredients WHERE name->>'en' = 'Cottage Cheese' UNION ALL

SELECT id, 130, 2.7, 0.3, 28, 'g' FROM ingredients WHERE name->>'en' = 'Rice' UNION ALL
SELECT id, 131, 5, 1.1, 25, 'g' FROM ingredients WHERE name->>'en' = 'Pasta' UNION ALL
SELECT id, 265, 9, 3.3, 49, 'g' FROM ingredients WHERE name->>'en' = 'Bread' UNION ALL
SELECT id, 389, 17, 7, 66, 'g' FROM ingredients WHERE name->>'en' = 'Oats' UNION ALL
SELECT id, 120, 4.4, 0.9, 21, 'g' FROM ingredients WHERE name->>'en' = 'Quinoa' UNION ALL
SELECT id, 77, 2, 0.1, 17, 'g' FROM ingredients WHERE name->>'en' = 'Potato' UNION ALL
SELECT id, 86, 1.6, 0.1, 20, 'g' FROM ingredients WHERE name->>'en' = 'Sweet Potato' UNION ALL
SELECT id, 364, 13, 1.7, 71, 'g' FROM ingredients WHERE name->>'en' = 'Wheat' UNION ALL

SELECT id, 34, 2.8, 0.4, 7, 'g' FROM ingredients WHERE name->>'en' = 'Broccoli' UNION ALL
SELECT id, 23, 2.7, 0.4, 3.6, 'g' FROM ingredients WHERE name->>'en' = 'Spinach' UNION ALL
SELECT id, 41, 0.9, 0.2, 10, 'g' FROM ingredients WHERE name->>'en' = 'Carrots' UNION ALL
SELECT id, 18, 0.9, 0.2, 3.9, 'g' FROM ingredients WHERE name->>'en' = 'Tomato' UNION ALL
SELECT id, 15, 1.4, 0.2, 2.9, 'g' FROM ingredients WHERE name->>'en' = 'Lettuce' UNION ALL
SELECT id, 31, 1, 0.3, 5.5, 'g' FROM ingredients WHERE name->>'en' = 'Bell Pepper' UNION ALL
SELECT id, 16, 0.7, 0.1, 3.6, 'g' FROM ingredients WHERE name->>'en' = 'Cucumber' UNION ALL
SELECT id, 21, 1.5, 0.4, 3.5, 'g' FROM ingredients WHERE name->>'en' = 'Zucchini' UNION ALL
SELECT id, 22, 3.1, 0.3, 3.3, 'g' FROM ingredients WHERE name->>'en' = 'Mushroom' UNION ALL
SELECT id, 40, 1.1, 0.1, 9, 'g' FROM ingredients WHERE name->>'en' = 'Onion' UNION ALL
SELECT id, 149, 6.6, 0.5, 33, 'g' FROM ingredients WHERE name->>'en' = 'Garlic' UNION ALL
SELECT id, 49, 3.3, 0.9, 9, 'g' FROM ingredients WHERE name->>'en' = 'Kale' UNION ALL

SELECT id, 52, 0.3, 0.4, 14, 'g' FROM ingredients WHERE name->>'en' = 'Apple' UNION ALL
SELECT id, 89, 1.1, 0.3, 23, 'g' FROM ingredients WHERE name->>'en' = 'Banana' UNION ALL
SELECT id, 160, 2, 15, 9, 'g' FROM ingredients WHERE name->>'en' = 'Avocado' UNION ALL
SELECT id, 57, 0.7, 0.3, 14, 'g' FROM ingredients WHERE name->>'en' = 'Blueberries' UNION ALL
SELECT id, 32, 0.7, 0.3, 7.7, 'g' FROM ingredients WHERE name->>'en' = 'Strawberries' UNION ALL
SELECT id, 47, 0.9, 0.3, 12, 'g' FROM ingredients WHERE name->>'en' = 'Orange' UNION ALL
SELECT id, 67, 0.6, 0.2, 17, 'g' FROM ingredients WHERE name->>'en' = 'Grapes' UNION ALL
SELECT id, 30, 0.6, 0.2, 7.6, 'g' FROM ingredients WHERE name->>'en' = 'Watermelon' UNION ALL
SELECT id, 60, 0.8, 0.4, 15, 'g' FROM ingredients WHERE name->>'en' = 'Mango' UNION ALL

SELECT id, 61, 3.2, 3.3, 4.8, 'ml' FROM ingredients WHERE name->>'en' = 'Milk' UNION ALL
SELECT id, 59, 3.5, 0.4, 4.7, 'ml' FROM ingredients WHERE name->>'en' = 'Yogurt' UNION ALL
SELECT id, 403, 25, 33, 1.3, 'g' FROM ingredients WHERE name->>'en' = 'Cheddar Cheese' UNION ALL
SELECT id, 280, 28, 17, 3.1, 'g' FROM ingredients WHERE name->>'en' = 'Mozzarella' UNION ALL
SELECT id, 717, 0.9, 81, 0, 'g' FROM ingredients WHERE name->>'en' = 'Butter' UNION ALL
SELECT id, 884, 0, 100, 0, 'ml' FROM ingredients WHERE name->>'en' = 'Olive Oil' UNION ALL
SELECT id, 892, 0, 99, 0, 'ml' FROM ingredients WHERE name->>'en' = 'Coconut Oil' UNION ALL

SELECT id, 579, 25, 51, 0, 'g' FROM ingredients WHERE name->>'en' = 'Almonds' UNION ALL
SELECT id, 654, 15, 65, 14, 'g' FROM ingredients WHERE name->>'en' = 'Walnuts' UNION ALL
SELECT id, 588, 25, 50, 20, 'g' FROM ingredients WHERE name->>'en' = 'Peanut Butter' UNION ALL
SELECT id, 486, 16, 30, 42, 'g' FROM ingredients WHERE name->>'en' = 'Chia Seeds' UNION ALL
SELECT id, 534, 18, 42, 29, 'g' FROM ingredients WHERE name->>'en' = 'Flax Seeds' UNION ALL

SELECT id, 0, 0, 0, 0, 'g' FROM ingredients WHERE name->>'en' = 'Salt' UNION ALL
SELECT id, 251, 10, 3.3, 64, 'g' FROM ingredients WHERE name->>'en' = 'Black Pepper' UNION ALL
SELECT id, 331, 13, 5, 66, 'g' FROM ingredients WHERE name->>'en' = 'Garlic Powder' UNION ALL
SELECT id, 282, 10, 12, 53, 'g' FROM ingredients WHERE name->>'en' = 'Paprika' UNION ALL
SELECT id, 247, 3.1, 0.3, 81, 'g' FROM ingredients WHERE name->>'en' = 'Cinnamon' UNION ALL
SELECT id, 304, 0.3, 0, 82, 'g' FROM ingredients WHERE name->>'en' = 'Honey' UNION ALL
SELECT id, 61, 8, 1, 5.7, 'ml' FROM ingredients WHERE name->>'en' = 'Soy Sauce' UNION ALL
SELECT id, 18, 0.4, 0.04, 0.9, 'ml' FROM ingredients WHERE name->>'en' = 'Vinegar'
ON CONFLICT (ingredient_id) DO NOTHING;

-- ============================================
-- INGREDIENT UNIT CONVERSIONS (portion → grams)
-- ============================================
-- Garlic, Eggs, Bread, Butter, Oils, Honey, Nuts, Vegetables, Fruits
INSERT INTO ingredient_unit_conversions (ingredient_id, unit, grams)
SELECT id, 'clove', 3 FROM ingredients WHERE name->>'en' = 'Garlic' UNION ALL
SELECT id, 'tbsp', 9 FROM ingredients WHERE name->>'en' = 'Garlic' UNION ALL

SELECT id, 'pcs', 50 FROM ingredients WHERE name->>'en' = 'Eggs' UNION ALL
SELECT id, 'slice', 30 FROM ingredients WHERE name->>'en' = 'Bread' UNION ALL
SELECT id, 'tbsp', 15 FROM ingredients WHERE name->>'en' = 'Butter' UNION ALL
SELECT id, 'tbsp', 15 FROM ingredients WHERE name->>'en' = 'Olive Oil' UNION ALL
SELECT id, 'tsp', 5 FROM ingredients WHERE name->>'en' = 'Olive Oil' UNION ALL
SELECT id, 'tbsp', 20 FROM ingredients WHERE name->>'en' = 'Honey' UNION ALL
SELECT id, 'tsp', 7 FROM ingredients WHERE name->>'en' = 'Honey' UNION ALL
SELECT id, 'tbsp', 16 FROM ingredients WHERE name->>'en' = 'Peanut Butter' UNION ALL
SELECT id, 'tbsp', 9 FROM ingredients WHERE name->>'en' = 'Almonds' UNION ALL
SELECT id, 'tbsp', 7 FROM ingredients WHERE name->>'en' = 'Walnuts' UNION ALL
SELECT id, 'tbsp', 10 FROM ingredients WHERE name->>'en' = 'Onion' UNION ALL
SELECT id, 'pcs', 182 FROM ingredients WHERE name->>'en' = 'Apple' UNION ALL
SELECT id, 'pcs', 118 FROM ingredients WHERE name->>'en' = 'Banana' UNION ALL
SELECT id, 'pcs', 150 FROM ingredients WHERE name->>'en' = 'Avocado' UNION ALL
SELECT id, 'pcs', 123 FROM ingredients WHERE name->>'en' = 'Tomato' UNION ALL
SELECT id, 'pcs', 149 FROM ingredients WHERE name->>'en' = 'Bell Pepper' UNION ALL
SELECT id, 'pcs', 301 FROM ingredients WHERE name->>'en' = 'Cucumber' UNION ALL
SELECT id, 'pcs', 61 FROM ingredients WHERE name->>'en' = 'Carrots' UNION ALL
SELECT id, 'pcs', 173 FROM ingredients WHERE name->>'en' = 'Potato'
ON CONFLICT (ingredient_id, unit) DO NOTHING;

-- ============================================
-- INGREDIENT PORTIONS (named portions with weights)
-- ============================================
-- All ingredient portions
INSERT INTO ingredient_portions (ingredient_id, name, weight_in_grams)
SELECT id, '1 medium fillet', 175 FROM ingredients WHERE name->>'en' = 'Chicken Breast' UNION ALL
SELECT id, '1 large fillet', 225 FROM ingredients WHERE name->>'en' = 'Chicken Breast' UNION ALL
SELECT id, '1 fillet', 180 FROM ingredients WHERE name->>'en' = 'Salmon' UNION ALL
SELECT id, '100g fillet', 100 FROM ingredients WHERE name->>'en' = 'Salmon' UNION ALL
SELECT id, '1 large egg', 50 FROM ingredients WHERE name->>'en' = 'Eggs' UNION ALL
SELECT id, '1 egg white', 33 FROM ingredients WHERE name->>'en' = 'Eggs' UNION ALL
SELECT id, '1 egg yolk', 17 FROM ingredients WHERE name->>'en' = 'Eggs' UNION ALL
SELECT id, '1 medium avocado', 150 FROM ingredients WHERE name->>'en' = 'Avocado' UNION ALL
SELECT id, '1/2 avocado', 75 FROM ingredients WHERE name->>'en' = 'Avocado' UNION ALL
SELECT id, '1 medium apple', 182 FROM ingredients WHERE name->>'en' = 'Apple' UNION ALL
SELECT id, '1 small apple', 149 FROM ingredients WHERE name->>'en' = 'Apple' UNION ALL
SELECT id, '1 medium banana', 118 FROM ingredients WHERE name->>'en' = 'Banana' UNION ALL
SELECT id, '1 large banana', 136 FROM ingredients WHERE name->>'en' = 'Banana' UNION ALL
SELECT id, '1 medium tomato', 123 FROM ingredients WHERE name->>'en' = 'Tomato' UNION ALL
SELECT id, '1 large tomato', 182 FROM ingredients WHERE name->>'en' = 'Tomato' UNION ALL
SELECT id, '1 medium pepper', 149 FROM ingredients WHERE name->>'en' = 'Bell Pepper' UNION ALL
SELECT id, '1 whole cucumber', 301 FROM ingredients WHERE name->>'en' = 'Cucumber' UNION ALL
SELECT id, '1 cup sliced', 104 FROM ingredients WHERE name->>'en' = 'Cucumber' UNION ALL
SELECT id, '1 medium carrot', 61 FROM ingredients WHERE name->>'en' = 'Carrots' UNION ALL
SELECT id, '1 cup chopped', 128 FROM ingredients WHERE name->>'en' = 'Carrots' UNION ALL
SELECT id, '1 medium potato', 173 FROM ingredients WHERE name->>'en' = 'Potato' UNION ALL
SELECT id, '1 large potato', 299 FROM ingredients WHERE name->>'en' = 'Potato' UNION ALL
SELECT id, '1 cup chopped', 91 FROM ingredients WHERE name->>'en' = 'Broccoli' UNION ALL
SELECT id, '1 head', 588 FROM ingredients WHERE name->>'en' = 'Broccoli' UNION ALL
SELECT id, '1 cup raw', 30 FROM ingredients WHERE name->>'en' = 'Spinach' UNION ALL
SELECT id, '1 cup cooked', 180 FROM ingredients WHERE name->>'en' = 'Spinach' UNION ALL
SELECT id, '23 almonds', 23 FROM ingredients WHERE name->>'en' = 'Almonds' UNION ALL
SELECT id, '1 ounce (oz)', 28 FROM ingredients WHERE name->>'en' = 'Almonds' UNION ALL
SELECT id, '14 halves', 28 FROM ingredients WHERE name->>'en' = 'Walnuts' UNION ALL
SELECT id, '2 tbsp', 32 FROM ingredients WHERE name->>'en' = 'Peanut Butter' UNION ALL
SELECT id, '1 cup cooked', 195 FROM ingredients WHERE name->>'en' = 'Rice' UNION ALL
SELECT id, '1 cup cooked', 220 FROM ingredients WHERE name->>'en' = 'Pasta' UNION ALL
SELECT id, '1 slice', 30 FROM ingredients WHERE name->>'en' = 'Bread' UNION ALL
SELECT id, '1 cup cooked', 234 FROM ingredients WHERE name->>'en' = 'Oats' UNION ALL
SELECT id, '1/2 cup dry', 40 FROM ingredients WHERE name->>'en' = 'Oats'
ON CONFLICT (ingredient_id, name) DO NOTHING;

COMMENT ON SCHEMA public IS 'Seed data loaded successfully';
