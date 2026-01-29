import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';

const app = new Hono();

// Middleware to extract user
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

// GET /assets - List user's uploaded assets
app.get('/', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const { data, error } = await supabaseAdmin
    .from('assets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ assets: data });
});

// POST /assets/upload-url - Get pre-signed upload URL
app.post('/upload-url', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  const { filename, contentType } = body;
  
  if (!filename || !contentType) {
    return c.json({ error: 'filename and contentType required' }, 400);
  }
  
  // Validate content type
  if (!contentType.startsWith('image/')) {
    return c.json({ error: 'Only images are allowed' }, 400);
  }
  
  // Generate unique filename
  const timestamp = Date.now();
  const ext = filename.split('.').pop();
  const uniqueFilename = `${user.id}/${timestamp}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
  
  // Create signed upload URL (expires in 5 minutes)
  const { data, error } = await supabaseAdmin.storage
    .from('user-assets')
    .createSignedUploadUrl(uniqueFilename);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({
    uploadUrl: data.signedUrl,
    path: uniqueFilename,
    token: data.token,
  });
});

// POST /assets - Record uploaded asset in database
app.post('/', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  const { name, file_url, file_type, file_size, width, height } = body;
  
  if (!name || !file_url) {
    return c.json({ error: 'name and file_url required' }, 400);
  }
  
  const { data, error } = await supabaseAdmin
    .from('assets')
    .insert({
      user_id: user.id,
      name,
      file_url,
      file_type,
      file_size,
      width,
      height,
    })
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ asset: data }, 201);
});

// DELETE /assets/:id - Delete asset
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Get asset to find file path
  const { data: asset } = await supabaseAdmin
    .from('assets')
    .select('file_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (!asset) {
    return c.json({ error: 'Asset not found' }, 404);
  }
  
  // Delete from storage
  const path = asset.file_url.split('/user-assets/')[1];
  if (path) {
    await supabaseAdmin.storage.from('user-assets').remove([path]);
  }
  
  // Delete from database
  const { error } = await supabaseAdmin
    .from('assets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

export default app;
