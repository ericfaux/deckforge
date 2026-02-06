/**
 * Text Warp Path Generation
 *
 * Generates SVG path strings for curved/warped text rendering.
 * Each warp type produces a path that text can follow via <textPath>.
 */

export type WarpType = 'none' | 'arc-up' | 'arc-down' | 'bridge' | 'valley' | 'flag' | 'bulge' | 'fish-eye' | 'rise' | 'wave' | 'inflate';

export interface WarpOptions {
  warpType: WarpType;
  width: number;
  height: number;
  intensity: number; // 0-100
}

export interface ArcOptions {
  width: number;
  height: number;
  radius?: number;
  angle?: number; // degrees, 0-360
  direction: 'convex' | 'concave';
}

/**
 * Generate an SVG arc path for text to follow.
 * Uses circular arc geometry.
 */
export function generateArcPath(opts: ArcOptions): string {
  const { width, direction } = opts;
  const intensity = opts.angle ?? 180;

  // Convert angle to radians - clamp between 10 and 350
  const angleDeg = Math.max(10, Math.min(350, intensity));
  const angleRad = (angleDeg * Math.PI) / 180;

  // Calculate radius from chord length (width) and angle
  const radius = opts.radius ?? (width / 2) / Math.sin(angleRad / 2);

  // Start and end points at edges of the text width
  const startX = 0;
  const endX = width;

  // For convex (smile) - arc curves upward, for concave (frown) - arc curves downward
  const sweep = direction === 'convex' ? 0 : 1;
  const largeArc = angleDeg > 180 ? 1 : 0;

  // Calculate the Y positions based on the arc
  const midSag = radius - Math.sqrt(Math.max(0, radius * radius - (width / 2) * (width / 2)));
  const startY = direction === 'convex' ? midSag : 0;
  const endY = startY;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endX} ${endY}`;
}

/**
 * Generate SVG path for warp presets.
 * Each preset uses a mathematical function to shape the path.
 */
export function generateWarpPath(opts: WarpOptions): string {
  const { warpType, width, height, intensity } = opts;
  const t = intensity / 100; // Normalize to 0-1
  const segments = 40; // Number of path segments for smoothness

  switch (warpType) {
    case 'arc-up':
      return generateParabolaPath(width, -t * height * 0.5, segments);

    case 'arc-down':
      return generateParabolaPath(width, t * height * 0.5, segments);

    case 'bridge':
      return generateBridgePath(width, t * height * 0.6, segments);

    case 'valley':
      return generateBridgePath(width, -t * height * 0.6, segments);

    case 'flag':
      return generateSinePath(width, t * height * 0.4, 1, segments);

    case 'wave':
      return generateSinePath(width, t * height * 0.3, 2, segments);

    case 'bulge':
      return generateBulgePath(width, t * height * 0.5, segments);

    case 'fish-eye':
      return generateFishEyePath(width, t * height * 0.6, segments);

    case 'rise':
      return generateRisePath(width, t * height * 0.5, segments);

    case 'inflate':
      return generateInflatePath(width, t * height * 0.4, segments);

    default:
      return `M 0 0 L ${width} 0`;
  }
}

/** Parabolic arc - smooth curve up or down */
function generateParabolaPath(width: number, depth: number, segments: number): string {
  const points: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const pct = i / segments;
    const x = pct * width;
    // Parabola: y = -4*depth * x*(1-x)  peaks in the middle
    const y = -4 * depth * pct * (1 - pct);
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return points.join(' ');
}

/** Bridge/valley - like a suspension bridge with flat-ish middle and steep edges */
function generateBridgePath(width: number, depth: number, segments: number): string {
  const points: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const pct = i / segments;
    const x = pct * width;
    // Quartic curve - flatter in middle, steeper at edges
    const centered = pct * 2 - 1; // -1 to 1
    const y = -depth * (1 - centered * centered * centered * centered);
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return points.join(' ');
}

/** Sine wave path */
function generateSinePath(width: number, amplitude: number, cycles: number, segments: number): string {
  const points: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const pct = i / segments;
    const x = pct * width;
    const y = -amplitude * Math.sin(pct * Math.PI * 2 * cycles);
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return points.join(' ');
}

/** Bulge - wider in the middle */
function generateBulgePath(width: number, depth: number, segments: number): string {
  const points: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const pct = i / segments;
    const x = pct * width;
    // Gaussian-like curve
    const centered = pct * 2 - 1;
    const y = -depth * Math.exp(-4 * centered * centered);
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return points.join(' ');
}

/** Fish-eye - extreme bulge with pinched edges */
function generateFishEyePath(width: number, depth: number, segments: number): string {
  const points: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const pct = i / segments;
    const x = pct * width;
    const centered = pct * 2 - 1;
    // Sharp bell curve
    const y = -depth * Math.exp(-8 * centered * centered);
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return points.join(' ');
}

/** Rise - text rises from left to right */
function generateRisePath(width: number, depth: number, segments: number): string {
  const points: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const pct = i / segments;
    const x = pct * width;
    // Ease-in curve rising
    const y = -depth * pct * pct;
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return points.join(' ');
}

/** Inflate - smooth balloon-like expansion */
function generateInflatePath(width: number, depth: number, segments: number): string {
  const points: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const pct = i / segments;
    const x = pct * width;
    // Semicircle
    const centered = pct * 2 - 1;
    const y = -depth * Math.sqrt(Math.max(0, 1 - centered * centered));
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return points.join(' ');
}

/**
 * Generate an SVG path from a CanvasObject's pathPoints.
 * Used for text-on-custom-path feature.
 */
export function pathPointsToSvgPath(pathPoints: Array<{ x: number; y: number; cp1x?: number; cp1y?: number; cp2x?: number; cp2y?: number }>, originX: number, originY: number): string {
  if (!pathPoints || pathPoints.length === 0) return '';

  // Translate path relative to origin
  let d = `M ${pathPoints[0].x - originX} ${pathPoints[0].y - originY}`;

  for (let i = 1; i < pathPoints.length; i++) {
    const pt = pathPoints[i];
    const px = pt.x - originX;
    const py = pt.y - originY;

    if (pt.cp1x !== undefined && pt.cp1y !== undefined) {
      const c1x = pt.cp1x - originX;
      const c1y = pt.cp1y - originY;
      if (pt.cp2x !== undefined && pt.cp2y !== undefined) {
        const c2x = pt.cp2x - originX;
        const c2y = pt.cp2y - originY;
        d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${px} ${py}`;
      } else {
        d += ` Q ${c1x} ${c1y} ${px} ${py}`;
      }
    } else {
      d += ` L ${px} ${py}`;
    }
  }

  return d;
}

/** Check if a text object has any warp/curve applied */
export function hasTextWarp(obj: { warpType?: string; textPathId?: string }): boolean {
  return (!!obj.warpType && obj.warpType !== 'none') || !!obj.textPathId;
}
