import axios from 'axios';

// Use VITE_BACKEND_URL (same as api.ts) for consistency
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

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
  async list(): Promise<Font[]> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE}/api/fonts`, {
      headers: { Authorization: `Bearer ${token}` },
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

// Preload all user fonts
export async function preloadUserFonts() {
  try {
    const fonts = await fontsApi.list();
    await Promise.all(fonts.map(loadFont));
    // Combine user fonts with system defaults
    return [...DEFAULT_FONTS, ...fonts];
  } catch (error) {
    console.error('Failed to preload fonts:', error);
    // Return at least system fonts on error
    return DEFAULT_FONTS;
  }
}
