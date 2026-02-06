import { useMemo } from 'react';
import { useDeckDimensions } from './WorkbenchStage';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';

interface SymmetryGuideProps {
  deckX: number;
  deckY: number;
  stageScale: number;
  enabled: boolean;
}

/**
 * Checks if the design is approximately vertically symmetric
 * by comparing object positions relative to the center axis.
 */
function checkVerticalSymmetry(objects: CanvasObject[], centerX: number): {
  isSymmetric: boolean;
  asymmetricObjects: string[];
} {
  const threshold = 3; // px tolerance
  const asymmetricObjects: string[] = [];

  for (const obj of objects) {
    if (obj.hidden) continue;
    const objWidth = obj.width * obj.scaleX;
    const objCenterX = obj.x + objWidth / 2;
    const distFromCenter = Math.abs(objCenterX - centerX);

    // Object is on center - symmetric by itself
    if (distFromCenter < threshold) continue;

    // Look for a mirror object on the other side
    const mirrorX = centerX - (objCenterX - centerX);
    const hasMirror = objects.some(other => {
      if (other.id === obj.id || other.hidden) return false;
      const otherWidth = other.width * other.scaleX;
      const otherCenterX = other.x + otherWidth / 2;
      return Math.abs(otherCenterX - mirrorX) < threshold;
    });

    if (!hasMirror) {
      asymmetricObjects.push(obj.id);
    }
  }

  return {
    isSymmetric: asymmetricObjects.length === 0,
    asymmetricObjects,
  };
}

export function SymmetryGuide({ deckX, deckY, stageScale, enabled }: SymmetryGuideProps) {
  if (!enabled) return null;

  const objects = useDeckForgeStore(state => state.objects);
  const { width: deckWidth, height: deckHeight } = useDeckDimensions();
  const centerX = deckWidth / 2;

  const symmetry = useMemo(
    () => checkVerticalSymmetry(objects, centerX),
    [objects, centerX]
  );

  const fontSize = 4;

  return (
    <g
      transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
      pointerEvents="none"
    >
      {/* Center symmetry line */}
      <line
        x1={centerX}
        y1={0}
        x2={centerX}
        y2={deckHeight}
        stroke={symmetry.isSymmetric ? '#4caf50' : '#ff9800'}
        strokeWidth={0.6}
        strokeDasharray="1,1"
        opacity={0.6}
      />

      {/* Mirror reflection markers along the center line */}
      {Array.from({ length: Math.floor(deckHeight / 20) }, (_, i) => (
        <g key={i}>
          <line
            x1={centerX - 2}
            y1={i * 20 + 10}
            x2={centerX + 2}
            y2={i * 20 + 10}
            stroke={symmetry.isSymmetric ? '#4caf50' : '#ff9800'}
            strokeWidth={0.4}
            opacity={0.4}
          />
        </g>
      ))}

      {/* Symmetry status indicator */}
      <g>
        <rect
          x={centerX - 18}
          y={4}
          width={36}
          height={10}
          fill={symmetry.isSymmetric ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 152, 0, 0.9)'}
          rx={2}
        />
        <text
          x={centerX}
          y={11}
          textAnchor="middle"
          fill="white"
          fontSize={fontSize}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
        >
          {symmetry.isSymmetric ? 'SYMMETRIC' : 'ASYMMETRIC'}
        </text>
      </g>

      {/* Highlight asymmetric objects */}
      {!symmetry.isSymmetric && symmetry.asymmetricObjects.map(id => {
        const obj = objects.find(o => o.id === id);
        if (!obj) return null;
        const w = obj.width * obj.scaleX;
        const h = obj.height * obj.scaleY;
        return (
          <rect
            key={id}
            x={obj.x - 1}
            y={obj.y - 1}
            width={w + 2}
            height={h + 2}
            fill="none"
            stroke="#ff9800"
            strokeWidth={0.8}
            strokeDasharray="2,1"
            opacity={0.6}
          />
        );
      })}
    </g>
  );
}
