import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';

const app = new Hono();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /auth/signup - Create new user account
app.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    const validated = signupSchema.parse(body);

    // Create user with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true, // Auto-confirm for now
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    // Create profile if username provided
    if (validated.username && data.user) {
      await supabaseAdmin.from('profiles').insert({
        id: data.user.id,
        username: validated.username,
        display_name: validated.username,
      });
    }

    // Sign in to get session
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

    if (sessionError) {
      return c.json({ error: sessionError.message }, 400);
    }

    return c.json({
      user: sessionData.user,
      session: sessionData.session,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: err.issues }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /auth/login - Sign in existing user
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const validated = loginSchema.parse(body);

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: err.issues }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /auth/logout - Sign out user
app.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  const { error } = await supabaseAdmin.auth.admin.signOut(token);

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ success: true });
});

// GET /auth/me - Get current user info
app.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  // Get profile data
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return c.json({
    user: {
      ...user,
      profile,
    },
  });
});

// POST /auth/refresh - Refresh access token
app.post('/refresh', async (c) => {
  const body = await c.req.json();
  const { refresh_token } = body;

  if (!refresh_token) {
    return c.json({ error: 'Refresh token required' }, 400);
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token,
  });

  if (error) {
    return c.json({ error: error.message }, 401);
  }

  return c.json({
    session: data.session,
  });
});

export default app;
