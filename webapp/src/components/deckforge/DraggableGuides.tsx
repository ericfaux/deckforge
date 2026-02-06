import { useState, useCallback } from 'react';

interface Guide {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number; // in deck coordinates
  locked: boolean;
  color: string;
}

interface DraggableGuidesProps {
  guides: Guide[];
  deckX: number;
  deckY: number;
  stageScale: number;
  deckWidth: number;
  deckHeight: number;
  onAddGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
  onUpdateGuide: (id: string, position: number) => void;
  onDeleteGuide: (id: string) => void;
}

interface DragState {
  guideId: string;
  orientation: 'horizontal' | 'vertical';
  startPosition: number;
}

export function DraggableGuides({
  guides,
  deckX,
  deckY,
  stageScale,
  deckWidth,
  deckHeight,
  onAddGuide,
  onUpdateGuide,
  onDeleteGuide,
}: DraggableGuidesProps) {
  const [hoveredGuideId, setHoveredGuideId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPosition, setDragPosition] = useState<number | null>(null);

  // Convert screen coordinates to deck coordinates
  const screenToDeck = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      return {
        x: (screenX - deckX) / stageScale,
        y: (screenY - deckY) / stageScale,
      };
    },
    [deckX, deckY, stageScale]
  );

  const handleGuideMouseDown = useCallback(
    (e: React.MouseEvent, guide: Guide) => {
      if (guide.locked) return;
      e.stopPropagation();
      e.preventDefault();

      setDragState({
        guideId: guide.id,
        orientation: guide.orientation,
        startPosition: guide.position,
      });
      setDragPosition(guide.position);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const svgElement = (e.target as SVGElement).ownerSVGElement;
        if (!svgElement) return;

        const rect = svgElement.getBoundingClientRect();
        const screenX = moveEvent.clientX - rect.left;
        const screenY = moveEvent.clientY - rect.top;
        const deckCoords = screenToDeck(screenX, screenY);

        const newPosition =
          guide.orientation === 'horizontal' ? deckCoords.y : deckCoords.x;

        // Check if dragged outside deck bounds (toward the ruler / off the deck)
        const isOutsideBounds =
          guide.orientation === 'horizontal'
            ? deckCoords.y < -10 || deckCoords.y > deckHeight + 10
            : deckCoords.x < -10 || deckCoords.x > deckWidth + 10;

        if (isOutsideBounds) {
          onDeleteGuide(guide.id);
          setDragState(null);
          setDragPosition(null);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          return;
        }

        // Clamp position within deck bounds
        const clampedPosition = Math.max(
          0,
          Math.min(
            newPosition,
            guide.orientation === 'horizontal' ? deckHeight : deckWidth
          )
        );

        setDragPosition(clampedPosition);
        onUpdateGuide(guide.id, Math.round(clampedPosition * 10) / 10);
      };

      const handleMouseUp = () => {
        setDragState(null);
        setDragPosition(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [screenToDeck, deckWidth, deckHeight, onUpdateGuide, onDeleteGuide]
  );

  const handleGuideMouseEnter = useCallback((guideId: string) => {
    setHoveredGuideId(guideId);
  }, []);

  const handleGuideMouseLeave = useCallback(() => {
    setHoveredGuideId(null);
  }, []);

  // Scale-aware constants
  const baseStrokeWidth = 1 / stageScale;
  const hoverStrokeWidth = 2.5 / stageScale;
  const hitAreaWidth = 8 / stageScale;
  const fontSize = 9 / stageScale;
  const labelPaddingX = 4 / stageScale;
  const labelPaddingY = 2 / stageScale;
  const labelHeight = 14 / stageScale;
  const dashSize = 4 / stageScale;

  return (
    <g transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}>
      {guides.map((guide) => {
        const isHovered = hoveredGuideId === guide.id;
        const isDragging = dragState?.guideId === guide.id;
        const isActive = isHovered || isDragging;
        const color = guide.color || '#00d4ff';
        const currentPosition =
          isDragging && dragPosition !== null ? dragPosition : guide.position;
        const opacity = isActive ? 1 : 0.8;
        const strokeWidth = isActive ? hoverStrokeWidth : baseStrokeWidth;
        const cursorStyle =
          guide.locked
            ? 'default'
            : guide.orientation === 'vertical'
              ? 'col-resize'
              : 'row-resize';

        if (guide.orientation === 'vertical') {
          // Vertical guide: full-height line at guide.position
          return (
            <g key={guide.id}>
              {/* Invisible hit area for easier mouse targeting */}
              <line
                x1={currentPosition}
                y1={0}
                x2={currentPosition}
                y2={deckHeight}
                stroke="transparent"
                strokeWidth={hitAreaWidth}
                style={{ cursor: cursorStyle, pointerEvents: 'stroke' }}
                onMouseDown={(e) => handleGuideMouseDown(e, guide)}
                onMouseEnter={() => handleGuideMouseEnter(guide.id)}
                onMouseLeave={handleGuideMouseLeave}
              />
              {/* Visible guide line */}
              <line
                x1={currentPosition}
                y1={0}
                x2={currentPosition}
                y2={deckHeight}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashSize} ${dashSize}`}
                opacity={opacity}
                style={{ pointerEvents: 'none' }}
              />
              {/* Position label at the top edge */}
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={currentPosition + labelPaddingX}
                  y={labelPaddingY}
                  width={40 / stageScale}
                  height={labelHeight}
                  fill={color}
                  rx={2 / stageScale}
                  opacity={isActive ? 1 : 0.85}
                />
                <text
                  x={currentPosition + labelPaddingX + 20 / stageScale}
                  y={labelPaddingY + labelHeight - 3 / stageScale}
                  textAnchor="middle"
                  fill="white"
                  fontSize={fontSize}
                  fontFamily="monospace"
                  fontWeight={isDragging ? '700' : '500'}
                >
                  X: {Math.round(currentPosition)}
                </text>
              </g>
              {/* Drag tooltip (shown only while dragging) */}
              {isDragging ? (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={currentPosition + labelPaddingX}
                    y={deckHeight / 2 - labelHeight / 2}
                    width={50 / stageScale}
                    height={labelHeight + 4 / stageScale}
                    fill="rgba(0, 0, 0, 0.85)"
                    rx={3 / stageScale}
                  />
                  <text
                    x={currentPosition + labelPaddingX + 25 / stageScale}
                    y={deckHeight / 2 + 3 / stageScale}
                    textAnchor="middle"
                    fill="white"
                    fontSize={fontSize}
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    X: {Math.round(currentPosition)}
                  </text>
                </g>
              ) : null}
            </g>
          );
        } else {
          // Horizontal guide: full-width line at guide.position
          return (
            <g key={guide.id}>
              {/* Invisible hit area for easier mouse targeting */}
              <line
                x1={0}
                y1={currentPosition}
                x2={deckWidth}
                y2={currentPosition}
                stroke="transparent"
                strokeWidth={hitAreaWidth}
                style={{ cursor: cursorStyle, pointerEvents: 'stroke' }}
                onMouseDown={(e) => handleGuideMouseDown(e, guide)}
                onMouseEnter={() => handleGuideMouseEnter(guide.id)}
                onMouseLeave={handleGuideMouseLeave}
              />
              {/* Visible guide line */}
              <line
                x1={0}
                y1={currentPosition}
                x2={deckWidth}
                y2={currentPosition}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashSize} ${dashSize}`}
                opacity={opacity}
                style={{ pointerEvents: 'none' }}
              />
              {/* Position label at the left edge */}
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={labelPaddingX}
                  y={currentPosition + labelPaddingY}
                  width={40 / stageScale}
                  height={labelHeight}
                  fill={color}
                  rx={2 / stageScale}
                  opacity={isActive ? 1 : 0.85}
                />
                <text
                  x={labelPaddingX + 20 / stageScale}
                  y={currentPosition + labelPaddingY + labelHeight - 3 / stageScale}
                  textAnchor="middle"
                  fill="white"
                  fontSize={fontSize}
                  fontFamily="monospace"
                  fontWeight={isDragging ? '700' : '500'}
                >
                  Y: {Math.round(currentPosition)}
                </text>
              </g>
              {/* Drag tooltip (shown only while dragging) */}
              {isDragging ? (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={deckWidth / 2 - 25 / stageScale}
                    y={currentPosition + labelPaddingY}
                    width={50 / stageScale}
                    height={labelHeight + 4 / stageScale}
                    fill="rgba(0, 0, 0, 0.85)"
                    rx={3 / stageScale}
                  />
                  <text
                    x={deckWidth / 2}
                    y={currentPosition + labelPaddingY + labelHeight}
                    textAnchor="middle"
                    fill="white"
                    fontSize={fontSize}
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    Y: {Math.round(currentPosition)}
                  </text>
                </g>
              ) : null}
            </g>
          );
        }
      })}
    </g>
  );
}
