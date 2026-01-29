-- Marketplace tables for design selling/buying

-- Designer profiles
CREATE TABLE designer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bio TEXT,
  social_links JSONB DEFAULT '{}', -- {instagram: '', twitter: '', website: ''}
  verified BOOLEAN DEFAULT FALSE,
  total_sales INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  payout_method TEXT, -- 'paypal' or 'stripe'
  payout_email TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Marketplace designs
CREATE TABLE marketplace_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL, -- Supabase storage URL
  thumbnail_url TEXT, -- PNG preview image
  price DECIMAL(10,2) NOT NULL DEFAULT 0, -- $0 for free
  license_type TEXT NOT NULL CHECK (license_type IN ('personal', 'commercial', 'unlimited')),
  tags TEXT[] DEFAULT '{}',
  category TEXT CHECK (category IN ('street', 'retro', 'minimal', 'edgy', 'pro')),
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  featured_until TIMESTAMPTZ, -- NULL if not featured
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace purchases
CREATE TABLE marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID REFERENCES marketplace_designs(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(design_id, buyer_id) -- Can't buy same design twice
);

-- Marketplace favorites
CREATE TABLE marketplace_favorites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  design_id UUID REFERENCES marketplace_designs(id) ON DELETE CASCADE NOT NULL,
  favorited_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, design_id)
);

-- Marketplace reviews (verified purchasers only)
CREATE TABLE marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID REFERENCES marketplace_designs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(design_id, user_id) -- One review per design per user
);

-- Marketplace follows (follow designers)
CREATE TABLE marketplace_follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

-- Indexes for performance
CREATE INDEX idx_marketplace_designs_user ON marketplace_designs(user_id);
CREATE INDEX idx_marketplace_designs_category ON marketplace_designs(category);
CREATE INDEX idx_marketplace_designs_featured ON marketplace_designs(featured_until) WHERE featured_until IS NOT NULL;
CREATE INDEX idx_marketplace_designs_created ON marketplace_designs(created_at DESC);
CREATE INDEX idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_id);
CREATE INDEX idx_marketplace_purchases_design ON marketplace_purchases(design_id);
CREATE INDEX idx_marketplace_favorites_user ON marketplace_favorites(user_id);
CREATE INDEX idx_marketplace_reviews_design ON marketplace_reviews(design_id);

-- RLS policies
ALTER TABLE designer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_follows ENABLE ROW LEVEL SECURITY;

-- Designer profiles: Public read, owner write
CREATE POLICY "Designer profiles are viewable by everyone"
  ON designer_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own designer profile"
  ON designer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own designer profile"
  ON designer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Marketplace designs: Public read if published, owner full control
CREATE POLICY "Published designs are viewable by everyone"
  ON marketplace_designs FOR SELECT
  USING (published = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own designs"
  ON marketplace_designs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own designs"
  ON marketplace_designs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own designs"
  ON marketplace_designs FOR DELETE
  USING (auth.uid() = user_id);

-- Purchases: Buyers can read own purchases
CREATE POLICY "Users can view own purchases"
  ON marketplace_purchases FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Authenticated users can purchase"
  ON marketplace_purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Favorites: Users can manage own favorites
CREATE POLICY "Users can view own favorites"
  ON marketplace_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON marketplace_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON marketplace_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Reviews: Anyone can read, only purchasers can write
CREATE POLICY "Reviews are viewable by everyone"
  ON marketplace_reviews FOR SELECT
  USING (true);

CREATE POLICY "Purchasers can write reviews"
  ON marketplace_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM marketplace_purchases
      WHERE buyer_id = auth.uid() AND design_id = marketplace_reviews.design_id
    )
  );

CREATE POLICY "Users can update own reviews"
  ON marketplace_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON marketplace_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Follows: Users can manage own follows
CREATE POLICY "Follows are viewable by everyone"
  ON marketplace_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON marketplace_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON marketplace_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Functions for updating counts
CREATE OR REPLACE FUNCTION update_design_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update favorites count
  IF TG_TABLE_NAME = 'marketplace_favorites' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE marketplace_designs SET favorites = favorites + 1 WHERE id = NEW.design_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE marketplace_designs SET favorites = favorites - 1 WHERE id = OLD.design_id;
    END IF;
  END IF;
  
  -- Update downloads count
  IF TG_TABLE_NAME = 'marketplace_purchases' AND TG_OP = 'INSERT' THEN
    UPDATE marketplace_designs SET downloads = downloads + 1 WHERE id = NEW.design_id;
    
    -- Update designer stats
    UPDATE designer_profiles 
    SET total_sales = total_sales + 1,
        total_earnings = total_earnings + (NEW.price_paid * 0.8) -- 80% to designer
    WHERE user_id = (SELECT user_id FROM marketplace_designs WHERE id = NEW.design_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating stats
CREATE TRIGGER marketplace_favorites_stats
  AFTER INSERT OR DELETE ON marketplace_favorites
  FOR EACH ROW EXECUTE FUNCTION update_design_stats();

CREATE TRIGGER marketplace_purchases_stats
  AFTER INSERT ON marketplace_purchases
  FOR EACH ROW EXECUTE FUNCTION update_design_stats();

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER designer_profiles_updated_at
  BEFORE UPDATE ON designer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER marketplace_designs_updated_at
  BEFORE UPDATE ON marketplace_designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_views(design_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE marketplace_designs SET views = views + 1 WHERE id = design_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket for marketplace designs
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace-designs', 'marketplace-designs', true);

-- Storage policies for marketplace designs
CREATE POLICY "Marketplace designs are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketplace-designs');

CREATE POLICY "Authenticated users can upload marketplace designs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'marketplace-designs' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own marketplace designs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'marketplace-designs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own marketplace designs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'marketplace-designs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
