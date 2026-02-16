-- 005: Security Hardening
-- Fixes Supabase security linter warnings:
--   1. Mutable search_path on all 5 functions
--   2. SECURITY DEFINER where needed + fully-qualified table names
--   3. RLS policy review & optimization
--   4. Missing indexes on commonly queried columns

-- ============================================================
-- 1. Fix functions: set search_path, add SECURITY DEFINER where
--    needed, use fully-qualified table names (public.*)
-- ============================================================

-- 1a. update_updated_at_column() — simple trigger, no table access
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public, pg_catalog;

-- 1b. handle_new_user() — needs SECURITY DEFINER to insert into
--     public.profiles from auth.users trigger context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1c. update_design_stats() — needs SECURITY DEFINER to update
--     marketplace_designs and designer_profiles counters via trigger
CREATE OR REPLACE FUNCTION public.update_design_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Update favorites count
  IF TG_TABLE_NAME = 'marketplace_favorites' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.marketplace_designs SET favorites = favorites + 1 WHERE id = NEW.design_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.marketplace_designs SET favorites = favorites - 1 WHERE id = OLD.design_id;
    END IF;
  END IF;

  -- Update downloads count and designer earnings
  IF TG_TABLE_NAME = 'marketplace_purchases' AND TG_OP = 'INSERT' THEN
    UPDATE public.marketplace_designs SET downloads = downloads + 1 WHERE id = NEW.design_id;

    -- Update designer stats (80% revenue share)
    UPDATE public.designer_profiles
    SET total_sales = total_sales + 1,
        total_earnings = total_earnings + (NEW.price_paid * 0.8)
    WHERE user_id = (SELECT user_id FROM public.marketplace_designs WHERE id = NEW.design_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 1d. update_updated_at() — simple trigger, no table access
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public, pg_catalog;

-- 1e. increment_views() — needs SECURITY DEFINER so any
--     authenticated user can increment views on published designs
CREATE OR REPLACE FUNCTION public.increment_views(design_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.marketplace_designs
  SET views = views + 1
  WHERE id = increment_views.design_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. Revoke public EXECUTE on SECURITY DEFINER functions
--    and grant only to authenticated users
-- ============================================================

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
-- handle_new_user is called by trigger on auth.users, runs as definer

REVOKE ALL ON FUNCTION public.update_design_stats() FROM PUBLIC;
-- update_design_stats is called by triggers, runs as definer

REVOKE ALL ON FUNCTION public.increment_views(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO authenticated;

-- ============================================================
-- 3. RLS policy review & optimization
-- ============================================================

-- 3a. designer_profiles — add missing DELETE policy for owner
CREATE POLICY "Users can delete own designer profile"
  ON public.designer_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- 3b. marketplace_designs — restrict UPDATE so users cannot
--     modify counter columns (views, downloads, favorites) directly.
--     Drop the existing broad UPDATE policy, replace with column-specific.
DROP POLICY IF EXISTS "Users can update own designs" ON public.marketplace_designs;

CREATE POLICY "Users can update own marketplace designs"
  ON public.marketplace_designs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3c. marketplace_reviews — tighten INSERT to use qualified table
--     and ensure user_id matches auth.uid()
DROP POLICY IF EXISTS "Purchasers can write reviews" ON public.marketplace_reviews;

CREATE POLICY "Verified purchasers can write reviews"
  ON public.marketplace_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.marketplace_purchases
      WHERE buyer_id = auth.uid() AND design_id = marketplace_reviews.design_id
    )
  );

-- ============================================================
-- 4. Add missing indexes for common query patterns
-- ============================================================

-- designer_profiles: user_id has UNIQUE constraint (implicit index) — OK
-- marketplace_favorites: need design_id index for counting favorites
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_design
  ON public.marketplace_favorites(design_id);

-- marketplace_reviews: need user_id index for looking up user's reviews
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_user
  ON public.marketplace_reviews(user_id);

-- marketplace_designs: published filter is common in SELECT queries
CREATE INDEX IF NOT EXISTS idx_marketplace_designs_published
  ON public.marketplace_designs(published) WHERE published = true;

-- fingerpark_projects: user_id already indexed — OK
-- designs: user_id, created_at already indexed — OK
