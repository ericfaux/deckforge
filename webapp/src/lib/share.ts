import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface ShareResponse {
  share_token: string;
  share_url: string;
}

export interface SharedDesign {
  id: string;
  name: string;
  canvas_data: any;
  created_at: string;
  updated_at: string;
}

export const shareAPI = {
  // Create or get share link
  async createShareLink(designId: string): Promise<ShareResponse> {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE}/api/share/${designId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Revoke share link
  async revokeShareLink(designId: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE}/api/share/${designId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get shared design (public, no auth)
  async getSharedDesign(shareToken: string): Promise<SharedDesign> {
    const response = await axios.get(`${API_BASE}/api/share/view/${shareToken}`);
    return response.data.design;
  },
};

// Generate embed code
export function generateEmbedCode(shareToken: string, width = 400, height = 600): string {
  const baseUrl = window.location.origin;
  return `<iframe src="${baseUrl}/share/${shareToken}" width="${width}" height="${height}" frameborder="0" style="border: 2px solid #000; border-radius: 4px;"></iframe>`;
}

// Copy to clipboard helper
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}
