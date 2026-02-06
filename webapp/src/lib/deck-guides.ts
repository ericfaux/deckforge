/**
 * Deck-specific design guides and hardware positions for fingerboard decks.
 *
 * All measurements are based on real fingerboard hardware standards:
 * - Truck mounting holes: standard 4-hole pattern
 * - Wheelbase: distance between front and rear truck mounting positions
 * - Kick boundaries: where the flat area ends and the concave/kick begins
 * - Safe print area: inner rectangle where graphics won't be cut off in production
 * - Bleed: 2mm extension beyond deck edge for print production
 * - Safe zone: 3mm inset from deck edge for critical content
 *
 * Canvas units = mm * SCALE_FACTOR (3x)
 */

import { DeckSize, getDeckSize, DECK_SIZES } from './deck-sizes';

const SCALE_FACTOR = 3;

/** Convert mm to canvas units */
function mmToCanvas(mm: number): number {
  return mm * SCALE_FACTOR;
}

/** Convert canvas units to mm */
export function canvasToMm(canvasUnits: number, deckSize: DeckSize): { widthMm: number; heightMm: number } {
  return {
    widthMm: (canvasUnits / deckSize.canvasWidth) * deckSize.width,
    heightMm: (canvasUnits / deckSize.canvasHeight) * deckSize.length,
  };
}

/** Get mm-per-pixel ratios for a deck size */
export function getMmPerPixel(deckSize: DeckSize) {
  return {
    x: deckSize.width / deckSize.canvasWidth,
    y: deckSize.length / deckSize.canvasHeight,
  };
}

/**
 * Hardware guide positions for a specific deck size.
 * Based on real fingerboard truck mounting standards.
 */
export interface HardwareGuide {
  /** Front truck mounting holes (4 positions: [x, y][]) */
  frontTruckHoles: Array<{ x: number; y: number }>;
  /** Rear truck mounting holes (4 positions) */
  rearTruckHoles: Array<{ x: number; y: number }>;
  /** Front truck baseplate rectangle */
  frontBaseplate: { x: number; y: number; width: number; height: number };
  /** Rear truck baseplate rectangle */
  rearBaseplate: { x: number; y: number; width: number; height: number };
  /** Wheelbase lines (y positions of front and rear axles) */
  wheelbase: { frontY: number; rearY: number };
  /** Center axis line (x position) */
  centerX: number;
  /** Nose kick boundary (y position where flat area ends) */
  noseKickY: number;
  /** Tail kick boundary (y position where flat area ends) */
  tailKickY: number;
  /** Safe print area (inner rectangle) */
  safePrintArea: { x: number; y: number; width: number; height: number };
  /** Hole radius in canvas units */
  holeRadius: number;
}

/**
 * Calculate hardware guide positions for a deck size.
 *
 * Real fingerboard dimensions (approximate industry standards):
 * - Truck hole spacing (width): ~18mm between holes horizontally
 * - Truck hole spacing (length): ~6mm between holes vertically
 * - Front truck position: ~17mm from nose tip
 * - Rear truck position: ~17mm from tail tip
 * - Nose kick starts: ~14mm from nose tip
 * - Tail kick starts: ~14mm from tail tip
 * - Hole diameter: ~2mm
 */
export function getHardwareGuide(deckSizeId: string): HardwareGuide {
  const size = getDeckSize(deckSizeId);
  const w = size.canvasWidth;
  const h = size.canvasHeight;
  const centerX = w / 2;

  // Truck hole spacing scales with deck width
  // Standard: holes are ~9mm from center on each side (18mm total span)
  const holeSpreadX = mmToCanvas(Math.min(9, size.width * 0.28));
  // Vertical spacing between hole pairs: ~6mm
  const holeSpreadY = mmToCanvas(6);

  // Front truck axle position: ~17mm from nose tip
  const frontAxleY = mmToCanvas(17);
  // Rear truck axle position: ~17mm from tail tip
  const rearAxleY = h - mmToCanvas(17);

  // Baseplate dimensions (scaled to deck width)
  const baseplateWidth = mmToCanvas(Math.min(20, size.width * 0.62));
  const baseplateHeight = mmToCanvas(12);

  // Kick boundaries: where flat area ends (~14mm from each tip)
  const noseKickY = mmToCanvas(14);
  const tailKickY = h - mmToCanvas(14);

  // Safe print area: 5mm inset from each edge, between kick zones + 2mm margin
  const safePrintInsetX = mmToCanvas(3);
  const safePrintTopY = noseKickY + mmToCanvas(2);
  const safePrintBottomY = tailKickY - mmToCanvas(2);

  const holeRadius = mmToCanvas(1);

  return {
    frontTruckHoles: [
      { x: centerX - holeSpreadX, y: frontAxleY - holeSpreadY / 2 },
      { x: centerX + holeSpreadX, y: frontAxleY - holeSpreadY / 2 },
      { x: centerX - holeSpreadX, y: frontAxleY + holeSpreadY / 2 },
      { x: centerX + holeSpreadX, y: frontAxleY + holeSpreadY / 2 },
    ],
    rearTruckHoles: [
      { x: centerX - holeSpreadX, y: rearAxleY - holeSpreadY / 2 },
      { x: centerX + holeSpreadX, y: rearAxleY - holeSpreadY / 2 },
      { x: centerX - holeSpreadX, y: rearAxleY + holeSpreadY / 2 },
      { x: centerX + holeSpreadX, y: rearAxleY + holeSpreadY / 2 },
    ],
    frontBaseplate: {
      x: centerX - baseplateWidth / 2,
      y: frontAxleY - baseplateHeight / 2,
      width: baseplateWidth,
      height: baseplateHeight,
    },
    rearBaseplate: {
      x: centerX - baseplateWidth / 2,
      y: rearAxleY - baseplateHeight / 2,
      width: baseplateWidth,
      height: baseplateHeight,
    },
    wheelbase: { frontY: frontAxleY, rearY: rearAxleY },
    centerX,
    noseKickY,
    tailKickY,
    safePrintArea: {
      x: safePrintInsetX,
      y: safePrintTopY,
      width: w - safePrintInsetX * 2,
      height: safePrintBottomY - safePrintTopY,
    },
    holeRadius,
  };
}

/**
 * Bleed and safe zone calculations.
 * - Bleed: 2mm extension beyond deck edge
 * - Safe zone: 3mm inset from deck edge
 */
export interface BleedSafeZone {
  /** Bleed extension in canvas units (2mm) */
  bleedExtension: number;
  /** Safe zone inset in canvas units (3mm) */
  safeZoneInset: number;
}

export function getBleedSafeZone(): BleedSafeZone {
  return {
    bleedExtension: mmToCanvas(2),
    safeZoneInset: mmToCanvas(3),
  };
}

/**
 * Snap targets from hardware guides.
 * Returns a list of positions that objects should snap to.
 */
export interface GuideSnapTarget {
  position: number;
  orientation: 'horizontal' | 'vertical';
  label: string;
}

export function getGuideSnapTargets(deckSizeId: string): GuideSnapTarget[] {
  const guide = getHardwareGuide(deckSizeId);
  const bleed = getBleedSafeZone();
  const size = getDeckSize(deckSizeId);
  const targets: GuideSnapTarget[] = [];

  // Center axis
  targets.push({ position: guide.centerX, orientation: 'vertical', label: 'Center axis' });

  // Wheelbase lines
  targets.push({ position: guide.wheelbase.frontY, orientation: 'horizontal', label: 'Front axle' });
  targets.push({ position: guide.wheelbase.rearY, orientation: 'horizontal', label: 'Rear axle' });

  // Kick boundaries
  targets.push({ position: guide.noseKickY, orientation: 'horizontal', label: 'Nose kick' });
  targets.push({ position: guide.tailKickY, orientation: 'horizontal', label: 'Tail kick' });

  // Safe print area edges
  targets.push({ position: guide.safePrintArea.x, orientation: 'vertical', label: 'Safe area' });
  targets.push({ position: guide.safePrintArea.x + guide.safePrintArea.width, orientation: 'vertical', label: 'Safe area' });
  targets.push({ position: guide.safePrintArea.y, orientation: 'horizontal', label: 'Safe area' });
  targets.push({ position: guide.safePrintArea.y + guide.safePrintArea.height, orientation: 'horizontal', label: 'Safe area' });

  // Safe zone edges (3mm inset)
  targets.push({ position: bleed.safeZoneInset, orientation: 'vertical', label: 'Safe zone' });
  targets.push({ position: size.canvasWidth - bleed.safeZoneInset, orientation: 'vertical', label: 'Safe zone' });

  // Front truck hole Y positions
  const frontHoleYs = [...new Set(guide.frontTruckHoles.map(h => h.y))];
  frontHoleYs.forEach(y => targets.push({ position: y, orientation: 'horizontal', label: 'Truck holes' }));

  // Rear truck hole Y positions
  const rearHoleYs = [...new Set(guide.rearTruckHoles.map(h => h.y))];
  rearHoleYs.forEach(y => targets.push({ position: y, orientation: 'horizontal', label: 'Truck holes' }));

  // Truck hole X positions
  const holeXs = [...new Set([...guide.frontTruckHoles, ...guide.rearTruckHoles].map(h => h.x))];
  holeXs.forEach(x => targets.push({ position: x, orientation: 'vertical', label: 'Truck holes' }));

  return targets;
}

/**
 * Get accurate deck outline path for SVG rendering.
 *
 * Fingerboard decks have:
 * - Slightly different nose vs tail radius (nose is typically slightly rounder)
 * - The nose radius is about 0.52x the width, tail about 0.48x
 * - Straight sides connecting nose and tail curves
 */
export function getAccurateDeckPath(
  x: number, y: number, width: number, height: number,
  deckSizeId?: string
): string {
  // Nose is slightly wider/rounder radius than tail on real fingerboards
  const noseRadius = width * 0.52;
  const tailRadius = width * 0.48;

  // Nose curve (top) - slightly rounder
  // Tail curve (bottom) - slightly tighter
  return `
    M ${x} ${y + noseRadius}
    C ${x} ${y + noseRadius * 0.35} ${x + width * 0.15} ${y} ${x + width / 2} ${y}
    C ${x + width * 0.85} ${y} ${x + width} ${y + noseRadius * 0.35} ${x + width} ${y + noseRadius}
    L ${x + width} ${y + height - tailRadius}
    C ${x + width} ${y + height - tailRadius * 0.35} ${x + width * 0.85} ${y + height} ${x + width / 2} ${y + height}
    C ${x + width * 0.15} ${y + height} ${x} ${y + height - tailRadius * 0.35} ${x} ${y + height - tailRadius}
    Z
  `;
}
