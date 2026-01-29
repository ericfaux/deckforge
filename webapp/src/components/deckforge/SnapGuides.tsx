import { DECK_WIDTH, DECK_HEIGHT } from './WorkbenchStage';

interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number; // x for vertical, y for horizontal
  label?: string;
}

interface SnapGuidesProps {
  guides: SnapGuide[];
  deckX: number;
  deckY: number;
  stageScale: number;
}

export function SnapGuides({ guides, deckX, deckY, stageScale }: SnapGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <g transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`} style={{ pointerEvents: 'none' }}>
      {guides.map((guide, index) => {
        if (guide.type === 'vertical') {
          return (
            <g key={`v-${index}`}>
              <line
                x1={guide.position}
                y1={0}
                x2={guide.position}
                y2={DECK_HEIGHT}
                stroke="#ff0000"
                strokeWidth={1 / stageScale}
                strokeDasharray={`${4 / stageScale} ${2 / stageScale}`}
                opacity={0.8}
              />
              {guide.label && (
                <g>
                  <rect
                    x={guide.position - 30 / stageScale}
                    y={10 / stageScale}
                    width={60 / stageScale}
                    height={16 / stageScale}
                    fill="rgba(255, 0, 0, 0.9)"
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
                stroke="#ff0000"
                strokeWidth={1 / stageScale}
                strokeDasharray={`${4 / stageScale} ${2 / stageScale}`}
                opacity={0.8}
              />
              {guide.label && (
                <g>
                  <rect
                    x={10 / stageScale}
                    y={guide.position - 8 / stageScale}
                    width={60 / stageScale}
                    height={16 / stageScale}
                    fill="rgba(255, 0, 0, 0.9)"
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
  snapThreshold: number = 5
): SnapGuide[] {
  const guides: SnapGuide[] = [];
  
  const draggedWidth = draggedObject.width * draggedObject.scaleX;
  const draggedHeight = draggedObject.height * draggedObject.scaleY;
  const draggedCenterX = draggedObject.x + draggedWidth / 2;
  const draggedCenterY = draggedObject.y + draggedHeight / 2;
  const draggedRight = draggedObject.x + draggedWidth;
  const draggedBottom = draggedObject.y + draggedHeight;

  // Check alignment with deck center
  const deckCenterX = DECK_WIDTH / 2;
  const deckCenterY = DECK_HEIGHT / 2;

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
