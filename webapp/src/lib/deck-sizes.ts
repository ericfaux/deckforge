/**
 * Standard fingerboard deck sizes based on industry standards
 * Sources: Berlinwood, Blackriver, Teak Tuning
 * 
 * Real-world dimensions in millimeters
 * Canvas dimensions are scaled 3x for better resolution
 */

export interface DeckSize {
  id: string;
  name: string;
  width: number; // Real width in mm
  length: number; // Real length in mm
  canvasWidth: number; // Canvas units (3x scale)
  canvasHeight: number; // Canvas units (3x scale)
  description: string;
  recommended: string;
}

// Scale factor: canvas units per mm
const SCALE_FACTOR = 3;

export const DECK_SIZES: DeckSize[] = [
  {
    id: '29mm',
    name: '29mm',
    width: 29,
    length: 96,
    canvasWidth: 29 * SCALE_FACTOR,
    canvasHeight: 96 * SCALE_FACTOR,
    description: 'Narrow deck for smaller hands',
    recommended: 'Beginners, younger riders',
  },
  {
    id: '32mm',
    name: '32mm',
    width: 32,
    length: 96,
    canvasWidth: 32 * SCALE_FACTOR,
    canvasHeight: 96 * SCALE_FACTOR,
    description: 'Industry standard width',
    recommended: 'Most popular, balanced performance',
  },
  {
    id: '33mm',
    name: '33mm',
    width: 33,
    length: 97,
    canvasWidth: 33 * SCALE_FACTOR,
    canvasHeight: 97 * SCALE_FACTOR,
    description: 'Sweet spot for many riders',
    recommended: 'Smooth transition, versatile',
  },
  {
    id: '33.3mm',
    name: '33.3mm',
    width: 33.3,
    length: 97,
    canvasWidth: Math.round(33.3 * SCALE_FACTOR),
    canvasHeight: 97 * SCALE_FACTOR,
    description: 'Pro deck width',
    recommended: 'Advanced riders, more control',
  },
  {
    id: '34mm',
    name: '34mm',
    width: 34,
    length: 97,
    canvasWidth: 34 * SCALE_FACTOR,
    canvasHeight: 97 * SCALE_FACTOR,
    description: 'Wide deck for larger fingers',
    recommended: 'Better control, wider surface',
  },
  {
    id: '36mm',
    name: '36mm',
    width: 36,
    length: 100,
    canvasWidth: 36 * SCALE_FACTOR,
    canvasHeight: 100 * SCALE_FACTOR,
    description: 'Extra wide deck',
    recommended: 'Maximum control, larger hands',
  },
];

// Default size (industry standard)
export const DEFAULT_DECK_SIZE = DECK_SIZES[1]; // 32mm

// Legacy support (old dimensions)
export const LEGACY_DECK_SIZE: DeckSize = {
  id: 'legacy',
  name: 'Legacy (96x294)',
  width: 32,
  length: 98,
  canvasWidth: 96,
  canvasHeight: 294,
  description: 'Original DeckForge dimensions',
  recommended: 'For existing designs',
};

/**
 * Get deck size by ID
 */
export function getDeckSize(id: string): DeckSize {
  return DECK_SIZES.find(s => s.id === id) || DEFAULT_DECK_SIZE;
}

/**
 * Calculate aspect ratio for a deck size
 */
export function getAspectRatio(size: DeckSize): number {
  return size.canvasWidth / size.canvasHeight;
}

/**
 * Get print dimensions in mm for export
 */
export function getPrintDimensions(size: DeckSize) {
  return {
    width: size.width,
    height: size.length,
    unit: 'mm' as const,
  };
}
