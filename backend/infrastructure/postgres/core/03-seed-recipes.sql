-- ============================================
-- 20 SAMPLE RECIPES SEED
-- ============================================
-- Run: psql -h localhost -p 5433 -U core_user -d core_db -f 03-seed-recipes.sql

-- Ensure author user exists
INSERT INTO users (id, username, role, status)
VALUES (1, 'demo_chef', 'user', 'offline')
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipes (title, description, instructions, servings, spiciness, author_id, status, rating_avg, rating_count)
SELECT
  jsonb_build_object('en', v.title, 'fi', v.title, 'ru', v.title),
  CASE
    WHEN v.description IS NULL THEN NULL
    ELSE jsonb_build_object('en', v.description, 'fi', v.description, 'ru', v.description)
  END,
  jsonb_build_object(
    'en', to_jsonb(v.instructions),
    'fi', to_jsonb(v.instructions),
    'ru', to_jsonb(v.instructions)
  ),
  v.servings,
  v.spiciness,
  v.author_id,
  v.status,
  v.rating_avg,
  v.rating_count
FROM (VALUES

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
  2, 1, 1, 'published', 4.70, 23
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
  4, 2, 1, 'published', 4.85, 41
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
  1, 0, 1, 'published', 4.30, 18
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
  4, 0, 1, 'published', 4.20, 15
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
  4, 2, 1, 'published', 4.60, 32
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
  4, 0, 1, 'published', 4.55, 27
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
  4, 0, 1, 'published', 4.15, 12
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
  2, 0, 1, 'published', 4.00, 9
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
  2, 3, 1, 'published', 4.75, 38
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
  2, 0, 1, 'published', 4.80, 56
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
  2, 2, 1, 'published', 4.65, 29
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
  2, 0, 1, 'published', 4.50, 21
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
  3, 1, 1, 'published', 4.10, 14
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
  4, 0, 1, 'published', 4.70, 33
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
  1, 0, 1, 'published', 4.25, 11
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
  6, 0, 1, 'published', 4.40, 17
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
  4, 1, 1, 'published', 4.90, 62
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
  6, 1, 1, 'published', 4.35, 22
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
  4, 0, 1, 'published', 4.95, 48
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
  1, 0, 1, 'published', 4.20, 16
)) AS v(title, description, instructions, servings, spiciness, author_id, status, rating_avg, rating_count);

WITH seeded_media(title_en, image_url) AS (
  VALUES
    ('Spaghetti Carbonara', '/recipe-pictures/recipe-01.svg'),
    ('Chicken Tikka Masala', '/recipe-pictures/recipe-02.svg'),
    ('Avocado Toast with Poached Egg', '/recipe-pictures/recipe-03.svg'),
    ('Classic Caesar Salad', '/recipe-pictures/recipe-04.svg'),
    ('Beef Tacos', '/recipe-pictures/recipe-05.svg'),
    ('Mushroom Risotto', '/recipe-pictures/recipe-06.svg'),
    ('Greek Salad', '/recipe-pictures/recipe-07.svg'),
    ('Banana Oat Pancakes', '/recipe-pictures/recipe-08.svg'),
    ('Tom Yum Soup', '/recipe-pictures/recipe-09.svg'),
    ('Margherita Pizza', '/recipe-pictures/recipe-10.svg'),
    ('Shakshuka', '/recipe-pictures/recipe-11.svg'),
    ('Grilled Salmon with Lemon Butter', '/recipe-pictures/recipe-12.svg'),
    ('Vegetable Stir-fry with Tofu', '/recipe-pictures/recipe-13.svg'),
    ('French Onion Soup', '/recipe-pictures/recipe-14.svg'),
    ('Mango Smoothie Bowl', '/recipe-pictures/recipe-15.svg'),
    ('Borscht', '/recipe-pictures/recipe-16.svg'),
    ('Butter Chicken', '/recipe-pictures/recipe-17.svg'),
    ('Lentil Soup', '/recipe-pictures/recipe-18.svg'),
    ('Chocolate Lava Cakes', '/recipe-pictures/recipe-19.svg'),
    ('Overnight Oats', '/recipe-pictures/recipe-20.svg')
)
INSERT INTO recipe_media (recipe_id, type, url, position)
SELECT
  r.id,
  'image',
  sm.image_url,
  0
FROM recipes r
JOIN seeded_media sm ON COALESCE(r.title->>'en', '') = sm.title_en
ON CONFLICT (recipe_id, position) DO UPDATE
SET
  type = EXCLUDED.type,
  url = EXCLUDED.url;
