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
  ('venison',           'Venison',           'Hirvenliha',         'Оленина')

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
) AS v(code, name)
ON CONFLICT (code) DO NOTHING;

-- Additional ingredients (further enrichment)
INSERT INTO ingredients (code, name)
SELECT v.code,
  jsonb_build_object('en', v.name)
FROM (VALUES
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
) AS v(code, name)
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
