import { useMemo } from 'react';
import { CanvasObject } from '@/store/deckforge';

interface MultiSelectBoundingBoxProps {
  objects: CanvasObject[];
  stageScale: number;
}

export function MultiSelectBoundingBox({ objects, stageScale }: MultiSelectBoundingBoxProps) {
  const bounds = useMemo(() => {
    if (objects.length < 2) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const obj of objects) {
      const w = obj.width * obj.scaleX;
      const h = obj.height * obj.scaleY;
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + w);
      maxY = Math.max(maxY, obj.y + h);
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [objects]);

  if (!bounds) return null;

  const padding = 4 / stageScale;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Shared bounding box */}
      <rect
        x={bounds.x - padding}
        y={bounds.y - padding}
        width={bounds.width + padding * 2}
        height={bounds.height + padding * 2}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={1.5 / stageScale}
        strokeDasharray={`${6 / stageScale} ${3 / stageScale}`}
        opacity={0.9}
      />
      {/* Corner markers */}
      {[
        { x: bounds.x - padding, y: bounds.y - padding },
        { x: bounds.x + bounds.width + padding, y: bounds.y - padding },
        { x: bounds.x + bounds.width + padding, y: bounds.y + bounds.height + padding },
        { x: bounds.x - padding, y: bounds.y + bounds.height + padding },
      ].map((corner, i) => (
        <rect
          key={i}
          x={corner.x - 3 / stageScale}
          y={corner.y - 3 / stageScale}
          width={6 / stageScale}
          height={6 / stageScale}
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth={1 / stageScale}
        />
      ))}
      {/* Selection count badge */}
      <g>
        <rect
          x={bounds.x + bounds.width / 2 - 20 / stageScale}
          y={bounds.y - padding - 20 / stageScale}
          width={40 / stageScale}
          height={16 / stageScale}
          fill="rgba(59, 130, 246, 0.95)"
          rx={3 / stageScale}
        />
        <text
          x={bounds.x + bounds.width / 2}
          y={bounds.y - padding - 9 / stageScale}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={10 / stageScale}
          fontFamily="monospace"
          fontWeight="600"
        >
          {objects.length} sel
        </text>
      </g>
    </g>
  );
}
