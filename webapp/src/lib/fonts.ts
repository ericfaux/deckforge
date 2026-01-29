import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    const response = await axios.get(`${API_BASE}/fonts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.fonts;
  },

  // Get signed upload URL
  async getUploadUrl(filename: string, contentType: string) {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE}/fonts/upload-url`,
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
    const response = await axios.post(`${API_BASE}/fonts`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.font;
  },

  // Delete font
  async delete(id: string) {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE}/fonts/${id}`, {
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

// Preload all user fonts
export async function preloadUserFonts() {
  try {
    const fonts = await fontsApi.list();
    await Promise.all(fonts.map(loadFont));
    return fonts;
  } catch (error) {
    console.error('Failed to preload fonts:', error);
    return [];
  }
}
