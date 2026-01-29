-- DeckForge Database Schema for Supabase

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Designs table
CREATE TABLE IF NOT EXISTS public.designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Design',
  description TEXT,
  canvas_data JSONB NOT NULL, -- Stores the full canvas state (objects array, etc.)
  thumbnail_url TEXT, -- Preview image URL
  is_public BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE, -- For featured templates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Designs policies
CREATE POLICY "Users can view own designs"
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

-- Assets table (user-uploaded images)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_type TEXT, -- image/png, image/jpeg, etc.
  file_size INTEGER, -- bytes
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonts table (user-uploaded custom fonts)
CREATE TABLE IF NOT EXISTS public.fonts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  font_family TEXT NOT NULL, -- CSS font-family name
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_type TEXT, -- font/ttf, font/woff2, etc.
  file_size INTEGER, -- bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Assets policies
CREATE POLICY "Users can view own assets"
  ON public.assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload assets"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.assets FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS for fonts
ALTER TABLE public.fonts ENABLE ROW LEVEL SECURITY;

-- Fonts policies
CREATE POLICY "Users can view own fonts"
  ON public.fonts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload fonts"
  ON public.fonts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fonts"
  ON public.fonts FOR DELETE
  USING (auth.uid() = user_id);

-- Likes table (for community marketplace)
CREATE TABLE IF NOT EXISTS public.design_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  design_id UUID REFERENCES public.designs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, design_id)
);

-- Enable RLS
ALTER TABLE public.design_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON public.design_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like designs"
  ON public.design_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike designs"
  ON public.design_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS designs_user_id_idx ON public.designs(user_id);
CREATE INDEX IF NOT EXISTS designs_is_public_idx ON public.designs(is_public);
CREATE INDEX IF NOT EXISTS designs_created_at_idx ON public.designs(created_at DESC);
CREATE INDEX IF NOT EXISTS assets_user_id_idx ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS fonts_user_id_idx ON public.fonts(user_id);
CREATE INDEX IF NOT EXISTS design_likes_design_id_idx ON public.design_likes(design_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designs_updated_at
  BEFORE UPDATE ON public.designs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for user assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-assets', 'user-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-assets bucket
CREATE POLICY "Users can upload to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view public assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-assets');

CREATE POLICY "Users can delete their own assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
