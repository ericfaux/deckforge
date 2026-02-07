import type { CanvasObject, PathPoint } from '@/store/deckforge';

/**
 * Convert a PathPoint array to an SVG path d string.
 */
export function pathPointsToSvgPath(points: PathPoint[], closed?: boolean): string {
  if (points.length === 0) return '';

  const parts: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const pt = points[i];

    const hasCP2 = prev.cp2x !== undefined && prev.cp2y !== undefined;
    const hasCP1 = pt.cp1x !== undefined && pt.cp1y !== undefined;

    if (hasCP2 && hasCP1) {
      // Cubic bezier
      parts.push(`C ${prev.cp2x} ${prev.cp2y} ${pt.cp1x} ${pt.cp1y} ${pt.x} ${pt.y}`);
    } else if (hasCP2) {
      // Quadratic using prev's cp2 as the control point
      parts.push(`Q ${prev.cp2x} ${prev.cp2y} ${pt.x} ${pt.y}`);
    } else if (hasCP1) {
      // Quadratic using point's cp1 as the control point
      parts.push(`Q ${pt.cp1x} ${pt.cp1y} ${pt.x} ${pt.y}`);
    } else {
      // Straight line
      parts.push(`L ${pt.x} ${pt.y}`);
    }
  }

  if (closed) {
    parts.push('Z');
  }

  return parts.join(' ');
}

/**
 * Convert a CanvasObject to an SVG path string.
 * Returns null for unsupported types (image, text, group, sticker, texture).
 */
export function objectToSvgPath(obj: CanvasObject): string | null {
  switch (obj.type) {
    case 'shape':
      return shapeToPath(obj);
    case 'path':
      return pathObjectToPath(obj);
    case 'line':
      return lineToPath(obj);
    default:
      return null;
  }
}

function shapeToPath(obj: CanvasObject): string | null {
  const w = obj.width * obj.scaleX;
  const h = obj.height * obj.scaleY;
  const x = obj.x;
  const y = obj.y;

  switch (obj.shapeType) {
    case 'rect':
      return rectToPath(x, y, w, h);
    case 'circle':
      return circleToPath(x, y, w, h);
    case 'star':
      return starToPath(x, y, w, h);
    case 'polygon':
      return polygonToPath(x, y, w, h, obj.polygonSides ?? 6);
    default:
      return null;
  }
}

function rectToPath(x: number, y: number, w: number, h: number): string {
  return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
}

function circleToPath(x: number, y: number, w: number, h: number): string {
  // Approximate an ellipse with 4 cubic bezier arcs
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;

  // Magic number for cubic bezier circle approximation: (4/3)*tan(pi/8) ≈ 0.5522847498
  const kx = rx * 0.5522847498;
  const ky = ry * 0.5522847498;

  return [
    `M ${cx} ${cy - ry}`,
    `C ${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}`,
    `C ${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry}`,
    `C ${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy}`,
    `C ${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry}`,
    'Z',
  ].join(' ');
}

function starToPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const outerRx = w / 2;
  const outerRy = h / 2;
  const innerRx = outerRx * 0.4;
  const innerRy = outerRy * 0.4;
  const points = 5;
  const totalVertices = points * 2;

  const parts: string[] = [];

  for (let i = 0; i < totalVertices; i++) {
    // Start from top (-PI/2 offset)
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const isOuter = i % 2 === 0;
    const rx = isOuter ? outerRx : innerRx;
    const ry = isOuter ? outerRy : innerRy;
    const px = cx + rx * Math.cos(angle);
    const py = cy + ry * Math.sin(angle);

    if (i === 0) {
      parts.push(`M ${px} ${py}`);
    } else {
      parts.push(`L ${px} ${py}`);
    }
  }

  parts.push('Z');
  return parts.join(' ');
}

function polygonToPath(x: number, y: number, w: number, h: number, sides: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;

  const parts: string[] = [];

  for (let i = 0; i < sides; i++) {
    // Start from top (-PI/2 offset)
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const px = cx + rx * Math.cos(angle);
    const py = cy + ry * Math.sin(angle);

    if (i === 0) {
      parts.push(`M ${px} ${py}`);
    } else {
      parts.push(`L ${px} ${py}`);
    }
  }

  parts.push('Z');
  return parts.join(' ');
}

function pathObjectToPath(obj: CanvasObject): string | null {
  if (!obj.pathPoints || obj.pathPoints.length === 0) return null;
  return pathPointsToSvgPath(obj.pathPoints, obj.pathClosed);
}

function lineToPath(obj: CanvasObject): string {
  const x1 = obj.x;
  const y1 = obj.y;
  const x2 = obj.x + (obj.lineEndX ?? obj.width);
  const y2 = obj.y + (obj.lineEndY ?? obj.height);
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

/**
 * Parse an SVG path string into an array of commands with their coordinates.
 */
function parsePath(pathData: string): Array<{ command: string; coords: number[] }> {
  const commands: Array<{ command: string; coords: number[] }> = [];
  // Match command letter followed by its numeric arguments
  const regex = /([MLCQZmlcqz])\s*([\d\s,.\-e+]*)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(pathData)) !== null) {
    const command = match[1];
    const coordStr = match[2].trim();
    const coords = coordStr.length > 0
      ? coordStr.split(/[\s,]+/).map(Number)
      : [];
    commands.push({ command, coords });
  }

  return commands;
}

/**
 * Apply position, rotation, and scale transforms to SVG path coordinates.
 * Transforms the actual coordinates rather than returning a transform attribute.
 */
export function applyTransformToPath(
  pathData: string,
  obj: { x: number; y: number; rotation: number; scaleX: number; scaleY: number }
): string {
  const commands = parsePath(pathData);
  if (commands.length === 0) return pathData;

  // Collect all coordinate pairs to find the center for rotation
  const allX: number[] = [];
  const allY: number[] = [];
  for (const cmd of commands) {
    for (let i = 0; i < cmd.coords.length; i += 2) {
      if (i + 1 < cmd.coords.length) {
        allX.push(cmd.coords[i]);
        allY.push(cmd.coords[i + 1]);
      }
    }
  }

  if (allX.length === 0) return pathData;

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const radians = (obj.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  function transformPoint(px: number, py: number): [number, number] {
    // Translate to origin (center)
    let dx = px - centerX;
    let dy = py - centerY;

    // Scale
    dx *= obj.scaleX;
    dy *= obj.scaleY;

    // Rotate
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;

    // Translate back and apply position offset
    return [rx + centerX + obj.x, ry + centerY + obj.y];
  }

  const parts: string[] = [];

  for (const cmd of commands) {
    const upper = cmd.command.toUpperCase();

    if (upper === 'Z') {
      parts.push('Z');
      continue;
    }

    const transformed: number[] = [];
    for (let i = 0; i < cmd.coords.length; i += 2) {
      if (i + 1 < cmd.coords.length) {
        const [tx, ty] = transformPoint(cmd.coords[i], cmd.coords[i + 1]);
        transformed.push(tx, ty);
      }
    }

    parts.push(`${cmd.command} ${transformed.join(' ')}`);
  }

  return parts.join(' ');
}
