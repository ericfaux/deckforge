import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';

const app = new Hono();

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

// GET /tags - List user's tags
app.get('/', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const { data, error } = await supabaseAdmin
    .from('design_tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ tags: data });
});

// POST /tags - Create tag
app.post('/', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  const { name, color } = body;
  
  if (!name || !name.trim()) {
    return c.json({ error: 'Tag name required' }, 400);
  }
  
  const { data, error } = await supabaseAdmin
    .from('design_tags')
    .insert({
      user_id: user.id,
      name: name.trim().toLowerCase(),
      color: color || '#00ffff',
    })
    .select()
    .single();
  
  if (error) {
    // Handle duplicate tag name
    if (error.code === '23505') {
      return c.json({ error: 'Tag already exists' }, 400);
    }
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ tag: data }, 201);
});

// DELETE /tags/:id - Delete tag
app.delete('/:id', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const tagId = c.req.param('id');
  
  const { error } = await supabaseAdmin
    .from('design_tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', user.id);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

// GET /tags/design/:designId - Get tags for a design
app.get('/design/:designId', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const designId = c.req.param('designId');
  
  const { data, error } = await supabaseAdmin
    .from('design_tag_assignments')
    .select('tag_id, design_tags(*)')
    .eq('design_id', designId);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  const tags = data?.map((item: any) => item.design_tags) || [];
  
  return c.json({ tags });
});

// POST /tags/:id/designs/:designId - Assign tag to design
app.post('/:id/designs/:designId', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const tagId = c.req.param('id');
  const designId = c.req.param('designId');
  
  // Verify design ownership
  const { data: design } = await supabaseAdmin
    .from('designs')
    .select('id')
    .eq('id', designId)
    .eq('user_id', user.id)
    .single();
  
  if (!design) {
    return c.json({ error: 'Design not found' }, 404);
  }
  
  const { error } = await supabaseAdmin
    .from('design_tag_assignments')
    .insert({ design_id: designId, tag_id: tagId });
  
  if (error) {
    // Ignore if already assigned
    if (error.code === '23505') {
      return c.json({ success: true });
    }
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

// DELETE /tags/:id/designs/:designId - Remove tag from design
app.delete('/:id/designs/:designId', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const tagId = c.req.param('id');
  const designId = c.req.param('designId');
  
  const { error } = await supabaseAdmin
    .from('design_tag_assignments')
    .delete()
    .eq('design_id', designId)
    .eq('tag_id', tagId);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

export default app;
