import { useMemo } from 'react';
import { useDeckForgeStore } from '@/store/deckforge';
import { useDeckDimensions } from './WorkbenchStage';
import { getHardwareGuide, getMmPerPixel } from '@/lib/deck-guides';
import { getDeckSize } from '@/lib/deck-sizes';

interface HardwareGuideOverlayProps {
  deckX: number;
  deckY: number;
  stageScale: number;
  enabled: boolean;
}

export function HardwareGuideOverlay({ deckX, deckY, stageScale, enabled }: HardwareGuideOverlayProps) {
  if (!enabled) return null;

  const deckSizeId = useDeckForgeStore(state => state.deckSizeId);
  const { width: deckWidth, height: deckHeight } = useDeckDimensions();
  const deckSize = getDeckSize(deckSizeId);
  const mmPerPx = getMmPerPixel(deckSize);

  const guide = useMemo(() => getHardwareGuide(deckSizeId), [deckSizeId]);

  const fontSize = 5;
  const labelFontSize = 4;
  const strokeW = 0.8;
  const dashPattern = '2,1.5';

  return (
    <g
      transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
      pointerEvents="none"
      style={{ opacity: 0.85 }}
    >
      {/* Center axis line (vertical) */}
      <line
        x1={guide.centerX}
        y1={0}
        x2={guide.centerX}
        y2={deckHeight}
        stroke="#00bcd4"
        strokeWidth={strokeW}
        strokeDasharray="4,2"
        opacity={0.6}
      />
      <text
        x={guide.centerX}
        y={deckHeight / 2}
        textAnchor="middle"
        fontSize={labelFontSize}
        fontFamily="JetBrains Mono, monospace"
        fill="#00bcd4"
        opacity={0.7}
        transform={`rotate(-90, ${guide.centerX}, ${deckHeight / 2})`}
      >
        CENTER AXIS
      </text>

      {/* Wheelbase lines */}
      <line
        x1={0}
        y1={guide.wheelbase.frontY}
        x2={deckWidth}
        y2={guide.wheelbase.frontY}
        stroke="#ff9800"
        strokeWidth={strokeW}
        strokeDasharray="3,2"
        opacity={0.5}
      />
      <line
        x1={0}
        y1={guide.wheelbase.rearY}
        x2={deckWidth}
        y2={guide.wheelbase.rearY}
        stroke="#ff9800"
        strokeWidth={strokeW}
        strokeDasharray="3,2"
        opacity={0.5}
      />

      {/* Wheelbase measurement line (connecting front to rear axle) */}
      <line
        x1={deckWidth - 6}
        y1={guide.wheelbase.frontY}
        x2={deckWidth - 6}
        y2={guide.wheelbase.rearY}
        stroke="#ff9800"
        strokeWidth={0.5}
        opacity={0.4}
      />
      <text
        x={deckWidth - 4}
        y={(guide.wheelbase.frontY + guide.wheelbase.rearY) / 2}
        textAnchor="start"
        fontSize={3.5}
        fontFamily="JetBrains Mono, monospace"
        fill="#ff9800"
        opacity={0.6}
        transform={`rotate(-90, ${deckWidth - 4}, ${(guide.wheelbase.frontY + guide.wheelbase.rearY) / 2})`}
      >
        {((guide.wheelbase.rearY - guide.wheelbase.frontY) * mmPerPx.y).toFixed(1)}mm
      </text>

      {/* Nose/Tail kick boundaries */}
      <line
        x1={0}
        y1={guide.noseKickY}
        x2={deckWidth}
        y2={guide.noseKickY}
        stroke="#e91e63"
        strokeWidth={strokeW}
        strokeDasharray="1.5,1.5"
        opacity={0.5}
      />
      <text
        x={3}
        y={guide.noseKickY - 2}
        fontSize={labelFontSize}
        fontFamily="JetBrains Mono, monospace"
        fill="#e91e63"
        opacity={0.7}
      >
        NOSE KICK
      </text>

      <line
        x1={0}
        y1={guide.tailKickY}
        x2={deckWidth}
        y2={guide.tailKickY}
        stroke="#e91e63"
        strokeWidth={strokeW}
        strokeDasharray="1.5,1.5"
        opacity={0.5}
      />
      <text
        x={3}
        y={guide.tailKickY + 5}
        fontSize={labelFontSize}
        fontFamily="JetBrains Mono, monospace"
        fill="#e91e63"
        opacity={0.7}
      >
        TAIL KICK
      </text>

      {/* Front Truck Baseplate */}
      <rect
        x={guide.frontBaseplate.x}
        y={guide.frontBaseplate.y}
        width={guide.frontBaseplate.width}
        height={guide.frontBaseplate.height}
        fill="rgba(255, 152, 0, 0.12)"
        stroke="#ff9800"
        strokeWidth={strokeW}
        strokeDasharray={dashPattern}
      />
      {/* Front truck mounting holes */}
      {guide.frontTruckHoles.map((hole, i) => (
        <circle
          key={`front-${i}`}
          cx={hole.x}
          cy={hole.y}
          r={guide.holeRadius}
          fill="rgba(255, 152, 0, 0.3)"
          stroke="#ff9800"
          strokeWidth={0.5}
        />
      ))}
      <text
        x={guide.centerX}
        y={guide.frontBaseplate.y - 3}
        textAnchor="middle"
        fontSize={fontSize}
        fontFamily="JetBrains Mono, monospace"
        fill="#ff9800"
        fontWeight="600"
      >
        FRONT TRUCK
      </text>

      {/* Rear Truck Baseplate */}
      <rect
        x={guide.rearBaseplate.x}
        y={guide.rearBaseplate.y}
        width={guide.rearBaseplate.width}
        height={guide.rearBaseplate.height}
        fill="rgba(255, 152, 0, 0.12)"
        stroke="#ff9800"
        strokeWidth={strokeW}
        strokeDasharray={dashPattern}
      />
      {/* Rear truck mounting holes */}
      {guide.rearTruckHoles.map((hole, i) => (
        <circle
          key={`rear-${i}`}
          cx={hole.x}
          cy={hole.y}
          r={guide.holeRadius}
          fill="rgba(255, 152, 0, 0.3)"
          stroke="#ff9800"
          strokeWidth={0.5}
        />
      ))}
      <text
        x={guide.centerX}
        y={guide.rearBaseplate.y + guide.rearBaseplate.height + 7}
        textAnchor="middle"
        fontSize={fontSize}
        fontFamily="JetBrains Mono, monospace"
        fill="#ff9800"
        fontWeight="600"
      >
        REAR TRUCK
      </text>

      {/* Safe print area */}
      <rect
        x={guide.safePrintArea.x}
        y={guide.safePrintArea.y}
        width={guide.safePrintArea.width}
        height={guide.safePrintArea.height}
        fill="none"
        stroke="#4caf50"
        strokeWidth={strokeW}
        strokeDasharray="3,1.5"
        opacity={0.5}
      />
      <text
        x={guide.safePrintArea.x + 2}
        y={guide.safePrintArea.y + guide.safePrintArea.height - 2}
        fontSize={3.5}
        fontFamily="JetBrains Mono, monospace"
        fill="#4caf50"
        opacity={0.6}
      >
        SAFE PRINT AREA
      </text>
    </g>
  );
}
