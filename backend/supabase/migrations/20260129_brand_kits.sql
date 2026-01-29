-- Brand Kits: Save and reuse color palettes and font combinations
-- Premium feature for monetization

CREATE TABLE IF NOT EXISTS brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Color palette (array of hex colors)
  colors JSONB NOT NULL DEFAULT '[]',
  
  -- Font combinations (array of font objects)
  fonts JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS brand_kits_user_id_idx ON brand_kits(user_id);

-- RLS Policies
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

-- Users can read their own brand kits
CREATE POLICY "Users can read own brand kits"
  ON brand_kits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own brand kits
CREATE POLICY "Users can create brand kits"
  ON brand_kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own brand kits
CREATE POLICY "Users can update own brand kits"
  ON brand_kits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own brand kits
CREATE POLICY "Users can delete own brand kits"
  ON brand_kits FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_brand_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_kits_updated_at();
