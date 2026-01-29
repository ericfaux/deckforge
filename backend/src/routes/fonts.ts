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

// GET /fonts - List user's uploaded fonts
app.get('/', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const { data, error } = await supabaseAdmin
    .from('fonts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ fonts: data });
});

// POST /fonts/upload-url - Get pre-signed upload URL for font file
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
  
  // Validate content type (only fonts)
  const validTypes = ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/x-font-ttf', 'application/x-font-otf'];
  if (!validTypes.includes(contentType) && !filename.match(/\.(ttf|otf|woff|woff2)$/i)) {
    return c.json({ error: 'Only font files are allowed (.ttf, .otf, .woff, .woff2)' }, 400);
  }
  
  // Generate unique filename
  const timestamp = Date.now();
  const ext = filename.split('.').pop();
  const uniqueFilename = `${user.id}/fonts/${timestamp}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
  
  // Create signed upload URL
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

// POST /fonts - Record uploaded font in database
app.post('/', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  const { name, file_url, font_family, file_type, file_size } = body;
  
  if (!name || !file_url || !font_family) {
    return c.json({ error: 'name, file_url, and font_family required' }, 400);
  }
  
  const { data, error } = await supabaseAdmin
    .from('fonts')
    .insert({
      user_id: user.id,
      name,
      file_url,
      font_family,
      file_type,
      file_size,
    })
    .select()
    .single();
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ font: data }, 201);
});

// DELETE /fonts/:id - Delete font
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Get font to find file path
  const { data: font } = await supabaseAdmin
    .from('fonts')
    .select('file_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (!font) {
    return c.json({ error: 'Font not found' }, 404);
  }
  
  // Delete from storage
  const path = font.file_url.split('/user-assets/')[1];
  if (path) {
    await supabaseAdmin.storage.from('user-assets').remove([path]);
  }
  
  // Delete from database
  const { error } = await supabaseAdmin
    .from('fonts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

export default app;
