// API client for DeckForge backend
import { createClient } from '@supabase/supabase-js';
import { compressImage, formatFileSize } from './image-compression';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
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

// Assets API
export const assetsAPI = {
  async list() {
    const response = await apiRequest('/api/assets');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list assets');
    }

    return response.json();
  },

  async getUploadUrl(filename: string, contentType: string) {
    const response = await apiRequest('/api/assets/upload-url', {
      method: 'POST',
      body: JSON.stringify({ filename, contentType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    return response.json();
  },

  async create(asset: {
    name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    width?: number;
    height?: number;
  }) {
    const response = await apiRequest('/api/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create asset');
    }

    return response.json();
  },

  async delete(id: string) {
    const response = await apiRequest(`/api/assets/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete asset');
    }

    return response.json();
  },

  async upload(file: File): Promise<{url: string; width: number; height: number; originalSize?: number; compressedSize?: number}> {
    const originalSize = file.size;

    // Compress image before upload (if applicable)
    let fileToUpload = file;
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      try {
        const compressedFile = await compressImage(file, {
          maxWidth: 2048,
          maxHeight: 2048,
          quality: 0.85,
          maxSizeMB: 2,
        });
        
        fileToUpload = compressedFile;
        
        // Log compression results
        if (compressedFile.size < originalSize) {
          const savings = ((1 - compressedFile.size / originalSize) * 100).toFixed(1);
          console.log(
            `Image compressed: ${formatFileSize(originalSize)} → ${formatFileSize(compressedFile.size)} (${savings}% smaller)`
          );
        }
      } catch (error) {
        console.warn('Image compression failed, uploading original:', error);
        // Continue with original file if compression fails
      }
    }

    // Get signed upload URL
    const { uploadUrl, path } = await this.getUploadUrl(fileToUpload.name, fileToUpload.type);

    // Upload file directly to Supabase Storage
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: fileToUpload,
      headers: {
        'Content-Type': fileToUpload.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(fileToUpload);

    // Construct public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/user-assets/${path}`;

    // Record in database
    await this.create({
      name: fileToUpload.name,
      file_url: publicUrl,
      file_type: fileToUpload.type,
      file_size: fileToUpload.size,
      width: dimensions.width,
      height: dimensions.height,
    });

    return {
      url: publicUrl,
      width: dimensions.width,
      height: dimensions.height,
      originalSize,
      compressedSize: fileToUpload.size,
    };
  },
};

// Helper: Get image dimensions from file
function getImageDimensions(file: File): Promise<{width: number; height: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

// Brand Kits API (Premium feature)
export const brandKitsAPI = {
  async list() {
    const response = await apiRequest('/api/brand-kits');
    if (!response.ok) {
      throw new Error('Failed to list brand kits');
    }
    return response.json();
  },

  async create(kit: { name: string; description?: string; colors: string[]; fonts?: any[]; is_default?: boolean }) {
    const response = await apiRequest('/api/brand-kits', {
      method: 'POST',
      body: JSON.stringify(kit),
    });
    if (!response.ok) {
      throw new Error('Failed to create brand kit');
    }
    return response.json();
  },

  async update(id: string, updates: Partial<{ name: string; description: string; colors: string[]; fonts: any[]; is_default: boolean }>) {
    const response = await apiRequest(`/api/brand-kits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update brand kit');
    }
    return response.json();
  },

  async delete(id: string) {
    const response = await apiRequest(`/api/brand-kits/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete brand kit');
    }
    return response.json();
  },
};
