-- 002: Designs & Gallery
-- Design storage and community features

-- Designs table
CREATE TABLE IF NOT EXISTS public.designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Design',
  description TEXT,
  design_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  deck_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS designs_user_id_idx ON public.designs(user_id);
CREATE INDEX IF NOT EXISTS designs_is_public_idx ON public.designs(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS designs_created_at_idx ON public.designs(created_at DESC);
CREATE INDEX IF NOT EXISTS designs_category_idx ON public.designs(category);
CREATE INDEX IF NOT EXISTS designs_tags_idx ON public.designs USING GIN(tags);

-- Enable RLS
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: owner can CRUD, public can read where is_public=true
CREATE POLICY "Users can view own designs and public designs"
  ON public.designs FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own designs"
  ON public.designs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own designs"
  ON public.designs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own designs"
  ON public.designs FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_designs_updated_at
  BEFORE UPDATE ON public.designs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Design likes table for gallery
CREATE TABLE IF NOT EXISTS public.design_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  design_id UUID REFERENCES public.designs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, design_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS design_likes_design_id_idx ON public.design_likes(design_id);

-- Enable RLS
ALTER TABLE public.design_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view likes"
  ON public.design_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like designs"
  ON public.design_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike designs"
  ON public.design_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for design thumbnails and exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-assets', 'design-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for design-assets bucket
CREATE POLICY "Design assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'design-assets');

CREATE POLICY "Authenticated users can upload design assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'design-assets' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own design assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'design-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own design assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'design-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
