-- Insert sample menu items
INSERT INTO menu_items (id, name, description, price, category, image_url, ingredients, preparation_time)
VALUES
  (
    gen_random_uuid(),
    'Supa Crema de Ciuperci',
    'O supa cremoasa cu ciuperci proaspete si crutoane aromate',
    25.00,
    'supe-creme',
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
    ARRAY['ciuperci', 'smantana', 'ceapa', 'usturoi', 'crutoane'],
    20
  ),
  (
    gen_random_uuid(),
    'Musaca de Vinete',
    'Musaca traditionala cu vinete coapte si carne tocata',
    35.00,
    'carne',
    'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800',
    ARRAY['vinete', 'carne tocata', 'sos bechamel', 'cascaval'],
    45
  ),
  (
    gen_random_uuid(),
    'Salata Caesar',
    'Salata proaspata cu piept de pui la gratar, crutoane si parmezan',
    32.00,
    'starter',
    'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800',
    ARRAY['salata iceberg', 'piept de pui', 'crutoane', 'parmezan', 'sos caesar'],
    15
  ),
  (
    gen_random_uuid(),
    'Paste Carbonara',
    'Paste proaspete cu sos carbonara traditional',
    38.00,
    'fainoase',
    'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
    ARRAY['paste', 'ou', 'guanciale', 'pecorino', 'piper negru'],
    25
  ),
  (
    gen_random_uuid(),
    'Tiramisu',
    'Desert italian traditional cu mascarpone si cafea',
    28.00,
    'dulce',
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
    ARRAY['piscoturi', 'cafea', 'mascarpone', 'cacao', 'oua'],
    30
  );