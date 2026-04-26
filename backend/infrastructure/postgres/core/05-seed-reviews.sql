-- ============================================
-- RECIPE REVIEWS SEED
-- ============================================
-- Add sample reviews for all 20 seed recipes
-- Reviews are written in multiple languages (en, fi, ru)

WITH recipe_reviews_data AS (
  SELECT v.recipe_title, v.user_id, v.body, v.source_locale
  FROM (VALUES
    -- Spaghetti Carbonara
    ('Spaghetti Carbonara', 2, 'Great texture and rich taste. Will cook again.', 'en'),
    ('Spaghetti Carbonara', 3, 'Nopea tehdä ja todella maukas kastike.', 'fi'),
    ('Spaghetti Carbonara', 8, 'Очень вкусно, соус получился нежным.', 'ru'),
    
    -- Chicken Tikka Masala
    ('Chicken Tikka Masala', 4, 'Deep flavor and tender chicken. Big hit at dinner.', 'en'),
    ('Chicken Tikka Masala', 5, 'Marinadi toimi hyvin, kana jäi mehukkaaksi.', 'fi'),
    ('Chicken Tikka Masala', 11, 'Насыщенный вкус и мягкая курица.', 'ru'),
    
    -- Avocado Toast with Poached Egg
    ('Avocado Toast with Poached Egg', 9, 'Quick brunch, looks nice, tastes fresh.', 'en'),
    ('Avocado Toast with Poached Egg', 14, 'Hyva aamupala kiireiseen aamuun.', 'fi'),
    ('Avocado Toast with Poached Egg', 19, 'Быстрый и легкий завтрак.', 'ru'),
    
    -- Classic Caesar Salad
    ('Classic Caesar Salad', 6, 'Crisp salad and strong dressing. Exactly what I wanted.', 'en'),
    ('Classic Caesar Salad', 16, 'Rapea salaatti ja hyva kastike.', 'fi'),
    ('Classic Caesar Salad', 20, 'Заправка яркая, салат хрустящий.', 'ru'),
    
    -- Beef Tacos
    ('Beef Tacos', 7, 'Fast, filling, and easy to customize.', 'en'),
    ('Beef Tacos', 15, 'Perhe tykkasi, teen tata uudestaan.', 'fi'),
    ('Beef Tacos', 1, 'Быстрый ужин, всем понравилось.', 'ru'),
    
    -- Mushroom Risotto
    ('Mushroom Risotto', 10, 'Creamy result, but needs attention while cooking.', 'en'),
    ('Mushroom Risotto', 6, 'Hieman tyolas, mutta lopputulos palkitsee.', 'fi'),
    ('Mushroom Risotto', 12, 'Нужно помешивать часто, но вкус отличный.', 'ru'),
    
    -- Greek Salad
    ('Greek Salad', 13, 'Very fresh and light. Perfect for warm weather.', 'en'),
    ('Greek Salad', 9, 'Raikas salaatti, feta toimii hyvin.', 'fi'),
    ('Greek Salad', 18, 'Свежо и просто, отличный гарнир.', 'ru'),
    
    -- Banana Oat Pancakes
    ('Banana Oat Pancakes', 4, 'Soft pancakes, naturally sweet, no extra sugar needed.', 'en'),
    ('Banana Oat Pancakes', 17, 'Helppo resepti, banaani makeuttaa hyvin.', 'fi'),
    ('Banana Oat Pancakes', 2, 'Полезный завтрак без лишнего сахара.', 'ru'),
    
    -- Tom Yum Soup
    ('Tom Yum Soup', 11, 'Bold, spicy, and sour. Very close to restaurant style.', 'en'),
    ('Tom Yum Soup', 3, 'Tulinen ja hapan, juuri kuten pitaa.', 'fi'),
    ('Tom Yum Soup', 7, 'Остро и ярко, хороший баланс кислоты.', 'ru'),
    
    -- Margherita Pizza
    ('Margherita Pizza', 8, 'Simple ingredients, great result, crisp base.', 'en'),
    ('Margherita Pizza', 14, 'Hyva pohja ja tuore mozzarella toimii.', 'fi'),
    ('Margherita Pizza', 5, 'Классика: просто и очень вкусно.', 'ru'),
    
    -- Shakshuka
    ('Shakshuka', 12, 'Comforting and spicy. Great with fresh bread.', 'en'),
    ('Shakshuka', 19, 'Mausteinen kastike, tosi hyva aamiaisella.', 'fi'),
    ('Shakshuka', 13, 'Ароматный соус и удачные яйца.', 'ru'),
    
    -- Grilled Salmon with Lemon Butter
    ('Grilled Salmon with Lemon Butter', 10, 'Juicy fish and bright sauce. Nice weeknight option.', 'en'),
    ('Grilled Salmon with Lemon Butter', 18, 'Lohi jai mehukkaaksi, kastike oli raikas.', 'fi'),
    ('Grilled Salmon with Lemon Butter', 4, 'Сочный лосось и приятный лимонный вкус.', 'ru'),
    
    -- Vegetable Stir-fry with Tofu
    ('Vegetable Stir-fry with Tofu', 7, 'Colorful, fast, and satisfying vegan dinner.', 'en'),
    ('Vegetable Stir-fry with Tofu', 1, 'Rapea tofu ja hyva kastike.', 'fi'),
    ('Vegetable Stir-fry with Tofu', 9, 'Быстро, ярко, тофу получился хрустящим.', 'ru'),
    
    -- French Onion Soup
    ('French Onion Soup', 15, 'Long cook, deep flavor, very cozy dish.', 'en'),
    ('French Onion Soup', 11, 'Hidas mutta todella maukas keitto.', 'fi'),
    ('French Onion Soup', 6, 'Требует времени, но вкус очень глубокий.', 'ru'),
    
    -- Mango Smoothie Bowl
    ('Mango Smoothie Bowl', 2, 'Cold, fruity, and fun. Great summer breakfast.', 'en'),
    ('Mango Smoothie Bowl', 13, 'Raikas kulho, tykkasin granolasta paalla.', 'fi'),
    ('Mango Smoothie Bowl', 10, 'Освежает и выглядит очень аппетитно.', 'ru'),
    
    -- Borscht
    ('Borscht', 5, 'Earthy, hearty, and better on day two.', 'en'),
    ('Borscht', 20, 'Lammittava keitto, smetana sopii hyvin.', 'fi'),
    ('Borscht', 14, 'Сытно, ярко и очень по-домашнему.', 'ru'),
    
    -- Butter Chicken
    ('Butter Chicken', 3, 'Creamy sauce and gentle heat. Crowd pleaser.', 'en'),
    ('Butter Chicken', 12, 'Kermainen kastike, pehmea kana.', 'fi'),
    ('Butter Chicken', 17, 'Мягкий карри, отлично с рисом.', 'ru'),
    
    -- Lentil Soup
    ('Lentil Soup', 9, 'Budget-friendly, filling, and easy to reheat.', 'en'),
    ('Lentil Soup', 6, 'Edullinen ja ravitseva arkeen.', 'fi'),
    ('Lentil Soup', 8, 'Простой и питательный суп на каждый день.', 'ru'),
    
    -- Chocolate Lava Cakes
    ('Chocolate Lava Cakes', 16, 'Looks fancy, actually easy with correct timing.', 'en'),
    ('Chocolate Lava Cakes', 10, 'Nayttava jalokiruoka, onnistui hyvin.', 'fi'),
    ('Chocolate Lava Cakes', 3, 'Эффектный десерт, главное не перепечь.', 'ru'),
    
    -- Overnight Oats
    ('Overnight Oats', 4, 'Prep once, eat all week. Super practical.', 'en'),
    ('Overnight Oats', 17, 'Todella kaytannollinen kiireisiin aamuihin.', 'fi'),
    ('Overnight Oats', 11, 'Удобно: сделал вечером, утром готово.', 'ru')
  ) AS v(recipe_title, user_id, body, source_locale)
)
INSERT INTO recipe_reviews (recipe_id, author_id, body, source_locale)
SELECT r.id, rrd.user_id, rrd.body, rrd.source_locale
FROM recipe_reviews_data rrd
JOIN recipes r ON r.title->>'en' = rrd.recipe_title
WHERE NOT EXISTS (
  SELECT 1 FROM recipe_reviews rr
  WHERE rr.recipe_id = r.id
    AND rr.author_id = rrd.user_id
    AND rr.source_locale = rrd.source_locale
);
