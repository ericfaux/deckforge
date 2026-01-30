-- Fingerpark Builder: Save/Load Projects
-- Users can save their park designs and share them

-- Projects table
CREATE TABLE fingerpark_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  objects JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of ParkObject
  thumbnail_url TEXT, -- Optional screenshot
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE fingerpark_projects ENABLE ROW LEVEL SECURITY;

-- Users can read their own projects
CREATE POLICY "Users can view own projects"
  ON fingerpark_projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read public projects
CREATE POLICY "Anyone can view public projects"
  ON fingerpark_projects FOR SELECT
  USING (is_public = true);

-- Users can create projects
CREATE POLICY "Users can create projects"
  ON fingerpark_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON fingerpark_projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON fingerpark_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX fingerpark_projects_user_id_idx ON fingerpark_projects(user_id);
CREATE INDEX fingerpark_projects_created_at_idx ON fingerpark_projects(created_at DESC);
CREATE INDEX fingerpark_projects_public_idx ON fingerpark_projects(is_public) WHERE is_public = true;

-- Updated timestamp trigger
CREATE TRIGGER update_fingerpark_projects_updated_at
  BEFORE UPDATE ON fingerpark_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
