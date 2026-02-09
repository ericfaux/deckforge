import { create } from 'zustand';

const MAX_RECENT = 12;
const LS_KEY = 'deckforge-recent-colors';

export const useColorHistory = create<{
  recentColors: string[];
  addColor: (color: string) => void;
}>((set, get) => ({
  recentColors: (() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]').slice(0, MAX_RECENT);
    } catch {
      return [];
    }
  })(),
  addColor: (color) => {
    if (!color || color.length < 4) return;
    const colors = get().recentColors.filter(c => c.toLowerCase() !== color.toLowerCase());
    const updated = [color, ...colors].slice(0, MAX_RECENT);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    set({ recentColors: updated });
  },
}));
