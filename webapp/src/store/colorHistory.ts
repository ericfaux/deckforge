import { create } from 'zustand';

const MAX_RECENT = 14;
const LS_KEY = 'deckforge-recent-colors';
const RAPID_MS = 300;

/** Only accept #RGB or #RRGGBB hex strings */
function isValidHex(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

let lastAddTime = 0;

export const useColorHistory = create<{
  recentColors: string[];
  addColor: (color: string) => void;
}>((set, get) => ({
  recentColors: (() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      return stored.filter((c: string) => isValidHex(c)).slice(0, MAX_RECENT);
    } catch {
      return [];
    }
  })(),
  addColor: (color) => {
    if (!color || !isValidHex(color)) return;

    const now = Date.now();
    const colors = get().recentColors;

    let updated: string[];
    if (now - lastAddTime < RAPID_MS && colors.length > 0) {
      // Rapid successive call (e.g. dragging color picker) — replace the
      // most-recent entry instead of pushing a new one every frame.
      const rest = colors.slice(1).filter(c => c.toLowerCase() !== color.toLowerCase());
      updated = [color, ...rest].slice(0, MAX_RECENT);
    } else {
      const rest = colors.filter(c => c.toLowerCase() !== color.toLowerCase());
      updated = [color, ...rest].slice(0, MAX_RECENT);
    }

    lastAddTime = now;
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    set({ recentColors: updated });
  },
}));
