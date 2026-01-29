import { CanvasObject } from '@/store/deckforge';

export interface SnapGuide {
  position: number;
  orientation: 'horizontal' | 'vertical';
  type: 'center' | 'edge' | 'object';
}

const SNAP_THRESHOLD = 5; // pixels

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

/**
 * Calculate snapping for an object being moved
 * Returns adjusted position and guide lines to display
 */
export function calculateSnapping(
  object: CanvasObject,
  objects: CanvasObject[],
  canvasWidth: number,
  canvasHeight: number,
  enabled: boolean = true
): SnapResult {
  if (!enabled) {
    return { x: object.x, y: object.y, guides: [] };
  }

  const guides: SnapGuide[] = [];
  let snapX = object.x;
  let snapY = object.y;

  // Calculate object bounds
  const objWidth = object.width * object.scaleX;
  const objHeight = object.height * object.scaleY;
  const objCenterX = object.x + objWidth / 2;
  const objCenterY = object.y + objHeight / 2;
  const objRight = object.x + objWidth;
  const objBottom = object.y + objHeight;

  // Canvas center lines
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  // Check snapping to canvas center
  if (Math.abs(objCenterX - canvasCenterX) < SNAP_THRESHOLD) {
    snapX = canvasCenterX - objWidth / 2;
    guides.push({
      position: canvasCenterX,
      orientation: 'vertical',
      type: 'center',
    });
  }

  if (Math.abs(objCenterY - canvasCenterY) < SNAP_THRESHOLD) {
    snapY = canvasCenterY - objHeight / 2;
    guides.push({
      position: canvasCenterY,
      orientation: 'horizontal',
      type: 'center',
    });
  }

  // Check snapping to canvas edges
  if (Math.abs(object.x) < SNAP_THRESHOLD) {
    snapX = 0;
    guides.push({
      position: 0,
      orientation: 'vertical',
      type: 'edge',
    });
  }

  if (Math.abs(object.y) < SNAP_THRESHOLD) {
    snapY = 0;
    guides.push({
      position: 0,
      orientation: 'horizontal',
      type: 'edge',
    });
  }

  if (Math.abs(objRight - canvasWidth) < SNAP_THRESHOLD) {
    snapX = canvasWidth - objWidth;
    guides.push({
      position: canvasWidth,
      orientation: 'vertical',
      type: 'edge',
    });
  }

  if (Math.abs(objBottom - canvasHeight) < SNAP_THRESHOLD) {
    snapY = canvasHeight - objHeight;
    guides.push({
      position: canvasHeight,
      orientation: 'horizontal',
      type: 'edge',
    });
  }

  // Check snapping to other objects
  for (const other of objects) {
    if (other.id === object.id) continue;

    const otherWidth = other.width * other.scaleX;
    const otherHeight = other.height * other.scaleY;
    const otherCenterX = other.x + otherWidth / 2;
    const otherCenterY = other.y + otherHeight / 2;
    const otherRight = other.x + otherWidth;
    const otherBottom = other.y + otherHeight;

    // Vertical alignment
    // Center to center
    if (Math.abs(objCenterX - otherCenterX) < SNAP_THRESHOLD) {
      snapX = otherCenterX - objWidth / 2;
      guides.push({
        position: otherCenterX,
        orientation: 'vertical',
        type: 'object',
      });
    }

    // Left to left
    if (Math.abs(object.x - other.x) < SNAP_THRESHOLD) {
      snapX = other.x;
      guides.push({
        position: other.x,
        orientation: 'vertical',
        type: 'object',
      });
    }

    // Right to right
    if (Math.abs(objRight - otherRight) < SNAP_THRESHOLD) {
      snapX = otherRight - objWidth;
      guides.push({
        position: otherRight,
        orientation: 'vertical',
        type: 'object',
      });
    }

    // Left to right (adjacent)
    if (Math.abs(object.x - otherRight) < SNAP_THRESHOLD) {
      snapX = otherRight;
      guides.push({
        position: otherRight,
        orientation: 'vertical',
        type: 'object',
      });
    }

    // Right to left (adjacent)
    if (Math.abs(objRight - other.x) < SNAP_THRESHOLD) {
      snapX = other.x - objWidth;
      guides.push({
        position: other.x,
        orientation: 'vertical',
        type: 'object',
      });
    }

    // Horizontal alignment
    // Center to center
    if (Math.abs(objCenterY - otherCenterY) < SNAP_THRESHOLD) {
      snapY = otherCenterY - objHeight / 2;
      guides.push({
        position: otherCenterY,
        orientation: 'horizontal',
        type: 'object',
      });
    }

    // Top to top
    if (Math.abs(object.y - other.y) < SNAP_THRESHOLD) {
      snapY = other.y;
      guides.push({
        position: other.y,
        orientation: 'horizontal',
        type: 'object',
      });
    }

    // Bottom to bottom
    if (Math.abs(objBottom - otherBottom) < SNAP_THRESHOLD) {
      snapY = otherBottom - objHeight;
      guides.push({
        position: otherBottom,
        orientation: 'horizontal',
        type: 'object',
      });
    }

    // Top to bottom (adjacent)
    if (Math.abs(object.y - otherBottom) < SNAP_THRESHOLD) {
      snapY = otherBottom;
      guides.push({
        position: otherBottom,
        orientation: 'horizontal',
        type: 'object',
      });
    }

    // Bottom to top (adjacent)
    if (Math.abs(objBottom - other.y) < SNAP_THRESHOLD) {
      snapY = other.y - objHeight;
      guides.push({
        position: other.y,
        orientation: 'horizontal',
        type: 'object',
      });
    }
  }

  // Remove duplicate guides (same position and orientation)
  const uniqueGuides = guides.filter((guide, index, self) =>
    index === self.findIndex((g) =>
      g.position === guide.position && g.orientation === guide.orientation
    )
  );

  return {
    x: snapX,
    y: snapY,
    guides: uniqueGuides,
  };
}

/**
 * Calculate evenly spaced distribution for multiple objects
 */
export function distributeObjects(
  objectIds: string[],
  objects: CanvasObject[],
  direction: 'horizontal' | 'vertical'
): Partial<CanvasObject>[] {
  if (objectIds.length < 3) return [];

  const selectedObjects = objects
    .filter(obj => objectIds.includes(obj.id))
    .sort((a, b) => {
      if (direction === 'horizontal') {
        return a.x - b.x;
      } else {
        return a.y - b.y;
      }
    });

  const first = selectedObjects[0];
  const last = selectedObjects[selectedObjects.length - 1];

  if (direction === 'horizontal') {
    const firstCenter = first.x + (first.width * first.scaleX) / 2;
    const lastCenter = last.x + (last.width * last.scaleX) / 2;
    const totalSpan = lastCenter - firstCenter;
    const spacing = totalSpan / (selectedObjects.length - 1);

    return selectedObjects.map((obj, index) => {
      if (index === 0 || index === selectedObjects.length - 1) {
        return {}; // Don't move first/last
      }

      const targetCenter = firstCenter + spacing * index;
      const objWidth = obj.width * obj.scaleX;
      return {
        id: obj.id,
        x: targetCenter - objWidth / 2,
      };
    });
  } else {
    const firstCenter = first.y + (first.height * first.scaleY) / 2;
    const lastCenter = last.y + (last.height * last.scaleY) / 2;
    const totalSpan = lastCenter - firstCenter;
    const spacing = totalSpan / (selectedObjects.length - 1);

    return selectedObjects.map((obj, index) => {
      if (index === 0 || index === selectedObjects.length - 1) {
        return {}; // Don't move first/last
      }

      const targetCenter = firstCenter + spacing * index;
      const objHeight = obj.height * obj.scaleY;
      return {
        id: obj.id,
        y: targetCenter - objHeight / 2,
      };
    });
  }
}

/**
 * Align multiple objects
 */
export function alignObjects(
  objectIds: string[],
  objects: CanvasObject[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): Partial<CanvasObject>[] {
  if (objectIds.length < 2) return [];

  const selectedObjects = objects.filter(obj => objectIds.includes(obj.id));

  if (alignment === 'left') {
    const minX = Math.min(...selectedObjects.map(obj => obj.x));
    return selectedObjects.map(obj => ({ id: obj.id, x: minX }));
  }

  if (alignment === 'right') {
    const maxRight = Math.max(...selectedObjects.map(obj => obj.x + obj.width * obj.scaleX));
    return selectedObjects.map(obj => ({
      id: obj.id,
      x: maxRight - obj.width * obj.scaleX,
    }));
  }

  if (alignment === 'center') {
    const centers = selectedObjects.map(obj => obj.x + (obj.width * obj.scaleX) / 2);
    const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
    return selectedObjects.map(obj => ({
      id: obj.id,
      x: avgCenter - (obj.width * obj.scaleX) / 2,
    }));
  }

  if (alignment === 'top') {
    const minY = Math.min(...selectedObjects.map(obj => obj.y));
    return selectedObjects.map(obj => ({ id: obj.id, y: minY }));
  }

  if (alignment === 'bottom') {
    const maxBottom = Math.max(...selectedObjects.map(obj => obj.y + obj.height * obj.scaleY));
    return selectedObjects.map(obj => ({
      id: obj.id,
      y: maxBottom - obj.height * obj.scaleY,
    }));
  }

  if (alignment === 'middle') {
    const centers = selectedObjects.map(obj => obj.y + (obj.height * obj.scaleY) / 2);
    const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
    return selectedObjects.map(obj => ({
      id: obj.id,
      y: avgCenter - (obj.height * obj.scaleY) / 2,
    }));
  }

  return [];
}
