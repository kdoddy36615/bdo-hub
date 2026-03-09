-- BDO Command Center - Seed Reference Data
-- Bosses and Gathering Items (not user-scoped)

-- ============================================================
-- BOSS REFERENCE DATA
-- ============================================================
insert into public.bosses (name, priority, spawn_type, spawn_schedule, location, notable_drops) values
  ('Kzarka', 'high', 'world', '[{"days": [0,1,2,3,4,5,6], "times": ["02:00","19:00"]}]'::jsonb, 'Serendia Shrine', array['Kzarka Weapon Box']),
  ('Karanda', 'high', 'world', '[{"days": [0,1,2,3,4,5,6], "times": ["02:00","19:00"]}]'::jsonb, 'Karanda Ridge', array['Dandelion Weapon Box']),
  ('Kutum', 'high', 'world', '[{"days": [0,1,2,3,4,5,6], "times": ["02:00","19:00"]}]'::jsonb, 'Scarlet Sand Chamber', array['Kutum Sub-Weapon Box']),
  ('Nouver', 'medium', 'world', '[{"days": [0,1,2,3,4,5,6], "times": ["02:00","19:00"]}]'::jsonb, 'Valencia Desert', array['Nouver Sub-Weapon Box']),
  ('Offin', 'medium', 'world', '[{"days": [1,4], "times": ["02:00"]}]'::jsonb, 'Holo Forest', array['Offin Tett Weapon Box']),
  ('Garmoth', 'medium', 'world', '[{"days": [2,5], "times": ["22:00"]}]'::jsonb, 'Bloodwolf Settlement', array['Garmoth Heart']),
  ('Quint', 'low', 'field', '[{"days": [0,3,6], "times": ["02:00"]}]'::jsonb, 'Calpheon Outskirts', array['Mutant Enhancer']),
  ('Muraka', 'low', 'field', '[{"days": [0,3,6], "times": ["02:00"]}]'::jsonb, 'Mansha Forest', array['Muraka Crystal']),
  ('Vell', 'medium', 'world', '[{"days": [0], "times": ["17:00"]}]'::jsonb, 'Vell Sea', array['Vells Heart']),
  ('Nightmarish Kzarka', 'high', 'special', '[{"days": [6], "times": ["01:00"]}]'::jsonb, 'Serendia Shrine', array['Mythical Weapon Box'])
on conflict (name) do nothing;

-- ============================================================
-- GATHERING ITEMS REFERENCE DATA
-- ============================================================
insert into public.gathering_items (name, category, use_description, why_it_matters, is_gathering_exclusive, market_availability) values
  ('Hard Black Crystal Shard', 'enhancement', 'Enhancement materials', 'Used to craft Concentrated Magical Black Stones for enhancing boss gear.', true, 'Available but expensive'),
  ('Sharp Black Crystal Shard', 'enhancement', 'Enhancement materials', 'Same purpose as Hard shards but for weapon upgrades.', true, 'Available but expensive'),
  ('Caphras Stones', 'caphras', 'Gear progression', 'Occasionally obtained from gathering; needed for late-game gear upgrades.', false, 'Available on marketplace'),
  ('Spirit Dust', 'caphras', 'Caphras crafting', 'Used to craft Caphras Stones through processing.', true, 'Limited availability'),
  ('Fairy Powder', 'fairy', 'Fairy growth', 'Used to upgrade fairy tiers and reroll fairy skills.', true, 'Not tradeable'),
  ('Trace of Earth', 'alchemy', 'Alchemy ingredient', 'Required for many alchemy recipes and lifeskill progression.', true, 'Available on marketplace'),
  ('Trace of Savagery', 'alchemy', 'Alchemy ingredient', 'Required for many alchemy recipes and lifeskill progression.', true, 'Available on marketplace'),
  ('Trace of Origin', 'alchemy', 'Alchemy ingredient', 'Required for many alchemy recipes and lifeskill progression.', true, 'Available on marketplace'),
  ('Trace of Ascension', 'alchemy', 'Alchemy ingredient', 'Required for many alchemy recipes and lifeskill progression.', true, 'Available on marketplace'),
  ('Trace of Forest', 'alchemy', 'Alchemy ingredient', 'Required for many alchemy recipes and lifeskill progression.', true, 'Available on marketplace'),
  ('Trace of Death', 'alchemy', 'Alchemy ingredient', 'Required for many alchemy recipes and lifeskill progression.', true, 'Available on marketplace')
on conflict (name) do nothing;
