-- Add comments system

CREATE TABLE IF NOT EXISTS design_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES design_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_design_id ON design_comments(design_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON design_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON design_comments(parent_comment_id);

-- RLS
ALTER TABLE design_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments on public designs
CREATE POLICY "Anyone can view comments" ON design_comments
  FOR SELECT USING (true);

-- Authenticated users can post comments
CREATE POLICY "Users can post comments" ON design_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON design_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON design_comments
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE design_comments IS 'Comments on public designs';
