-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION increment_upvotes(item_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE wishlist SET upvotes = upvotes + 1 WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_upvotes(item_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE wishlist SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
