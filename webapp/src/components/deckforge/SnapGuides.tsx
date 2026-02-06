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
