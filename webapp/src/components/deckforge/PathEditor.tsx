import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CanvasObject, PathPoint } from '@/store/deckforge';

interface PathEditorProps {
  object: CanvasObject;
  deckX: number;
  deckY: number;
  stageScale: number;
  onUpdatePoints: (points: PathPoint[]) => void;
  onClose: () => void;
}

/**
 * Figma-style direct path node editor overlay.
 * Rendered as an SVG <g> on top of the canvas when a path object is double-clicked.
 */
export function PathEditor({
  object,
  deckX,
  deckY,
  stageScale,
  onUpdatePoints,
  onClose,
}: PathEditorProps) {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Track what is being dragged: 'anchor' | 'cp1' | 'cp2' | null
  const dragTarget = useRef<'anchor' | 'cp1' | 'cp2' | null>(null);
  const dragPointIndex = useRef<number | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const pointsSnapshot = useRef<PathPoint[] | null>(null);

  const points = object.pathPoints ?? [];
  const isClosed = object.pathClosed ?? false;

  // Sizes that stay visually constant regardless of zoom
  const anchorSize = 6 / stageScale;
  const anchorHoverSize = 8 / stageScale;
  const cpRadius = 4 / stageScale;
  const strokeWidth = 1 / stageScale;
  const dashArray = `${4 / stageScale} ${3 / stageScale}`;
  const pathStrokeWidth = 1.5 / stageScale;
  const hitStrokeWidth = 12 / stageScale;

  // --- Keyboard listeners ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPointIndex !== null) {
        e.preventDefault();
        e.stopPropagation();

        const updated = points.filter((_, i) => i !== selectedPointIndex);
        setSelectedPointIndex(null);

        if (updated.length < 2) {
          onUpdatePoints(updated);
          onClose();
        } else {
          onUpdatePoints(updated);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPointIndex, points, onUpdatePoints, onClose]);

  // --- Convert mouse event to local (object-space) coordinates ---
  const screenToLocal = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      const svg = (e.target as SVGElement).ownerSVGElement;
      if (!svg) return { x: 0, y: 0 };

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;

      // Transform from screen to SVG root
      const svgPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      // Remove deck transform: translate(deckX, deckY) scale(stageScale)
      const afterDeck = {
        x: (svgPoint.x - deckX) / stageScale,
        y: (svgPoint.y - deckY) / stageScale,
      };

      // Remove object transform: translate(x,y) rotate(r) scale(sx, sy)
      const rad = -((object.rotation ?? 0) * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const tx = afterDeck.x - object.x;
      const ty = afterDeck.y - object.y;
      const sx = object.scaleX || 1;
      const sy = object.scaleY || 1;

      return {
        x: (cos * tx + sin * ty) / sx,
        y: (-sin * tx + cos * ty) / sy,
      };
    },
    [deckX, deckY, stageScale, object.x, object.y, object.rotation, object.scaleX, object.scaleY],
  );

  // --- Drag handlers ---
  const handlePointerDown = useCallback(
    (
      e: React.PointerEvent<SVGElement>,
      index: number,
      target: 'anchor' | 'cp1' | 'cp2',
    ) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as SVGElement).setPointerCapture(e.pointerId);

      setIsDragging(true);
      setSelectedPointIndex(index);
      dragTarget.current = target;
      dragPointIndex.current = index;

      const local = screenToLocal(e as unknown as React.MouseEvent<SVGElement>);
      dragStart.current = local;
      pointsSnapshot.current = points.map((p) => ({ ...p }));
    },
    [points, screenToLocal],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGElement>) => {
      if (!isDragging || dragPointIndex.current === null || !dragStart.current || !pointsSnapshot.current) return;

      const local = screenToLocal(e as unknown as React.MouseEvent<SVGElement>);
      const dx = local.x - dragStart.current.x;
      const dy = local.y - dragStart.current.y;

      const idx = dragPointIndex.current;
      const snap = pointsSnapshot.current;
      const updated = snap.map((p) => ({ ...p }));
      const target = dragTarget.current;

      if (target === 'anchor') {
        updated[idx] = {
          ...updated[idx],
          x: snap[idx].x + dx,
          y: snap[idx].y + dy,
          cp1x: snap[idx].cp1x !== undefined ? snap[idx].cp1x! + dx : undefined,
          cp1y: snap[idx].cp1y !== undefined ? snap[idx].cp1y! + dy : undefined,
          cp2x: snap[idx].cp2x !== undefined ? snap[idx].cp2x! + dx : undefined,
          cp2y: snap[idx].cp2y !== undefined ? snap[idx].cp2y! + dy : undefined,
        };
      } else if (target === 'cp1') {
        updated[idx] = {
          ...updated[idx],
          cp1x: snap[idx].cp1x !== undefined ? snap[idx].cp1x! + dx : local.x,
          cp1y: snap[idx].cp1y !== undefined ? snap[idx].cp1y! + dy : local.y,
        };
      } else if (target === 'cp2') {
        updated[idx] = {
          ...updated[idx],
          cp2x: snap[idx].cp2x !== undefined ? snap[idx].cp2x! + dx : local.x,
          cp2y: snap[idx].cp2y !== undefined ? snap[idx].cp2y! + dy : local.y,
        };
      }

      onUpdatePoints(updated);
    },
    [isDragging, screenToLocal, onUpdatePoints],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGElement>) => {
      if (isDragging) {
        (e.target as SVGElement).releasePointerCapture?.(e.pointerId);
      }
      setIsDragging(false);
      dragTarget.current = null;
      dragPointIndex.current = null;
      dragStart.current = null;
      pointsSnapshot.current = null;
    },
    [isDragging],
  );

  // --- Build the SVG path d string ---
  const buildPathD = useCallback(() => {
    if (points.length === 0) return '';

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      const hasCP2Prev = prev.cp2x !== undefined && prev.cp2y !== undefined;
      const hasCP1Curr = curr.cp1x !== undefined && curr.cp1y !== undefined;

      if (hasCP2Prev && hasCP1Curr) {
        d += ` C ${prev.cp2x} ${prev.cp2y}, ${curr.cp1x} ${curr.cp1y}, ${curr.x} ${curr.y}`;
      } else if (hasCP2Prev) {
        d += ` Q ${prev.cp2x} ${prev.cp2y}, ${curr.x} ${curr.y}`;
      } else if (hasCP1Curr) {
        d += ` Q ${curr.cp1x} ${curr.cp1y}, ${curr.x} ${curr.y}`;
      } else {
        d += ` L ${curr.x} ${curr.y}`;
      }
    }

    if (isClosed && points.length > 2) {
      const last = points[points.length - 1];
      const first = points[0];
      const hasCP2Last = last.cp2x !== undefined && last.cp2y !== undefined;
      const hasCP1First = first.cp1x !== undefined && first.cp1y !== undefined;

      if (hasCP2Last && hasCP1First) {
        d += ` C ${last.cp2x} ${last.cp2y}, ${first.cp1x} ${first.cp1y}, ${first.x} ${first.y}`;
      } else if (hasCP2Last) {
        d += ` Q ${last.cp2x} ${last.cp2y}, ${first.x} ${first.y}`;
      } else if (hasCP1First) {
        d += ` Q ${first.cp1x} ${first.cp1y}, ${first.x} ${first.y}`;
      } else {
        d += ' Z';
      }
    }

    return d;
  }, [points, isClosed]);

  // --- Add point on segment click ---
  const handleSegmentClick = useCallback(
    (e: React.MouseEvent<SVGPathElement>) => {
      if (isDragging) return;
      e.preventDefault();
      e.stopPropagation();

      const local = screenToLocal(e);

      // Find the closest segment to insert the new point
      let bestIndex = points.length; // insert at end by default
      let bestDist = Infinity;

      const segmentCount = isClosed ? points.length : points.length - 1;
      for (let i = 0; i < segmentCount; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        const dist = distToSegment(local, a, b);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i + 1;
        }
      }

      const newPoint: PathPoint = { x: local.x, y: local.y };
      const updated = [...points];
      updated.splice(bestIndex, 0, newPoint);
      setSelectedPointIndex(bestIndex);
      onUpdatePoints(updated);
    },
    [isDragging, points, isClosed, screenToLocal, onUpdatePoints],
  );

  // --- Click on empty area deselects ---
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      if (!isDragging) {
        e.stopPropagation();
        setSelectedPointIndex(null);
      }
    },
    [isDragging],
  );

  const pathD = buildPathD();

  return (
    <g
      transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <g
        transform={`translate(${object.x}, ${object.y}) rotate(${object.rotation ?? 0}) scale(${object.scaleX ?? 1}, ${object.scaleY ?? 1})`}
      >
        {/* Invisible hit area for deselecting */}
        <rect
          x={-10000}
          y={-10000}
          width={20000}
          height={20000}
          fill="transparent"
          onClick={handleBackgroundClick}
          style={{ pointerEvents: isDragging ? 'none' : 'all' }}
        />

        {/* Editing path stroke */}
        {pathD ? (
          <>
            <path
              d={pathD}
              fill="none"
              stroke="#0d99ff"
              strokeWidth={pathStrokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            />
            {/* Invisible wide hit area for adding points on segment */}
            <path
              d={pathD}
              fill="none"
              stroke="transparent"
              strokeWidth={hitStrokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              onClick={handleSegmentClick}
              style={{ cursor: 'crosshair', pointerEvents: isDragging ? 'none' : 'stroke' }}
            />
          </>
        ) : null}

        {/* Control point handles and lines */}
        {points.map((pt, i) => {
          const elements: React.ReactNode[] = [];

          // CP1 line + handle
          if (pt.cp1x !== undefined && pt.cp1y !== undefined) {
            elements.push(
              <line
                key={`cp1-line-${i}`}
                x1={pt.x}
                y1={pt.y}
                x2={pt.cp1x}
                y2={pt.cp1y}
                stroke="#ff6600"
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                style={{ pointerEvents: 'none' }}
              />,
              <circle
                key={`cp1-handle-${i}`}
                cx={pt.cp1x}
                cy={pt.cp1y}
                r={cpRadius}
                fill="#ff6600"
                stroke="#ffffff"
                strokeWidth={strokeWidth}
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => handlePointerDown(e, i, 'cp1')}
              />,
            );
          }

          // CP2 line + handle
          if (pt.cp2x !== undefined && pt.cp2y !== undefined) {
            elements.push(
              <line
                key={`cp2-line-${i}`}
                x1={pt.x}
                y1={pt.y}
                x2={pt.cp2x}
                y2={pt.cp2y}
                stroke="#ff6600"
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                style={{ pointerEvents: 'none' }}
              />,
              <circle
                key={`cp2-handle-${i}`}
                cx={pt.cp2x}
                cy={pt.cp2y}
                r={cpRadius}
                fill="#ff6600"
                stroke="#ffffff"
                strokeWidth={strokeWidth}
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => handlePointerDown(e, i, 'cp2')}
              />,
            );
          }

          return <React.Fragment key={`cp-group-${i}`}>{elements}</React.Fragment>;
        })}

        {/* Anchor point handles */}
        {points.map((pt, i) => {
          const isSelected = selectedPointIndex === i;
          const isHovered = hoveredPointIndex === i;
          const size = isHovered ? anchorHoverSize : anchorSize;
          const half = size / 2;

          return (
            <rect
              key={`anchor-${i}`}
              x={pt.x - half}
              y={pt.y - half}
              width={size}
              height={size}
              fill="#0d99ff"
              stroke={isSelected ? '#ccff00' : '#ffffff'}
              strokeWidth={strokeWidth * (isSelected ? 2 : 1)}
              style={{ cursor: 'pointer' }}
              onPointerDown={(e) => handlePointerDown(e, i, 'anchor')}
              onPointerEnter={() => setHoveredPointIndex(i)}
              onPointerLeave={() => setHoveredPointIndex(null)}
            />
          );
        })}
      </g>
    </g>
  );
}

/** Squared distance from point p to the line segment (a, b). */
function distToSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return Math.sqrt(ex * ex + ey * ey);
  }

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  const ex = p.x - projX;
  const ey = p.y - projY;
  return Math.sqrt(ex * ex + ey * ey);
}
