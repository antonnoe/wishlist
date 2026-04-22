-- ============================================================================
-- Migration 002: Sentiment feedback (3 smileys per idee)
-- ============================================================================
-- Datum:    22-04-2026
-- Doel:     Vervangt upvotes volledig door drie smileys (😀 😐 🙁)
-- Strategie: Schone lei — upvote-tabel en -kolom worden gedropt.
--            Historische stemmen gaan verloren.
--
-- Uitvoeren in Supabase SQL Editor (project: communities-tools).
-- ============================================================================


-- 1. Upvote-infrastructuur opruimen
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS increment_upvotes(uuid);
DROP FUNCTION IF EXISTS decrement_upvotes(uuid);
DROP TABLE IF EXISTS wishlist_votes;
ALTER TABLE wishlist DROP COLUMN IF EXISTS upvotes;


-- 2. Nieuwe denormalized counters op wishlist
-- ----------------------------------------------------------------------------
ALTER TABLE wishlist
  ADD COLUMN IF NOT EXISTS positive_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS neutral_count  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS negative_count integer NOT NULL DEFAULT 0;


-- 3. Nieuwe sentiments-tabel
-- ----------------------------------------------------------------------------
CREATE TABLE wishlist_sentiments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id uuid NOT NULL REFERENCES wishlist(id) ON DELETE CASCADE,
  user_id     text NOT NULL,
  sentiment   text NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wishlist_id, user_id)
);

CREATE INDEX idx_wishlist_sentiments_wishlist_id ON wishlist_sentiments(wishlist_id);
CREATE INDEX idx_wishlist_sentiments_user_id     ON wishlist_sentiments(user_id);


-- 4. RLS-policies (gelijk aan wishlist_votes-patroon)
-- ----------------------------------------------------------------------------
ALTER TABLE wishlist_sentiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sentiments"
  ON wishlist_sentiments FOR SELECT
  USING (true);

CREATE POLICY "Service role full access"
  ON wishlist_sentiments FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- 5. RPC-functies voor atomische counter-updates
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_sentiment(item_id uuid, sentiment_type text)
RETURNS void AS $$
BEGIN
  IF sentiment_type = 'positive' THEN
    UPDATE wishlist SET positive_count = positive_count + 1 WHERE id = item_id;
  ELSIF sentiment_type = 'neutral' THEN
    UPDATE wishlist SET neutral_count = neutral_count + 1 WHERE id = item_id;
  ELSIF sentiment_type = 'negative' THEN
    UPDATE wishlist SET negative_count = negative_count + 1 WHERE id = item_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_sentiment(item_id uuid, sentiment_type text)
RETURNS void AS $$
BEGIN
  IF sentiment_type = 'positive' THEN
    UPDATE wishlist SET positive_count = GREATEST(positive_count - 1, 0) WHERE id = item_id;
  ELSIF sentiment_type = 'neutral' THEN
    UPDATE wishlist SET neutral_count = GREATEST(neutral_count - 1, 0) WHERE id = item_id;
  ELSIF sentiment_type = 'negative' THEN
    UPDATE wishlist SET negative_count = GREATEST(negative_count - 1, 0) WHERE id = item_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- Einde migratie 002
-- ============================================================================
