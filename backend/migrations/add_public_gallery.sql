-- Add public gallery features to designs table

-- Add is_public flag
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Add view count
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add like count
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Create likes table
CREATE TABLE IF NOT EXISTS design_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(design_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_design_likes_design_id ON design_likes(design_id);
CREATE INDEX IF NOT EXISTS idx_design_likes_user_id ON design_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_public ON designs(is_public) WHERE is_public = true;

-- RLS for likes
ALTER TABLE design_likes ENABLE ROW LEVEL SECURITY;

-- Users can read all likes
CREATE POLICY "Anyone can view likes" ON design_likes
  FOR SELECT USING (true);

-- Users can like designs
CREATE POLICY "Users can like designs" ON design_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unlike their own likes
CREATE POLICY "Users can unlike designs" ON design_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments
COMMENT ON COLUMN designs.is_public IS 'Whether design appears in public gallery';
COMMENT ON COLUMN designs.view_count IS 'Number of times design has been viewed';
COMMENT ON COLUMN designs.like_count IS 'Number of likes (cached)';
COMMENT ON TABLE design_likes IS 'User likes on designs';
