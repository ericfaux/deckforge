import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';

const app = new Hono();

// Middleware to extract user (for authenticated routes)
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

// Generate random share token
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// POST /share/:designId - Create or get share link for a design
app.post('/:designId', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const designId = c.req.param('designId');
  
  // Verify user owns this design
  const { data: design, error: fetchError } = await supabaseAdmin
    .from('designs')
    .select('id, user_id, share_token')
    .eq('id', designId)
    .eq('user_id', user.id)
    .single();
  
  if (fetchError || !design) {
    return c.json({ error: 'Design not found or access denied' }, 404);
  }
  
  // If design already has a share token, return it
  if (design.share_token) {
    return c.json({ 
      share_token: design.share_token,
      share_url: `${c.req.url.split('/api')[0]}/share/${design.share_token}`
    });
  }
  
  // Generate new share token
  const shareToken = generateShareToken();
  
  const { error: updateError } = await supabaseAdmin
    .from('designs')
    .update({ share_token: shareToken })
    .eq('id', designId);
  
  if (updateError) {
    return c.json({ error: updateError.message }, 500);
  }
  
  return c.json({ 
    share_token: shareToken,
    share_url: `${c.req.url.split('/api')[0]}/share/${shareToken}`
  });
});

// DELETE /share/:designId - Revoke share link
app.delete('/:designId', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const designId = c.req.param('designId');
  
  const { error } = await supabaseAdmin
    .from('designs')
    .update({ share_token: null })
    .eq('id', designId)
    .eq('user_id', user.id);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ success: true });
});

// GET /share/view/:token - Public endpoint to view shared design
app.get('/view/:token', async (c) => {
  const token = c.req.param('token');
  
  const { data: design, error } = await supabaseAdmin
    .from('designs')
    .select('id, name, canvas_data, created_at, updated_at')
    .eq('share_token', token)
    .single();
  
  if (error || !design) {
    return c.json({ error: 'Shared design not found' }, 404);
  }
  
  return c.json({ design });
});

export default app;
