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
  if (!enabled) return null;

  // Get current deck dimensions (dynamic based on selected size)
  const { width: DECK_WIDTH, height: DECK_HEIGHT } = useDeckDimensions();
  
  // Get deck size info for mm conversions
  const deckSizeId = useDeckForgeStore(state => state.deckSizeId);
  const deckSize = getDeckSize(deckSizeId);
  
  // Calculate mm per pixel ratio
  const mmPerPixelWidth = deckSize.width / DECK_WIDTH;
  const mmPerPixelHeight = deckSize.length / DECK_HEIGHT;

  const rulerThickness = 20 / stageScale;
  const tickSpacing = 10; // Major tick every 10px
  const minorTickSpacing = 5; // Minor tick every 5px
  const fontSize = 8 / stageScale;

  // Generate horizontal ruler (top) - showing mm measurements
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

    // Add labels for major ticks - convert pixels to mm
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

  // Generate vertical ruler (left) - showing mm measurements
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

    // Add labels for major ticks - convert pixels to mm
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
    <g transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`} style={{ pointerEvents: 'none' }}>
      {/* Horizontal ruler background */}
      <rect
        x={0}
        y={0}
        width={DECK_WIDTH}
        height={rulerThickness}
        fill="rgba(255, 255, 255, 0.95)"
        stroke="#ccc"
        strokeWidth={1 / stageScale}
      />
      {horizontalTicks}

      {/* Vertical ruler background */}
      <rect
        x={0}
        y={0}
        width={rulerThickness}
        height={DECK_HEIGHT}
        fill="rgba(255, 255, 255, 0.95)"
        stroke="#ccc"
        strokeWidth={1 / stageScale}
      />
      {verticalTicks}

      {/* Corner square */}
      <rect
        x={0}
        y={0}
        width={rulerThickness}
        height={rulerThickness}
        fill="#f0f0f0"
        stroke="#ccc"
        strokeWidth={1 / stageScale}
      />
      
      {/* Logo/icon in corner */}
      <text
        x={rulerThickness / 2}
        y={rulerThickness / 2 + fontSize * 0.3}
        textAnchor="middle"
        fill="#999"
        fontSize={fontSize}
        fontFamily="monospace"
      >
        mm
      </text>
    </g>
  );
}
