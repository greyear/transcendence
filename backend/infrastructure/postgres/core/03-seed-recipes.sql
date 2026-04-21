-- ============================================
-- 20 SAMPLE RECIPES SEED
-- ============================================
-- Run: psql -h localhost -p 5433 -U core_user -d core_db -f 03-seed-recipes.sql

-- Ensure author user exists
INSERT INTO users (id, username, role, status)
VALUES (1, 'demo_chef', 'user', 'offline')
ON CONFLICT (id) DO NOTHING;

WITH seeded_recipes(title, description, instructions, servings, spiciness, status) AS (
VALUES

-- 1
(
  'Spaghetti Carbonara',
  'A classic Roman pasta dish with eggs, cheese, pancetta, and black pepper.',
  ARRAY[
    'Boil salted water and cook spaghetti until al dente',
    'Fry pancetta in a pan over medium heat until crispy',
    'Whisk eggs with grated Parmesan and season with black pepper',
    'Reserve 1 cup of pasta water before draining',
    'Remove pan from heat, add drained pasta to pancetta',
    'Pour egg mixture over pasta, tossing quickly and adding pasta water to create a creamy sauce',
    'Serve immediately with extra Parmesan and black pepper'
  ],
  2, 1, 'published'
),

-- 2
(
  'Chicken Tikka Masala',
  'Tender chicken in a rich, spiced tomato-cream sauce — a crowd-pleasing Indian classic.',
  ARRAY[
    'Marinate chicken pieces in yogurt, garlic, ginger, cumin, and turmeric for at least 1 hour',
    'Grill or broil chicken until slightly charred, set aside',
    'Sauté onions in oil until golden, add garlic, ginger, and spices',
    'Add tomato purée and cook for 10 minutes',
    'Stir in cream and simmer for 5 minutes',
    'Add grilled chicken and simmer for another 10 minutes',
    'Garnish with fresh cilantro and serve with basmati rice or naan'
  ],
  4, 2, 'published'
),

-- 3
(
  'Avocado Toast with Poached Egg',
  'Simple, nutritious breakfast ready in under 15 minutes.',
  ARRAY[
    'Toast sourdough bread until golden and crispy',
    'Mash avocado with lemon juice, salt, and red pepper flakes',
    'Bring a pot of water to a gentle simmer, add a splash of vinegar',
    'Crack egg into a small cup, swirl the water, and slide egg in',
    'Poach for 3 minutes until whites are set but yolk is runny',
    'Spread avocado on toast, top with poached egg',
    'Season with salt, pepper, and chilli flakes'
  ],
  1, 0, 'published'
),

-- 4
(
  'Classic Caesar Salad',
  'Crisp romaine lettuce with homemade Caesar dressing, croutons, and shaved Parmesan.',
  ARRAY[
    'Make dressing: whisk garlic, anchovy paste, lemon juice, Worcestershire sauce, mustard, and mayonnaise',
    'Stir in grated Parmesan and thin with olive oil',
    'Toss bread cubes in olive oil and garlic, bake at 180°C until golden',
    'Chop romaine lettuce and place in a large bowl',
    'Toss with dressing until well coated',
    'Top with croutons and shaved Parmesan',
    'Serve immediately'
  ],
  4, 0, 'published'
),

-- 5
(
  'Beef Tacos',
  'Quick and flavourful ground beef tacos with fresh toppings.',
  ARRAY[
    'Brown ground beef in a skillet over medium-high heat, drain fat',
    'Add taco seasoning (cumin, chili powder, garlic powder, paprika) and a splash of water',
    'Simmer for 5 minutes until sauce thickens',
    'Warm corn tortillas in a dry pan or directly over gas flame',
    'Fill tortillas with seasoned beef',
    'Top with shredded cheese, diced tomato, lettuce, sour cream, and salsa',
    'Serve with lime wedges'
  ],
  4, 2, 'published'
),

-- 6
(
  'Mushroom Risotto',
  'Creamy Italian rice dish with earthy mushrooms and white wine.',
  ARRAY[
    'Warm chicken or vegetable stock in a separate saucepan',
    'Sauté shallots in butter until translucent',
    'Add Arborio rice and toast for 2 minutes',
    'Pour in white wine and stir until absorbed',
    'Add warm stock one ladle at a time, stirring constantly',
    'Stir in sliced mushrooms after the first few ladles of stock',
    'Continue adding stock for 18–20 minutes until rice is al dente',
    'Finish with butter and Parmesan, season with salt and pepper'
  ],
  4, 0, 'published'
),

-- 7
(
  'Greek Salad',
  'A refreshing Mediterranean salad with cucumber, tomatoes, olives, and feta.',
  ARRAY[
    'Chop cucumber, tomatoes, and red onion into bite-sized pieces',
    'Halve Kalamata olives',
    'Combine vegetables and olives in a large bowl',
    'Drizzle with olive oil and red wine vinegar',
    'Season with salt, oregano, and black pepper',
    'Top with a block or crumbled feta cheese',
    'Toss gently and serve'
  ],
  4, 0, 'published'
),

-- 8
(
  'Banana Oat Pancakes',
  'Healthy two-ingredient pancakes — no flour, no sugar.',
  ARRAY[
    'Mash 2 ripe bananas in a bowl until smooth',
    'Mix in 1 cup of rolled oats and 2 eggs',
    'Let batter rest for 5 minutes',
    'Heat a non-stick pan over medium heat with a little coconut oil',
    'Spoon batter into small rounds and cook 2–3 minutes per side',
    'Serve with fresh berries and a drizzle of honey'
  ],
  2, 0, 'published'
),

-- 9
(
  'Tom Yum Soup',
  'Spicy and sour Thai soup with shrimp, lemongrass, and mushrooms.',
  ARRAY[
    'Bring chicken stock to a boil',
    'Add lemongrass stalks, galangal slices, and kaffir lime leaves',
    'Add mushrooms and simmer for 5 minutes',
    'Add shrimp and cook until pink',
    'Season with fish sauce, lime juice, and Thai chili paste (nam prik pao)',
    'Add fresh Thai chillies to taste',
    'Remove lemongrass and galangal before serving',
    'Garnish with fresh coriander and serve hot'
  ],
  2, 3, 'published'
),

-- 10
(
  'Margherita Pizza',
  'Simple Neapolitan pizza with tomato sauce, fresh mozzarella, and basil.',
  ARRAY[
    'Mix flour, yeast, salt, and water to form dough; knead for 10 minutes',
    'Let dough rise covered for 1 hour',
    'Preheat oven to its maximum temperature (ideally 250°C+)',
    'Stretch dough into a thin round on a floured surface',
    'Spread a thin layer of tomato passata',
    'Add torn fresh mozzarella',
    'Bake for 8–10 minutes until crust is charred and cheese is bubbling',
    'Top with fresh basil leaves and a drizzle of olive oil'
  ],
  2, 0, 'published'
),

-- 11
(
  'Shakshuka',
  'Eggs poached in a spiced tomato and pepper sauce — a Middle Eastern breakfast staple.',
  ARRAY[
    'Sauté diced onion and bell pepper in olive oil until softened',
    'Add garlic, cumin, paprika, and chilli flakes; cook 1 minute',
    'Add crushed tomatoes and season with salt and pepper',
    'Simmer sauce for 10 minutes',
    'Make wells in the sauce and crack eggs into each well',
    'Cover and cook on low heat until egg whites are set but yolks are runny (about 8 minutes)',
    'Garnish with feta, fresh parsley, and serve with crusty bread'
  ],
  2, 2, 'published'
),

-- 12
(
  'Grilled Salmon with Lemon Butter',
  'Simple pan-grilled salmon fillet finished with a bright lemon butter sauce.',
  ARRAY[
    'Pat salmon fillets dry and season generously with salt and pepper',
    'Heat olive oil in a skillet over high heat until shimmering',
    'Place salmon skin-side down and cook without moving for 4 minutes',
    'Flip and cook for another 2–3 minutes',
    'Reduce heat, add butter, garlic, and lemon zest to the pan',
    'Baste salmon with the melted butter for 1 minute',
    'Serve immediately with steamed vegetables and lemon wedges'
  ],
  2, 0, 'published'
),

-- 13
(
  'Vegetable Stir-fry with Tofu',
  'Quick and colourful high-protein vegan stir-fry with a savoury sauce.',
  ARRAY[
    'Press tofu for 30 minutes to remove excess moisture, then cube it',
    'Fry tofu in a hot wok with oil until golden on all sides; set aside',
    'Stir-fry broccoli, bell pepper, carrots, and snap peas for 3–4 minutes',
    'Add garlic and ginger and cook for 30 seconds',
    'Mix soy sauce, sesame oil, rice vinegar, and cornstarch into a sauce',
    'Return tofu to the wok and pour sauce over everything',
    'Toss until sauce thickens, serve over steamed rice'
  ],
  3, 1, 'published'
),

-- 14
(
  'French Onion Soup',
  'Rich, deeply caramelised onion soup topped with a gruyère crouton.',
  ARRAY[
    'Slice 6 large onions thinly',
    'Cook onions in butter over low heat, stirring occasionally, for 45–60 minutes until deeply caramelised',
    'Add garlic and thyme, cook 2 minutes',
    'Deglaze with white wine or brandy',
    'Add beef stock and simmer for 20 minutes; season with salt and pepper',
    'Ladle soup into oven-safe bowls',
    'Top with a toasted baguette slice and a thick layer of grated gruyère',
    'Broil until cheese is bubbly and golden'
  ],
  4, 0, 'published'
),

-- 15
(
  'Mango Smoothie Bowl',
  'Thick tropical smoothie bowl topped with fresh fruit and granola.',
  ARRAY[
    'Blend frozen mango chunks with a small amount of coconut milk until thick and smooth',
    'Pour into a bowl — the mixture should be thick enough to hold toppings',
    'Arrange fresh mango slices, banana coins, and blueberries on top',
    'Add a handful of granola',
    'Drizzle with honey and sprinkle with chia seeds',
    'Serve immediately'
  ],
  1, 0, 'published'
),

-- 16
(
  'Borscht',
  'Traditional Eastern European beet soup, hearty and vibrant red.',
  ARRAY[
    'Sauté diced onion, carrots, and celery in oil until softened',
    'Add grated or julienned beets and cook for 5 minutes',
    'Add diced potatoes, shredded cabbage, and beef or vegetable stock',
    'Bring to a boil, then simmer for 25–30 minutes until vegetables are tender',
    'Stir in tomato paste, vinegar, salt, and sugar to balance the flavour',
    'Adjust seasoning and simmer another 5 minutes',
    'Serve with a dollop of sour cream and fresh dill'
  ],
  6, 0, 'published'
),

-- 17
(
  'Butter Chicken',
  'Mild and creamy Indian curry that is a favourite worldwide.',
  ARRAY[
    'Marinate chicken in yogurt, lemon juice, turmeric, chili, and garam masala overnight',
    'Grill or roast marinated chicken at 220°C until cooked through',
    'Sauté onions in butter until soft, add ginger-garlic paste and cook 2 minutes',
    'Add tomato purée and spices (cumin, coriander, kashmiri chili) and cook for 15 minutes',
    'Blend the sauce until smooth, return to pan',
    'Stir in cream and honey, simmer 5 minutes',
    'Add grilled chicken and simmer for 10 more minutes',
    'Finish with a knob of butter, garnish with cream and coriander'
  ],
  4, 1, 'published'
),

-- 18
(
  'Lentil Soup',
  'Nourishing, budget-friendly soup with red lentils and warming spices.',
  ARRAY[
    'Sauté diced onion and garlic in olive oil until golden',
    'Add ground cumin, coriander, turmeric, and smoked paprika; toast for 1 minute',
    'Add rinsed red lentils, diced tomatoes, and vegetable stock',
    'Bring to a boil, then simmer for 25 minutes until lentils are very soft',
    'Blend half the soup for a creamier texture, or leave chunky',
    'Season with salt, pepper, and lemon juice',
    'Drizzle with olive oil and serve with warm bread'
  ],
  6, 1, 'published'
),

-- 19
(
  'Chocolate Lava Cakes',
  'Decadent individual chocolate cakes with a warm, molten centre.',
  ARRAY[
    'Preheat oven to 220°C and grease ramekins with butter and cocoa powder',
    'Melt dark chocolate and butter together over a double boiler',
    'Whisk eggs, egg yolks, and sugar until pale and thick',
    'Fold chocolate mixture into the egg mixture',
    'Sift in flour and fold gently until just combined',
    'Divide batter between ramekins and refrigerate for at least 30 minutes',
    'Bake for exactly 12 minutes — edges should be set but centre should jiggle',
    'Run a knife around the edge, invert onto plates, and serve immediately with vanilla ice cream'
  ],
  4, 0, 'published'
),

-- 20
(
  'Overnight Oats',
  'Effortless make-ahead breakfast — prepare the night before, eat straight from the fridge.',
  ARRAY[
    'Combine rolled oats, milk (dairy or plant-based), and chia seeds in a jar',
    'Stir in Greek yogurt for extra creaminess and protein',
    'Sweeten with honey or maple syrup to taste',
    'Seal jar and refrigerate overnight (at least 6 hours)',
    'In the morning, stir and add a splash more milk if too thick',
    'Top with fresh berries, banana slices, and a handful of granola',
    'Enjoy cold or gently warm in the microwave'
  ],
  1, 0, 'published'
)
),
available_authors AS (
  SELECT id
  FROM users
  ORDER BY id
  LIMIT 20
),
seeded_recipes_ranked AS (
  SELECT
    sr.title,
    sr.description,
    sr.instructions,
    sr.servings,
    sr.spiciness,
    sr.status,
    row_number() OVER (ORDER BY sr.title) AS rn
  FROM seeded_recipes sr
),
localized_recipe_texts AS (
  SELECT
    v.title_en,
    v.title_fi,
    v.title_ru,
    v.description_fi,
    v.description_ru
  FROM (VALUES
    ('Spaghetti Carbonara', 'Spagetti Carbonara', 'Спагетти карбонара', 'Klassinen roomalainen pasta-annos kananmunalla, juustolla, pancettalla ja mustapippurilla.', 'Классическое римское блюдо из пасты с яйцами, сыром, панчеттой и чёрным перцем.'),
    ('Chicken Tikka Masala', 'Kana Tikka Masala', 'Курица тикка масала', 'Mureaa kanaa täyteläisessä mausteisessa tomaatti-kermakastikkeessa — suosittu intialainen klassikko.', 'Нежная курица в насыщенном пряном томатно-сливочном соусе — популярная индийская классика.'),
    ('Avocado Toast with Poached Egg', 'Avokadoleipä uppomunalla', 'Тост с авокадо и яйцом пашот', 'Yksinkertainen ja ravitseva aamiainen, joka valmistuu alle 15 minuutissa.', 'Простой и питательный завтрак, который готовится менее чем за 15 минут.'),
    ('Classic Caesar Salad', 'Klassinen Caesar-salaatti', 'Классический салат Цезарь', 'Rapeaa roomansalaattia kotitekoisella Caesar-kastikkeella, krutongeilla ja parmesaanilla.', 'Хрустящий ромэн с домашней заправкой Цезарь, крутонами и стружкой пармезана.'),
    ('Beef Tacos', 'Naudanlihatacot', 'Тако с говядиной', 'Nopeat ja maukkaat jauhelihatacot tuoreilla lisukkeilla.', 'Быстрые и ароматные тако с говяжьим фаршем и свежими топпингами.'),
    ('Mushroom Risotto', 'Sienirisotto', 'Грибное ризотто', 'Kermainen italialainen riisiruoka metsäsienillä ja valkoviinillä.', 'Кремовое итальянское ризотто с ароматными грибами и белым вином.'),
    ('Greek Salad', 'Kreikkalainen salaatti', 'Греческий салат', 'Raikas välimerellinen salaatti kurkulla, tomaatilla, oliiveilla ja fetalla.', 'Освежающий средиземноморский салат с огурцом, томатами, оливками и фетой.'),
    ('Banana Oat Pancakes', 'Banaani-kaurapannukakut', 'Бананово-овсяные панкейки', 'Terveelliset pannukakut kahdesta pääainesosasta ilman vehnäjauhoja ja lisättyä sokeria.', 'Полезные панкейки из двух основных ингредиентов без муки и добавленного сахара.'),
    ('Tom Yum Soup', 'Tom Yum -keitto', 'Суп Том Ям', 'Tulinen ja hapan thaikeitto katkaravuilla, sitruunaruoholla ja sienillä.', 'Острый и кислый тайский суп с креветками, лемонграссом и грибами.'),
    ('Margherita Pizza', 'Pizza Margherita', 'Пицца Маргарита', 'Yksinkertainen napolilainen pizza tomaattikastikkeella, tuoreella mozzarellalla ja basilikalla.', 'Классическая неаполитанская пицца с томатным соусом, свежей моцареллой и базиликом.'),
    ('Shakshuka', 'Shakshuka', 'Шакшука', 'Munia mausteisessa tomaatti-paprikakastikkeessa — Lähi-idän aamiaisklassikko.', 'Яйца в пряном томатно-перечном соусе — классический ближневосточный завтрак.'),
    ('Grilled Salmon with Lemon Butter', 'Grillattu lohi sitruunavoilla', 'Лосось на гриле с лимонным маслом', 'Helppo pannulla paistettu lohifilee kirkkaalla sitruuna-voikastikkeella.', 'Простой лосось, обжаренный на сковороде, с ярким лимонно-сливочным соусом.'),
    ('Vegetable Stir-fry with Tofu', 'Kasviswokki tofulla', 'Овощной стир-фрай с тофу', 'Nopea ja värikäs proteiinipitoinen vegaaninen wokki suolaisella kastikkeella.', 'Быстрый и яркий веганский стир-фрай с тофу и насыщенным соусом.'),
    ('French Onion Soup', 'Ranskalainen sipulikeitto', 'Французский луковый суп', 'Täyteläinen karamellisoitu sipulikeitto, päällä gruyère-juustolla kuorrutettu leipä.', 'Насыщенный суп из карамелизованного лука с гренкой под расплавленным сыром грюйер.'),
    ('Mango Smoothie Bowl', 'Mangoinen smoothie-kulho', 'Смузи-боул с манго', 'Paksu trooppinen smoothie-kulho tuoreilla hedelmillä ja granolalla.', 'Густой тропический смузи-боул со свежими фруктами и гранолой.'),
    ('Borscht', 'Borssikeitto', 'Борщ', 'Perinteinen itäeurooppalainen punajuurikeitto, täyteläinen ja syvän punainen.', 'Традиционный восточноевропейский борщ — сытный и насыщенного красного цвета.'),
    ('Butter Chicken', 'Voikana', 'Баттер чикен', 'Mieto ja kermainen intialainen curry, josta on tullut maailmanlaajuinen suosikki.', 'Нежный сливочный индийский карри, ставший любимым блюдом во всём мире.'),
    ('Lentil Soup', 'Linssikeitto', 'Чечевичный суп', 'Ravitseva ja edullinen keitto punaisilla linsseillä ja lämpimillä mausteilla.', 'Питательный и доступный суп из красной чечевицы с согревающими специями.'),
    ('Chocolate Lava Cakes', 'Suklaa-laavakakut', 'Шоколадные лавакейки', 'Ylelliset annoskakut, joiden keskellä on lämmin valuva suklaasydän.', 'Насыщенные порционные кексы с тёплой жидкой шоколадной серединой.'),
    ('Overnight Oats', 'Yön yli -kaurapuuro', 'Овсянка на ночь', 'Vaivaton ennakkoon tehtävä aamiainen — valmista illalla, nauti suoraan jääkaapista.', 'Простой завтрак на ночь: приготовьте вечером и ешьте утром прямо из холодильника.')
  ) AS v(title_en, title_fi, title_ru, description_fi, description_ru)
),
localized_recipe_steps AS (
  SELECT
    v.title_en,
    v.instructions_fi,
    v.instructions_ru
  FROM (VALUES
    ('Spaghetti Carbonara', ARRAY['Keitä pasta suolatussa vedessä al denteksi','Paista pancetta rapeaksi keskilämmöllä','Vatkaa munat ja juustoraaste mustapippurin kanssa','Sekoita kuuma pasta pannulla, lisää munaseos ja hieman pastavettä kermaiseksi kastikkeeksi','Tarjoile heti juuston ja mustapippurin kanssa'], ARRAY['Сварите пасту в подсоленной воде до состояния al dente','Обжарьте панчетту до хруста на среднем огне','Взбейте яйца с тёртым сыром и чёрным перцем','Смешайте горячую пасту с панчеттой, добавьте яичную смесь и немного воды от пасты','Подавайте сразу с сыром и свежемолотым перцем']),
    ('Chicken Tikka Masala', ARRAY['Marinoi kana jogurtissa, valkosipulissa ja mausteissa vähintään tunnin','Kypsennä kana grillissä tai uunissa kevyesti ruskistaen','Kuullota sipuli, lisää valkosipuli, inkivääri ja mausteet','Lisää tomaattisose ja kypsennä kastiketta','Sekoita kerma joukkoon, lisää kana ja hauduta valmiiksi'], ARRAY['Замаринуйте курицу в йогурте, чесноке и специях минимум на час','Запеките или обжарьте курицу до лёгкой корочки','Обжарьте лук, добавьте чеснок, имбирь и специи','Добавьте томатное пюре и проварите соус','Влейте сливки, добавьте курицу и доведите до готовности']),
    ('Avocado Toast with Poached Egg', ARRAY['Paahda leipä kullanruskeaksi','Muussaa avokado sitruunamehun, suolan ja chilihiutaleiden kanssa','Valmista uppomuna hiljalleen poreilevassa vedessä','Levitä avokado paahtoleivälle ja nosta muna päälle','Mausta pippurilla ja tarjoile heti'], ARRAY['Поджарьте хлеб до золотистой корочки','Разомните авокадо с лимонным соком, солью и чили','Приготовьте яйцо пашот в едва кипящей воде','Намажьте авокадо на тост и выложите сверху яйцо','Приправьте перцем и сразу подавайте']),
    ('Classic Caesar Salad', ARRAY['Vatkaa kastike valkosipulista, sitruunasta, sinapista ja majoneesista','Lisää parmesaani ja oliiviöljy kastikkeeseen','Paahda leipäkuutiot krutongeiksi','Sekoita roomansalaatti kastikkeen kanssa','Viimeistele krutongeilla ja juustolla'], ARRAY['Смешайте соус из чеснока, лимона, горчицы и майонеза','Добавьте в заправку пармезан и оливковое масло','Поджарьте хлебные кубики до состояния крутонов','Перемешайте ромэн с заправкой','Добавьте крутоны и сыр перед подачей']),
    ('Beef Tacos', ARRAY['Ruskista jauheliha pannulla ja valuta ylimääräinen rasva','Lisää mausteseos ja tilkka vettä, hauduta hetki','Lämmitä tortillat kuivalla pannulla','Täytä tortillat lihalla ja tuoreilla lisukkeilla','Tarjoa limetin kanssa'], ARRAY['Обжарьте говяжий фарш и удалите лишний жир','Добавьте специи и немного воды, протушите','Разогрейте тортильи на сухой сковороде','Наполните тортильи мясом и свежими топпингами','Подавайте с дольками лайма']),
    ('Mushroom Risotto', ARRAY['Pidä liemi lämpimänä kattilassa','Kuullota sipuli voissa ja lisää riisi paahtumaan','Lisää viini ja anna imeytyä','Lisää lientä vähitellen jatkuvasti sekoittaen','Lisää sienet ja kypsennä riisi al denteksi, viimeistele voilla ja juustolla'], ARRAY['Держите бульон тёплым в отдельной кастрюле','Обжарьте лук в масле и добавьте рис','Влейте вино и дайте ему впитаться','Постепенно подливайте бульон, постоянно помешивая','Добавьте грибы, доведите рис до al dente и завершите маслом и сыром']),
    ('Greek Salad', ARRAY['Pilko kurkku, tomaatit ja punasipuli','Yhdistä kulhossa oliivien kanssa','Lorauta päälle oliiviöljyä ja etikkaa','Mausta suolalla, oreganolla ja pippurilla','Lisää feta ja tarjoile'], ARRAY['Нарежьте огурец, помидоры и красный лук','Смешайте овощи с оливками в миске','Добавьте оливковое масло и уксус','Приправьте солью, орегано и перцем','Добавьте фету и подавайте']),
    ('Banana Oat Pancakes', ARRAY['Muussaa banaanit sileäksi','Sekoita joukkoon kaurahiutaleet ja munat','Anna taikinan levätä muutama minuutti','Paista pieniä lettuja keskilämmöllä molemmin puolin','Tarjoa marjojen ja hunajan kanssa'], ARRAY['Разомните бананы до однородности','Добавьте овсяные хлопья и яйца','Дайте тесту постоять несколько минут','Жарьте небольшие оладьи на среднем огне с двух сторон','Подавайте с ягодами и мёдом']),
    ('Tom Yum Soup', ARRAY['Kiehauta liemi kattilassa','Lisää sitruunaruoho, galangal ja limetinlehdet','Lisää sienet ja hauduta hetki','Lisää katkaravut ja kypsennä juuri valmiiksi','Mausta kalakastikkeella, limetillä ja chilitahnalla'], ARRAY['Доведите бульон до кипения','Добавьте лемонграсс, галангал и листья лайма','Добавьте грибы и немного проварите','Положите креветки и готовьте до готовности','Приправьте рыбным соусом, лаймом и пастой чили']),
    ('Margherita Pizza', ARRAY['Vaivaa taikina jauhoista, vedestä, hiivasta ja suolasta','Anna taikinan kohota','Venytä taikina ohueksi pohjaksi','Levitä tomaattikastike ja lisää mozzarella','Paista kuumassa uunissa ja viimeistele basilikalla'], ARRAY['Замесите тесто из муки, воды, дрожжей и соли','Дайте тесту подняться','Растяните тесто в тонкую основу','Добавьте томатный соус и моцареллу','Выпекайте в очень горячей духовке и добавьте базилик']),
    ('Shakshuka', ARRAY['Kuullota sipuli ja paprika pehmeiksi','Lisää valkosipuli ja mausteet','Lisää tomaatit ja hauduta kastike','Tee kastikkeeseen kuopat ja riko munat niihin','Kypsennä kannen alla kunnes valkuaiset ovat hyytyneet'], ARRAY['Обжарьте лук и перец до мягкости','Добавьте чеснок и специи','Добавьте томаты и потушите соус','Сделайте углубления и разбейте туда яйца','Готовьте под крышкой до схватывания белков']),
    ('Grilled Salmon with Lemon Butter', ARRAY['Kuivaa lohifileet ja mausta ne','Kuumenna pannu ja paista lohi ensin nahkapuolelta','Käännä ja kypsennä loppuun','Lisää voi, valkosipuli ja sitruuna pannulle','Valele lohi voikastikkeella ja tarjoile'], ARRAY['Обсушите филе лосося и приправьте','Разогрейте сковороду и сначала обжарьте кожей вниз','Переверните и доведите до готовности','Добавьте в сковороду масло, чеснок и лимон','Полейте лосось соусом и подавайте']),
    ('Vegetable Stir-fry with Tofu', ARRAY['Purista tofu kuivaksi ja kuutioi se','Paista tofu kullanruskeaksi ja nosta sivuun','Wokkaa vihannekset nopeasti kuumalla pannulla','Lisää valkosipuli ja inkivääri','Palauta tofu pannulle, lisää kastike ja sekoita sakeaksi'], ARRAY['Отожмите тофу и нарежьте кубиками','Обжарьте тофу до золотистой корочки и отложите','Быстро обжарьте овощи в горячем воке','Добавьте чеснок и имбирь','Верните тофу, влейте соус и готовьте до загустения']),
    ('French Onion Soup', ARRAY['Viipaloi sipulit ohuiksi','Hauduta sipuleita voissa pitkään karamellisoiden','Lisää valkosipuli ja yrtit','Kaada joukkoon liemi ja keitä miedosti','Tarjoa kulhoissa paahdetun leivän ja juuston kanssa'], ARRAY['Тонко нарежьте лук','Долго томите лук в сливочном масле до карамелизации','Добавьте чеснок и травы','Влейте бульон и варите на слабом огне','Подавайте с гренкой и расплавленным сыром']),
    ('Mango Smoothie Bowl', ARRAY['Soseuta pakastettu mango pienen nestemäärän kanssa paksuksi','Kaada smoothie kulhoon','Lisää päälle tuoreita hedelmiä','Ripottele granolaa ja chia-siemeniä','Viimeistele hunajalla ja tarjoile heti'], ARRAY['Взбейте замороженное манго с небольшим количеством жидкости до густоты','Переложите смузи в миску','Добавьте сверху свежие фрукты','Посыпьте гранолой и семенами чиа','Полейте мёдом и сразу подавайте']),
    ('Borscht', ARRAY['Kuullota sipuli, porkkana ja selleri öljyssä','Lisää punajuuri ja kuullota hetki','Lisää peruna, kaali ja liemi','Hauduta kunnes kasvikset pehmenevät','Mausta tomaatilla, etikalla ja tarjoile tillin kanssa'], ARRAY['Обжарьте лук, морковь и сельдерей в масле','Добавьте свёклу и немного потушите','Добавьте картофель, капусту и бульон','Варите до мягкости овощей','Приправьте томатом и уксусом, подавайте с укропом']),
    ('Butter Chicken', ARRAY['Marinoi kana jogurtissa ja mausteissa yön yli','Paista tai grillaa kana kypsäksi','Kuullota sipuli voissa ja lisää inkivääri sekä valkosipuli','Lisää tomaattisose ja mausteet, kypsennä kastike','Soseuta kastike, lisää kerma ja kana, hauduta valmiiksi'], ARRAY['Замаринуйте курицу в йогурте и специях на ночь','Обжарьте или запеките курицу до готовности','Обжарьте лук в масле, добавьте имбирь и чеснок','Добавьте томатное пюре и специи, проварите соус','Пробейте соус блендером, добавьте сливки и курицу, доведите до готовности']),
    ('Lentil Soup', ARRAY['Kuullota sipuli ja valkosipuli oliiviöljyssä','Lisää mausteet ja paahda hetki','Lisää linssit, tomaatit ja liemi','Hauduta kunnes linssit pehmenevät','Soseuta osa keitosta ja mausta sitruunalla'], ARRAY['Обжарьте лук и чеснок в оливковом масле','Добавьте специи и прогрейте','Добавьте чечевицу, томаты и бульон','Варите до мягкости чечевицы','Часть супа пробейте блендером и приправьте лимоном']),
    ('Chocolate Lava Cakes', ARRAY['Esilämmitä uuni ja voitele annosvuoat','Sulata suklaa ja voi yhdessä','Vatkaa munat ja sokeri kuohkeaksi','Kääntele suklaaseos joukkoon, lisää jauhot varovasti','Paista hetki niin, että keskusta jää valuvaksi'], ARRAY['Разогрейте духовку и смажьте формочки','Растопите шоколад и масло','Взбейте яйца с сахаром до пышности','Аккуратно вмешайте шоколадную смесь и немного муки','Выпекайте недолго, чтобы середина осталась жидкой']),
    ('Overnight Oats', ARRAY['Sekoita purkissa kaurahiutaleet, maito ja chia-siemenet','Lisää jogurtti kermaisuutta varten','Makeuta hunajalla tai siirapilla','Sulje purkki ja anna tekeytyä jääkaapissa yön yli','Aamulla lisää halutessasi maitoa ja viimeistele marjoilla'], ARRAY['Смешайте в банке овсяные хлопья, молоко и семена чиа','Добавьте йогурт для кремовой текстуры','Подсластите мёдом или сиропом','Закройте банку и оставьте в холодильнике на ночь','Утром при необходимости добавьте молоко и украсьте ягодами'])
  ) AS v(title_en, instructions_fi, instructions_ru)
),
recipes_with_authors AS (
  SELECT
    srr.title,
    srr.description,
    srr.instructions,
    COALESCE(lrs.instructions_fi, srr.instructions) AS instructions_fi,
    COALESCE(lrs.instructions_ru, srr.instructions) AS instructions_ru,
    srr.servings,
    srr.spiciness,
    aa.id AS author_id,
    srr.status,
    COALESCE(lrt.title_fi, srr.title) AS title_fi,
    COALESCE(lrt.title_ru, srr.title) AS title_ru,
    COALESCE(lrt.description_fi, srr.description) AS description_fi,
    COALESCE(lrt.description_ru, srr.description) AS description_ru
  FROM seeded_recipes_ranked srr
  JOIN LATERAL (
    SELECT a.id
    FROM available_authors a
    ORDER BY md5(srr.title || ':' || a.id::text)
    LIMIT 1
  ) aa ON true
  LEFT JOIN localized_recipe_texts lrt ON lrt.title_en = srr.title
  LEFT JOIN localized_recipe_steps lrs ON lrs.title_en = srr.title
)
INSERT INTO recipes (title, description, instructions, servings, spiciness, author_id, status, rating_avg, rating_count)
SELECT
  jsonb_build_object('en', v.title, 'fi', v.title_fi, 'ru', v.title_ru),
  CASE
    WHEN v.description IS NULL THEN NULL
    ELSE jsonb_build_object('en', v.description, 'fi', v.description_fi, 'ru', v.description_ru)
  END,
  jsonb_build_object(
    'en', to_jsonb(v.instructions),
    'fi', to_jsonb(v.instructions_fi),
    'ru', to_jsonb(v.instructions_ru)
  ),
  v.servings,
  v.spiciness,
  v.author_id,
  v.status,
  -- Ratings are derived from recipe_ratings; start seeds with no ratings.
  NULL AS rating_avg,
  0 AS rating_count
FROM recipes_with_authors v
WHERE NOT EXISTS (
  SELECT 1
  FROM recipes r
  WHERE COALESCE(r.title->>'en', '') = v.title
);

WITH seeded_media(title_en, image_url) AS (
  VALUES
    ('Spaghetti Carbonara', '/recipe-pictures/recipe-01.jpeg'),
    ('Chicken Tikka Masala', '/recipe-pictures/recipe-02.jpeg'),
    ('Avocado Toast with Poached Egg', '/recipe-pictures/recipe-03.jpeg'),
    ('Classic Caesar Salad', '/recipe-pictures/recipe-04.jpeg'),
    ('Beef Tacos', '/recipe-pictures/recipe-05.jpeg'),
    ('Mushroom Risotto', '/recipe-pictures/recipe-06.jpeg'),
    ('Greek Salad', '/recipe-pictures/recipe-07.jpeg'),
    ('Banana Oat Pancakes', '/recipe-pictures/recipe-08.jpeg'),
    ('Tom Yum Soup', '/recipe-pictures/recipe-09.jpeg'),
    ('Margherita Pizza', '/recipe-pictures/recipe-10.jpeg'),
    ('Shakshuka', '/recipe-pictures/recipe-11.jpeg'),
    ('Grilled Salmon with Lemon Butter', '/recipe-pictures/recipe-12.jpeg'),
    ('Vegetable Stir-fry with Tofu', '/recipe-pictures/recipe-13.jpeg'),
    ('French Onion Soup', '/recipe-pictures/recipe-14.jpeg'),
    ('Mango Smoothie Bowl', '/recipe-pictures/recipe-15.jpeg'),
    ('Borscht', '/recipe-pictures/recipe-16.jpeg'),
    ('Butter Chicken', '/recipe-pictures/recipe-17.jpeg'),
    ('Lentil Soup', '/recipe-pictures/recipe-18.jpeg'),
    ('Chocolate Lava Cakes', '/recipe-pictures/recipe-19.jpeg'),
    ('Overnight Oats', '/recipe-pictures/recipe-20.jpeg')
)
MERGE INTO recipe_media rm
USING (
  SELECT
    r.id AS recipe_id,
    sm.image_url
  FROM recipes r
  JOIN seeded_media sm ON COALESCE(r.title->>'en', '') = sm.title_en
) src
ON rm.recipe_id = src.recipe_id AND rm.position = 0
WHEN MATCHED THEN
  UPDATE SET type = 'image', url = src.image_url
WHEN NOT MATCHED THEN
  INSERT (recipe_id, type, url, position)
  VALUES (src.recipe_id, 'image', src.image_url, 0);

WITH seeded_recipe_ingredients(title_en, ingredient_name, amount, unit) AS (
  VALUES
    ('Spaghetti Carbonara', 'Pasta', 120, 'g'),
    ('Spaghetti Carbonara', 'Eggs', 2, 'pcs'),
    ('Spaghetti Carbonara', 'Cheddar Cheese', 60, 'g'),
    ('Spaghetti Carbonara', 'Butter', 15, 'g'),
    ('Spaghetti Carbonara', 'Garlic', 1, 'clove'),
    ('Spaghetti Carbonara', 'Black Pepper', 1, 'tsp'),
    ('Spaghetti Carbonara', 'Salt', 1, 'tsp'),

    ('Chicken Tikka Masala', 'Chicken Breast', 500, 'g'),
    ('Chicken Tikka Masala', 'Yogurt', 200, 'ml'),
    ('Chicken Tikka Masala', 'Tomato', 400, 'g'),
    ('Chicken Tikka Masala', 'Onion', 150, 'g'),
    ('Chicken Tikka Masala', 'Garlic', 4, 'clove'),
    ('Chicken Tikka Masala', 'Butter', 30, 'g'),
    ('Chicken Tikka Masala', 'Black Pepper', 1, 'tsp'),
    ('Chicken Tikka Masala', 'Salt', 1, 'tsp'),

    ('Avocado Toast with Poached Egg', 'Bread', 2, 'slice'),
    ('Avocado Toast with Poached Egg', 'Avocado', 1, 'pcs'),
    ('Avocado Toast with Poached Egg', 'Eggs', 2, 'pcs'),
    ('Avocado Toast with Poached Egg', 'Tomato', 100, 'g'),
    ('Avocado Toast with Poached Egg', 'Olive Oil', 1, 'tsp'),
    ('Avocado Toast with Poached Egg', 'Black Pepper', 1, 'tsp'),
    ('Avocado Toast with Poached Egg', 'Salt', 1, 'tsp'),

    ('Classic Caesar Salad', 'Lettuce', 200, 'g'),
    ('Classic Caesar Salad', 'Bread', 3, 'slice'),
    ('Classic Caesar Salad', 'Cheddar Cheese', 60, 'g'),
    ('Classic Caesar Salad', 'Tomato', 120, 'g'),
    ('Classic Caesar Salad', 'Olive Oil', 2, 'tbsp'),
    ('Classic Caesar Salad', 'Garlic', 1, 'clove'),
    ('Classic Caesar Salad', 'Black Pepper', 1, 'tsp'),
    ('Classic Caesar Salad', 'Salt', 1, 'tsp'),

    ('Beef Tacos', 'Beef', 450, 'g'),
    ('Beef Tacos', 'Tomato', 250, 'g'),
    ('Beef Tacos', 'Lettuce', 150, 'g'),
    ('Beef Tacos', 'Onion', 120, 'g'),
    ('Beef Tacos', 'Garlic', 2, 'clove'),
    ('Beef Tacos', 'Cheddar Cheese', 80, 'g'),
    ('Beef Tacos', 'Olive Oil', 1, 'tbsp'),

    ('Mushroom Risotto', 'Rice', 320, 'g'),
    ('Mushroom Risotto', 'Mushroom', 300, 'g'),
    ('Mushroom Risotto', 'Butter', 40, 'g'),
    ('Mushroom Risotto', 'Onion', 120, 'g'),
    ('Mushroom Risotto', 'Garlic', 2, 'clove'),
    ('Mushroom Risotto', 'Cheddar Cheese', 70, 'g'),
    ('Mushroom Risotto', 'Black Pepper', 1, 'tsp'),
    ('Mushroom Risotto', 'Salt', 1, 'tsp'),

    ('Greek Salad', 'Cucumber', 300, 'g'),
    ('Greek Salad', 'Tomato', 350, 'g'),
    ('Greek Salad', 'Cheddar Cheese', 150, 'g'),
    ('Greek Salad', 'Onion', 100, 'g'),
    ('Greek Salad', 'Olive Oil', 2, 'tbsp'),
    ('Greek Salad', 'Black Pepper', 1, 'tsp'),
    ('Greek Salad', 'Salt', 1, 'tsp'),

    ('Banana Oat Pancakes', 'Banana', 2, 'pcs'),
    ('Banana Oat Pancakes', 'Oats', 140, 'g'),
    ('Banana Oat Pancakes', 'Eggs', 2, 'pcs'),
    ('Banana Oat Pancakes', 'Milk', 120, 'ml'),
    ('Banana Oat Pancakes', 'Butter', 15, 'g'),
    ('Banana Oat Pancakes', 'Honey', 20, 'g'),
    ('Banana Oat Pancakes', 'Cinnamon', 1, 'tsp'),

    ('Tom Yum Soup', 'Mushroom', 180, 'g'),
    ('Tom Yum Soup', 'Tomato', 250, 'g'),
    ('Tom Yum Soup', 'Garlic', 4, 'clove'),
    ('Tom Yum Soup', 'Onion', 100, 'g'),
    ('Tom Yum Soup', 'Salmon', 250, 'g'),
    ('Tom Yum Soup', 'Black Pepper', 1, 'tsp'),
    ('Tom Yum Soup', 'Salt', 1, 'tsp'),

    ('Margherita Pizza', 'Bread', 300, 'g'),
    ('Margherita Pizza', 'Tomato', 300, 'g'),
    ('Margherita Pizza', 'Mozzarella', 200, 'g'),
    ('Margherita Pizza', 'Olive Oil', 2, 'tbsp'),
    ('Margherita Pizza', 'Garlic', 2, 'clove'),
    ('Margherita Pizza', 'Black Pepper', 1, 'tsp'),
    ('Margherita Pizza', 'Salt', 1, 'tsp'),

    ('Shakshuka', 'Eggs', 4, 'pcs'),
    ('Shakshuka', 'Tomato', 500, 'g'),
    ('Shakshuka', 'Bell Pepper', 200, 'g'),
    ('Shakshuka', 'Onion', 120, 'g'),
    ('Shakshuka', 'Garlic', 3, 'clove'),
    ('Shakshuka', 'Olive Oil', 2, 'tbsp'),
    ('Shakshuka', 'Black Pepper', 1, 'tsp'),
    ('Shakshuka', 'Salt', 1, 'tsp'),

    ('Grilled Salmon with Lemon Butter', 'Salmon', 500, 'g'),
    ('Grilled Salmon with Lemon Butter', 'Butter', 35, 'g'),
    ('Grilled Salmon with Lemon Butter', 'Garlic', 3, 'clove'),
    ('Grilled Salmon with Lemon Butter', 'Olive Oil', 1, 'tbsp'),
    ('Grilled Salmon with Lemon Butter', 'Potato', 350, 'g'),
    ('Grilled Salmon with Lemon Butter', 'Broccoli', 200, 'g'),
    ('Grilled Salmon with Lemon Butter', 'Black Pepper', 1, 'tsp'),
    ('Grilled Salmon with Lemon Butter', 'Salt', 1, 'tsp'),

    ('Vegetable Stir-fry with Tofu', 'Tofu', 400, 'g'),
    ('Vegetable Stir-fry with Tofu', 'Broccoli', 220, 'g'),
    ('Vegetable Stir-fry with Tofu', 'Bell Pepper', 180, 'g'),
    ('Vegetable Stir-fry with Tofu', 'Carrots', 150, 'g'),
    ('Vegetable Stir-fry with Tofu', 'Garlic', 3, 'clove'),
    ('Vegetable Stir-fry with Tofu', 'Soy Sauce', 40, 'ml'),
    ('Vegetable Stir-fry with Tofu', 'Olive Oil', 1, 'tbsp'),
    ('Vegetable Stir-fry with Tofu', 'Rice', 220, 'g'),

    ('French Onion Soup', 'Onion', 700, 'g'),
    ('French Onion Soup', 'Butter', 50, 'g'),
    ('French Onion Soup', 'Bread', 3, 'slice'),
    ('French Onion Soup', 'Cheddar Cheese', 120, 'g'),
    ('French Onion Soup', 'Garlic', 2, 'clove'),
    ('French Onion Soup', 'Black Pepper', 1, 'tsp'),
    ('French Onion Soup', 'Salt', 1, 'tsp'),

    ('Mango Smoothie Bowl', 'Mango', 300, 'g'),
    ('Mango Smoothie Bowl', 'Banana', 1, 'pcs'),
    ('Mango Smoothie Bowl', 'Oats', 60, 'g'),
    ('Mango Smoothie Bowl', 'Milk', 180, 'ml'),
    ('Mango Smoothie Bowl', 'Honey', 25, 'g'),
    ('Mango Smoothie Bowl', 'Blueberries', 80, 'g'),
    ('Mango Smoothie Bowl', 'Chia Seeds', 15, 'g'),

    ('Borscht', 'Potato', 350, 'g'),
    ('Borscht', 'Carrots', 180, 'g'),
    ('Borscht', 'Tomato', 300, 'g'),
    ('Borscht', 'Onion', 150, 'g'),
    ('Borscht', 'Garlic', 3, 'clove'),
    ('Borscht', 'Olive Oil', 1, 'tbsp'),
    ('Borscht', 'Beef', 300, 'g'),
    ('Borscht', 'Black Pepper', 1, 'tsp'),
    ('Borscht', 'Salt', 1, 'tsp'),

    ('Butter Chicken', 'Chicken Breast', 700, 'g'),
    ('Butter Chicken', 'Tomato', 450, 'g'),
    ('Butter Chicken', 'Butter', 50, 'g'),
    ('Butter Chicken', 'Yogurt', 180, 'ml'),
    ('Butter Chicken', 'Onion', 180, 'g'),
    ('Butter Chicken', 'Garlic', 4, 'clove'),
    ('Butter Chicken', 'Black Pepper', 1, 'tsp'),
    ('Butter Chicken', 'Salt', 1, 'tsp'),

    ('Lentil Soup', 'Lentils', 300, 'g'),
    ('Lentil Soup', 'Onion', 160, 'g'),
    ('Lentil Soup', 'Carrots', 140, 'g'),
    ('Lentil Soup', 'Tomato', 250, 'g'),
    ('Lentil Soup', 'Garlic', 3, 'clove'),
    ('Lentil Soup', 'Olive Oil', 1, 'tbsp'),
    ('Lentil Soup', 'Black Pepper', 1, 'tsp'),
    ('Lentil Soup', 'Salt', 1, 'tsp'),

    ('Chocolate Lava Cakes', 'Eggs', 3, 'pcs'),
    ('Chocolate Lava Cakes', 'Butter', 120, 'g'),
    ('Chocolate Lava Cakes', 'Milk', 120, 'ml'),
    ('Chocolate Lava Cakes', 'Dark Chocolate Chips', 180, 'g'),
    ('Chocolate Lava Cakes', 'Honey', 30, 'g'),
    ('Chocolate Lava Cakes', 'Oats', 30, 'g'),

    ('Overnight Oats', 'Oats', 120, 'g'),
    ('Overnight Oats', 'Milk', 250, 'ml'),
    ('Overnight Oats', 'Yogurt', 120, 'ml'),
    ('Overnight Oats', 'Honey', 25, 'g'),
    ('Overnight Oats', 'Banana', 1, 'pcs'),
    ('Overnight Oats', 'Blueberries', 80, 'g'),
    ('Overnight Oats', 'Chia Seeds', 15, 'g')
),
seeded_media(title_en, image_url) AS (
  VALUES
    ('Spaghetti Carbonara', '/recipe-pictures/recipe-01.jpeg'),
    ('Chicken Tikka Masala', '/recipe-pictures/recipe-02.jpeg'),
    ('Avocado Toast with Poached Egg', '/recipe-pictures/recipe-03.jpeg'),
    ('Classic Caesar Salad', '/recipe-pictures/recipe-04.jpeg'),
    ('Beef Tacos', '/recipe-pictures/recipe-05.jpeg'),
    ('Mushroom Risotto', '/recipe-pictures/recipe-06.jpeg'),
    ('Greek Salad', '/recipe-pictures/recipe-07.jpeg'),
    ('Banana Oat Pancakes', '/recipe-pictures/recipe-08.jpeg'),
    ('Tom Yum Soup', '/recipe-pictures/recipe-09.jpeg'),
    ('Margherita Pizza', '/recipe-pictures/recipe-10.jpeg'),
    ('Shakshuka', '/recipe-pictures/recipe-11.jpeg'),
    ('Grilled Salmon with Lemon Butter', '/recipe-pictures/recipe-12.jpeg'),
    ('Vegetable Stir-fry with Tofu', '/recipe-pictures/recipe-13.jpeg'),
    ('French Onion Soup', '/recipe-pictures/recipe-14.jpeg'),
    ('Mango Smoothie Bowl', '/recipe-pictures/recipe-15.jpeg'),
    ('Borscht', '/recipe-pictures/recipe-16.jpeg'),
    ('Butter Chicken', '/recipe-pictures/recipe-17.jpeg'),
    ('Lentil Soup', '/recipe-pictures/recipe-18.jpeg'),
    ('Chocolate Lava Cakes', '/recipe-pictures/recipe-19.jpeg'),
    ('Overnight Oats', '/recipe-pictures/recipe-20.jpeg')
)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
SELECT
  r.id,
  i.id,
  sri.amount,
  sri.unit
FROM seeded_recipe_ingredients sri
JOIN seeded_media sm ON sm.title_en = sri.title_en
JOIN recipes r ON COALESCE(r.title->>'en', '') = sm.title_en
JOIN recipe_media rm ON rm.recipe_id = r.id AND rm.position = 0 AND rm.url = sm.image_url
JOIN ingredients i ON i.name = sri.ingredient_name
ON CONFLICT (recipe_id, ingredient_id) DO UPDATE
SET amount = EXCLUDED.amount,
    unit = EXCLUDED.unit;