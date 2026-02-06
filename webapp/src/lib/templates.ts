import { CanvasObject } from '@/store/deckforge';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'street' | 'retro' | 'minimal' | 'edgy' | 'pro' | 'blank';
  thumbnail?: string;
  tags: string[];
  objects: Omit<CanvasObject, 'id'>[];
  author?: string;
}

// Canvas dimensions (legacy 96x294)
const W = 96;
const H = 294;

// ── Helper: full-deck background rect ──────────────────────────────────
function bg(fill: string): Omit<CanvasObject, 'id'> {
  return {
    type: 'shape', shapeType: 'rect',
    x: 0, y: 0, width: W, height: H,
    rotation: 0, opacity: 1, scaleX: 1, scaleY: 1,
    fill,
  };
}

function gradientBg(
  stops: Array<{ offset: number; color: string }>,
  angle = 180,
): Omit<CanvasObject, 'id'> {
  return {
    type: 'shape', shapeType: 'rect',
    x: 0, y: 0, width: W, height: H,
    rotation: 0, opacity: 1, scaleX: 1, scaleY: 1,
    fillType: 'linear-gradient',
    gradientStops: stops,
    gradientAngle: angle,
  };
}

function patternBg(
  patternType: CanvasObject['patternType'],
  primary: string,
  secondary: string,
  scale = 1,
): Omit<CanvasObject, 'id'> {
  return {
    type: 'shape', shapeType: 'rect',
    x: 0, y: 0, width: W, height: H,
    rotation: 0, opacity: 1, scaleX: 1, scaleY: 1,
    fill: primary,
    patternType,
    patternPrimaryColor: primary,
    patternSecondaryColor: secondary,
    patternScale: scale,
  };
}

function sticker(
  iconName: string,
  x: number, y: number,
  size: number,
  fill: string,
  opts: Partial<Omit<CanvasObject, 'id'>> = {},
): Omit<CanvasObject, 'id'> {
  return {
    type: 'sticker',
    x, y, width: size, height: size,
    rotation: 0, opacity: 1, scaleX: 1, scaleY: 1,
    iconName, fill,
    strokeWidth: 0, solidFill: true,
    ...opts,
  };
}

function text(
  content: string,
  x: number, y: number,
  w: number, h: number,
  fill: string,
  opts: Partial<Omit<CanvasObject, 'id'>> = {},
): Omit<CanvasObject, 'id'> {
  return {
    type: 'text',
    x, y, width: w, height: h,
    rotation: 0, opacity: 1, scaleX: 1, scaleY: 1,
    text: content, fill,
    fontSize: opts.fontSize || 10,
    fontFamily: opts.fontFamily || 'Impact',
    align: opts.align || 'center',
    textTransform: opts.textTransform || 'uppercase',
    ...opts,
  };
}

function rect(
  x: number, y: number, w: number, h: number,
  fill: string,
  opts: Partial<Omit<CanvasObject, 'id'>> = {},
): Omit<CanvasObject, 'id'> {
  return {
    type: 'shape', shapeType: 'rect',
    x, y, width: w, height: h,
    rotation: 0, opacity: 1, scaleX: 1, scaleY: 1,
    fill,
    ...opts,
  };
}

function circle(
  x: number, y: number, size: number,
  fill: string,
  opts: Partial<Omit<CanvasObject, 'id'>> = {},
): Omit<CanvasObject, 'id'> {
  return {
    type: 'shape', shapeType: 'circle',
    x, y, width: size, height: size,
    rotation: 0, opacity: 1, scaleX: 1, scaleY: 1,
    fill,
    ...opts,
  };
}

function line(
  x: number, y: number,
  endX: number, endY: number,
  stroke: string,
  strokeWidth = 1,
  opts: Partial<Omit<CanvasObject, 'id'>> = {},
): Omit<CanvasObject, 'id'> {
  return {
    type: 'line',
    x, y, width: Math.abs(endX), height: Math.abs(endY) || 1,
    rotation: 0, opacity: 1, scaleX: 1, scaleY: 1,
    lineType: 'straight',
    lineEndX: endX,
    lineEndY: endY,
    stroke,
    strokeWidth,
    ...opts,
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  STREET TEMPLATES (3)
// ═══════════════════════════════════════════════════════════════════════

const streetChecker: Template = {
  id: 'street-checker',
  name: 'Street Checker',
  description: 'Classic checkerboard pattern with bold text and skull sticker',
  category: 'street',
  tags: ['street', 'checkerboard', 'skull', 'bold', 'classic'],
  author: 'DeckForge',
  objects: [
    // Checkerboard pattern background
    patternBg('checkerboard', '#000000', '#ffffff', 1),
    // Dark overlay band at center for text
    rect(0, 115, W, 64, '#000000', { opacity: 0.85 }),
    // Bold text
    text('SKATE', 8, 120, 80, 20, '#ffffff', {
      fontSize: 18, fontFamily: 'Impact', fontWeight: 'bold',
      letterSpacing: 4,
    }),
    text('OR DIE', 14, 142, 68, 16, '#ff0000', {
      fontSize: 14, fontFamily: 'Impact', fontWeight: 'bold',
      letterSpacing: 6,
    }),
    // Skull sticker top
    sticker('Skull', 28, 30, 40, '#ffffff', { opacity: 0.9 }),
    // Skull sticker bottom (mirrored)
    sticker('Skull', 28, 220, 40, '#ffffff', { opacity: 0.9, rotation: 180 }),
  ],
};

const streetTag: Template = {
  id: 'street-tag',
  name: 'Street Tag',
  description: 'Urban graffiti-inspired design with diagonal stripes and bold colors',
  category: 'street',
  tags: ['street', 'graffiti', 'urban', 'bold', 'stripes'],
  author: 'DeckForge',
  objects: [
    // Dark base
    bg('#1a1a1a'),
    // Diagonal stripes pattern overlay
    patternBg('diagonal-stripes', '#ff4400', '#1a1a1a', 0.8),
    // White paint-splash band
    rect(0, 100, W, 80, '#ffffff', { opacity: 0.95, rotation: -3 }),
    // Tag text
    text('REBEL', 6, 110, 84, 24, '#000000', {
      fontSize: 22, fontFamily: 'Impact', fontWeight: 'bold',
      letterSpacing: 3,
    }),
    text('CREW', 18, 138, 60, 16, '#ff4400', {
      fontSize: 14, fontFamily: 'Impact',
      letterSpacing: 8,
    }),
    // Star accents
    sticker('Star', 5, 45, 20, '#ff4400', { rotation: 15 }),
    sticker('Star', 71, 55, 16, '#ffffff', { rotation: -10, opacity: 0.7 }),
    sticker('Star', 10, 230, 18, '#ff4400', { rotation: 30 }),
    // Crown sticker
    sticker('Crown', 30, 205, 36, '#ffd700', { opacity: 0.9 }),
  ],
};

const streetRaw: Template = {
  id: 'street-raw',
  name: 'Street Raw',
  description: 'Gritty raw street style with crosshatch and flame accents',
  category: 'street',
  tags: ['street', 'gritty', 'raw', 'fire', 'crosshatch'],
  author: 'DeckForge',
  objects: [
    // Dark gray textured base
    bg('#2a2a2a'),
    // Crosshatch overlay
    patternBg('crosshatch', '#3a3a3a', '#1a1a1a', 0.6),
    // Red accent stripe
    rect(0, 130, W, 8, '#cc0000'),
    rect(0, 156, W, 8, '#cc0000'),
    // Raw text
    text('RAW', 12, 133, 72, 24, '#ffffff', {
      fontSize: 24, fontFamily: 'Impact', fontWeight: 'bold',
    }),
    // Flame stickers
    sticker('Flame', 10, 60, 30, '#ff4500', { rotation: -15 }),
    sticker('Flame', 56, 50, 34, '#ff6600', { rotation: 10 }),
    sticker('Flame', 30, 220, 36, '#ff4500', { rotation: 5 }),
    // X mark at bottom
    sticker('X', 38, 260, 20, '#cc0000'),
  ],
};

// ═══════════════════════════════════════════════════════════════════════
//  RETRO TEMPLATES (3)
// ═══════════════════════════════════════════════════════════════════════

const retroTieDye: Template = {
  id: 'retro-tie-dye',
  name: 'Retro Tie-Dye',
  description: 'Groovy tie-dye pattern with peace signs and retro vibes',
  category: 'retro',
  tags: ['retro', 'tie-dye', 'peace', 'groovy', '70s'],
  author: 'DeckForge',
  objects: [
    // Tie-dye pattern background
    patternBg('tie-dye', '#ff6b9d', '#44c8f5', 1),
    // Peace sign sticker (using Heart as closest available)
    sticker('Heart', 28, 60, 40, '#ffffff', {
      opacity: 0.9,
      glow: { enabled: true, radius: 10, color: '#ffffff', intensity: 0.6 },
    }),
    // Groovy text
    text('GROOVY', 6, 130, 84, 20, '#ffffff', {
      fontSize: 16, fontFamily: 'Georgia',
      fontStyle: 'italic', fontWeight: 'bold',
      textShadow: { enabled: true, offsetX: 2, offsetY: 2, blur: 4, color: '#00000066' },
    }),
    text('VIBES', 18, 155, 60, 16, '#ffd700', {
      fontSize: 14, fontFamily: 'Georgia',
      fontStyle: 'italic', letterSpacing: 6,
    }),
    // Sun sticker
    sticker('Sun', 8, 210, 28, '#ffd700', { rotation: 15, opacity: 0.85 }),
    // Flower-like accents (using Sparkles icon)
    sticker('Sparkles', 60, 220, 24, '#ffffff', { rotation: -10, opacity: 0.8 }),
    sticker('Sparkles', 36, 30, 18, '#ffd700', { rotation: 20, opacity: 0.6 }),
  ],
};

const retroSunset: Template = {
  id: 'retro-sunset',
  name: 'Retro Sunset',
  description: 'Vaporwave sunset gradient with horizontal scan lines',
  category: 'retro',
  tags: ['retro', 'sunset', 'vaporwave', 'gradient', '80s'],
  author: 'DeckForge',
  objects: [
    // Sunset gradient background
    gradientBg([
      { offset: 0, color: '#0f0c29' },
      { offset: 0.3, color: '#302b63' },
      { offset: 0.6, color: '#ff6b6b' },
      { offset: 0.8, color: '#ffa502' },
      { offset: 1, color: '#ffd700' },
    ], 180),
    // Sun circle
    circle(23, 80, 50, '#ff6b6b', {
      glow: { enabled: true, radius: 20, color: '#ff6b6b', intensity: 0.8 },
    }),
    // Horizontal scan lines
    rect(0, 100, W, 2, '#000000', { opacity: 0.3 }),
    rect(0, 108, W, 2, '#000000', { opacity: 0.25 }),
    rect(0, 118, W, 2, '#000000', { opacity: 0.2 }),
    rect(0, 130, W, 3, '#000000', { opacity: 0.15 }),
    rect(0, 145, W, 3, '#000000', { opacity: 0.1 }),
    // Retro text
    text('SUNSET', 8, 170, 80, 18, '#ffd700', {
      fontSize: 16, fontFamily: 'Impact',
      letterSpacing: 5,
      textShadow: { enabled: true, offsetX: 1, offsetY: 2, blur: 6, color: '#ff6b6b88' },
    }),
    text('BLVD', 24, 192, 48, 14, '#ff6b6b', {
      fontSize: 12, fontFamily: 'Impact',
      letterSpacing: 10,
    }),
    // Palm tree silhouette (Mountain icon as stand-in)
    sticker('Mountain', 4, 210, 40, '#0f0c29', { opacity: 0.7 }),
    sticker('Mountain', 52, 215, 36, '#0f0c29', { opacity: 0.5 }),
  ],
};

const retroArcade: Template = {
  id: 'retro-arcade',
  name: 'Retro Arcade',
  description: 'Pixel-inspired arcade game aesthetic with neon accents',
  category: 'retro',
  tags: ['retro', 'arcade', 'pixel', 'game', 'neon'],
  author: 'DeckForge',
  objects: [
    // Dark purple base
    bg('#120024'),
    // Noise pattern overlay for CRT feel
    patternBg('noise', '#1a0033', '#2a0055', 0.5),
    // Screen glow background
    rect(6, 60, 84, 170, '#0a0020', {
      stroke: '#00ff88', strokeWidth: 2,
    }),
    // "INSERT COIN" text
    text('INSERT', 14, 75, 68, 16, '#00ff88', {
      fontSize: 14, fontFamily: 'Courier New', fontWeight: 'bold',
      letterSpacing: 4,
    }),
    text('COIN', 22, 95, 52, 14, '#00ff88', {
      fontSize: 12, fontFamily: 'Courier New', fontWeight: 'bold',
      letterSpacing: 8,
    }),
    // Score display
    text('HI-SCORE', 12, 125, 72, 10, '#ff00ff', {
      fontSize: 8, fontFamily: 'Courier New',
      letterSpacing: 2,
    }),
    text('999999', 18, 138, 60, 12, '#ffffff', {
      fontSize: 10, fontFamily: 'Courier New', fontWeight: 'bold',
      letterSpacing: 4,
    }),
    // Game elements
    sticker('Gamepad2', 28, 165, 40, '#00ff88', {
      glow: { enabled: true, radius: 8, color: '#00ff88', intensity: 0.7 },
    }),
    // Star decorations
    sticker('Star', 12, 195, 14, '#ffd700', { rotation: 15 }),
    sticker('Star', 70, 190, 12, '#ff00ff', { rotation: -20 }),
    sticker('Star', 40, 200, 10, '#00ffff', { rotation: 10 }),
    // Zap accent
    sticker('Zap', 62, 70, 22, '#ffd700', { rotation: 15, opacity: 0.8 }),
  ],
};

// ═══════════════════════════════════════════════════════════════════════
//  MINIMAL TEMPLATES (3)
// ═══════════════════════════════════════════════════════════════════════

const minimalLine: Template = {
  id: 'minimal-line',
  name: 'Minimal Line',
  description: 'Clean white deck with a single thin line and small logo placement',
  category: 'minimal',
  tags: ['minimal', 'clean', 'white', 'line', 'simple'],
  author: 'DeckForge',
  objects: [
    // Pure white background
    bg('#ffffff'),
    // Single thin horizontal line
    rect(12, 146, 72, 1, '#000000'),
    // Small centered circle logo
    circle(40, 130, 16, '#000000'),
    // Tiny brand text
    text('DECK', 32, 160, 32, 8, '#999999', {
      fontSize: 6, fontFamily: 'Helvetica',
      letterSpacing: 6,
    }),
  ],
};

const minimalDot: Template = {
  id: 'minimal-dot',
  name: 'Minimal Halftone',
  description: 'Monochrome design with halftone dot pattern and geometric accent',
  category: 'minimal',
  tags: ['minimal', 'halftone', 'monochrome', 'geometric', 'dot'],
  author: 'DeckForge',
  objects: [
    // White background
    bg('#ffffff'),
    // Halftone pattern (subtle)
    patternBg('halftone', '#e8e8e8', '#ffffff', 0.6),
    // Large black circle
    circle(8, 80, 80, '#000000'),
    // Small white circle cut-out effect
    circle(32, 104, 32, '#ffffff'),
    // Thin accent line below
    rect(20, 180, 56, 1, '#000000'),
    // Small text
    text('MONO', 28, 190, 40, 8, '#000000', {
      fontSize: 6, fontFamily: 'Helvetica',
      letterSpacing: 8,
    }),
  ],
};

const minimalZen: Template = {
  id: 'minimal-zen',
  name: 'Minimal Zen',
  description: 'Zen-inspired minimalist design with soft tones and simple geometry',
  category: 'minimal',
  tags: ['minimal', 'zen', 'calm', 'soft', 'japanese'],
  author: 'DeckForge',
  objects: [
    // Warm off-white background
    bg('#f5f0eb'),
    // Soft circle (stone/enso)
    circle(18, 100, 60, '#d4c5b2', { opacity: 0.6 }),
    // Inner circle
    circle(30, 112, 36, '#c4b5a2', { opacity: 0.4 }),
    // Thin vertical line
    rect(47, 30, 1, 60, '#8a7a6a', { opacity: 0.5 }),
    // Thin vertical line below circle
    rect(47, 175, 1, 60, '#8a7a6a', { opacity: 0.5 }),
    // Small text
    text('ZEN', 34, 250, 28, 8, '#8a7a6a', {
      fontSize: 7, fontFamily: 'Georgia',
      fontStyle: 'italic',
      letterSpacing: 10,
    }),
  ],
};

// ═══════════════════════════════════════════════════════════════════════
//  EDGY TEMPLATES (3)
// ═══════════════════════════════════════════════════════════════════════

const edgyNeon: Template = {
  id: 'edgy-neon',
  name: 'Neon Shock',
  description: 'Dark background with electric neon accents and lightning stickers',
  category: 'edgy',
  tags: ['edgy', 'neon', 'electric', 'dark', 'lightning'],
  author: 'DeckForge',
  objects: [
    // Deep dark background
    bg('#0a0a0f'),
    // Neon glow bars
    rect(0, 90, W, 4, '#00ff88', {
      glow: { enabled: true, radius: 12, color: '#00ff88', intensity: 1 },
    }),
    rect(0, 200, W, 4, '#ff00ff', {
      glow: { enabled: true, radius: 12, color: '#ff00ff', intensity: 1 },
    }),
    // Neon text
    text('SHOCK', 8, 120, 80, 22, '#00ffff', {
      fontSize: 20, fontFamily: 'Impact', fontWeight: 'bold',
      letterSpacing: 3,
      textShadow: { enabled: true, offsetX: 0, offsetY: 0, blur: 10, color: '#00ffff' },
    }),
    text('WAVE', 18, 146, 60, 16, '#ff00ff', {
      fontSize: 14, fontFamily: 'Impact',
      letterSpacing: 8,
      textShadow: { enabled: true, offsetX: 0, offsetY: 0, blur: 8, color: '#ff00ff' },
    }),
    // Lightning stickers
    sticker('Zap', 8, 30, 35, '#00ff88', {
      rotation: -20,
      glow: { enabled: true, radius: 10, color: '#00ff88', intensity: 0.9 },
    }),
    sticker('Zap', 53, 40, 35, '#ff00ff', {
      rotation: 20,
      glow: { enabled: true, radius: 10, color: '#ff00ff', intensity: 0.9 },
    }),
    sticker('Zap', 28, 225, 40, '#00ffff', {
      glow: { enabled: true, radius: 12, color: '#00ffff', intensity: 1 },
    }),
  ],
};

const edgySkull: Template = {
  id: 'edgy-skull',
  name: 'Death Grip',
  description: 'Heavy punk aesthetic with skulls, speed lines, and blood red accents',
  category: 'edgy',
  tags: ['edgy', 'punk', 'skull', 'red', 'dark'],
  author: 'DeckForge',
  objects: [
    // Black base
    bg('#000000'),
    // Speed lines pattern
    patternBg('speed-lines', '#1a0000', '#000000', 0.8),
    // Blood red band
    rect(0, 110, W, 74, '#cc0000'),
    // Drip accents at band edges
    rect(15, 107, 8, 12, '#cc0000', { opacity: 0.8 }),
    rect(40, 105, 6, 16, '#cc0000', { opacity: 0.7 }),
    rect(65, 108, 10, 10, '#cc0000', { opacity: 0.9 }),
    rect(20, 184, 8, 14, '#cc0000', { opacity: 0.7 }),
    rect(50, 182, 6, 18, '#cc0000', { opacity: 0.8 }),
    rect(75, 183, 10, 12, '#cc0000', { opacity: 0.6 }),
    // Main skull
    sticker('Skull', 18, 118, 60, '#ffffff'),
    // Death text
    text('DEATH', 10, 60, 76, 18, '#cc0000', {
      fontSize: 16, fontFamily: 'Impact', fontWeight: 'bold',
      letterSpacing: 5,
    }),
    text('GRIP', 20, 78, 56, 14, '#ffffff', {
      fontSize: 12, fontFamily: 'Impact',
      letterSpacing: 8,
    }),
    // Small skulls
    sticker('Skull', 8, 210, 24, '#cc0000', { rotation: -15, opacity: 0.7 }),
    sticker('Skull', 64, 215, 24, '#cc0000', { rotation: 15, opacity: 0.7 }),
  ],
};

const edgyVoid: Template = {
  id: 'edgy-void',
  name: 'Void Walker',
  description: 'Cosmic dark void with galaxy-inspired gradient and ethereal elements',
  category: 'edgy',
  tags: ['edgy', 'void', 'cosmic', 'galaxy', 'dark'],
  author: 'DeckForge',
  objects: [
    // Deep space gradient
    gradientBg([
      { offset: 0, color: '#000000' },
      { offset: 0.3, color: '#0d001a' },
      { offset: 0.5, color: '#1a0033' },
      { offset: 0.7, color: '#0d001a' },
      { offset: 1, color: '#000000' },
    ], 180),
    // Nebula accent
    circle(10, 80, 76, '#6600cc', { opacity: 0.15 }),
    circle(30, 100, 36, '#9933ff', { opacity: 0.1 }),
    // Stars (small circles)
    circle(15, 40, 3, '#ffffff', { opacity: 0.9 }),
    circle(60, 25, 2, '#ffffff', { opacity: 0.7 }),
    circle(75, 60, 2, '#ffffff', { opacity: 0.5 }),
    circle(30, 70, 2, '#ffffff', { opacity: 0.6 }),
    circle(80, 95, 3, '#ffffff', { opacity: 0.8 }),
    circle(10, 180, 2, '#ffffff', { opacity: 0.5 }),
    circle(50, 200, 3, '#ffffff', { opacity: 0.7 }),
    circle(85, 175, 2, '#ffffff', { opacity: 0.4 }),
    circle(25, 240, 2, '#ffffff', { opacity: 0.6 }),
    circle(70, 255, 2, '#ffffff', { opacity: 0.5 }),
    // Eye sticker (all-seeing eye)
    sticker('Eye', 23, 120, 50, '#9933ff', {
      glow: { enabled: true, radius: 15, color: '#9933ff', intensity: 0.8 },
    }),
    // Void text
    text('VOID', 16, 185, 64, 18, '#9933ff', {
      fontSize: 16, fontFamily: 'Impact',
      letterSpacing: 8,
      textShadow: { enabled: true, offsetX: 0, offsetY: 0, blur: 12, color: '#9933ff88' },
    }),
    text('WALKER', 10, 207, 76, 12, '#6644aa', {
      fontSize: 9, fontFamily: 'Impact',
      letterSpacing: 6, opacity: 0.7,
    }),
  ],
};

// ═══════════════════════════════════════════════════════════════════════
//  PRO TEMPLATES (3)
// ═══════════════════════════════════════════════════════════════════════

const proWoodgrain: Template = {
  id: 'pro-woodgrain',
  name: 'Pro Woodgrain',
  description: 'Natural wood grain texture with brand-style layout and truck hole guides',
  category: 'pro',
  tags: ['pro', 'wood', 'natural', 'brand', 'classic'],
  author: 'DeckForge',
  objects: [
    // Wood-tone base gradient
    gradientBg([
      { offset: 0, color: '#8B6914' },
      { offset: 0.2, color: '#A0782C' },
      { offset: 0.4, color: '#8B6914' },
      { offset: 0.6, color: '#9A7020' },
      { offset: 0.8, color: '#A0782C' },
      { offset: 1, color: '#8B6914' },
    ], 170),
    // Subtle noise overlay for grain texture
    patternBg('noise', '#7a5a10', '#8B6914', 0.3),
    // Brand logo area - white rectangle
    rect(18, 115, 60, 60, '#ffffff', { opacity: 0.95 }),
    // Brand inner border
    rect(21, 118, 54, 54, '#ffffff', {
      stroke: '#8B6914', strokeWidth: 1.5,
    }),
    // Brand text
    text('DECK', 22, 126, 52, 14, '#8B6914', {
      fontSize: 12, fontFamily: 'Georgia', fontWeight: 'bold',
      letterSpacing: 6,
    }),
    text('FORGE', 22, 142, 52, 14, '#8B6914', {
      fontSize: 10, fontFamily: 'Georgia',
      letterSpacing: 4,
    }),
    // Small "SINCE 2024"
    text('EST. 2024', 26, 157, 44, 8, '#8B6914', {
      fontSize: 5, fontFamily: 'Georgia',
      letterSpacing: 3, opacity: 0.7,
    }),
    // Truck hole guides (circles at bolt positions)
    // Front truck
    circle(18, 28, 6, 'transparent', {
      stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.4,
    }),
    circle(66, 28, 6, 'transparent', {
      stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.4,
    }),
    circle(18, 46, 6, 'transparent', {
      stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.4,
    }),
    circle(66, 46, 6, 'transparent', {
      stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.4,
    }),
    // Rear truck
    circle(18, 236, 6, 'transparent', {
      stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.4,
    }),
    circle(66, 236, 6, 'transparent', {
      stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.4,
    }),
    circle(18, 254, 6, 'transparent', {
      stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.4,
    }),
    circle(66, 254, 6, 'transparent', {
      stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.4,
    }),
  ],
};

const proCompetition: Template = {
  id: 'pro-competition',
  name: 'Pro Competition',
  description: 'Clean competition-grade design with sharp geometric elements',
  category: 'pro',
  tags: ['pro', 'competition', 'clean', 'geometric', 'sharp'],
  author: 'DeckForge',
  objects: [
    // Premium gradient background
    gradientBg([
      { offset: 0, color: '#1a1a2e' },
      { offset: 0.5, color: '#16213e' },
      { offset: 1, color: '#0f3460' },
    ], 180),
    // Gold accent band
    rect(0, 135, W, 2, '#c9a84c'),
    rect(0, 155, W, 2, '#c9a84c'),
    // Center diamond shape (rotated rect)
    rect(24, 105, 48, 48, '#c9a84c', {
      rotation: 45, opacity: 0.15,
    }),
    // Pro shield sticker
    sticker('Shield', 28, 115, 40, '#c9a84c', {
      opacity: 0.9,
    }),
    // Competition text
    text('PRO', 20, 90, 56, 14, '#c9a84c', {
      fontSize: 10, fontFamily: 'Helvetica', fontWeight: 'bold',
      letterSpacing: 12,
    }),
    text('SERIES', 16, 170, 64, 12, '#c9a84c', {
      fontSize: 8, fontFamily: 'Helvetica',
      letterSpacing: 8,
    }),
    // Top accent lines
    rect(20, 40, 56, 1, '#c9a84c', { opacity: 0.5 }),
    rect(25, 44, 46, 1, '#c9a84c', { opacity: 0.3 }),
    // Bottom accent lines
    rect(20, 240, 56, 1, '#c9a84c', { opacity: 0.5 }),
    rect(25, 244, 46, 1, '#c9a84c', { opacity: 0.3 }),
    // Corner markers
    sticker('Crosshair', 6, 12, 14, '#c9a84c', { opacity: 0.4 }),
    sticker('Crosshair', 76, 12, 14, '#c9a84c', { opacity: 0.4 }),
    sticker('Crosshair', 6, 268, 14, '#c9a84c', { opacity: 0.4 }),
    sticker('Crosshair', 76, 268, 14, '#c9a84c', { opacity: 0.4 }),
  ],
};

const proSignature: Template = {
  id: 'pro-signature',
  name: 'Pro Signature',
  description: 'Premium signature series with elegant gradient and refined typography',
  category: 'pro',
  tags: ['pro', 'signature', 'premium', 'elegant', 'luxury'],
  author: 'DeckForge',
  objects: [
    // Deep matte black to charcoal gradient
    gradientBg([
      { offset: 0, color: '#1a1a1a' },
      { offset: 0.3, color: '#2d2d2d' },
      { offset: 0.5, color: '#333333' },
      { offset: 0.7, color: '#2d2d2d' },
      { offset: 1, color: '#1a1a1a' },
    ], 180),
    // Subtle center stripe
    rect(44, 0, 8, H, '#ffffff', { opacity: 0.03 }),
    // Silver accent lines
    rect(0, 130, W, 0.5, '#c0c0c0', { opacity: 0.6 }),
    rect(0, 163, W, 0.5, '#c0c0c0', { opacity: 0.6 }),
    // Signature text area
    text('SIGNATURE', 6, 135, 84, 12, '#c0c0c0', {
      fontSize: 9, fontFamily: 'Georgia',
      fontStyle: 'italic',
      letterSpacing: 4,
    }),
    text('SERIES', 20, 148, 56, 10, '#808080', {
      fontSize: 7, fontFamily: 'Georgia',
      letterSpacing: 6,
    }),
    // Diamond accent
    sticker('Diamond', 36, 80, 24, '#c0c0c0', { opacity: 0.6 }),
    // Small edition number
    text('001/100', 30, 220, 36, 8, '#666666', {
      fontSize: 5, fontFamily: 'Courier New',
      letterSpacing: 2,
    }),
    // Top/bottom accent dots
    circle(44, 20, 4, '#c0c0c0', { opacity: 0.3 }),
    circle(44, 266, 4, '#c0c0c0', { opacity: 0.3 }),
  ],
};

// ═══════════════════════════════════════════════════════════════════════
//  BLANK TEMPLATE
// ═══════════════════════════════════════════════════════════════════════

const blank: Template = {
  id: 'blank',
  name: 'Blank Canvas',
  description: 'Start from scratch with a clean white deck',
  category: 'blank',
  tags: ['blank', 'custom', 'empty'],
  objects: [
    bg('#ffffff'),
  ],
};

// ═══════════════════════════════════════════════════════════════════════
//  EXPORT ALL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export const templates: Template[] = [
  // Street
  streetChecker,
  streetTag,
  streetRaw,
  // Retro
  retroTieDye,
  retroSunset,
  retroArcade,
  // Minimal
  minimalLine,
  minimalDot,
  minimalZen,
  // Edgy
  edgyNeon,
  edgySkull,
  edgyVoid,
  // Pro
  proWoodgrain,
  proCompetition,
  proSignature,
  // Blank
  blank,
];

export const templateCategories = [
  { value: 'all', label: 'All Styles' },
  { value: 'street', label: 'Street' },
  { value: 'retro', label: 'Retro' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'edgy', label: 'Edgy' },
  { value: 'pro', label: 'Pro' },
] as const;

export function searchTemplates(query: string): Template[] {
  if (!query) return templates;

  const lowerQuery = query.toLowerCase();
  return templates.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    t.category.toLowerCase().includes(lowerQuery)
  );
}

export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
  if (category === 'all') return templates;
  return templates.filter(t => t.category === category);
}
