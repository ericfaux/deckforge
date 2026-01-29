// API client for DeckForge backend
import { createClient } from '@supabase/supabase-js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hvulzgcqdwurrhaebhyy.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth state
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

// API request wrapper
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

// Auth API
export const authAPI = {
  async signup(email: string, password: string, username?: string) {
    const response = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    if (data.session?.access_token) {
      setAuthToken(data.session.access_token);
    }
    return data;
  },

  async login(email: string, password: string) {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    if (data.session?.access_token) {
      setAuthToken(data.session.access_token);
    }
    return data;
  },

  async logout() {
    const response = await apiRequest('/api/auth/logout', {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Logout failed');
    }

    setAuthToken(null);
    return response.json();
  },

  async me() {
    const response = await apiRequest('/api/auth/me');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user');
    }

    return response.json();
  },
};

// Designs API
export const designsAPI = {
  async list() {
    const response = await apiRequest('/api/designs');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list designs');
    }

    return response.json();
  },

  async get(id: string) {
    const response = await apiRequest(`/api/designs/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get design');
    }

    return response.json();
  },

  async create(design: {
    name: string;
    description?: string;
    canvas_data: any;
    thumbnail_url?: string;
    is_public?: boolean;
  }) {
    const response = await apiRequest('/api/designs', {
      method: 'POST',
      body: JSON.stringify(design),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create design');
    }

    return response.json();
  },

  async update(id: string, updates: {
    name?: string;
    description?: string;
    canvas_data?: any;
    thumbnail_url?: string;
    is_public?: boolean;
  }) {
    const response = await apiRequest(`/api/designs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update design');
    }

    return response.json();
  },

  async delete(id: string) {
    const response = await apiRequest(`/api/designs/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete design');
    }

    return response.json();
  },
};
