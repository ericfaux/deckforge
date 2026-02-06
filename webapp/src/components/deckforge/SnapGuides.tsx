import { useDeckDimensions } from './WorkbenchStage';

interface SnapGuide {
  type: 'vertical' | 'horizontal' | 'spacing';
  position: number; // x for vertical, y for horizontal
  label?: string;
  // For spacing guides
  start?: number;
  end?: number;
  distance?: number;
}

interface SnapGuidesProps {
  guides: SnapGuide[];
  deckX: number;
  deckY: number;
  stageScale: number;
  deckWidth?: number;
  deckHeight?: number;
}

export function SnapGuides({ guides, deckX, deckY, stageScale, deckWidth: propDeckWidth, deckHeight: propDeckHeight }: SnapGuidesProps) {
  const { width: hookDeckWidth, height: hookDeckHeight } = useDeckDimensions();
  const DECK_WIDTH = propDeckWidth ?? hookDeckWidth;
  const DECK_HEIGHT = propDeckHeight ?? hookDeckHeight;
  if (guides.length === 0) return null;

  return (
    <g transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`} style={{ pointerEvents: 'none' }}>
      {guides.map((guide, index) => {
        if (guide.type === 'spacing') {
          // Render spacing measurement
          const isVertical = guide.start !== undefined && guide.end !== undefined;
          if (!isVertical || guide.distance === undefined) return null;
          
          const midPoint = (guide.start! + guide.end!) / 2;
          const length = Math.abs(guide.end! - guide.start!);
          
          return (
            <g key={`spacing-${index}`}>
              {/* Measurement line */}
              <line
                x1={guide.position}
                y1={guide.start}
                x2={guide.position}
                y2={guide.end}
                stroke="#00d9ff"
                strokeWidth={1.5 / stageScale}
                opacity={0.9}
              />
              {/* End caps */}
              <line
                x1={guide.position - 5 / stageScale}
                y1={guide.start}
                x2={guide.position + 5 / stageScale}
                y2={guide.start}
                stroke="#00d9ff"
                strokeWidth={1.5 / stageScale}
              />
              <line
                x1={guide.position - 5 / stageScale}
                y1={guide.end}
                x2={guide.position + 5 / stageScale}
                y2={guide.end}
                stroke="#00d9ff"
                strokeWidth={1.5 / stageScale}
              />
              {/* Distance label */}
              <g>
                <rect
                  x={guide.position - 25 / stageScale}
                  y={midPoint - 10 / stageScale}
                  width={50 / stageScale}
                  height={20 / stageScale}
                  fill="rgba(0, 217, 255, 0.95)"
                  rx={4 / stageScale}
                />
                <text
                  x={guide.position}
                  y={midPoint + 2 / stageScale}
                  textAnchor="middle"
                  fill="white"
                  fontSize={11 / stageScale}
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {Math.round(guide.distance)}px
                </text>
              </g>
            </g>
          );
        }
        
        if (guide.type === 'vertical') {
          return (
            <g key={`v-${index}`}>
              <line
                x1={guide.position}
                y1={0}
                x2={guide.position}
                y2={DECK_HEIGHT}
                stroke="#0d99ff"
                strokeWidth={1 / stageScale}
                strokeDasharray={`${4 / stageScale} ${2 / stageScale}`}
                opacity={0.9}
              />
              {guide.label && (
                <g>
                  <rect
                    x={guide.position - 30 / stageScale}
                    y={10 / stageScale}
                    width={60 / stageScale}
                    height={16 / stageScale}
                    fill="rgba(13, 153, 255, 0.95)"
                    rx={3 / stageScale}
                  />
                  <text
                    x={guide.position}
                    y={20 / stageScale}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10 / stageScale}
                    fontFamily="monospace"
                  >
                    {guide.label}
                  </text>
                </g>
              )}
            </g>
          );
        } else {
          return (
            <g key={`h-${index}`}>
              <line
                x1={0}
                y1={guide.position}
                x2={DECK_WIDTH}
                y2={guide.position}
                stroke="#0d99ff"
                strokeWidth={1 / stageScale}
                strokeDasharray={`${4 / stageScale} ${2 / stageScale}`}
                opacity={0.9}
              />
              {guide.label && (
                <g>
                  <rect
                    x={10 / stageScale}
                    y={guide.position - 8 / stageScale}
                    width={60 / stageScale}
                    height={16 / stageScale}
                    fill="rgba(13, 153, 255, 0.95)"
                    rx={3 / stageScale}
                  />
                  <text
                    x={40 / stageScale}
                    y={guide.position + 3 / stageScale}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10 / stageScale}
                    fontFamily="monospace"
                  >
                    {guide.label}
                  </text>
                </g>
              )}
            </g>
          );
        }
      })}
    </g>
  );
}

// Guide snap target from hardware guides, safe zones, etc.
export interface GuideSnapTarget {
  position: number;
  orientation: 'horizontal' | 'vertical';
  label: string;
}

// Calculate snap position and guides - returns both snapped coordinates and visual guides
export function calculateSnapPosition(
  draggedObject: { x: number; y: number; width: number; height: number; scaleX: number; scaleY: number },
  otherObjects: Array<{ id: string; x: number; y: number; width: number; height: number; scaleX: number; scaleY: number }>,
  snapThreshold: number = 5,
  deckWidth: number = 96,
  deckHeight: number = 294,
  guideTargets?: GuideSnapTarget[]
): { snappedX: number; snappedY: number; guides: SnapGuide[]; snapLabel?: string } {
  const draggedWidth = draggedObject.width * draggedObject.scaleX;
  const draggedHeight = draggedObject.height * draggedObject.scaleY;
  const draggedCenterX = draggedObject.x + draggedWidth / 2;
  const draggedCenterY = draggedObject.y + draggedHeight / 2;
  const draggedRight = draggedObject.x + draggedWidth;
  const draggedBottom = draggedObject.y + draggedHeight;

  let snapX: number | null = null;
  let snapY: number | null = null;
  let bestSnapDistX = snapThreshold;
  let bestSnapDistY = snapThreshold;
  const guides: SnapGuide[] = [];

  // Check deck center
  const deckCenterX = deckWidth / 2;
  const deckCenterY = deckHeight / 2;

  // Vertical center snap
  const centerXDist = Math.abs(draggedCenterX - deckCenterX);
  if (centerXDist < bestSnapDistX) {
    bestSnapDistX = centerXDist;
    snapX = deckCenterX - draggedWidth / 2;
    guides.push({ type: 'vertical', position: deckCenterX, label: 'Center' });
  }

  // Horizontal center snap
  const centerYDist = Math.abs(draggedCenterY - deckCenterY);
  if (centerYDist < bestSnapDistY) {
    bestSnapDistY = centerYDist;
    snapY = deckCenterY - draggedHeight / 2;
    guides.push({ type: 'horizontal', position: deckCenterY, label: 'Center' });
  }

  // Deck edges
  const leftDist = Math.abs(draggedObject.x);
  if (leftDist < bestSnapDistX) {
    bestSnapDistX = leftDist;
    snapX = 0;
    guides.push({ type: 'vertical', position: 0 });
  }
  const rightDist = Math.abs(draggedRight - deckWidth);
  if (rightDist < bestSnapDistX) {
    bestSnapDistX = rightDist;
    snapX = deckWidth - draggedWidth;
    guides.push({ type: 'vertical', position: deckWidth });
  }
  const topDist = Math.abs(draggedObject.y);
  if (topDist < bestSnapDistY) {
    bestSnapDistY = topDist;
    snapY = 0;
    guides.push({ type: 'horizontal', position: 0 });
  }
  const bottomDist = Math.abs(draggedBottom - deckHeight);
  if (bottomDist < bestSnapDistY) {
    bestSnapDistY = bottomDist;
    snapY = deckHeight - draggedHeight;
    guides.push({ type: 'horizontal', position: deckHeight });
  }

  // Check alignment with other objects
  for (const other of otherObjects) {
    const otherWidth = other.width * other.scaleX;
    const otherHeight = other.height * other.scaleY;
    const otherCenterX = other.x + otherWidth / 2;
    const otherCenterY = other.y + otherHeight / 2;
    const otherRight = other.x + otherWidth;
    const otherBottom = other.y + otherHeight;

    // Left edge to left edge
    let dist = Math.abs(draggedObject.x - other.x);
    if (dist < bestSnapDistX) { bestSnapDistX = dist; snapX = other.x; guides.push({ type: 'vertical', position: other.x }); }

    // Right edge to right edge
    dist = Math.abs(draggedRight - otherRight);
    if (dist < bestSnapDistX) { bestSnapDistX = dist; snapX = otherRight - draggedWidth; guides.push({ type: 'vertical', position: otherRight }); }

    // Center to center (X)
    dist = Math.abs(draggedCenterX - otherCenterX);
    if (dist < bestSnapDistX) { bestSnapDistX = dist; snapX = otherCenterX - draggedWidth / 2; guides.push({ type: 'vertical', position: otherCenterX }); }

    // Left to right edge
    dist = Math.abs(draggedObject.x - otherRight);
    if (dist < bestSnapDistX) { bestSnapDistX = dist; snapX = otherRight; guides.push({ type: 'vertical', position: otherRight }); }

    // Right to left edge
    dist = Math.abs(draggedRight - other.x);
    if (dist < bestSnapDistX) { bestSnapDistX = dist; snapX = other.x - draggedWidth; guides.push({ type: 'vertical', position: other.x }); }

    // Top edge to top edge
    dist = Math.abs(draggedObject.y - other.y);
    if (dist < bestSnapDistY) { bestSnapDistY = dist; snapY = other.y; guides.push({ type: 'horizontal', position: other.y }); }

    // Bottom edge to bottom edge
    dist = Math.abs(draggedBottom - otherBottom);
    if (dist < bestSnapDistY) { bestSnapDistY = dist; snapY = otherBottom - draggedHeight; guides.push({ type: 'horizontal', position: otherBottom }); }

    // Center to center (Y)
    dist = Math.abs(draggedCenterY - otherCenterY);
    if (dist < bestSnapDistY) { bestSnapDistY = dist; snapY = otherCenterY - draggedHeight / 2; guides.push({ type: 'horizontal', position: otherCenterY }); }

    // Top to bottom edge
    dist = Math.abs(draggedObject.y - otherBottom);
    if (dist < bestSnapDistY) { bestSnapDistY = dist; snapY = otherBottom; guides.push({ type: 'horizontal', position: otherBottom }); }

    // Bottom to top edge
    dist = Math.abs(draggedBottom - other.y);
    if (dist < bestSnapDistY) { bestSnapDistY = dist; snapY = other.y - draggedHeight; guides.push({ type: 'horizontal', position: other.y }); }
  }

  // Snap to hardware guide targets (center axis, truck holes, safe zones, etc.)
  let snapLabel: string | undefined;
  if (guideTargets && guideTargets.length > 0) {
    for (const target of guideTargets) {
      if (target.orientation === 'vertical') {
        // Snap object center X to guide
        let dist = Math.abs(draggedCenterX - target.position);
        if (dist < bestSnapDistX) {
          bestSnapDistX = dist;
          snapX = target.position - draggedWidth / 2;
          guides.push({ type: 'vertical', position: target.position, label: target.label });
          snapLabel = `Snapped to ${target.label.toLowerCase()}`;
        }
        // Snap left edge to guide
        dist = Math.abs(draggedObject.x - target.position);
        if (dist < bestSnapDistX) {
          bestSnapDistX = dist;
          snapX = target.position;
          guides.push({ type: 'vertical', position: target.position, label: target.label });
          snapLabel = `Aligned with ${target.label.toLowerCase()}`;
        }
        // Snap right edge to guide
        dist = Math.abs(draggedRight - target.position);
        if (dist < bestSnapDistX) {
          bestSnapDistX = dist;
          snapX = target.position - draggedWidth;
          guides.push({ type: 'vertical', position: target.position, label: target.label });
          snapLabel = `Aligned with ${target.label.toLowerCase()}`;
        }
      } else {
        // Snap object center Y to guide
        let dist = Math.abs(draggedCenterY - target.position);
        if (dist < bestSnapDistY) {
          bestSnapDistY = dist;
          snapY = target.position - draggedHeight / 2;
          guides.push({ type: 'horizontal', position: target.position, label: target.label });
          snapLabel = `Snapped to ${target.label.toLowerCase()}`;
        }
        // Snap top edge to guide
        dist = Math.abs(draggedObject.y - target.position);
        if (dist < bestSnapDistY) {
          bestSnapDistY = dist;
          snapY = target.position;
          guides.push({ type: 'horizontal', position: target.position, label: target.label });
          snapLabel = `Aligned with ${target.label.toLowerCase()}`;
        }
        // Snap bottom edge to guide
        dist = Math.abs(draggedBottom - target.position);
        if (dist < bestSnapDistY) {
          bestSnapDistY = dist;
          snapY = target.position - draggedHeight;
          guides.push({ type: 'horizontal', position: target.position, label: target.label });
          snapLabel = `Aligned with ${target.label.toLowerCase()}`;
        }
      }
    }
  }

  // Add spacing measurements
  const snappedObj = {
    ...draggedObject,
    x: snapX !== null ? snapX : draggedObject.x,
    y: snapY !== null ? snapY : draggedObject.y,
  };
  const snappedRight = snappedObj.x + draggedWidth;
  const snappedBottom = snappedObj.y + draggedHeight;

  for (const other of otherObjects) {
    const otherWidth = other.width * other.scaleX;
    const otherHeight = other.height * other.scaleY;
    const otherRight = other.x + otherWidth;
    const otherBottom = other.y + otherHeight;

    const hOverlap = snappedObj.y < otherBottom && snappedBottom > other.y;
    if (hOverlap) {
      if (snappedRight < other.x && other.x - snappedRight < 100) {
        const distance = other.x - snappedRight;
        const cy = Math.max(snappedObj.y, other.y) + Math.min(snappedBottom - snappedObj.y, otherBottom - other.y) / 2;
        guides.push({ type: 'spacing', position: snappedRight + distance / 2, start: cy - 20, end: cy + 20, distance });
      }
      if (snappedObj.x > otherRight && snappedObj.x - otherRight < 100) {
        const distance = snappedObj.x - otherRight;
        const cy = Math.max(snappedObj.y, other.y) + Math.min(snappedBottom - snappedObj.y, otherBottom - other.y) / 2;
        guides.push({ type: 'spacing', position: otherRight + distance / 2, start: cy - 20, end: cy + 20, distance });
      }
    }

    const vOverlap = snappedObj.x < otherRight && snappedRight > other.x;
    if (vOverlap) {
      if (snappedBottom < other.y && other.y - snappedBottom < 100) {
        const distance = other.y - snappedBottom;
        const cx = Math.max(snappedObj.x, other.x) + Math.min(snappedRight - snappedObj.x, otherRight - other.x) / 2;
        guides.push({ type: 'spacing', position: cx, start: snappedBottom, end: other.y, distance });
      }
      if (snappedObj.y > otherBottom && snappedObj.y - otherBottom < 100) {
        const distance = snappedObj.y - otherBottom;
        const cx = Math.max(snappedObj.x, other.x) + Math.min(snappedRight - snappedObj.x, otherRight - other.x) / 2;
        guides.push({ type: 'spacing', position: cx, start: otherBottom, end: snappedObj.y, distance });
      }
    }
  }

  // De-duplicate guides
  const uniqueGuides: SnapGuide[] = [];
  for (const guide of guides) {
    if (!uniqueGuides.some(g => g.type === guide.type && Math.abs(g.position - guide.position) < 1)) {
      uniqueGuides.push(guide);
    }
  }

  return {
    snappedX: snapX !== null ? snapX : draggedObject.x,
    snappedY: snapY !== null ? snapY : draggedObject.y,
    guides: uniqueGuides,
    snapLabel,
  };
}

// Helper function to calculate snap guides for an object being dragged
export function calculateSnapGuides(
  draggedObject: { x: number; y: number; width: number; height: number; scaleX: number; scaleY: number },
  otherObjects: Array<{ id: string; x: number; y: number; width: number; height: number; scaleX: number; scaleY: number }>,
  snapThreshold: number = 5,
  deckWidth: number = 96,  // Default to legacy value for backward compatibility
  deckHeight: number = 294 // Default to legacy value for backward compatibility
): SnapGuide[] {
  const guides: SnapGuide[] = [];
  
  const draggedWidth = draggedObject.width * draggedObject.scaleX;
  const draggedHeight = draggedObject.height * draggedObject.scaleY;
  const draggedCenterX = draggedObject.x + draggedWidth / 2;
  const draggedCenterY = draggedObject.y + draggedHeight / 2;
  const draggedRight = draggedObject.x + draggedWidth;
  const draggedBottom = draggedObject.y + draggedHeight;

  // Check alignment with deck center
  const deckCenterX = deckWidth / 2;
  const deckCenterY = deckHeight / 2;

  if (Math.abs(draggedCenterX - deckCenterX) < snapThreshold) {
    guides.push({
      type: 'vertical',
      position: deckCenterX,
      label: 'Center',
    });
  }

  if (Math.abs(draggedCenterY - deckCenterY) < snapThreshold) {
    guides.push({
      type: 'horizontal',
      position: deckCenterY,
      label: 'Center',
    });
  }

  // Check alignment with other objects
  otherObjects.forEach((other) => {
    const otherWidth = other.width * other.scaleX;
    const otherHeight = other.height * other.scaleY;
    const otherCenterX = other.x + otherWidth / 2;
    const otherCenterY = other.y + otherHeight / 2;
    const otherRight = other.x + otherWidth;
    const otherBottom = other.y + otherHeight;

    // Vertical alignment checks
    // Left edges
    if (Math.abs(draggedObject.x - other.x) < snapThreshold) {
      guides.push({ type: 'vertical', position: other.x });
    }
    // Right edges
    if (Math.abs(draggedRight - otherRight) < snapThreshold) {
      guides.push({ type: 'vertical', position: otherRight });
    }
    // Center alignment
    if (Math.abs(draggedCenterX - otherCenterX) < snapThreshold) {
      guides.push({ type: 'vertical', position: otherCenterX });
    }
    // Left to right alignment
    if (Math.abs(draggedObject.x - otherRight) < snapThreshold) {
      guides.push({ type: 'vertical', position: otherRight });
    }
    // Right to left alignment
    if (Math.abs(draggedRight - other.x) < snapThreshold) {
      guides.push({ type: 'vertical', position: other.x });
    }

    // Horizontal alignment checks
    // Top edges
    if (Math.abs(draggedObject.y - other.y) < snapThreshold) {
      guides.push({ type: 'horizontal', position: other.y });
    }
    // Bottom edges
    if (Math.abs(draggedBottom - otherBottom) < snapThreshold) {
      guides.push({ type: 'horizontal', position: otherBottom });
    }
    // Center alignment
    if (Math.abs(draggedCenterY - otherCenterY) < snapThreshold) {
      guides.push({ type: 'horizontal', position: otherCenterY });
    }
    // Top to bottom alignment
    if (Math.abs(draggedObject.y - otherBottom) < snapThreshold) {
      guides.push({ type: 'horizontal', position: otherBottom });
    }
    // Bottom to top alignment
    if (Math.abs(draggedBottom - other.y) < snapThreshold) {
      guides.push({ type: 'horizontal', position: other.y });
    }
  });

  // Add spacing measurements for nearby objects
  otherObjects.forEach((other) => {
    const otherWidth = other.width * other.scaleX;
    const otherHeight = other.height * other.scaleY;
    const otherRight = other.x + otherWidth;
    const otherBottom = other.y + otherHeight;
    
    // Check for vertical spacing (objects side by side)
    const horizontalOverlap = 
      (draggedObject.y < otherBottom && draggedBottom > other.y);
    
    if (horizontalOverlap) {
      // Object to the right
      if (draggedRight < other.x && other.x - draggedRight < 100) {
        const distance = other.x - draggedRight;
        const centerY = Math.max(draggedObject.y, other.y) + 
                       Math.min(draggedBottom - draggedObject.y, otherBottom - other.y) / 2;
        guides.push({
          type: 'spacing',
          position: draggedRight + distance / 2,
          start: centerY - 20,
          end: centerY + 20,
          distance: distance,
        });
      }
      // Object to the left
      if (draggedObject.x > otherRight && draggedObject.x - otherRight < 100) {
        const distance = draggedObject.x - otherRight;
        const centerY = Math.max(draggedObject.y, other.y) + 
                       Math.min(draggedBottom - draggedObject.y, otherBottom - other.y) / 2;
        guides.push({
          type: 'spacing',
          position: otherRight + distance / 2,
          start: centerY - 20,
          end: centerY + 20,
          distance: distance,
        });
      }
    }
    
    // Check for horizontal spacing (objects stacked)
    const verticalOverlap = 
      (draggedObject.x < otherRight && draggedRight > other.x);
    
    if (verticalOverlap) {
      // Object below
      if (draggedBottom < other.y && other.y - draggedBottom < 100) {
        const distance = other.y - draggedBottom;
        const centerX = Math.max(draggedObject.x, other.x) + 
                       Math.min(draggedRight - draggedObject.x, otherRight - other.x) / 2;
        guides.push({
          type: 'spacing',
          position: centerX,
          start: draggedBottom,
          end: other.y,
          distance: distance,
        });
      }
      // Object above
      if (draggedObject.y > otherBottom && draggedObject.y - otherBottom < 100) {
        const distance = draggedObject.y - otherBottom;
        const centerX = Math.max(draggedObject.x, other.x) + 
                       Math.min(draggedRight - draggedObject.x, otherRight - other.x) / 2;
        guides.push({
          type: 'spacing',
          position: centerX,
          start: otherBottom,
          end: draggedObject.y,
          distance: distance,
        });
      }
    }
  });

  // Remove duplicate guides
  const uniqueGuides: SnapGuide[] = [];
  guides.forEach((guide) => {
    const isDuplicate = uniqueGuides.some(
      (existing) =>
        existing.type === guide.type &&
        Math.abs(existing.position - guide.position) < 1
    );
    if (!isDuplicate) {
      uniqueGuides.push(guide);
    }
  });

  return uniqueGuides;
}
