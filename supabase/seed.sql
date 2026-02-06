-- =============================================================================
-- DeckForge Seed Data
-- Populates all public tables with realistic demo data for a polished experience.
-- Run after migrations. Executes as postgres role (bypasses RLS).
-- =============================================================================

-- Fixed UUIDs for demo users
-- Using deterministic UUIDs so foreign keys are always valid.

-- ─── 1. AUTH USERS ──────────────────────────────────────────────────────────────

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES
  -- User 1: NeonArtist (designer, verified)
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'neonartist@deckforge.demo',
    crypt('demo-password-01', gen_salt('bf')),
    NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"neonartist","display_name":"Neon Artist","avatar_url":"https://api.dicebear.com/7.x/thumbs/svg?seed=neonartist"}'
  ),
  -- User 2: TokyoDesigns (designer, verified)
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'tokyodesigns@deckforge.demo',
    crypt('demo-password-02', gen_salt('bf')),
    NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days', NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"tokyodesigns","display_name":"Tokyo Designs","avatar_url":"https://api.dicebear.com/7.x/thumbs/svg?seed=tokyodesigns"}'
  ),
  -- User 3: WaveCreative (designer)
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'wavecreative@deckforge.demo',
    crypt('demo-password-03', gen_salt('bf')),
    NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"wavecreative","display_name":"Wave Creative","avatar_url":"https://api.dicebear.com/7.x/thumbs/svg?seed=wavecreative"}'
  ),
  -- User 4: RetroRipper (designer, verified)
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'retroripper@deckforge.demo',
    crypt('demo-password-04', gen_salt('bf')),
    NOW() - INTERVAL '150 days', NOW() - INTERVAL '150 days', NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"retroripper","display_name":"Retro Ripper","avatar_url":"https://api.dicebear.com/7.x/thumbs/svg?seed=retroripper"}'
  ),
  -- User 5: ProDecks (designer, verified)
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'prodecks@deckforge.demo',
    crypt('demo-password-05', gen_salt('bf')),
    NOW() - INTERVAL '200 days', NOW() - INTERVAL '200 days', NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"prodecks","display_name":"Pro Decks","avatar_url":"https://api.dicebear.com/7.x/thumbs/svg?seed=prodecks"}'
  ),
  -- User 6: GlitchArt (designer)
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'glitchart@deckforge.demo',
    crypt('demo-password-06', gen_salt('bf')),
    NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"glitchart","display_name":"Glitch Art","avatar_url":"https://api.dicebear.com/7.x/thumbs/svg?seed=glitchart"}'
  ),
  -- User 7: LineWork (designer)
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'linework@deckforge.demo',
    crypt('demo-password-07', gen_salt('bf')),
    NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"linework","display_name":"Line Work Studio","avatar_url":"https://api.dicebear.com/7.x/thumbs/svg?seed=linework"}'
  ),
  -- User 8: AcidArt (designer, verified)
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'acidart@deckforge.demo',
    crypt('demo-password-08', gen_salt('bf')),
    NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days', NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"acidart","display_name":"Acid Art Co.","avatar_url":"https://api.dicebear.com/7.x/thumbs/svg?seed=acidart"}'
  ),
  -- User 9: SkaterKid (buyer/community member, not a designer)
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'skaterkid@deckforge.demo',
    crypt('demo-password-09', gen_salt('bf')),
    NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"skaterkid","display_name":"Skater Kid","avatar_url":"https://api.dicebear.com/7.x/thumbs/svg?seed=skaterkid"}'
  ),
  -- User 10: DeckCollector (buyer/community member, not a designer)
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'deckcollector@deckforge.demo',
    crypt('demo-password-10', gen_salt('bf')),
    NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"deckcollector","display_name":"Deck Collector","avatar_url":"https://api.dicebear.com/7.x/thumbs/svg?seed=deckcollector"}'
  )
ON CONFLICT (id) DO NOTHING;

-- Auth identities (required by Supabase auth)
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'email', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01","email":"neonartist@deckforge.demo"}', NOW(), NOW() - INTERVAL '90 days', NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'email', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02","email":"tokyodesigns@deckforge.demo"}', NOW(), NOW() - INTERVAL '120 days', NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'email', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03","email":"wavecreative@deckforge.demo"}', NOW(), NOW() - INTERVAL '60 days', NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'email', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04","email":"retroripper@deckforge.demo"}', NOW(), NOW() - INTERVAL '150 days', NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'email', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05","email":"prodecks@deckforge.demo"}', NOW(), NOW() - INTERVAL '200 days', NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'email', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06","email":"glitchart@deckforge.demo"}', NOW(), NOW() - INTERVAL '45 days', NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'email', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07","email":"linework@deckforge.demo"}', NOW(), NOW() - INTERVAL '30 days', NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'email', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08","email":"acidart@deckforge.demo"}', NOW(), NOW() - INTERVAL '100 days', NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'email', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09","email":"skaterkid@deckforge.demo"}', NOW(), NOW() - INTERVAL '25 days', NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'email', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10","email":"deckcollector@deckforge.demo"}', NOW(), NOW() - INTERVAL '40 days', NOW())
ON CONFLICT (provider_id, provider) DO NOTHING;


-- ─── 2. PROFILES ────────────────────────────────────────────────────────────────
-- The handle_new_user() trigger may auto-create these, so we use upsert.

INSERT INTO public.profiles (id, username, display_name, avatar_url, bio) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'neonartist',    'Neon Artist',        'https://api.dicebear.com/7.x/thumbs/svg?seed=neonartist',    'Digital artist specializing in dark aesthetic fingerboard graphics. Neon vibes only.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'tokyodesigns',  'Tokyo Designs',      'https://api.dicebear.com/7.x/thumbs/svg?seed=tokyodesigns',  'JDM-inspired graphics for fingerboard culture. Based in Tokyo.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'wavecreative',  'Wave Creative',      'https://api.dicebear.com/7.x/thumbs/svg?seed=wavecreative',  'Minimal design enthusiast. Less is more.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'retroripper',   'Retro Ripper',       'https://api.dicebear.com/7.x/thumbs/svg?seed=retroripper',   'Taking it back to the 80s, one deck at a time. Retro never dies.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'prodecks',      'Pro Decks',          'https://api.dicebear.com/7.x/thumbs/svg?seed=prodecks',      'Competition-grade fingerboard graphics for serious riders.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'glitchart',     'Glitch Art',         'https://api.dicebear.com/7.x/thumbs/svg?seed=glitchart',     'Breaking pixels since 1999. Error is art.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'linework',      'Line Work Studio',   'https://api.dicebear.com/7.x/thumbs/svg?seed=linework',      'Illustrator and fingerboard enthusiast. Fine lines, bold decks.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'acidart',       'Acid Art Co.',       'https://api.dicebear.com/7.x/thumbs/svg?seed=acidart',       'Psychedelic art for the fingerboard generation. Turn up the volume.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'skaterkid',     'Skater Kid',         'https://api.dicebear.com/7.x/thumbs/svg?seed=skaterkid',     'Just here for the sick decks. Collector and daily rider.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'deckcollector', 'Deck Collector',     'https://api.dicebear.com/7.x/thumbs/svg?seed=deckcollector', 'I collect fingerboard designs like Pokemon cards. Gotta catch em all.')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;


-- ─── 3. DESIGNER PROFILES ──────────────────────────────────────────────────────

INSERT INTO designer_profiles (id, user_id, bio, social_links, verified, total_sales, total_earnings) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
   'Dark aesthetic fingerboard graphics with neon accents',
   '{"instagram":"@neonartist.fb","twitter":"@neonartist_deck","website":"https://neonartist.design"}',
   TRUE, 389, 467.00),

  ('d0000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
   'JDM-inspired graphics for fingerboard culture',
   '{"instagram":"@tokyodesigns","twitter":"@tokyodecks","website":"https://tokyodesigns.jp"}',
   TRUE, 567, 903.00),

  ('d0000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
   'Minimal design enthusiast creating calm, clean decks',
   '{"instagram":"@wavecreative","twitter":"","website":""}',
   FALSE, 312, 0.00),

  ('d0000000-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
   'Retro and nostalgic fingerboard art from the 80s and 90s',
   '{"instagram":"@retroripper","twitter":"@retro_ripper","website":"https://retroripper.com"}',
   TRUE, 423, 844.00),

  ('d0000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
   'Competition-grade fingerboard graphics for serious riders',
   '{"instagram":"@prodecks","twitter":"@prodecks_official","website":"https://prodecks.co"}',
   TRUE, 891, 2845.00),

  ('d0000000-0000-0000-0000-000000000006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
   'Digital glitch and pixel art for fingerboards',
   '{"instagram":"@glitchart.fb","twitter":"","website":""}',
   FALSE, 521, 621.00),

  ('d0000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07',
   'Fine line botanical and geometric illustrations on decks',
   '{"instagram":"@lineworkstudio","twitter":"@linework_art","website":"https://linework.studio"}',
   FALSE, 198, 0.00),

  ('d0000000-0000-0000-0000-000000000008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08',
   'Psychedelic and acid-washed deck art',
   '{"instagram":"@acidartco","twitter":"@acidart_decks","website":"https://acidart.co"}',
   TRUE, 678, 1080.00)
ON CONFLICT (user_id) DO NOTHING;


-- ─── 4. DESIGNS (Gallery) ───────────────────────────────────────────────────────
-- These appear in the public gallery. References profiles(id).

INSERT INTO public.designs (id, user_id, title, description, design_data, thumbnail_url, is_public, tags, category, deck_size, view_count, like_count) VALUES
  -- NeonArtist designs
  ('b0000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
   'Midnight Bloom', 'Dark floral design with neon petals blooming against a midnight background.',
   '{"version":1,"background":"#0a0a1a","layers":[{"type":"shape","shape":"ellipse","x":50,"y":30,"width":200,"height":200,"fill":"#ff00ff","opacity":0.6},{"type":"shape","shape":"ellipse","x":150,"y":50,"width":180,"height":180,"fill":"#00ffcc","opacity":0.5},{"type":"text","content":"BLOOM","x":60,"y":280,"fontSize":48,"fill":"#ffffff","fontFamily":"Impact"}]}',
   NULL, TRUE, ARRAY['floral','neon','dark','nature'], 'edgy', '32mm',
   1247, 156),

  ('b0000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
   'Electric Pulse', 'Pulsing electric lines across a deep purple field. Feel the energy.',
   '{"version":1,"background":"#1a0033","layers":[{"type":"shape","shape":"rect","x":0,"y":140,"width":300,"height":4,"fill":"#00ffff","opacity":0.9},{"type":"shape","shape":"rect","x":0,"y":160,"width":300,"height":2,"fill":"#ff00ff","opacity":0.7},{"type":"shape","shape":"rect","x":0,"y":180,"width":300,"height":6,"fill":"#ffff00","opacity":0.5}]}',
   NULL, TRUE, ARRAY['electric','neon','lines','energy'], 'edgy', '34mm',
   834, 92),

  -- TokyoDesigns designs
  ('b0000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
   'Tokyo Drift', 'Japanese-inspired street design with speed line accents. Built for the streets.',
   '{"version":1,"background":"#1a1a2e","layers":[{"type":"shape","shape":"rect","x":20,"y":20,"width":260,"height":360,"fill":"transparent","stroke":"#e94560","strokeWidth":3},{"type":"text","content":"DRIFT","x":40,"y":200,"fontSize":56,"fill":"#e94560","fontFamily":"Impact"},{"type":"shape","shape":"rect","x":0,"y":300,"width":300,"height":2,"fill":"#ffffff","opacity":0.3}]}',
   NULL, TRUE, ARRAY['japanese','street','drift','speed'], 'street', '32mm',
   2103, 234),

  ('b0000000-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
   'Sakura Season', 'Delicate cherry blossom petals drifting across a soft pink gradient.',
   '{"version":1,"background":"linear-gradient(#fce4ec,#f8bbd0)","layers":[{"type":"shape","shape":"ellipse","x":80,"y":60,"width":20,"height":20,"fill":"#f48fb1","opacity":0.8},{"type":"shape","shape":"ellipse","x":200,"y":120,"width":16,"height":16,"fill":"#f48fb1","opacity":0.6},{"type":"shape","shape":"ellipse","x":140,"y":250,"width":22,"height":22,"fill":"#f48fb1","opacity":0.7},{"type":"text","content":"桜","x":100,"y":180,"fontSize":72,"fill":"#ad1457","fontFamily":"serif"}]}',
   NULL, TRUE, ARRAY['sakura','japanese','floral','pink'], 'minimal', '32mm',
   1456, 187),

  -- WaveCreative designs
  ('b0000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
   'Pastel Waves', 'Soft pastel gradient waves flowing across the deck. Smooth, calming, stylish.',
   '{"version":1,"background":"#f5f0ff","layers":[{"type":"shape","shape":"rect","x":0,"y":100,"width":300,"height":60,"fill":"#c3aed6","opacity":0.6},{"type":"shape","shape":"rect","x":0,"y":170,"width":300,"height":50,"fill":"#b8d4e3","opacity":0.5},{"type":"shape","shape":"rect","x":0,"y":230,"width":300,"height":40,"fill":"#ffd6e0","opacity":0.4}]}',
   NULL, TRUE, ARRAY['pastel','waves','gradient','calm'], 'minimal', '34mm',
   891, 178),

  ('b0000000-0000-0000-0000-000000000006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
   'Cloud Nine', 'Floating above it all. Soft white forms on a sky blue canvas.',
   '{"version":1,"background":"#87ceeb","layers":[{"type":"shape","shape":"ellipse","x":60,"y":100,"width":120,"height":60,"fill":"#ffffff","opacity":0.9},{"type":"shape","shape":"ellipse","x":160,"y":220,"width":100,"height":50,"fill":"#ffffff","opacity":0.8},{"type":"text","content":"9","x":120,"y":160,"fontSize":96,"fill":"#ffffff","fontFamily":"serif","opacity":0.3}]}',
   NULL, TRUE, ARRAY['clouds','sky','white','clean'], 'minimal', '32mm',
   543, 89),

  -- RetroRipper designs
  ('b0000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
   'Retro Cassette', 'Nostalgic 80s cassette tape design with mixtape label. Rewind the good times.',
   '{"version":1,"background":"#2d1b69","layers":[{"type":"shape","shape":"rect","x":40,"y":80,"width":220,"height":140,"fill":"#1a1a2e","stroke":"#ffd700","strokeWidth":2},{"type":"shape","shape":"ellipse","x":100,"y":150,"width":50,"height":50,"fill":"transparent","stroke":"#ffffff","strokeWidth":2},{"type":"shape","shape":"ellipse","x":200,"y":150,"width":50,"height":50,"fill":"transparent","stroke":"#ffffff","strokeWidth":2},{"type":"text","content":"MIX TAPE","x":80,"y":260,"fontSize":28,"fill":"#ffd700","fontFamily":"monospace"}]}',
   NULL, TRUE, ARRAY['retro','cassette','80s','music','nostalgia'], 'retro', '32mm',
   1556, 201),

  ('b0000000-0000-0000-0000-000000000008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
   'VHS Glitch', 'Tracking errors and scan lines from a bygone era of analog media.',
   '{"version":1,"background":"#0d0d0d","layers":[{"type":"shape","shape":"rect","x":0,"y":50,"width":300,"height":3,"fill":"#00ffff","opacity":0.8},{"type":"shape","shape":"rect","x":0,"y":150,"width":300,"height":2,"fill":"#ff0000","opacity":0.6},{"type":"shape","shape":"rect","x":0,"y":250,"width":300,"height":4,"fill":"#ffff00","opacity":0.5},{"type":"text","content":"PLAY ▶","x":20,"y":340,"fontSize":18,"fill":"#ffffff","fontFamily":"monospace","opacity":0.7}]}',
   NULL, TRUE, ARRAY['vhs','glitch','retro','analog'], 'retro', '34mm',
   978, 134),

  -- ProDecks designs
  ('b0000000-0000-0000-0000-000000000009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
   'Carbon Fiber Pro', 'Premium carbon fiber texture with precision-cut accent lines. Built for performance.',
   '{"version":1,"background":"#1a1a1a","layers":[{"type":"shape","shape":"rect","x":0,"y":0,"width":300,"height":400,"fill":"#2a2a2a","opacity":0.5},{"type":"shape","shape":"rect","x":140,"y":0,"width":4,"height":400,"fill":"#ccff00","opacity":0.9},{"type":"text","content":"PRO","x":40,"y":350,"fontSize":64,"fill":"#ccff00","fontFamily":"Impact"}]}',
   NULL, TRUE, ARRAY['carbon','pro','competition','premium','texture'], 'pro', '34mm',
   3210, 445),

  ('b0000000-0000-0000-0000-000000000010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
   'Stealth Matte', 'Murdered-out matte black with subtle geometric etching. Silent but deadly.',
   '{"version":1,"background":"#0a0a0a","layers":[{"type":"shape","shape":"rect","x":50,"y":50,"width":200,"height":300,"fill":"transparent","stroke":"#333333","strokeWidth":1},{"type":"shape","shape":"rect","x":70,"y":70,"width":160,"height":260,"fill":"transparent","stroke":"#222222","strokeWidth":1},{"type":"text","content":"STEALTH","x":55,"y":210,"fontSize":32,"fill":"#333333","fontFamily":"Impact"}]}',
   NULL, TRUE, ARRAY['black','matte','stealth','minimal'], 'pro', '32mm',
   2187, 312),

  -- GlitchArt designs
  ('b0000000-0000-0000-0000-000000000011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
   'Glitch Matrix', 'Corrupted pixel patterns and matrix-style code rain. Error has never looked so good.',
   '{"version":1,"background":"#0d1117","layers":[{"type":"text","content":"01001","x":20,"y":40,"fontSize":14,"fill":"#00ff00","fontFamily":"monospace","opacity":0.4},{"type":"text","content":"11010","x":80,"y":80,"fontSize":14,"fill":"#00ff00","fontFamily":"monospace","opacity":0.3},{"type":"text","content":"GLITCH","x":30,"y":200,"fontSize":48,"fill":"#ff0040","fontFamily":"Impact"},{"type":"shape","shape":"rect","x":0,"y":195,"width":300,"height":8,"fill":"#00ffff","opacity":0.3}]}',
   NULL, TRUE, ARRAY['glitch','digital','matrix','pixel','cyber'], 'edgy', '32mm',
   1823, 267),

  -- LineWork designs
  ('b0000000-0000-0000-0000-000000000012', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07',
   'Botanical Line Art', 'Delicate botanical illustrations with fine line work on cream. Nature meets minimalism.',
   '{"version":1,"background":"#fdf6e3","layers":[{"type":"shape","shape":"ellipse","x":100,"y":60,"width":100,"height":140,"fill":"transparent","stroke":"#2d4a3e","strokeWidth":1.5},{"type":"shape","shape":"rect","x":148,"y":200,"width":2,"height":120,"fill":"#2d4a3e"},{"type":"shape","shape":"ellipse","x":120,"y":140,"width":60,"height":80,"fill":"transparent","stroke":"#2d4a3e","strokeWidth":1}]}',
   NULL, TRUE, ARRAY['botanical','line-art','nature','minimal','illustration'], 'minimal', '32mm',
   756, 134),

  ('b0000000-0000-0000-0000-000000000013', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07',
   'Geometric Fauna', 'Low-poly animal portraits built from triangles and clean lines.',
   '{"version":1,"background":"#ffffff","layers":[{"type":"shape","shape":"rect","x":80,"y":60,"width":140,"height":120,"fill":"transparent","stroke":"#1a1a1a","strokeWidth":1},{"type":"shape","shape":"rect","x":120,"y":100,"width":60,"height":80,"fill":"transparent","stroke":"#1a1a1a","strokeWidth":1},{"type":"text","content":"FAUNA","x":80,"y":280,"fontSize":36,"fill":"#1a1a1a","fontFamily":"serif"}]}',
   NULL, TRUE, ARRAY['geometric','animals','line-art','polygon'], 'minimal', '34mm',
   412, 67),

  -- AcidArt designs
  ('b0000000-0000-0000-0000-000000000014', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08',
   'Acid Drip', 'Psychedelic acid-washed design with dripping colors and warped typography.',
   '{"version":1,"background":"#ff6b00","layers":[{"type":"shape","shape":"ellipse","x":80,"y":40,"width":140,"height":140,"fill":"#ff00ff","opacity":0.6},{"type":"shape","shape":"ellipse","x":120,"y":120,"width":120,"height":120,"fill":"#00ffff","opacity":0.5},{"type":"shape","shape":"ellipse","x":60,"y":200,"width":160,"height":100,"fill":"#ffff00","opacity":0.4},{"type":"text","content":"ACID","x":60,"y":320,"fontSize":56,"fill":"#ffffff","fontFamily":"Impact"}]}',
   NULL, TRUE, ARRAY['psychedelic','acid','drip','colorful','trippy'], 'retro', '34mm',
   2456, 321),

  ('b0000000-0000-0000-0000-000000000015', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08',
   'Neon Wave', 'Synthwave sunset with palm silhouettes and neon grid horizon.',
   '{"version":1,"background":"linear-gradient(#0a0020,#1a0040,#ff006e)","layers":[{"type":"shape","shape":"rect","x":0,"y":200,"width":300,"height":200,"fill":"#1a0040","opacity":0.8},{"type":"shape","shape":"ellipse","x":100,"y":180,"width":100,"height":100,"fill":"#ff006e","opacity":0.7},{"type":"text","content":"WAVE","x":60,"y":320,"fontSize":48,"fill":"#00ffff","fontFamily":"Impact"}]}',
   NULL, TRUE, ARRAY['synthwave','neon','sunset','retro','vaporwave'], 'retro', '32mm',
   1890, 256)
ON CONFLICT (id) DO NOTHING;


-- ─── 5. MARKETPLACE DESIGNS ─────────────────────────────────────────────────────

INSERT INTO marketplace_designs (id, user_id, title, description, file_url, thumbnail_url, price, license_type, tags, category, views, downloads, favorites, featured_until, published, created_at) VALUES
  -- NeonArtist listings
  ('c0000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
   'Midnight Grind', 'Dark urban design with gritty textures and neon highlights. Perfect for night riders who own the streets after dark.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01/midnight-grind.png',
   'https://picsum.photos/seed/midnight-grind/400/600',
   0.00, 'personal',
   ARRAY['dark','urban','neon','gritty'], 'street',
   1580, 412, 167, NULL, TRUE,
   NOW() - INTERVAL '80 days'),

  ('c0000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
   'Neon Wave', 'Synthwave-inspired neon gradients with retro grid perspective. Ride the wave into the future past.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01/neon-wave.png',
   'https://picsum.photos/seed/neon-wave/400/600',
   1.99, 'commercial',
   ARRAY['neon','synthwave','retro','gradient','vaporwave'], 'retro',
   2340, 634, 289, NOW() + INTERVAL '30 days', TRUE,
   NOW() - INTERVAL '70 days'),

  -- TokyoDesigns listings
  ('c0000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
   'Tokyo Drift', 'Japanese street racing inspired with kanji typography and speed line accents. Built for the streets.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02/tokyo-drift.png',
   'https://picsum.photos/seed/tokyo-drift/400/600',
   2.49, 'commercial',
   ARRAY['japanese','street','drift','speed','kanji'], 'street',
   3150, 789, 356, NOW() + INTERVAL '45 days', TRUE,
   NOW() - INTERVAL '100 days'),

  ('c0000000-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
   'Rising Sun', 'Clean Japanese rising sun motif with modern geometric overlays. East meets minimal.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02/rising-sun.png',
   'https://picsum.photos/seed/rising-sun/400/600',
   1.49, 'personal',
   ARRAY['japanese','sun','geometric','clean'], 'minimal',
   1120, 287, 145, NULL, TRUE,
   NOW() - INTERVAL '85 days'),

  -- RetroRipper listings
  ('c0000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
   'Retro Cassette', 'Nostalgic 80s cassette tape design with mixtape label and magnetic tape details. Rewind the good times.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04/retro-cassette.png',
   'https://picsum.photos/seed/retro-cassette/400/600',
   2.99, 'commercial',
   ARRAY['retro','cassette','80s','music','nostalgia'], 'retro',
   1890, 456, 213, NULL, TRUE,
   NOW() - INTERVAL '130 days'),

  ('c0000000-0000-0000-0000-000000000006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
   'Arcade Fever', '8-bit pixel art tribute to golden age arcade games. Insert coin to continue.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04/arcade-fever.png',
   'https://picsum.photos/seed/arcade-fever/400/600',
   1.99, 'personal',
   ARRAY['arcade','pixel','8bit','retro','gaming'], 'retro',
   1345, 367, 178, NULL, TRUE,
   NOW() - INTERVAL '110 days'),

  -- ProDecks listings
  ('c0000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
   'Carbon Fiber Pro', 'Premium carbon fiber texture with precision-cut accent lines and competition-ready branding.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05/carbon-fiber-pro.png',
   'https://picsum.photos/seed/carbon-fiber/400/600',
   4.99, 'unlimited',
   ARRAY['carbon','pro','competition','premium','texture'], 'pro',
   4230, 1023, 512, NOW() + INTERVAL '60 days', TRUE,
   NOW() - INTERVAL '180 days'),

  ('c0000000-0000-0000-0000-000000000008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
   'Stealth Ops', 'Murdered-out matte black with tactical markings. Silent but deadly performance graphics.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05/stealth-ops.png',
   'https://picsum.photos/seed/stealth-ops/400/600',
   3.49, 'commercial',
   ARRAY['black','matte','tactical','stealth','military'], 'pro',
   2780, 645, 334, NULL, TRUE,
   NOW() - INTERVAL '150 days'),

  -- GlitchArt listings
  ('c0000000-0000-0000-0000-000000000009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
   'Glitch Matrix', 'Digital glitch art with corrupted pixel patterns and matrix-style code rain.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06/glitch-matrix.png',
   'https://picsum.photos/seed/glitch-matrix/400/600',
   1.49, 'personal',
   ARRAY['glitch','digital','matrix','pixel','cyber'], 'edgy',
   1920, 534, 278, NULL, TRUE,
   NOW() - INTERVAL '40 days'),

  -- LineWork listings
  ('c0000000-0000-0000-0000-000000000010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07',
   'Botanical Line Art', 'Delicate botanical illustrations with fine line work on a cream background. Nature meets minimalism.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07/botanical-line-art.png',
   'https://picsum.photos/seed/botanical-line/400/600',
   0.00, 'personal',
   ARRAY['botanical','line-art','nature','minimal','illustration'], 'minimal',
   867, 234, 145, NULL, TRUE,
   NOW() - INTERVAL '25 days'),

  -- AcidArt listings
  ('c0000000-0000-0000-0000-000000000011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08',
   'Acid Drip', 'Psychedelic acid-washed design with dripping colors and warped typography. Turn up the volume.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08/acid-drip.png',
   'https://picsum.photos/seed/acid-drip/400/600',
   1.99, 'commercial',
   ARRAY['psychedelic','acid','drip','colorful','trippy'], 'edgy',
   2670, 712, 334, NULL, TRUE,
   NOW() - INTERVAL '90 days'),

  ('c0000000-0000-0000-0000-000000000012', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08',
   'Mushroom Cloud', 'Surreal mushroom forest with bioluminescent glow. Deep in the fungi dimension.',
   'marketplace-designs/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08/mushroom-cloud.png',
   'https://picsum.photos/seed/mushroom-cloud/400/600',
   0.99, 'personal',
   ARRAY['mushroom','surreal','glow','nature','psychedelic'], 'edgy',
   1450, 389, 201, NULL, TRUE,
   NOW() - INTERVAL '75 days')
ON CONFLICT (id) DO NOTHING;


-- ─── 6. MARKETPLACE PURCHASES ───────────────────────────────────────────────────
-- Needed before reviews (reviews require a valid purchase).

INSERT INTO marketplace_purchases (id, design_id, buyer_id, price_paid, purchased_at) VALUES
  -- SkaterKid purchases
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 2.49, NOW() - INTERVAL '20 days'),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 4.99, NOW() - INTERVAL '18 days'),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 2.99, NOW() - INTERVAL '15 days'),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 1.99, NOW() - INTERVAL '10 days'),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 1.99, NOW() - INTERVAL '8 days'),

  -- DeckCollector purchases
  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 4.99, NOW() - INTERVAL '35 days'),
  ('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 2.49, NOW() - INTERVAL '32 days'),
  ('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 3.49, NOW() - INTERVAL '28 days'),
  ('e0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 2.99, NOW() - INTERVAL '22 days'),
  ('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 1.99, NOW() - INTERVAL '18 days'),
  ('e0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 1.49, NOW() - INTERVAL '14 days'),
  ('e0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000012', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 0.99, NOW() - INTERVAL '10 days'),

  -- Designers buying each other's work
  ('e0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 4.99, NOW() - INTERVAL '60 days'),
  ('e0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 2.49, NOW() - INTERVAL '55 days'),
  ('e0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 1.99, NOW() - INTERVAL '50 days'),
  ('e0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 1.99, NOW() - INTERVAL '45 days')
ON CONFLICT (design_id, buyer_id) DO NOTHING;


-- ─── 7. MARKETPLACE REVIEWS ─────────────────────────────────────────────────────
-- Each review must have a corresponding purchase.

INSERT INTO marketplace_reviews (id, design_id, user_id, rating, comment, created_at) VALUES
  -- Reviews for Tokyo Drift (c...03)
  ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09',
   5, 'Absolutely fire design. The kanji details are so clean and the speed lines add real energy. My favorite deck graphic ever.', NOW() - INTERVAL '19 days'),
  ('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
   5, 'Tokyo Designs never misses. The quality is incredible and it looks even better printed on the deck. Worth every penny.', NOW() - INTERVAL '30 days'),
  ('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
   4, 'Great street-style design. Colors pop nicely. Would love to see more in this series.', NOW() - INTERVAL '50 days'),

  -- Reviews for Carbon Fiber Pro (c...07)
  ('f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09',
   5, 'The carbon fiber texture is SO realistic. Looks premium on any setup. If you ride competitive, this is the one.', NOW() - INTERVAL '16 days'),
  ('f0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
   5, 'Best pro design on the marketplace. The accent line placement is perfect. Worth the premium price.', NOW() - INTERVAL '33 days'),
  ('f0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
   4, 'Clean execution. The carbon weave pattern is well done. Only wish there were more color accent options.', NOW() - INTERVAL '58 days'),

  -- Reviews for Retro Cassette (c...05)
  ('f0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09',
   4, 'Love the nostalgia factor. The mixtape label detail is a nice touch. Takes me back to the good old days.', NOW() - INTERVAL '13 days'),
  ('f0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
   5, 'RetroRipper killed it with this one. The tape reel details are perfect. Instant classic.', NOW() - INTERVAL '20 days'),

  -- Reviews for Neon Wave (c...02)
  ('f0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09',
   4, 'The synthwave vibes are strong with this one. Gradient colors are smooth and eye-catching. Great at night.', NOW() - INTERVAL '8 days'),
  ('f0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08',
   5, 'Fellow neon lover here. This design is gorgeous. The retro grid perspective really makes it pop. A+', NOW() - INTERVAL '42 days'),

  -- Reviews for Acid Drip (c...11)
  ('f0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09',
   5, 'The colors on this are unreal. Every time I look at it I notice new details in the drip patterns. Psychedelic perfection.', NOW() - INTERVAL '6 days'),
  ('f0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
   4, 'Really unique art style. Stands out from everything else in my collection. The warped text is a cool detail.', NOW() - INTERVAL '16 days'),
  ('f0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
   5, 'As a fellow retro artist I respect this work. The color blending is masterful. Acid Art Co. delivers again.', NOW() - INTERVAL '48 days'),

  -- Reviews for Stealth Ops (c...08)
  ('f0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
   5, 'The matte finish idea is brilliant for a deck graphic. Subtle tactical details are chef''s kiss. Premium feel.', NOW() - INTERVAL '26 days'),

  -- Reviews for Glitch Matrix (c...09)
  ('f0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
   4, 'The corrupted pixel effect is really well done. Looks great under any lighting. Solid digital art piece.', NOW() - INTERVAL '12 days'),

  -- Reviews for Mushroom Cloud (c...12)
  ('f0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000012', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
   5, 'The bioluminescent glow effect is something else. So creative. My most complimented deck graphic by far.', NOW() - INTERVAL '8 days')
ON CONFLICT (design_id, user_id) DO NOTHING;


-- ─── 8. MARKETPLACE FAVORITES ───────────────────────────────────────────────────

INSERT INTO marketplace_favorites (user_id, design_id, favorited_at) VALUES
  -- SkaterKid favorites
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'c0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '21 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'c0000000-0000-0000-0000-000000000007', NOW() - INTERVAL '19 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'c0000000-0000-0000-0000-000000000011', NOW() - INTERVAL '9 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'c0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'c0000000-0000-0000-0000-000000000010', NOW() - INTERVAL '5 days'),

  -- DeckCollector favorites
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'c0000000-0000-0000-0000-000000000007', NOW() - INTERVAL '36 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'c0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '34 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'c0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '24 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'c0000000-0000-0000-0000-000000000011', NOW() - INTERVAL '19 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'c0000000-0000-0000-0000-000000000012', NOW() - INTERVAL '11 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'c0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '8 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'c0000000-0000-0000-0000-000000000008', NOW() - INTERVAL '6 days'),

  -- Designer cross-favorites
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'c0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '70 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'c0000000-0000-0000-0000-000000000007', NOW() - INTERVAL '65 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'c0000000-0000-0000-0000-000000000011', NOW() - INTERVAL '55 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'c0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '58 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'c0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '35 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'c0000000-0000-0000-0000-000000000009', NOW() - INTERVAL '30 days')
ON CONFLICT (user_id, design_id) DO NOTHING;


-- ─── 9. DESIGN LIKES (Gallery) ──────────────────────────────────────────────────
-- These are for the public gallery designs, not marketplace.

INSERT INTO public.design_likes (user_id, design_id, created_at) VALUES
  -- Likes on NeonArtist gallery designs
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '20 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '18 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'b0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '12 days'),

  -- Likes on TokyoDesigns gallery designs
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'b0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '22 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '19 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'b0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '14 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '10 days'),

  -- Likes on ProDecks gallery designs
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'b0000000-0000-0000-0000-000000000009', NOW() - INTERVAL '25 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0000000-0000-0000-0000-000000000009', NOW() - INTERVAL '23 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'b0000000-0000-0000-0000-000000000009', NOW() - INTERVAL '20 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'b0000000-0000-0000-0000-000000000009', NOW() - INTERVAL '16 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0000000-0000-0000-0000-000000000010', NOW() - INTERVAL '13 days'),

  -- Likes on other gallery designs
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'b0000000-0000-0000-0000-000000000007', NOW() - INTERVAL '17 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0000000-0000-0000-0000-000000000011', NOW() - INTERVAL '11 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'b0000000-0000-0000-0000-000000000014', NOW() - INTERVAL '8 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0000000-0000-0000-0000-000000000014', NOW() - INTERVAL '6 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'b0000000-0000-0000-0000-000000000014', NOW() - INTERVAL '4 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'b0000000-0000-0000-0000-000000000015', NOW() - INTERVAL '3 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0000000-0000-0000-0000-000000000012', NOW() - INTERVAL '5 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'b0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '9 days')
ON CONFLICT (user_id, design_id) DO NOTHING;


-- ─── 10. FINGERPARK PROJECTS ────────────────────────────────────────────────────

INSERT INTO fingerpark_projects (id, user_id, name, description, objects, thumbnail_url, is_public, created_at) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09',
   'Backyard Mini Park',
   'Simple home setup with a flatbar and quarter pipe. Perfect for learning basics.',
   '[{"id":"obj1","type":"flatbar","x":2,"y":0,"z":0,"rotation":0,"scale":1},{"id":"obj2","type":"quarter_pipe","x":-3,"y":0,"z":1,"rotation":90,"scale":1},{"id":"obj3","type":"kicker","x":1,"y":0,"z":-2,"rotation":0,"scale":0.8}]',
   NULL, TRUE, NOW() - INTERVAL '20 days'),

  ('f1000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
   'Street Plaza',
   'Urban-style plaza with ledges, stairs, and manual pads. Inspired by real street spots.',
   '[{"id":"obj1","type":"ledge","x":0,"y":0,"z":0,"rotation":0,"scale":1.2},{"id":"obj2","type":"stairs","x":3,"y":0,"z":0,"rotation":0,"scale":1},{"id":"obj3","type":"manual_pad","x":-2,"y":0,"z":2,"rotation":45,"scale":1},{"id":"obj4","type":"ledge","x":0,"y":0,"z":4,"rotation":90,"scale":1},{"id":"obj5","type":"rail","x":4,"y":0,"z":3,"rotation":0,"scale":1}]',
   NULL, TRUE, NOW() - INTERVAL '30 days'),

  ('f1000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
   'Competition Bowl',
   'Full competition-spec bowl with deep end, shallow end, and coping. Built for vert tricks.',
   '[{"id":"obj1","type":"bowl","x":0,"y":0,"z":0,"rotation":0,"scale":2},{"id":"obj2","type":"coping","x":0,"y":1.5,"z":0,"rotation":0,"scale":2},{"id":"obj3","type":"platform","x":4,"y":0,"z":0,"rotation":0,"scale":1},{"id":"obj4","type":"rail","x":5,"y":0,"z":2,"rotation":90,"scale":0.8}]',
   NULL, TRUE, NOW() - INTERVAL '45 days'),

  ('f1000000-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
   'Tokyo Night Spot',
   'Neon-lit urban spot inspired by Tokyo side streets. Tight lines and technical features.',
   '[{"id":"obj1","type":"flatbar","x":0,"y":0,"z":0,"rotation":30,"scale":1},{"id":"obj2","type":"kicker","x":2,"y":0,"z":1,"rotation":0,"scale":0.7},{"id":"obj3","type":"ledge","x":-1,"y":0,"z":3,"rotation":0,"scale":0.9},{"id":"obj4","type":"manual_pad","x":3,"y":0,"z":-1,"rotation":60,"scale":1},{"id":"obj5","type":"stairs","x":-3,"y":0,"z":0,"rotation":180,"scale":0.8},{"id":"obj6","type":"rail","x":1,"y":0,"z":-3,"rotation":45,"scale":1}]',
   NULL, TRUE, NOW() - INTERVAL '60 days'),

  ('f1000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
   'Retro Ramp Park',
   'Old-school ramp park with half pipe, launch ramps, and a fun box. 80s vibes only.',
   '[{"id":"obj1","type":"half_pipe","x":0,"y":0,"z":0,"rotation":0,"scale":1.5},{"id":"obj2","type":"kicker","x":4,"y":0,"z":0,"rotation":0,"scale":1},{"id":"obj3","type":"kicker","x":-4,"y":0,"z":0,"rotation":180,"scale":1},{"id":"obj4","type":"funbox","x":0,"y":0,"z":4,"rotation":0,"scale":1},{"id":"obj5","type":"rail","x":2,"y":0,"z":-3,"rotation":0,"scale":1.2}]',
   NULL, TRUE, NOW() - INTERVAL '80 days')
ON CONFLICT (id) DO NOTHING;


-- ─── 11. MARKETPLACE FOLLOWS ────────────────────────────────────────────────────

INSERT INTO marketplace_follows (follower_id, following_id, followed_at) VALUES
  -- SkaterKid follows top designers
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', NOW() - INTERVAL '22 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', NOW() - INTERVAL '21 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', NOW() - INTERVAL '9 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', NOW() - INTERVAL '7 days'),

  -- DeckCollector follows everyone
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', NOW() - INTERVAL '38 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', NOW() - INTERVAL '35 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', NOW() - INTERVAL '30 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', NOW() - INTERVAL '20 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', NOW() - INTERVAL '15 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', NOW() - INTERVAL '14 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', NOW() - INTERVAL '12 days'),

  -- Designer mutual follows
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', NOW() - INTERVAL '80 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', NOW() - INTERVAL '78 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', NOW() - INTERVAL '70 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', NOW() - INTERVAL '68 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', NOW() - INTERVAL '40 days')
ON CONFLICT (follower_id, following_id) DO NOTHING;


-- ─── DONE ───────────────────────────────────────────────────────────────────────
-- Seed data loaded successfully.
-- 10 users, 8 designer profiles, 15 gallery designs, 12 marketplace listings,
-- 16 purchases, 16 reviews, 18 favorites, 22 likes, 5 fingerpark projects,
-- 16 follows.
