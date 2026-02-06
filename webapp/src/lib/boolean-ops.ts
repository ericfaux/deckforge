import paper from 'paper';
import { CanvasObject, PathPoint } from '@/store/deckforge';
import { objectToSvgPath, applyTransformToPath } from './shape-to-path';

// Initialize paper.js in headless mode (no canvas)
const paperScope = new paper.PaperScope();
paperScope.setup(new paper.Size(1000, 1000));

export type BooleanOp = 'union' | 'subtract' | 'intersect' | 'exclude';

/**
 * Perform a boolean operation on two SVG path data strings.
 * Returns the resulting SVG path data string, or null on failure/empty result.
 */
export function performBooleanOp(
  pathDataA: string,
  pathDataB: string,
  operation: BooleanOp
): string | null {
  try {
    const pathA = new paperScope.CompoundPath(pathDataA);
    const pathB = new paperScope.CompoundPath(pathDataB);

    let result: paper.PathItem;
    switch (operation) {
      case 'union':
        result = pathA.unite(pathB);
        break;
      case 'subtract':
        result = pathA.subtract(pathB);
        break;
      case 'intersect':
        result = pathA.intersect(pathB);
        break;
      case 'exclude':
        result = pathA.exclude(pathB);
        break;
    }

    const pathData = result.pathData;

    // Clean up temporary paths
    pathA.remove();
    pathB.remove();
    result.remove();

    if (!pathData || pathData.trim() === '') {
      return null;
    }

    return pathData;
  } catch {
    return null;
  }
}

/**
 * Perform a boolean operation across multiple CanvasObjects.
 * Returns a new path-type CanvasObject with the combined result, or null on failure.
 */
export function booleanOperationOnObjects(
  objects: CanvasObject[],
  operation: BooleanOp
): CanvasObject | null {
  if (objects.length < 2) {
    return null;
  }

  try {
    // Convert all objects to SVG path data with transforms applied
    const svgPaths: string[] = [];
    for (const obj of objects) {
      const rawPath = objectToSvgPath(obj);
      if (!rawPath) return null;
      const transformedPath = applyTransformToPath(rawPath, obj);
      if (!transformedPath) return null;
      svgPaths.push(transformedPath);
    }

    // Sequentially apply the boolean operation: result = a op b, then result op c, etc.
    let currentResult = svgPaths[0];
    for (let i = 1; i < svgPaths.length; i++) {
      const result = performBooleanOp(currentResult, svgPaths[i], operation);
      if (!result) return null;
      currentResult = result;
    }

    // Parse the resulting path into points
    const { points, closed } = parseSvgPathToPoints(currentResult);

    // Calculate bounding box from the resulting path
    const tempPath = new paperScope.CompoundPath(currentResult);
    const bounds = tempPath.bounds;
    tempPath.remove();

    const first = objects[0];

    const newObject: CanvasObject = {
      id: '', // Will be assigned by the store
      type: 'path',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      rotation: 0,
      opacity: first.opacity,
      scaleX: 1,
      scaleY: 1,
      fill: first.fill,
      stroke: first.stroke,
      strokeWidth: first.strokeWidth,
      pathPoints: points,
      pathClosed: closed,
    };

    return newObject;
  } catch {
    return null;
  }
}

/**
 * Parse an SVG path data string back into a PathPoint array.
 * Handles M, L, Q, C, and Z commands.
 */
export function parseSvgPathToPoints(pathData: string): {
  points: PathPoint[];
  closed: boolean;
} {
  const points: PathPoint[] = [];
  let closed = false;

  // Tokenize: split into commands with their parameters
  // Match a letter followed by everything until the next letter or end of string
  const commandRegex = /([MLQCZmlhvqcstz])([^MLQCZmlhvqcstz]*)/gi;
  let match: RegExpExecArray | null;

  let currentX = 0;
  let currentY = 0;

  while ((match = commandRegex.exec(pathData)) !== null) {
    const command = match[1];
    const paramsStr = match[2].trim();

    // Parse numeric values from the parameter string
    const nums = paramsStr.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi);
    const params = nums ? nums.map(Number) : [];

    switch (command) {
      case 'M': {
        // Absolute moveto
        if (params.length >= 2) {
          currentX = params[0];
          currentY = params[1];
          points.push({ x: currentX, y: currentY });
          // Subsequent pairs after M are treated as L
          for (let i = 2; i + 1 < params.length; i += 2) {
            currentX = params[i];
            currentY = params[i + 1];
            points.push({ x: currentX, y: currentY });
          }
        }
        break;
      }
      case 'm': {
        // Relative moveto
        if (params.length >= 2) {
          currentX += params[0];
          currentY += params[1];
          points.push({ x: currentX, y: currentY });
          for (let i = 2; i + 1 < params.length; i += 2) {
            currentX += params[i];
            currentY += params[i + 1];
            points.push({ x: currentX, y: currentY });
          }
        }
        break;
      }
      case 'L': {
        // Absolute lineto
        for (let i = 0; i + 1 < params.length; i += 2) {
          currentX = params[i];
          currentY = params[i + 1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      }
      case 'l': {
        // Relative lineto
        for (let i = 0; i + 1 < params.length; i += 2) {
          currentX += params[i];
          currentY += params[i + 1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      }
      case 'H': {
        // Absolute horizontal lineto
        for (const p of params) {
          currentX = p;
          points.push({ x: currentX, y: currentY });
        }
        break;
      }
      case 'h': {
        // Relative horizontal lineto
        for (const p of params) {
          currentX += p;
          points.push({ x: currentX, y: currentY });
        }
        break;
      }
      case 'V': {
        // Absolute vertical lineto
        for (const p of params) {
          currentY = p;
          points.push({ x: currentX, y: currentY });
        }
        break;
      }
      case 'v': {
        // Relative vertical lineto
        for (const p of params) {
          currentY += p;
          points.push({ x: currentX, y: currentY });
        }
        break;
      }
      case 'Q': {
        // Absolute quadratic bezier
        for (let i = 0; i + 3 < params.length; i += 4) {
          const cp1x = params[i];
          const cp1y = params[i + 1];
          currentX = params[i + 2];
          currentY = params[i + 3];
          points.push({ x: currentX, y: currentY, cp1x, cp1y });
        }
        break;
      }
      case 'q': {
        // Relative quadratic bezier
        for (let i = 0; i + 3 < params.length; i += 4) {
          const cp1x = currentX + params[i];
          const cp1y = currentY + params[i + 1];
          currentX += params[i + 2];
          currentY += params[i + 3];
          points.push({ x: currentX, y: currentY, cp1x, cp1y });
        }
        break;
      }
      case 'C': {
        // Absolute cubic bezier
        for (let i = 0; i + 5 < params.length; i += 6) {
          const cp1x = params[i];
          const cp1y = params[i + 1];
          const cp2x = params[i + 2];
          const cp2y = params[i + 3];
          currentX = params[i + 4];
          currentY = params[i + 5];
          points.push({ x: currentX, y: currentY, cp1x, cp1y, cp2x, cp2y });
        }
        break;
      }
      case 'c': {
        // Relative cubic bezier
        for (let i = 0; i + 5 < params.length; i += 6) {
          const cp1x = currentX + params[i];
          const cp1y = currentY + params[i + 1];
          const cp2x = currentX + params[i + 2];
          const cp2y = currentY + params[i + 3];
          currentX += params[i + 4];
          currentY += params[i + 5];
          points.push({ x: currentX, y: currentY, cp1x, cp1y, cp2x, cp2y });
        }
        break;
      }
      case 'S':
      case 's': {
        // Smooth cubic bezier (treat as cubic with inferred first control point)
        const isRelative = command === 's';
        for (let i = 0; i + 3 < params.length; i += 4) {
          const cp2x = isRelative ? currentX + params[i] : params[i];
          const cp2y = isRelative ? currentY + params[i + 1] : params[i + 1];
          const endX = isRelative ? currentX + params[i + 2] : params[i + 2];
          const endY = isRelative ? currentY + params[i + 3] : params[i + 3];
          // Approximate cp1 as reflection of previous cp2 (or current point)
          const prevPoint = points[points.length - 1];
          const cp1x = prevPoint?.cp2x != null ? 2 * currentX - prevPoint.cp2x : currentX;
          const cp1y = prevPoint?.cp2y != null ? 2 * currentY - prevPoint.cp2y : currentY;
          currentX = endX;
          currentY = endY;
          points.push({ x: currentX, y: currentY, cp1x, cp1y, cp2x, cp2y });
        }
        break;
      }
      case 'T':
      case 't': {
        // Smooth quadratic bezier
        const isRelative = command === 't';
        for (let i = 0; i + 1 < params.length; i += 2) {
          const endX = isRelative ? currentX + params[i] : params[i];
          const endY = isRelative ? currentY + params[i + 1] : params[i + 1];
          const prevPoint = points[points.length - 1];
          const cp1x = prevPoint?.cp1x != null ? 2 * currentX - prevPoint.cp1x : currentX;
          const cp1y = prevPoint?.cp1y != null ? 2 * currentY - prevPoint.cp1y : currentY;
          currentX = endX;
          currentY = endY;
          points.push({ x: currentX, y: currentY, cp1x, cp1y });
        }
        break;
      }
      case 'Z':
      case 'z': {
        closed = true;
        break;
      }
      default:
        // Skip unknown commands
        break;
    }
  }

  return { points, closed };
}
