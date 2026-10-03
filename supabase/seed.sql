-- Données locales non sensibles : référentiel de sources et critères de recherche initiaux.
-- Aucun utilisateur, mot de passe, jeton ni clé ne doit figurer dans ce fichier.
-- Le script est rejouable (ON CONFLICT DO NOTHING).

insert into sources (id, code, name, kind, base_url, active) values
  ('6f1c2b7e-0000-4000-8000-00000000000a', 'leboncoin', 'leboncoin', 'PORTAL', 'https://www.leboncoin.fr', true),
  ('6f1c2b7e-0000-4000-8000-00000000000b', 'seloger', 'SeLoger', 'PORTAL', 'https://www.seloger.com', true),
  ('6f1c2b7e-0000-4000-8000-00000000000c', 'pap', 'PAP', 'PORTAL', 'https://www.pap.fr', true),
  ('6f1c2b7e-0000-4000-8000-00000000000d', 'bienici', 'Bien''ici', 'PORTAL', 'https://www.bienici.com', true),
  ('6f1c2b7e-0000-4000-8000-00000000000e', 'logic-immo', 'Logic-Immo', 'PORTAL', 'https://www.logic-immo.com', true),
  ('6f1c2b7e-0000-4000-8000-00000000000f', 'encheres-publiques', 'Enchères Publiques', 'AUCTION', 'https://www.encheres-publiques.com', true),
  ('6f1c2b7e-0000-4000-8000-000000000010', 'agence-locale', 'Agences locales (saisie agent)', 'AGENCY', null, true)
on conflict (code) do nothing;

insert into search_criteria_versions (id, version, config, active_from) values
  (
    '7a2d3c8f-0000-4000-8000-000000000001',
    1,
    '{
      "zones": [
        { "city": "Tours", "postalCodes": ["37000", "37100", "37200"], "priority": "PRIMARY" },
        { "city": "Joué-lès-Tours", "postalCodes": ["37300"], "priority": "PRIMARY" },
        { "city": "Saint-Cyr-sur-Loire", "postalCodes": ["37540"], "priority": "PRIMARY" },
        { "city": "Saint-Pierre-des-Corps", "postalCodes": ["37700"], "priority": "PRIMARY" }
      ],
      "maxPriceEuros": 180000,
      "minSurfaceM2": 20,
      "minGrossYieldPercent": 7
    }'::jsonb,
    '2026-10-01T00:00:00Z'
  )
on conflict (version) do nothing;
