-- ============================================
-- 20 SAMPLE USERS SEED
-- ============================================

INSERT INTO users (id, username, role, status) VALUES
  (1, 'demo_chef', 'user', 'offline'),
  (2, 'anna_kitchen', 'user', 'online'),
  (3, 'mika_soup', 'user', 'offline'),
  (4, 'ella_bakes', 'user', 'online'),
  (5, 'noah_grills', 'user', 'offline'),
  (6, 'sofia_salads', 'user', 'online'),
  (7, 'liam_pasta', 'user', 'offline'),
  (8, 'olivia_spice', 'user', 'online'),
  (9, 'leo_breakfast', 'user', 'offline'),
  (10, 'mila_vegan', 'user', 'online'),
  (11, 'emil_smokehouse', 'user', 'offline'),
  (12, 'sara_sweets', 'user', 'online'),
  (13, 'otto_oven', 'user', 'offline'),
  (14, 'nora_nordic', 'user', 'online'),
  (15, 'toni_tacos', 'user', 'offline'),
  (16, 'ida_herbs', 'user', 'online'),
  (17, 'aleksi_wok', 'user', 'offline'),
  (18, 'venla_simmer', 'user', 'online'),
  (19, 'joel_brunch', 'user', 'offline'),
  (20, 'aino_homecook', 'user', 'online')
ON CONFLICT (id) DO NOTHING;

UPDATE users
SET avatar = CASE
  WHEN id % 4 = 1 THEN '/avatars/avatar-1.svg'
  WHEN id % 4 = 2 THEN '/avatars/avatar-2.svg'
  WHEN id % 4 = 3 THEN '/avatars/avatar-3.svg'
  WHEN id % 4 = 4 THEN '/avatars/avatar-4.svg'
  WHEN id % 4 = 5 THEN '/avatars/avatar-5.svg'
  WHEN id % 4 = 6 THEN '/avatars/avatar-6.svg'
  WHEN id % 4 = 7 THEN '/avatars/avatar-7.svg'
  ELSE '/avatars/avatar-8.svg'
END
WHERE id BETWEEN 1 AND 20;
