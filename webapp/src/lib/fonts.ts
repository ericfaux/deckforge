import axios from 'axios';

// Use VITE_BACKEND_URL (same as api.ts) for consistency
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const USER_FONTS_CACHE_KEY = 'deckforge_user_fonts';
const USER_FONTS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export interface Font {
  id: string;
  user_id: string;
  name: string;
  file_url: string;
  font_family: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

export const fontsApi = {
  // Get all user's fonts
  async list(signal?: AbortSignal): Promise<Font[]> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE}/api/fonts`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.fonts;
  },

  // Get signed upload URL
  async getUploadUrl(filename: string, contentType: string) {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE}/api/fonts/upload-url`,
      { filename, contentType },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Upload font file to signed URL
  async uploadFile(uploadUrl: string, file: File) {
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type },
    });
  },

  // Record uploaded font in database
  async create(data: {
    name: string;
    file_url: string;
    font_family: string;
    file_type?: string;
    file_size?: number;
  }): Promise<Font> {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE}/api/fonts`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.font;
  },

  // Delete font
  async delete(id: string) {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE}/api/fonts/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Full upload flow
  async uploadFont(file: File, fontName: string): Promise<Font> {
    // Step 1: Get signed upload URL
    const { uploadUrl, path } = await this.getUploadUrl(file.name, file.type);

    // Step 2: Upload file
    await this.uploadFile(uploadUrl, file);

    // Step 3: Record in database
    const fontFamily = fontName.replace(/\s+/g, '-').toLowerCase();
    const fileUrl = `${API_BASE.replace('/api', '')}/storage/v1/object/public/user-assets/${path}`;
    
    return await this.create({
      name: fontName,
      file_url: fileUrl,
      font_family: fontFamily,
      file_type: file.type,
      file_size: file.size,
    });
  },
};

// Load a font dynamically
export function loadFont(font: Font): Promise<void> {
  return new Promise((resolve, reject) => {
    const fontFace = new FontFace(font.font_family, `url(${font.file_url})`);
    
    fontFace
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        resolve();
      })
      .catch(reject);
  });
}

// Default system fonts as fallback
export const DEFAULT_FONTS: Font[] = [
  {
    id: 'system-arial',
    user_id: 'system',
    name: 'Arial',
    font_family: 'Arial, sans-serif',
    file_url: '',
    created_at: new Date().toISOString(),
  },
  {
    id: 'system-impact',
    user_id: 'system',
    name: 'Impact',
    font_family: 'Impact, fantasy',
    file_url: '',
    created_at: new Date().toISOString(),
  },
  {
    id: 'system-times',
    user_id: 'system',
    name: 'Times New Roman',
    font_family: '"Times New Roman", serif',
    file_url: '',
    created_at: new Date().toISOString(),
  },
  {
    id: 'system-courier',
    user_id: 'system',
    name: 'Courier New',
    font_family: '"Courier New", monospace',
    file_url: '',
    created_at: new Date().toISOString(),
  },
  {
    id: 'system-helvetica',
    user_id: 'system',
    name: 'Helvetica',
    font_family: 'Helvetica, Arial, sans-serif',
    file_url: '',
    created_at: new Date().toISOString(),
  },
];

// Get cached user fonts from localStorage
function getCachedUserFonts(): Font[] | null {
  try {
    const cached = localStorage.getItem(USER_FONTS_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached) as { fonts: Font[]; timestamp: number };
      if (Date.now() - data.timestamp < USER_FONTS_CACHE_DURATION) {
        return data.fonts;
      }
    }
  } catch {
    // Cache read failed
  }
  return null;
}

// Save user fonts to localStorage cache
function cacheUserFonts(fonts: Font[]): void {
  try {
    localStorage.setItem(
      USER_FONTS_CACHE_KEY,
      JSON.stringify({ fonts, timestamp: Date.now() })
    );
  } catch {
    // Cache write failed (quota exceeded, etc.)
  }
}

// Clear user fonts cache (call on logout or font changes)
export function clearUserFontsCache(): void {
  try {
    localStorage.removeItem(USER_FONTS_CACHE_KEY);
  } catch {
    // Ignore
  }
}

// Preload all user fonts
export async function preloadUserFonts(): Promise<{ fonts: Font[]; fromCache: boolean; error?: string }> {
  // Check if user is authenticated before making API call
  const token = localStorage.getItem('token');
  if (!token) {
    // Not authenticated - return system fonts only
    return { fonts: DEFAULT_FONTS, fromCache: false };
  }

  try {
    // Use AbortController for a 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const fonts = await fontsApi.list(controller.signal);
    clearTimeout(timeoutId);

    // Load font faces in parallel, but don't fail if some don't load
    await Promise.allSettled(fonts.map(loadFont));

    // Cache successful result
    cacheUserFonts(fonts);

    return { fonts: [...DEFAULT_FONTS, ...fonts], fromCache: false };
  } catch (error) {
    // Try localStorage cache as fallback
    const cached = getCachedUserFonts();
    if (cached && cached.length > 0) {
      // Silently load cached fonts
      await Promise.allSettled(cached.map(loadFont));
      console.warn('[Fonts] Using cached custom fonts (backend unreachable)');
      return { fonts: [...DEFAULT_FONTS, ...cached], fromCache: true };
    }

    // No cache available - log a concise warning instead of a scary error
    console.warn('[Fonts] Custom fonts unavailable — using system + Google Fonts');
    return { fonts: DEFAULT_FONTS, fromCache: false, error: 'offline' };
  }
}
