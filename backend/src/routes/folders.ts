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

// GET /folders - List user's folders
app.get('/', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const { data, error } = await supabaseAdmin
    .from('design_folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ folders: data });
});

// POST /folders - Create folder
app.post('/', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  const { name, color } = body;
  
  if (!name || !name.trim()) {
    return c.json({ error: 'Folder name required' }, 400);
  }
  
  const { data, error } = await supabaseAdmin
    .from('design_folders')
    .insert({
      user_id: user.id,
      name: name.trim(),
      color: color || '#ccff00',
    })
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ folder: data }, 201);
});

// PATCH /folders/:id - Update folder
app.patch('/:id', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const folderId = c.req.param('id');
  const body = await c.req.json();
  const { name, color } = body;
  
  const updates: any = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name.trim();
  if (color !== undefined) updates.color = color;
  
  const { data, error } = await supabaseAdmin
    .from('design_folders')
    .update(updates)
    .eq('id', folderId)
    .eq('user_id', user.id)
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ folder: data });
});

// DELETE /folders/:id - Delete folder
app.delete('/:id', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const folderId = c.req.param('id');
  
  const { error } = await supabaseAdmin
    .from('design_folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', user.id);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

// POST /folders/:id/designs/:designId - Move design to folder
app.post('/:id/designs/:designId', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const folderId = c.req.param('id');
  const designId = c.req.param('designId');
  
  const { error } = await supabaseAdmin
    .from('designs')
    .update({ folder_id: folderId })
    .eq('id', designId)
    .eq('user_id', user.id);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

// DELETE /folders/:id/designs/:designId - Remove design from folder
app.delete('/:id/designs/:designId', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const designId = c.req.param('designId');
  
  const { error } = await supabaseAdmin
    .from('designs')
    .update({ folder_id: null })
    .eq('id', designId)
    .eq('user_id', user.id);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

export default app;
