import { useState, useCallback, useEffect, useRef } from 'react';
import { useDeckDimensions } from './WorkbenchStage';
import { useDeckForgeStore } from '@/store/deckforge';
import { getDeckSize } from '@/lib/deck-sizes';

interface RulerOverlayProps {
  deckX: number;
  deckY: number;
  stageScale: number;
  enabled: boolean;
}

export function RulerOverlay({ deckX, deckY, stageScale, enabled }: RulerOverlayProps) {
  const { width: DECK_WIDTH, height: DECK_HEIGHT } = useDeckDimensions();
  const deckSizeId = useDeckForgeStore(state => state.deckSizeId);
  const addGuide = useDeckForgeStore(state => state.addGuide);
  const deckSize = getDeckSize(deckSizeId);

  // Drag-from-ruler state
  const [dragging, setDragging] = useState<{ orientation: 'horizontal' | 'vertical'; position: number } | null>(null);
  const svgRef = useRef<SVGGElement>(null);

  const mmPerPixelWidth = deckSize.width / DECK_WIDTH;
  const mmPerPixelHeight = deckSize.length / DECK_HEIGHT;

  const rulerThickness = 20 / stageScale;
  const tickSpacing = 10;
  const minorTickSpacing = 5;
  const fontSize = 8 / stageScale;

  // Convert screen coordinates to deck coordinates
  const screenToDeck = useCallback((clientX: number, clientY: number) => {
    return {
      x: (clientX - deckX) / stageScale,
      y: (clientY - deckY) / stageScale,
    };
  }, [deckX, deckY, stageScale]);

  // Handle drag from horizontal ruler (creates horizontal guide)
  const handleHorizontalRulerMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const svgEl = svgRef.current?.closest('svg');
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const deckCoords = screenToDeck(e.clientX - rect.left, e.clientY - rect.top);
    setDragging({ orientation: 'horizontal', position: deckCoords.y });
  }, [screenToDeck]);

  // Handle drag from vertical ruler (creates vertical guide)
  const handleVerticalRulerMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const svgEl = svgRef.current?.closest('svg');
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const deckCoords = screenToDeck(e.clientX - rect.left, e.clientY - rect.top);
    setDragging({ orientation: 'vertical', position: deckCoords.x });
  }, [screenToDeck]);

  // Global mouse move/up during drag
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const svgEl = svgRef.current?.closest('svg');
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      const deckCoords = screenToDeck(e.clientX - rect.left, e.clientY - rect.top);

      setDragging((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          position: prev.orientation === 'horizontal' ? deckCoords.y : deckCoords.x,
        };
      });
    };

    const handleMouseUp = () => {
      if (dragging) {
        const pos = dragging.position;
        // Only create guide if within deck bounds
        if (dragging.orientation === 'horizontal' && pos > 0 && pos < DECK_HEIGHT) {
          addGuide('horizontal', Math.round(pos));
        } else if (dragging.orientation === 'vertical' && pos > 0 && pos < DECK_WIDTH) {
          addGuide('vertical', Math.round(pos));
        }
      }
      setDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, screenToDeck, addGuide, DECK_WIDTH, DECK_HEIGHT]);

  if (!enabled) return null;

  // Generate horizontal ruler ticks (top)
  const horizontalTicks = [];
  for (let x = 0; x <= DECK_WIDTH; x += minorTickSpacing) {
    const isMajor = x % tickSpacing === 0;
    const tickHeight = isMajor ? rulerThickness * 0.5 : rulerThickness * 0.3;

    horizontalTicks.push(
      <line
        key={`h-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={tickHeight}
        stroke="#888"
        strokeWidth={0.5 / stageScale}
      />
    );

    if (isMajor && x % 20 === 0) {
      const mmValue = (x * mmPerPixelWidth).toFixed(1);
      horizontalTicks.push(
        <text
          key={`h-label-${x}`}
          x={x}
          y={rulerThickness * 0.75}
          textAnchor="middle"
          fill="#333"
          fontSize={fontSize}
          fontFamily="monospace"
        >
          {mmValue}
        </text>
      );
    }
  }

  // Generate vertical ruler ticks (left)
  const verticalTicks = [];
  for (let y = 0; y <= DECK_HEIGHT; y += minorTickSpacing) {
    const isMajor = y % tickSpacing === 0;
    const tickWidth = isMajor ? rulerThickness * 0.5 : rulerThickness * 0.3;

    verticalTicks.push(
      <line
        key={`v-${y}`}
        x1={0}
        y1={y}
        x2={tickWidth}
        y2={y}
        stroke="#888"
        strokeWidth={0.5 / stageScale}
      />
    );

    if (isMajor && y % 20 === 0) {
      const mmValue = (y * mmPerPixelHeight).toFixed(1);
      verticalTicks.push(
        <text
          key={`v-label-${y}`}
          x={rulerThickness * 0.25}
          y={y + fontSize * 0.3}
          textAnchor="start"
          fill="#333"
          fontSize={fontSize}
          fontFamily="monospace"
        >
          {mmValue}
        </text>
      );
    }
  }

  return (
    <g ref={svgRef} transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}>
      {/* Horizontal ruler background — drag down from here to create horizontal guide */}
      <rect
        x={rulerThickness}
        y={0}
        width={DECK_WIDTH - rulerThickness}
        height={rulerThickness}
        fill="rgba(255, 255, 255, 0.95)"
        stroke="#ccc"
        strokeWidth={1 / stageScale}
        style={{ cursor: 'row-resize', pointerEvents: 'all' }}
        onMouseDown={handleHorizontalRulerMouseDown}
      />
      <g style={{ pointerEvents: 'none' }}>
        {horizontalTicks}
      </g>

      {/* Vertical ruler background — drag right from here to create vertical guide */}
      <rect
        x={0}
        y={rulerThickness}
        width={rulerThickness}
        height={DECK_HEIGHT - rulerThickness}
        fill="rgba(255, 255, 255, 0.95)"
        stroke="#ccc"
        strokeWidth={1 / stageScale}
        style={{ cursor: 'col-resize', pointerEvents: 'all' }}
        onMouseDown={handleVerticalRulerMouseDown}
      />
      <g style={{ pointerEvents: 'none' }}>
        {verticalTicks}
      </g>

      {/* Corner square */}
      <rect
        x={0}
        y={0}
        width={rulerThickness}
        height={rulerThickness}
        fill="#f0f0f0"
        stroke="#ccc"
        strokeWidth={1 / stageScale}
        style={{ pointerEvents: 'none' }}
      />
      <text
        x={rulerThickness / 2}
        y={rulerThickness / 2 + fontSize * 0.3}
        textAnchor="middle"
        fill="#999"
        fontSize={fontSize}
        fontFamily="monospace"
        style={{ pointerEvents: 'none' }}
      >
        mm
      </text>

      {/* Guide preview line while dragging from ruler */}
      {dragging && (
        <>
          {dragging.orientation === 'horizontal' ? (
            <>
              <line
                x1={0}
                y1={dragging.position}
                x2={DECK_WIDTH}
                y2={dragging.position}
                stroke="#00d4ff"
                strokeWidth={1.5 / stageScale}
                strokeDasharray={`${4 / stageScale} ${4 / stageScale}`}
                opacity={0.9}
                style={{ pointerEvents: 'none' }}
              />
              {/* Position tooltip */}
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={DECK_WIDTH / 2 - 30 / stageScale}
                  y={dragging.position - 20 / stageScale}
                  width={60 / stageScale}
                  height={16 / stageScale}
                  fill="rgba(0, 212, 255, 0.95)"
                  rx={3 / stageScale}
                />
                <text
                  x={DECK_WIDTH / 2}
                  y={dragging.position - 10 / stageScale}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10 / stageScale}
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  Y: {Math.round(dragging.position)}
                </text>
              </g>
            </>
          ) : (
            <>
              <line
                x1={dragging.position}
                y1={0}
                x2={dragging.position}
                y2={DECK_HEIGHT}
                stroke="#00d4ff"
                strokeWidth={1.5 / stageScale}
                strokeDasharray={`${4 / stageScale} ${4 / stageScale}`}
                opacity={0.9}
                style={{ pointerEvents: 'none' }}
              />
              {/* Position tooltip */}
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={dragging.position - 30 / stageScale}
                  y={10 / stageScale}
                  width={60 / stageScale}
                  height={16 / stageScale}
                  fill="rgba(0, 212, 255, 0.95)"
                  rx={3 / stageScale}
                />
                <text
                  x={dragging.position}
                  y={20 / stageScale}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10 / stageScale}
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  X: {Math.round(dragging.position)}
                </text>
              </g>
            </>
          )}
        </>
      )}
    </g>
  );
}
