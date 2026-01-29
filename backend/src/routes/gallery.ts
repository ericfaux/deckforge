import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';

const app = new Hono();

// Middleware to extract user (optional for gallery - some endpoints are public)
async function getUser(authHeader: string | undefined) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// GET /gallery - List public designs
app.get('/', async (c) => {
  const sort = c.req.query('sort') || 'recent'; // recent, popular, liked
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  let query = supabaseAdmin
    .from('designs')
    .select('id, name, description, canvas_data, thumbnail_url, view_count, like_count, created_at, updated_at')
    .eq('is_public', true)
    .range(offset, offset + limit - 1);

  // Apply sorting
  if (sort === 'popular') {
    query = query.order('view_count', { ascending: false });
  } else if (sort === 'liked') {
    query = query.order('like_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ designs: data, count: data?.length || 0 });
});

// GET /gallery/:designId - View public design (increments view count)
app.get('/:designId', async (c) => {
  const designId = c.req.param('designId');

  // Get design
  const { data: design, error } = await supabaseAdmin
    .from('designs')
    .select('*')
    .eq('id', designId)
    .eq('is_public', true)
    .single();

  if (error || !design) {
    return c.json({ error: 'Design not found' }, 404);
  }

  // Increment view count (fire and forget)
  supabaseAdmin
    .from('designs')
    .update({ view_count: (design.view_count || 0) + 1 })
    .eq('id', designId)
    .then();

  return c.json({ design });
});

// POST /gallery/:designId/like - Like a design
app.post('/:designId/like', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const designId = c.req.param('designId');

  // Check if already liked
  const { data: existing } = await supabaseAdmin
    .from('design_likes')
    .select('id')
    .eq('design_id', designId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return c.json({ error: 'Already liked' }, 400);
  }

  // Add like
  const { error: likeError } = await supabaseAdmin
    .from('design_likes')
    .insert({ design_id: designId, user_id: user.id });

  if (likeError) {
    return c.json({ error: likeError.message }, 500);
  }

  // Increment like count on design
  const { data: design } = await supabaseAdmin
    .from('designs')
    .select('like_count')
    .eq('id', designId)
    .single();

  await supabaseAdmin
    .from('designs')
    .update({ like_count: (design?.like_count || 0) + 1 })
    .eq('id', designId);

  return c.json({ success: true });
});

// DELETE /gallery/:designId/like - Unlike a design
app.delete('/:designId/like', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const designId = c.req.param('designId');

  // Remove like
  const { error: unlikeError } = await supabaseAdmin
    .from('design_likes')
    .delete()
    .eq('design_id', designId)
    .eq('user_id', user.id);

  if (unlikeError) {
    return c.json({ error: unlikeError.message }, 500);
  }

  // Decrement like count on design
  const { data: design } = await supabaseAdmin
    .from('designs')
    .select('like_count')
    .eq('id', designId)
    .single();

  if (design && design.like_count > 0) {
    await supabaseAdmin
      .from('designs')
      .update({ like_count: design.like_count - 1 })
      .eq('id', designId);
  }

  return c.json({ success: true });
});

// GET /gallery/:designId/liked - Check if user liked design
app.get('/:designId/liked', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ liked: false });
  }

  const designId = c.req.param('designId');

  const { data } = await supabaseAdmin
    .from('design_likes')
    .select('id')
    .eq('design_id', designId)
    .eq('user_id', user.id)
    .single();

  return c.json({ liked: !!data });
});

// PATCH /gallery/:designId/visibility - Toggle public visibility (owner only)
app.patch('/:designId/visibility', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const designId = c.req.param('designId');
  const body = await c.req.json();
  const { is_public } = body;

  // Update design (RLS ensures only owner can do this)
  const { error } = await supabaseAdmin
    .from('designs')
    .update({ is_public })
    .eq('id', designId)
    .eq('user_id', user.id);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true, is_public });
});

export default app;
