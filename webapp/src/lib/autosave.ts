import type { CanvasObject, TextureOverlay } from '@/store/deckforge';

const AUTOSAVE_KEY = 'deckforge_autosave';
const MAX_VERSIONS = 3;

export interface AutosaveData {
  timestamp: number;
  objects: CanvasObject[];
  textureOverlays: TextureOverlay[];
  backgroundColor: string;
  backgroundFillType?: 'solid' | 'gradient' | 'linear-gradient' | 'radial-gradient';
  backgroundGradient?: {
    startColor: string;
    endColor: string;
    direction: 'linear' | 'radial';
    angle: number;
    stops?: Array<{ offset: number; color: string }>;
    centerX?: number;
    centerY?: number;
    radius?: number;
  };
  deckSizeId: string;
  designName: string;
}

interface AutosaveEntry {
  version: number;
  data: AutosaveData;
}

function getStoredVersions(): AutosaveEntry[] {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveVersions(versions: AutosaveEntry[]): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(versions));
  } catch (e) {
    // localStorage may be full; remove oldest and retry
    if (versions.length > 1) {
      saveVersions(versions.slice(1));
    }
  }
}

/**
 * Save design state to localStorage. Keeps last MAX_VERSIONS saves.
 */
export function saveToLocalStorage(data: AutosaveData): void {
  const versions = getStoredVersions();
  const nextVersion = versions.length > 0
    ? Math.max(...versions.map(v => v.version)) + 1
    : 1;

  const newEntry: AutosaveEntry = {
    version: nextVersion,
    data: { ...data, timestamp: Date.now() },
  };

  const updated = [...versions, newEntry].slice(-MAX_VERSIONS);
  saveVersions(updated);
}

/**
 * Get the most recent autosave data, if any.
 */
export function getLatestAutosave(): AutosaveData | null {
  const versions = getStoredVersions();
  if (versions.length === 0) return null;
  return versions[versions.length - 1].data;
}

/**
 * Check if there is any autosave data available.
 */
export function hasAutosaveData(): boolean {
  return getStoredVersions().length > 0;
}

/**
 * Clear all autosave data from localStorage.
 */
export function clearAutosaveData(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
}

/**
 * Get a formatted timestamp string from an autosave entry.
 */
export function formatAutosaveTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return `today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
