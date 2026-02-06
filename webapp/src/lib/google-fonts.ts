// Google Fonts integration service
// Provides a curated list of popular Google Fonts with categories,
// localStorage caching, and dynamic font loading via Google Fonts CSS API.

export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
export type FontSort = 'popular' | 'trending' | 'recent';

export interface GoogleFont {
  family: string;
  category: FontCategory;
  variants: string[];  // e.g., ['300', '400', '700', 'italic']
  popularity: number;  // lower = more popular
}

// Top 10 fonts to preload for offline/fast access
export const TOP_FONTS: string[] = [
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Poppins',
  'Inter',
  'Raleway',
  'Playfair Display',
  'Bebas Neue',
];

const CACHE_KEY = 'deckforge_google_fonts';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Curated list of ~160 popular Google Fonts
const CURATED_FONTS: GoogleFont[] = [
  // Sans-Serif (sorted by popularity)
  { family: 'Roboto', category: 'sans-serif', variants: ['100', '300', '400', '500', '700', '900'], popularity: 1 },
  { family: 'Open Sans', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'], popularity: 2 },
  { family: 'Lato', category: 'sans-serif', variants: ['100', '300', '400', '700', '900'], popularity: 4 },
  { family: 'Montserrat', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 5 },
  { family: 'Poppins', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 6 },
  { family: 'Inter', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 7 },
  { family: 'Raleway', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 9 },
  { family: 'Nunito', category: 'sans-serif', variants: ['200', '300', '400', '500', '600', '700', '800', '900'], popularity: 10 },
  { family: 'Rubik', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800', '900'], popularity: 11 },
  { family: 'Work Sans', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 12 },
  { family: 'Nunito Sans', category: 'sans-serif', variants: ['200', '300', '400', '500', '600', '700', '800', '900'], popularity: 13 },
  { family: 'Fira Sans', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 14 },
  { family: 'Quicksand', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'], popularity: 15 },
  { family: 'Barlow', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 16 },
  { family: 'Mulish', category: 'sans-serif', variants: ['200', '300', '400', '500', '600', '700', '800', '900'], popularity: 17 },
  { family: 'IBM Plex Sans', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700'], popularity: 18 },
  { family: 'Kanit', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 19 },
  { family: 'Manrope', category: 'sans-serif', variants: ['200', '300', '400', '500', '600', '700', '800'], popularity: 20 },
  { family: 'DM Sans', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 21 },
  { family: 'Josefin Sans', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700'], popularity: 22 },
  { family: 'Outfit', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 23 },
  { family: 'Figtree', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800', '900'], popularity: 24 },
  { family: 'Titillium Web', category: 'sans-serif', variants: ['200', '300', '400', '600', '700', '900'], popularity: 25 },
  { family: 'Karla', category: 'sans-serif', variants: ['200', '300', '400', '500', '600', '700', '800'], popularity: 26 },
  { family: 'Heebo', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 27 },
  { family: 'Libre Franklin', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 28 },
  { family: 'Source Sans 3', category: 'sans-serif', variants: ['200', '300', '400', '500', '600', '700', '800', '900'], popularity: 29 },
  { family: 'Cabin', category: 'sans-serif', variants: ['400', '500', '600', '700'], popularity: 30 },
  { family: 'Exo 2', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 31 },
  { family: 'Space Grotesk', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'], popularity: 32 },
  { family: 'Assistant', category: 'sans-serif', variants: ['200', '300', '400', '500', '600', '700', '800'], popularity: 33 },
  { family: 'Archivo', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 34 },
  { family: 'Overpass', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 35 },
  { family: 'Lexend', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 36 },

  // Serif
  { family: 'Noto Serif', category: 'serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 3 },
  { family: 'Playfair Display', category: 'serif', variants: ['400', '500', '600', '700', '800', '900'], popularity: 8 },
  { family: 'Merriweather', category: 'serif', variants: ['300', '400', '700', '900'], popularity: 37 },
  { family: 'PT Serif', category: 'serif', variants: ['400', '700'], popularity: 38 },
  { family: 'Lora', category: 'serif', variants: ['400', '500', '600', '700'], popularity: 39 },
  { family: 'Libre Baskerville', category: 'serif', variants: ['400', '700'], popularity: 40 },
  { family: 'EB Garamond', category: 'serif', variants: ['400', '500', '600', '700', '800'], popularity: 41 },
  { family: 'Bitter', category: 'serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 42 },
  { family: 'Crimson Text', category: 'serif', variants: ['400', '600', '700'], popularity: 43 },
  { family: 'Cormorant Garamond', category: 'serif', variants: ['300', '400', '500', '600', '700'], popularity: 44 },
  { family: 'DM Serif Display', category: 'serif', variants: ['400'], popularity: 45 },
  { family: 'Vollkorn', category: 'serif', variants: ['400', '500', '600', '700', '800', '900'], popularity: 46 },
  { family: 'Spectral', category: 'serif', variants: ['200', '300', '400', '500', '600', '700', '800'], popularity: 47 },
  { family: 'Cardo', category: 'serif', variants: ['400', '700'], popularity: 48 },
  { family: 'Old Standard TT', category: 'serif', variants: ['400', '700'], popularity: 49 },
  { family: 'Alegreya', category: 'serif', variants: ['400', '500', '600', '700', '800', '900'], popularity: 50 },
  { family: 'Arvo', category: 'serif', variants: ['400', '700'], popularity: 51 },
  { family: 'Noto Serif Display', category: 'serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popularity: 52 },
  { family: 'Source Serif 4', category: 'serif', variants: ['200', '300', '400', '500', '600', '700', '800', '900'], popularity: 53 },
  { family: 'Cormorant', category: 'serif', variants: ['300', '400', '500', '600', '700'], popularity: 54 },
  { family: 'Frank Ruhl Libre', category: 'serif', variants: ['300', '400', '500', '700', '900'], popularity: 55 },
  { family: 'Bodoni Moda', category: 'serif', variants: ['400', '500', '600', '700', '800', '900'], popularity: 56 },
  { family: 'Zilla Slab', category: 'serif', variants: ['300', '400', '500', '600', '700'], popularity: 57 },

  // Display
  { family: 'Oswald', category: 'display', variants: ['200', '300', '400', '500', '600', '700'], popularity: 58 },
  { family: 'Bebas Neue', category: 'display', variants: ['400'], popularity: 59 },
  { family: 'Anton', category: 'display', variants: ['400'], popularity: 60 },
  { family: 'Abril Fatface', category: 'display', variants: ['400'], popularity: 61 },
  { family: 'Righteous', category: 'display', variants: ['400'], popularity: 62 },
  { family: 'Lobster', category: 'display', variants: ['400'], popularity: 63 },
  { family: 'Teko', category: 'display', variants: ['300', '400', '500', '600', '700'], popularity: 64 },
  { family: 'Alfa Slab One', category: 'display', variants: ['400'], popularity: 65 },
  { family: 'Fredoka', category: 'display', variants: ['300', '400', '500', '600', '700'], popularity: 66 },
  { family: 'Passion One', category: 'display', variants: ['400', '700', '900'], popularity: 67 },
  { family: 'Bungee', category: 'display', variants: ['400'], popularity: 68 },
  { family: 'Black Ops One', category: 'display', variants: ['400'], popularity: 69 },
  { family: 'Bangers', category: 'display', variants: ['400'], popularity: 70 },
  { family: 'Russo One', category: 'display', variants: ['400'], popularity: 71 },
  { family: 'Fascinate Inline', category: 'display', variants: ['400'], popularity: 72 },
  { family: 'Press Start 2P', category: 'display', variants: ['400'], popularity: 73 },
  { family: 'Fugaz One', category: 'display', variants: ['400'], popularity: 74 },
  { family: 'Monoton', category: 'display', variants: ['400'], popularity: 75 },
  { family: 'Bungee Shade', category: 'display', variants: ['400'], popularity: 76 },
  { family: 'Londrina Solid', category: 'display', variants: ['100', '300', '400', '900'], popularity: 77 },
  { family: 'Staatliches', category: 'display', variants: ['400'], popularity: 78 },
  { family: 'Orbitron', category: 'display', variants: ['400', '500', '600', '700', '800', '900'], popularity: 79 },
  { family: 'Changa', category: 'display', variants: ['200', '300', '400', '500', '600', '700', '800'], popularity: 80 },
  { family: 'Secular One', category: 'display', variants: ['400'], popularity: 81 },
  { family: 'Audiowide', category: 'display', variants: ['400'], popularity: 82 },
  { family: 'Coda', category: 'display', variants: ['400', '800'], popularity: 83 },
  { family: 'Dela Gothic One', category: 'display', variants: ['400'], popularity: 84 },
  { family: 'Ultra', category: 'display', variants: ['400'], popularity: 85 },
  { family: 'Rampart One', category: 'display', variants: ['400'], popularity: 86 },
  { family: 'Bungee Inline', category: 'display', variants: ['400'], popularity: 87 },
  { family: 'Major Mono Display', category: 'display', variants: ['400'], popularity: 88 },

  // Handwriting
  { family: 'Dancing Script', category: 'handwriting', variants: ['400', '500', '600', '700'], popularity: 89 },
  { family: 'Pacifico', category: 'handwriting', variants: ['400'], popularity: 90 },
  { family: 'Caveat', category: 'handwriting', variants: ['400', '500', '600', '700'], popularity: 91 },
  { family: 'Satisfy', category: 'handwriting', variants: ['400'], popularity: 92 },
  { family: 'Permanent Marker', category: 'handwriting', variants: ['400'], popularity: 93 },
  { family: 'Great Vibes', category: 'handwriting', variants: ['400'], popularity: 94 },
  { family: 'Kalam', category: 'handwriting', variants: ['300', '400', '700'], popularity: 95 },
  { family: 'Shadows Into Light', category: 'handwriting', variants: ['400'], popularity: 96 },
  { family: 'Sacramento', category: 'handwriting', variants: ['400'], popularity: 97 },
  { family: 'Indie Flower', category: 'handwriting', variants: ['400'], popularity: 98 },
  { family: 'Amatic SC', category: 'handwriting', variants: ['400', '700'], popularity: 99 },
  { family: 'Patrick Hand', category: 'handwriting', variants: ['400'], popularity: 100 },
  { family: 'Handlee', category: 'handwriting', variants: ['400'], popularity: 101 },
  { family: 'Architects Daughter', category: 'handwriting', variants: ['400'], popularity: 102 },
  { family: 'Courgette', category: 'handwriting', variants: ['400'], popularity: 103 },
  { family: 'Covered By Your Grace', category: 'handwriting', variants: ['400'], popularity: 104 },
  { family: 'Gloria Hallelujah', category: 'handwriting', variants: ['400'], popularity: 105 },
  { family: 'Yellowtail', category: 'handwriting', variants: ['400'], popularity: 106 },
  { family: 'Rock Salt', category: 'handwriting', variants: ['400'], popularity: 107 },
  { family: 'Damion', category: 'handwriting', variants: ['400'], popularity: 108 },
  { family: 'Homemade Apple', category: 'handwriting', variants: ['400'], popularity: 109 },
  { family: 'Alex Brush', category: 'handwriting', variants: ['400'], popularity: 110 },
  { family: 'Kaushan Script', category: 'handwriting', variants: ['400'], popularity: 111 },
  { family: 'Reenie Beanie', category: 'handwriting', variants: ['400'], popularity: 112 },
  { family: 'Bad Script', category: 'handwriting', variants: ['400'], popularity: 113 },
  { family: 'Nothing You Could Do', category: 'handwriting', variants: ['400'], popularity: 114 },
  { family: 'Tangerine', category: 'handwriting', variants: ['400', '700'], popularity: 115 },
  { family: 'Allura', category: 'handwriting', variants: ['400'], popularity: 116 },

  // Monospace
  { family: 'Roboto Mono', category: 'monospace', variants: ['100', '200', '300', '400', '500', '600', '700'], popularity: 117 },
  { family: 'Source Code Pro', category: 'monospace', variants: ['200', '300', '400', '500', '600', '700', '800', '900'], popularity: 118 },
  { family: 'Fira Code', category: 'monospace', variants: ['300', '400', '500', '600', '700'], popularity: 119 },
  { family: 'JetBrains Mono', category: 'monospace', variants: ['100', '200', '300', '400', '500', '600', '700', '800'], popularity: 120 },
  { family: 'IBM Plex Mono', category: 'monospace', variants: ['100', '200', '300', '400', '500', '600', '700'], popularity: 121 },
  { family: 'Space Mono', category: 'monospace', variants: ['400', '700'], popularity: 122 },
  { family: 'Inconsolata', category: 'monospace', variants: ['200', '300', '400', '500', '600', '700', '800', '900'], popularity: 123 },
  { family: 'Ubuntu Mono', category: 'monospace', variants: ['400', '700'], popularity: 124 },
  { family: 'PT Mono', category: 'monospace', variants: ['400'], popularity: 125 },
  { family: 'Anonymous Pro', category: 'monospace', variants: ['400', '700'], popularity: 126 },
  { family: 'Cousine', category: 'monospace', variants: ['400', '700'], popularity: 127 },
  { family: 'Share Tech Mono', category: 'monospace', variants: ['400'], popularity: 128 },
  { family: 'VT323', category: 'monospace', variants: ['400'], popularity: 129 },
  { family: 'Cutive Mono', category: 'monospace', variants: ['400'], popularity: 130 },
];

interface CachedFontData {
  fonts: GoogleFont[];
  timestamp: number;
}

/**
 * Get the Google Fonts list, using localStorage cache (24h TTL).
 */
export function getGoogleFonts(): GoogleFont[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data: CachedFontData = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data.fonts;
      }
    }
  } catch {
    // Cache read failed, use curated list
  }

  // Store in cache
  try {
    const cacheData: CachedFontData = {
      fonts: CURATED_FONTS,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Cache write failed (quota exceeded, etc.)
  }

  return CURATED_FONTS;
}

/**
 * Filter fonts by category.
 */
export function filterByCategory(fonts: GoogleFont[], category: FontCategory | 'all'): GoogleFont[] {
  if (category === 'all') return fonts;
  return fonts.filter((f) => f.category === category);
}

/**
 * Search fonts by name.
 */
export function searchFonts(fonts: GoogleFont[], query: string): GoogleFont[] {
  if (!query.trim()) return fonts;
  const lower = query.toLowerCase();
  return fonts.filter((f) => f.family.toLowerCase().includes(lower));
}

/**
 * Sort fonts.
 */
export function sortFonts(fonts: GoogleFont[], sort: FontSort): GoogleFont[] {
  const sorted = [...fonts];
  switch (sort) {
    case 'popular':
      return sorted.sort((a, b) => a.popularity - b.popularity);
    case 'trending':
      // Approximate trending by mixing popularity with category diversity
      return sorted.sort((a, b) => {
        const aScore = a.popularity + (a.category === 'display' ? -20 : 0);
        const bScore = b.popularity + (b.category === 'display' ? -20 : 0);
        return aScore - bScore;
      });
    case 'recent':
      // Reverse popularity as proxy for "newer" fonts
      return sorted.sort((a, b) => b.popularity - a.popularity);
    default:
      return sorted;
  }
}

// Track loaded fonts to avoid duplicate loads
const loadedFonts = new Set<string>();

/**
 * Load a Google Font dynamically by injecting a <link> for the Google Fonts CSS.
 */
export function loadGoogleFont(family: string, variants?: string[]): Promise<void> {
  if (loadedFonts.has(family)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const weights = variants?.filter(v => /^\d+$/.test(v)).join(';') || '400;700';
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights}&display=swap`;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.crossOrigin = 'anonymous';

    link.onload = () => {
      loadedFonts.add(family);
      resolve();
    };
    link.onerror = () => {
      reject(new Error(`Failed to load font: ${family}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Load a Google Font for preview (lightweight, only regular weight).
 */
export function loadGoogleFontPreview(family: string): Promise<void> {
  const previewKey = `preview:${family}`;
  if (loadedFonts.has(previewKey) || loadedFonts.has(family)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400&display=swap&text=${encodeURIComponent(family)}`;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.crossOrigin = 'anonymous';

    link.onload = () => {
      loadedFonts.add(previewKey);
      resolve();
    };
    link.onerror = () => {
      // Non-critical - preview just won't render in custom font
      resolve();
    };

    document.head.appendChild(link);
  });
}

/**
 * Preload the top 10 popular Google Fonts for fast access / offline fallback.
 */
export function preloadTopFonts(): void {
  const weights = '300;400;500;600;700';
  const families = TOP_FONTS.map(f => `family=${encodeURIComponent(f)}:wght@${weights}`).join('&');
  const url = `https://fonts.googleapis.com/css2?${families}&display=swap`;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.crossOrigin = 'anonymous';

  link.onload = () => {
    TOP_FONTS.forEach(f => loadedFonts.add(f));
  };

  document.head.appendChild(link);
}

/**
 * Check if a font is already loaded.
 */
export function isFontLoaded(family: string): boolean {
  return loadedFonts.has(family) || loadedFonts.has(`preview:${family}`);
}

/**
 * Get the recently used fonts from localStorage.
 */
export function getRecentFonts(): string[] {
  try {
    const data = localStorage.getItem('deckforge_recent_fonts');
    if (data) return JSON.parse(data);
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Add a font to the recently used list.
 */
export function addRecentFont(family: string): void {
  const recent = getRecentFonts().filter(f => f !== family);
  recent.unshift(family);
  // Keep max 20 recent fonts
  const trimmed = recent.slice(0, 20);
  try {
    localStorage.setItem('deckforge_recent_fonts', JSON.stringify(trimmed));
  } catch {
    // Ignore
  }
}

/**
 * Load all Google Fonts used in a set of canvas objects (for design restoration).
 */
export function loadFontsForObjects(objects: Array<{ type?: string; fontFamily?: string }>): void {
  const fonts = getGoogleFonts();
  const families = new Set<string>();

  for (const obj of objects) {
    if (obj.type === 'text' && obj.fontFamily) {
      families.add(obj.fontFamily);
    }
  }

  for (const family of families) {
    const gFont = fonts.find(f => f.family === family);
    if (gFont) {
      loadGoogleFont(family, gFont.variants);
    }
  }
}

/**
 * Category display labels.
 */
export const CATEGORY_LABELS: Record<FontCategory | 'all', string> = {
  all: 'All',
  'sans-serif': 'Sans-Serif',
  serif: 'Serif',
  display: 'Display',
  handwriting: 'Handwriting',
  monospace: 'Monospace',
};
