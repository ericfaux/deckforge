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

// GET /comments/:designId - Get all comments for a design
app.get('/:designId', async (c) => {
  const designId = c.req.param('designId');

  const { data, error } = await supabaseAdmin
    .from('design_comments')
    .select('*')
    .eq('design_id', designId)
    .order('created_at', { ascending: true });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ comments: data });
});

// POST /comments/:designId - Add a comment
app.post('/:designId', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const designId = c.req.param('designId');
  const body = await c.req.json();
  const { content, parent_comment_id } = body;

  if (!content || !content.trim()) {
    return c.json({ error: 'Comment content required' }, 400);
  }

  const { data, error } = await supabaseAdmin
    .from('design_comments')
    .insert({
      design_id: designId,
      user_id: user.id,
      parent_comment_id: parent_comment_id || null,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ comment: data }, 201);
});

// PATCH /comments/:commentId - Update a comment
app.patch('/:commentId', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const commentId = c.req.param('commentId');
  const body = await c.req.json();
  const { content } = body;

  if (!content || !content.trim()) {
    return c.json({ error: 'Comment content required' }, 400);
  }

  const { data, error } = await supabaseAdmin
    .from('design_comments')
    .update({ content: content.trim(), updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ comment: data });
});

// DELETE /comments/:commentId - Delete a comment
app.delete('/:commentId', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const commentId = c.req.param('commentId');

  const { error } = await supabaseAdmin
    .from('design_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true });
});

export default app;
