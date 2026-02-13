import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export const foldersAPI = {
  async list(): Promise<Folder[]> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE}/api/folders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.folders;
  },

  async create(name: string, color?: string): Promise<Folder> {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE}/api/folders`,
      { name, color },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.folder;
  },

  async update(id: string, updates: { name?: string; color?: string }): Promise<Folder> {
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `${API_BASE}/api/folders/${id}`,
      updates,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.folder;
  },

  async delete(id: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE}/api/folders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async moveDesign(folderId: string, designId: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.post(
      `${API_BASE}/api/folders/${folderId}/designs/${designId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  async removeDesign(folderId: string, designId: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE}/api/folders/${folderId}/designs/${designId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export const tagsAPI = {
  async list(): Promise<Tag[]> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE}/api/tags`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.tags;
  },

  async create(name: string, color?: string): Promise<Tag> {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE}/api/tags`,
      { name, color },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.tag;
  },

  async delete(id: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE}/api/tags/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getForDesign(designId: string): Promise<Tag[]> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE}/api/tags/design/${designId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.tags;
  },

  async assignToDesign(tagId: string, designId: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.post(
      `${API_BASE}/api/tags/${tagId}/designs/${designId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  async removeFromDesign(tagId: string, designId: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE}/api/tags/${tagId}/designs/${designId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
