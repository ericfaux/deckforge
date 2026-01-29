-- Add folders and tags for design organization

-- Folders table
CREATE TABLE IF NOT EXISTS design_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#ccff00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add folder_id to designs
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES design_folders(id) ON DELETE SET NULL;

-- Tags table
CREATE TABLE IF NOT EXISTS design_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#00ffff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Design-Tag junction table
CREATE TABLE IF NOT EXISTS design_tag_assignments (
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES design_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (design_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON design_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON design_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_design ON design_tag_assignments(design_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_tag ON design_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_designs_folder ON designs(folder_id);

-- RLS for folders
ALTER TABLE design_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders" ON design_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders" ON design_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON design_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON design_folders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for tags
ALTER TABLE design_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags" ON design_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags" ON design_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON design_tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON design_tags
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for tag assignments
ALTER TABLE design_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tag assignments for own designs" ON design_tag_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM designs WHERE designs.id = design_tag_assignments.design_id AND designs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can assign tags to own designs" ON design_tag_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM designs WHERE designs.id = design_tag_assignments.design_id AND designs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from own designs" ON design_tag_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM designs WHERE designs.id = design_tag_assignments.design_id AND designs.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE design_folders IS 'User-created folders for organizing designs';
COMMENT ON TABLE design_tags IS 'User-created tags for categorizing designs';
COMMENT ON TABLE design_tag_assignments IS 'Many-to-many relationship between designs and tags';
