import { Hono } from 'hono';
import { authenticateUser } from '../lib/auth';
import { supabaseAdmin as supabase } from '../lib/supabase';

const brandKitsRouter = new Hono();

/**
 * GET /api/brand-kits - List all brand kits for authenticated user
 */
brandKitsRouter.get('/', authenticateUser, async (c) => {
  try {
    const userId = c.get('userId');

    const { data, error } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({ kits: data || [] });
  } catch (error: any) {
    console.error('List brand kits error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/brand-kits - Create new brand kit
 */
brandKitsRouter.post('/', authenticateUser, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { name, description, colors, fonts, is_default } = body;

    if (!name || !colors || !Array.isArray(colors)) {
      return c.json({ error: 'Name and colors array required' }, 400);
    }

    // If setting as default, unset other defaults first
    if (is_default) {
      await supabase
        .from('brand_kits')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('brand_kits')
      .insert({
        user_id: userId,
        name,
        description: description || null,
        colors,
        fonts: fonts || [],
        is_default: is_default || false,
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ kit: data }, 201);
  } catch (error: any) {
    console.error('Create brand kit error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PATCH /api/brand-kits/:id - Update brand kit
 */
brandKitsRouter.patch('/:id', authenticateUser, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, description, colors, fonts, is_default } = body;

    // If setting as default, unset other defaults first
    if (is_default) {
      await supabase
        .from('brand_kits')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', id);
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (colors !== undefined) updates.colors = colors;
    if (fonts !== undefined) updates.fonts = fonts;
    if (is_default !== undefined) updates.is_default = is_default;

    const { data, error } = await supabase
      .from('brand_kits')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return c.json({ error: 'Brand kit not found' }, 404);
    }

    return c.json({ kit: data });
  } catch (error: any) {
    console.error('Update brand kit error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /api/brand-kits/:id - Delete brand kit
 */
brandKitsRouter.delete('/:id', authenticateUser, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const { error } = await supabase
      .from('brand_kits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete brand kit error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default brandKitsRouter;
