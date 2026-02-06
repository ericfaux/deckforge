import { useDeckDimensions } from './WorkbenchStage';
import { useDeckForgeStore } from '@/store/deckforge';
import { getBleedSafeZone } from '@/lib/deck-guides';
import { getAccurateDeckPath } from '@/lib/deck-guides';

interface BleedSafeZoneOverlayProps {
  deckX: number;
  deckY: number;
  stageScale: number;
  enabled: boolean;
}

export function BleedSafeZoneOverlay({ deckX, deckY, stageScale, enabled }: BleedSafeZoneOverlayProps) {
  if (!enabled) return null;

  const { width: deckWidth, height: deckHeight } = useDeckDimensions();
  const deckSizeId = useDeckForgeStore(state => state.deckSizeId);
  const { bleedExtension, safeZoneInset } = getBleedSafeZone();

  const labelFontSize = 4;

  // Bleed outline: 2mm extension beyond deck edge
  // We scale the deck path outward by the bleed amount
  const bleedPath = getAccurateDeckPath(
    -bleedExtension,
    -bleedExtension,
    deckWidth + bleedExtension * 2,
    deckHeight + bleedExtension * 2,
    deckSizeId
  );

  // Safe zone: 3mm inset from deck edge
  const safeZonePath = getAccurateDeckPath(
    safeZoneInset,
    safeZoneInset,
    deckWidth - safeZoneInset * 2,
    deckHeight - safeZoneInset * 2,
    deckSizeId
  );

  return (
    <g
      transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
      pointerEvents="none"
    >
      {/* Print Bleed area: red dashed outline, 2mm beyond deck */}
      <path
        d={bleedPath}
        fill="none"
        stroke="#f44336"
        strokeWidth={0.8}
        strokeDasharray="3,2"
        opacity={0.7}
      />
      <text
        x={deckWidth + bleedExtension + 1}
        y={12}
        fontSize={labelFontSize}
        fontFamily="JetBrains Mono, monospace"
        fill="#f44336"
        opacity={0.8}
      >
        BLEED (2mm)
      </text>

      {/* Safe Zone: green dashed outline, 3mm inset */}
      <path
        d={safeZonePath}
        fill="none"
        stroke="#4caf50"
        strokeWidth={0.8}
        strokeDasharray="2,1.5"
        opacity={0.7}
      />
      <text
        x={safeZoneInset + 2}
        y={safeZoneInset + 6}
        fontSize={labelFontSize}
        fontFamily="JetBrains Mono, monospace"
        fill="#4caf50"
        opacity={0.8}
      >
        SAFE ZONE (3mm)
      </text>

      {/* Fill between deck edge and bleed with semi-transparent red */}
      <path
        d={bleedPath}
        fill="rgba(244, 67, 54, 0.06)"
        stroke="none"
      />

      {/* Fill between safe zone and deck edge with semi-transparent green */}
      <path
        d={safeZonePath}
        fill="none"
        stroke="none"
      />
    </g>
  );
}
