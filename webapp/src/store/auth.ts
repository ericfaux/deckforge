import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, setAuthToken, getAuthToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  profile?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  signup: (email: string, password: string, username?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signup: async (email, password, username) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authAPI.signup(email, password, username);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Signup failed',
            isLoading: false,
          });
          throw err;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authAPI.login(email, password);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Login failed',
            isLoading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await authAPI.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Logout failed',
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        const token = getAuthToken();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const data = await authAPI.me();
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'deckforge-auth',
      partialize: (state) => ({
        // Only persist the token, not the full user object
        // User will be re-fetched on page load
      }),
    }
  )
);
