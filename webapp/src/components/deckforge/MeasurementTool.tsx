import { useState, useCallback, useRef } from 'react';
import { useDeckDimensions } from './WorkbenchStage';
import { useDeckForgeStore } from '@/store/deckforge';
import { getDeckSize } from '@/lib/deck-sizes';
import { getMmPerPixel } from '@/lib/deck-guides';

interface MeasurementToolProps {
  deckX: number;
  deckY: number;
  stageScale: number;
  enabled: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

interface MeasurePoint {
  x: number;
  y: number;
}

export function MeasurementTool({ deckX, deckY, stageScale, enabled, svgRef }: MeasurementToolProps) {
  const [startPoint, setStartPoint] = useState<MeasurePoint | null>(null);
  const [endPoint, setEndPoint] = useState<MeasurePoint | null>(null);
  const [hoverPoint, setHoverPoint] = useState<MeasurePoint | null>(null);
  const measuring = useRef(false);

  const { width: deckWidth, height: deckHeight } = useDeckDimensions();
  const deckSizeId = useDeckForgeStore(state => state.deckSizeId);
  const deckSize = getDeckSize(deckSizeId);
  const mmPerPx = getMmPerPixel(deckSize);

  const getCanvasPoint = useCallback((e: React.MouseEvent): MeasurePoint | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - deckX) / stageScale;
    const y = (e.clientY - rect.top - deckY) / stageScale;
    return { x, y };
  }, [svgRef, deckX, deckY, stageScale]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    const point = getCanvasPoint(e);
    if (!point) return;

    if (!measuring.current) {
      // First click: set start point
      setStartPoint(point);
      setEndPoint(null);
      measuring.current = true;
    } else {
      // Second click: set end point
      setEndPoint(point);
      measuring.current = false;
    }
  }, [enabled, getCanvasPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!enabled || !measuring.current) return;
    const point = getCanvasPoint(e);
    if (point) setHoverPoint(point);
  }, [enabled, getCanvasPoint]);

  if (!enabled) return null;

  const currentEnd = endPoint || hoverPoint;

  // Calculate distance
  let distanceMm = 0;
  let distancePx = 0;
  if (startPoint && currentEnd) {
    const dx = currentEnd.x - startPoint.x;
    const dy = currentEnd.y - startPoint.y;
    distancePx = Math.sqrt(dx * dx + dy * dy);
    // Average of x and y mm conversion for diagonal measurements
    const dxMm = dx * mmPerPx.x;
    const dyMm = dy * mmPerPx.y;
    distanceMm = Math.sqrt(dxMm * dxMm + dyMm * dyMm);
  }

  const fontSize = 4.5;
  const dotRadius = 2;

  return (
    <>
      {/* Click capture overlay - must be on top */}
      <rect
        x={deckX}
        y={deckY}
        width={deckWidth * stageScale}
        height={deckHeight * stageScale}
        fill="transparent"
        style={{ cursor: 'crosshair' }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />

      {/* Measurement visualization */}
      <g
        transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
        pointerEvents="none"
      >
        {/* Start point */}
        {startPoint && (
          <circle
            cx={startPoint.x}
            cy={startPoint.y}
            r={dotRadius}
            fill="#ff5722"
            stroke="white"
            strokeWidth={0.5}
          />
        )}

        {/* Line between points */}
        {startPoint && currentEnd && (
          <>
            <line
              x1={startPoint.x}
              y1={startPoint.y}
              x2={currentEnd.x}
              y2={currentEnd.y}
              stroke="#ff5722"
              strokeWidth={1}
              strokeDasharray={endPoint ? 'none' : '2,1'}
            />

            {/* End point */}
            <circle
              cx={currentEnd.x}
              cy={currentEnd.y}
              r={dotRadius}
              fill={endPoint ? '#ff5722' : 'rgba(255, 87, 34, 0.5)'}
              stroke="white"
              strokeWidth={0.5}
            />

            {/* Distance label */}
            {distanceMm > 0.1 && (
              <g>
                <rect
                  x={(startPoint.x + currentEnd.x) / 2 - 18}
                  y={(startPoint.y + currentEnd.y) / 2 - 8}
                  width={36}
                  height={12}
                  fill="rgba(255, 87, 34, 0.95)"
                  rx={2}
                />
                <text
                  x={(startPoint.x + currentEnd.x) / 2}
                  y={(startPoint.y + currentEnd.y) / 2}
                  textAnchor="middle"
                  fill="white"
                  fontSize={fontSize}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                >
                  {distanceMm.toFixed(1)}mm
                </text>
              </g>
            )}

            {/* Horizontal and vertical component indicators */}
            {distanceMm > 2 && startPoint && currentEnd && Math.abs(currentEnd.x - startPoint.x) > 3 && Math.abs(currentEnd.y - startPoint.y) > 3 && (
              <>
                {/* Horizontal component */}
                <line
                  x1={startPoint.x}
                  y1={currentEnd.y}
                  x2={currentEnd.x}
                  y2={currentEnd.y}
                  stroke="#ff5722"
                  strokeWidth={0.4}
                  strokeDasharray="1,1"
                  opacity={0.5}
                />
                <text
                  x={(startPoint.x + currentEnd.x) / 2}
                  y={currentEnd.y + 5}
                  textAnchor="middle"
                  fill="#ff5722"
                  fontSize={3.5}
                  fontFamily="JetBrains Mono, monospace"
                  opacity={0.7}
                >
                  {(Math.abs(currentEnd.x - startPoint.x) * mmPerPx.x).toFixed(1)}mm
                </text>
                {/* Vertical component */}
                <line
                  x1={startPoint.x}
                  y1={startPoint.y}
                  x2={startPoint.x}
                  y2={currentEnd.y}
                  stroke="#ff5722"
                  strokeWidth={0.4}
                  strokeDasharray="1,1"
                  opacity={0.5}
                />
                <text
                  x={startPoint.x - 2}
                  y={(startPoint.y + currentEnd.y) / 2}
                  textAnchor="end"
                  fill="#ff5722"
                  fontSize={3.5}
                  fontFamily="JetBrains Mono, monospace"
                  opacity={0.7}
                  transform={`rotate(-90, ${startPoint.x - 2}, ${(startPoint.y + currentEnd.y) / 2})`}
                >
                  {(Math.abs(currentEnd.y - startPoint.y) * mmPerPx.y).toFixed(1)}mm
                </text>
              </>
            )}
          </>
        )}

        {/* Instructions text when no points placed */}
        {!startPoint && (
          <text
            x={deckWidth / 2}
            y={deckHeight - 8}
            textAnchor="middle"
            fill="#ff5722"
            fontSize={4}
            fontFamily="JetBrains Mono, monospace"
            opacity={0.8}
          >
            Click two points to measure distance
          </text>
        )}
        {startPoint && !endPoint && (
          <text
            x={deckWidth / 2}
            y={deckHeight - 8}
            textAnchor="middle"
            fill="#ff5722"
            fontSize={4}
            fontFamily="JetBrains Mono, monospace"
            opacity={0.8}
          >
            Click second point to complete measurement
          </text>
        )}
      </g>
    </>
  );
}
