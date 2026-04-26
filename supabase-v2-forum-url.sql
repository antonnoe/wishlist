-- ============================================================================
-- Migration 004: forum_url per item
-- ============================================================================
-- Datum:    26-04-2026
-- Doel:     Voeg forum_url-kolom toe aan wishlist. Op /innovaties en
--           /innovaties/[id] verschijnt de "Reageer op het forum"-knop
--           alleen wanneer dit veld is ingevuld; idem op /ideeen.
--           Voorkomt dat de knop ten onrechte naar de forum-homepage
--           linkt zolang er nog geen specifieke blogpost/discussie is.
--
-- Eigenschap: IDEMPOTENT — veilig om meerdere keren te draaien.
--
-- Uitvoeren in Supabase SQL Editor (project: communities-tools).
-- ============================================================================

ALTER TABLE wishlist
  ADD COLUMN IF NOT EXISTS forum_url text;

-- Geen track-coupling: zowel innovaties als gebruikersideeën mogen een
-- forum-link krijgen. Schema-validatie van het URL-format gebeurt
-- server-side in de API.

-- ============================================================================
-- ROLLBACK (alleen handmatig):
--   ALTER TABLE wishlist DROP COLUMN IF EXISTS forum_url;
-- ============================================================================
-- Einde migratie 004
-- ============================================================================
