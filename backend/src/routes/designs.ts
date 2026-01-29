import { Hono } from 'hono';
import { supabaseAdmin, createSupabaseClient } from '../lib/supabase';

const app = new Hono();

// Middleware to extract user from Authorization header
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

// GET /designs - List user's designs
app.get('/', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const { data, error } = await supabaseAdmin
    .from('designs')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ designs: data });
});

// GET /designs/:id - Get single design
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = await getUser(c.req.header('Authorization'));
  
  const { data, error } = await supabaseAdmin
    .from('designs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    return c.json({ error: 'Design not found' }, 404);
  }
  
  // Check if user owns this design or if it's public
  if (data.user_id !== user?.id && !data.is_public) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  return c.json({ design: data });
});

// POST /designs - Create new design
app.post('/', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  
  const { data, error } = await supabaseAdmin
    .from('designs')
    .insert({
      user_id: user.id,
      name: body.name || 'Untitled Design',
      description: body.description || null,
      canvas_data: body.canvas_data,
      thumbnail_url: body.thumbnail_url || null,
      is_public: body.is_public || false,
    })
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ design: data }, 201);
});

// PATCH /designs/:id - Update design
app.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  
  // First check ownership
  const { data: existing } = await supabaseAdmin
    .from('designs')
    .select('user_id')
    .eq('id', id)
    .single();
  
  if (!existing || existing.user_id !== user.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  const { data, error } = await supabaseAdmin
    .from('designs')
    .update({
      name: body.name,
      description: body.description,
      canvas_data: body.canvas_data,
      thumbnail_url: body.thumbnail_url,
      is_public: body.is_public,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ design: data });
});

// DELETE /designs/:id - Delete design
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const { error } = await supabaseAdmin
    .from('designs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

export default app;
