-- ============================================================================
-- Migration 003: Boîte à idées V2 — Track-split (roadmap / idea)
-- ============================================================================
-- Datum:    26-04-2026
-- Doel:     Splits de wishlist in twee tracks:
--             - 'roadmap' : innovaties van Communities Abroad (Anton's items)
--             - 'idea'    : wensen, suggesties, zorgpunten van gebruikers
--           Voegt fasering, functioneel doel, doelgroepen en
--           tevredenheidsmeting per innovatie toe.
--
-- Eigenschap: IDEMPOTENT — veilig om meerdere keren te draaien. Geen
--             bestaande data wordt verwijderd. Alleen kolommen worden
--             toegevoegd, defaults gezet en items eenmalig geclassificeerd.
--
-- Uitvoeren in Supabase SQL Editor (project: communities-tools).
-- ============================================================================


-- 1. Nieuwe kolommen op tabel `wishlist`
-- ----------------------------------------------------------------------------
ALTER TABLE wishlist
  ADD COLUMN IF NOT EXISTS track text NOT NULL DEFAULT 'idea',
  ADD COLUMN IF NOT EXISTS roadmap_phase text,
  ADD COLUMN IF NOT EXISTS functional_goal text,
  ADD COLUMN IF NOT EXISTS user_groups text[],
  ADD COLUMN IF NOT EXISTS live_satisfaction_positive integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS live_satisfaction_neutral  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS live_satisfaction_negative integer NOT NULL DEFAULT 0;


-- 2. CHECK-constraints (idempotent: drop + recreate)
-- ----------------------------------------------------------------------------
ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_track_check;
ALTER TABLE wishlist
  ADD CONSTRAINT wishlist_track_check
  CHECK (track IN ('roadmap', 'idea'));

ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_roadmap_phase_check;
ALTER TABLE wishlist
  ADD CONSTRAINT wishlist_roadmap_phase_check
  CHECK (
    roadmap_phase IS NULL
    OR roadmap_phase IN ('concept','planning','uitvoering','oplevering','evaluatie')
  );

-- Coupling: roadmap-specifieke velden mogen alleen gevuld zijn bij
-- track='roadmap'. Voorkomt orphaned data na PATCH naar track='idea'.
ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_track_roadmap_fields_check;
ALTER TABLE wishlist
  ADD CONSTRAINT wishlist_track_roadmap_fields_check
  CHECK (
    track = 'roadmap'
    OR (
      roadmap_phase IS NULL
      AND functional_goal IS NULL
      AND user_groups IS NULL
    )
  );


-- 3. Index op track voor snellere filtering
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_wishlist_track ON wishlist(track);
CREATE INDEX IF NOT EXISTS idx_wishlist_roadmap_phase ON wishlist(roadmap_phase)
  WHERE roadmap_phase IS NOT NULL;


-- 4. Eenmalige classificatie van bestaande data
-- ----------------------------------------------------------------------------
-- Anton's items (created_by = 'admin') worden roadmap-items.
-- Alleen items die nog op de DEFAULT 'idea' staan worden geconverteerd,
-- zodat herhaaldelijke runs handmatige correcties niet overschrijven.
UPDATE wishlist
SET track = 'roadmap',
    roadmap_phase = CASE status
      WHEN 'live'    THEN 'oplevering'
      WHEN 'bezig'   THEN 'uitvoering'
      WHEN 'gepland' THEN 'planning'
      WHEN 'idee'    THEN 'concept'
      ELSE roadmap_phase
    END
WHERE created_by = 'admin'
  AND track = 'idea'
  AND roadmap_phase IS NULL;

-- Gebruikersitems blijven track='idea' (reeds default). Geen actie nodig.

-- functional_goal en user_groups blijven NULL — Anton vult later in via admin.


-- ============================================================================
-- 5. ROLLBACK-PLAN (alleen handmatig uit te voeren bij problemen)
-- ============================================================================
-- De migratie is non-destructief. Indien terugdraaien noodzakelijk is:
--
--   ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_track_check;
--   ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_roadmap_phase_check;
--   ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_track_roadmap_fields_check;
--   DROP INDEX IF EXISTS idx_wishlist_track;
--   DROP INDEX IF EXISTS idx_wishlist_roadmap_phase;
--   ALTER TABLE wishlist
--     DROP COLUMN IF EXISTS track,
--     DROP COLUMN IF EXISTS roadmap_phase,
--     DROP COLUMN IF EXISTS functional_goal,
--     DROP COLUMN IF EXISTS user_groups,
--     DROP COLUMN IF EXISTS live_satisfaction_positive,
--     DROP COLUMN IF EXISTS live_satisfaction_neutral,
--     DROP COLUMN IF EXISTS live_satisfaction_negative;
--
-- LET OP: rollback verwijdert alle nieuwe v2-data (fase, doel, doelgroepen,
-- tevredenheid). Alleen toepassen als de v2-frontend volledig is teruggedraaid.
-- ============================================================================
-- Einde migratie 003
-- ============================================================================
