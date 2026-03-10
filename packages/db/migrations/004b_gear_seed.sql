INSERT INTO public.gear_slots (slot_key, item_name, enhancement, ap, aap, dp, accuracy, evasion, dr, item_grade, notes) VALUES
('mainhand', 'Sovereign Foxspirit Charm', 'PEN', 140, 0, 0, 218, 0, 0, 3, 'Maegu exclusive'),
('subweapon', 'Blackstar Binyeo Knife', 'PEN', 33, 0, 25, 23, 14, 11, 3, 'Maegu exclusive'),
('awakening', 'Fiery Sovereign Foxtail Fans', '', 134, 0, 0, 12, 0, 0, 3, 'Maegu exclusive'),
('helmet', 'Griffon''s Helmet', 'PEN', 0, 0, 80, 0, 28, 52, 2, 'Boss gear set piece'),
('chest', 'Silent Fallen God Armor', 'PEN', 0, 0, 0, 0, 0, 0, 4, 'Upgraded from Dim Tree'),
('gloves', 'Bheg''s Gloves', 'PEN', 0, 0, 62, 50, 26, 36, 2, 'Boss gear set piece'),
('shoes', 'Urugon''s Shoes', 'PEN', 0, 0, 79, 0, 43, 36, 2, 'Boss gear set piece'),
('necklace', 'Kharazad Necklace', 'TET', 32, 0, 0, 18, 0, 0, 3, 'Working on Kharazad set'),
('belt', 'Kharazad Belt', 'TET', 20, 0, 0, 9, 0, 0, 3, 'Working on Kharazad set'),
('ring1', 'Tuvala Ring', 'PEN', 0, 0, 0, 0, 0, 0, 2, 'Replace with Kharazad'),
('ring2', 'Tuvala Ring', 'PEN', 0, 0, 0, 0, 0, 0, 2, 'Replace with Kharazad'),
('earring1', 'Tuvala Earring', 'PEN', 0, 0, 0, 0, 0, 0, 2, 'Replace with Kharazad'),
('earring2', 'Capotia Earring', 'III', 0, 0, 0, 0, 0, 0, 2, 'Replace with Kharazad'),
('artifact', 'Marsh''s Artifact', '', 0, 0, 0, 0, 0, 0, 2, 'Extra AP Against Monsters')
ON CONFLICT (slot_key) DO NOTHING;
