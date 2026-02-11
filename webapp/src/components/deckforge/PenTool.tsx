import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Undo, MousePointer2 } from 'lucide-react';
import { useColorHistory } from '@/store/colorHistory';
import { RecentColors } from './RecentColors';

interface Point {
  x: number;
  y: number;
  // Control handles for bezier curves (set by click+drag)
  cpOutX?: number;
  cpOutY?: number;
  cpInX?: number;
  cpInY?: number;
}

type DashStyle = 'solid' | 'dashed' | 'dotted';

interface PenToolProps {
  isActive: boolean;
  onComplete: (pathData: string, strokeWidth: number, strokeColor: string, opacity: number, dashStyle: DashStyle, mode: 'click' | 'draw', pathPoints?: Array<{ x: number; y: number; cp1x?: number; cp1y?: number; cp2x?: number; cp2y?: number }>) => void;
  onCancel: () => void;
  stageRef: React.RefObject<SVGSVGElement>;
  deckX: number;
  deckY: number;
  stageScale: number;
}

export function PenTool({ isActive, onComplete, onCancel, stageRef, deckX, deckY, stageScale }: PenToolProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [mode, setMode] = useState<'click' | 'draw'>('click');
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(1.0);
  const [dashStyle, setDashStyle] = useState<DashStyle>('solid');
  const { addColor } = useColorHistory();

  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color);
    addColor(color);
  };
  // Click+drag curve creation state
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isActive) {
      setPoints([]);
      setCurrentPoint(null);
      setIsDrawing(false);
      setMode('click');
      setIsDraggingHandle(false);
      setDragStartPoint(null);
    }
  }, [isActive]);

  const getCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!stageRef.current) return null;
    const rect = stageRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - deckX) / stageScale,
      y: (e.clientY - rect.top - deckY) / stageScale,
    };
  }, [stageRef, deckX, deckY, stageScale]);

  // Build PathPoints with control point data for the store
  const buildPathPoints = useCallback((pts: Point[]) => {
    return pts.map((p, i) => {
      const result: { x: number; y: number; cp1x?: number; cp1y?: number; cp2x?: number; cp2y?: number } = {
        x: p.x,
        y: p.y,
      };
      // cp1 = incoming control handle (from previous point toward this point)
      if (p.cpInX !== undefined && p.cpInY !== undefined) {
        result.cp1x = p.cpInX;
        result.cp1y = p.cpInY;
      }
      // cp2 = outgoing control handle (from this point toward next point)
      if (p.cpOutX !== undefined && p.cpOutY !== undefined) {
        result.cp2x = p.cpOutX;
        result.cp2y = p.cpOutY;
      }
      return result;
    });
  }, []);

  // Generate SVG path from points (with bezier support)
  const buildPathData = useCallback((pts: Point[], closePath = false) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const hasPrevOut = prev.cpOutX !== undefined && prev.cpOutY !== undefined;
      const hasCurrIn = curr.cpInX !== undefined && curr.cpInY !== undefined;

      if (hasPrevOut && hasCurrIn) {
        d += ` C ${prev.cpOutX} ${prev.cpOutY} ${curr.cpInX} ${curr.cpInY} ${curr.x} ${curr.y}`;
      } else if (hasPrevOut) {
        d += ` Q ${prev.cpOutX} ${prev.cpOutY} ${curr.x} ${curr.y}`;
      } else if (hasCurrIn) {
        d += ` Q ${curr.cpInX} ${curr.cpInY} ${curr.x} ${curr.y}`;
      } else {
        d += ` L ${curr.x} ${curr.y}`;
      }
    }

    if (closePath) d += ' Z';
    return d;
  }, []);

  const handleComplete = useCallback(() => {
    if (points.length < 2) {
      onCancel();
      return;
    }

    const pathData = buildPathData(points);
    const pathPoints = buildPathPoints(points);
    onComplete(pathData, strokeWidth, strokeColor, opacity, dashStyle, mode, pathPoints);
    setPoints([]);
    setCurrentPoint(null);
  }, [points, buildPathData, buildPathPoints, onComplete, strokeWidth, strokeColor, opacity, dashStyle, mode]);

  // ESC to cancel, Enter to complete
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && points.length >= 2) {
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, points, onCancel, handleComplete]);

  // Handle click+drag for bezier curve creation
  const handleStageMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActive || !stageRef.current) return;

    if (mode === 'draw') {
      // Freehand draw mode
      const coords = getCoords(e);
      if (!coords) return;
      setIsDrawing(true);
      setPoints([{ x: coords.x, y: coords.y }]);
      return;
    }

    // Click mode — start potential drag for curve handle
    const coords = getCoords(e);
    if (!coords) return;

    // Check if clicking near first point to close path
    if (points.length >= 3) {
      const first = points[0];
      const dist = Math.hypot(coords.x - first.x, coords.y - first.y);
      if (dist < 8 / stageScale) {
        // Close and complete
        const pathData = buildPathData(points, true);
        const pathPoints = buildPathPoints(points);
        onComplete(pathData, strokeWidth, strokeColor, opacity, dashStyle, mode, pathPoints);
        setPoints([]);
        setCurrentPoint(null);
        return;
      }
    }

    setIsDraggingHandle(true);
    setDragStartPoint(coords);
  };

  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (!isActive || !stageRef.current) return;
    const coords = getCoords(e);
    if (!coords) return;

    setCurrentPoint({ x: coords.x, y: coords.y });

    // Freehand draw
    if (mode === 'draw' && isDrawing) {
      setPoints(prev => [...prev, { x: coords.x, y: coords.y }]);
      return;
    }

    // Dragging handle for curve creation
    if (isDraggingHandle && dragStartPoint) {
      // Show the curve handle being dragged
      setCurrentPoint({
        x: dragStartPoint.x,
        y: dragStartPoint.y,
        cpOutX: coords.x,
        cpOutY: coords.y,
        // Mirror handle for incoming control
        cpInX: dragStartPoint.x * 2 - coords.x,
        cpInY: dragStartPoint.y * 2 - coords.y,
      });
    }
  };

  const handleStageMouseUp = (e: React.MouseEvent) => {
    if (!isActive) return;

    // Freehand draw complete
    if (mode === 'draw' && isDrawing) {
      setIsDrawing(false);
      if (points.length >= 2) {
        handleComplete();
      } else {
        onCancel();
      }
      return;
    }

    // Click mode — finish placing point
    if (isDraggingHandle && dragStartPoint) {
      const coords = getCoords(e);
      const dragDist = coords ? Math.hypot(coords.x - dragStartPoint.x, coords.y - dragStartPoint.y) : 0;

      let newPoint: Point;
      if (dragDist > 3) {
        // Dragged — create smooth point with control handles
        newPoint = {
          x: dragStartPoint.x,
          y: dragStartPoint.y,
          cpOutX: coords!.x,
          cpOutY: coords!.y,
          cpInX: dragStartPoint.x * 2 - coords!.x,
          cpInY: dragStartPoint.y * 2 - coords!.y,
        };
      } else {
        // Just clicked — create corner point
        newPoint = { x: dragStartPoint.x, y: dragStartPoint.y };
      }

      const newPoints = [...points, newPoint];
      setPoints(newPoints);

      // Auto-complete on second point for quick lines
      if (newPoints.length === 2 && dragDist <= 3 && !newPoints[0].cpOutX) {
        // Two corner points with no curves — complete as a simple line
        // (Don't auto-complete — let user keep adding points)
      }

      setIsDraggingHandle(false);
      setDragStartPoint(null);
    }
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1));
    }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel();
  };

  const handleCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleComplete();
  };

  const handleUndoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleUndo();
  };

  const handleModeSwitch = (newMode: 'click' | 'draw', e: React.MouseEvent) => {
    e.stopPropagation();
    setMode(newMode);
    setPoints([]);
  };

  if (!isActive) return null;

  // Generate preview path
  const previewPoints = [...points];
  if (currentPoint && mode === 'click' && !isDraggingHandle) {
    previewPoints.push(currentPoint);
  }
  const previewPath = previewPoints.length >= 2 ? buildPathData(previewPoints) : '';

  // Simple line preview for current segment
  let currentSegmentPreview = '';
  if (points.length > 0 && currentPoint && mode === 'click' && !isDraggingHandle) {
    const last = points[points.length - 1];
    if (last.cpOutX !== undefined) {
      currentSegmentPreview = `M ${last.x} ${last.y} Q ${last.cpOutX} ${last.cpOutY} ${currentPoint.x} ${currentPoint.y}`;
    } else {
      currentSegmentPreview = `M ${last.x} ${last.y} L ${currentPoint.x} ${currentPoint.y}`;
    }
  }

  // Get viewport dimensions
  const viewportWidth = stageRef.current?.clientWidth || 3000;
  const viewportHeight = stageRef.current?.clientHeight || 3000;

  return (
    <g style={{ pointerEvents: 'all' }}>
      {/* Overlay to capture interactions */}
      <rect
        x={0}
        y={0}
        width={viewportWidth}
        height={viewportHeight}
        fill="rgba(0,0,0,0.01)"
        style={{
          cursor: mode === 'draw' ? 'crosshair' : 'crosshair',
          pointerEvents: 'all'
        }}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      />

      {/* Draw path and handles in deck space */}
      <g
        transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
        style={{ pointerEvents: 'none' }}
      >
        {/* Preview path */}
        {previewPath && (
          <path
            d={previewPath}
            stroke={strokeColor}
            strokeWidth={strokeWidth / stageScale}
            fill="none"
            opacity={opacity * 0.6}
            strokeDasharray={`${4 / stageScale} ${4 / stageScale}`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Current segment preview */}
        {currentSegmentPreview && (
          <path
            d={currentSegmentPreview}
            stroke={strokeColor}
            strokeWidth={strokeWidth / stageScale}
            fill="none"
            opacity={opacity * 0.4}
            strokeDasharray={`${4 / stageScale} ${4 / stageScale}`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Draw points and handles */}
        {mode === 'click' && points.map((point, index) => (
          <g key={index}>
            {/* Control handle lines */}
            {point.cpOutX !== undefined && point.cpOutY !== undefined && (
              <>
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={point.cpOutX}
                  y2={point.cpOutY}
                  stroke="#ff6600"
                  strokeWidth={1 / stageScale}
                  opacity={0.8}
                />
                <circle
                  cx={point.cpOutX}
                  cy={point.cpOutY}
                  r={3 / stageScale}
                  fill="#ff6600"
                  stroke="#fff"
                  strokeWidth={1 / stageScale}
                />
              </>
            )}
            {point.cpInX !== undefined && point.cpInY !== undefined && (
              <>
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={point.cpInX}
                  y2={point.cpInY}
                  stroke="#ff6600"
                  strokeWidth={1 / stageScale}
                  opacity={0.8}
                />
                <circle
                  cx={point.cpInX}
                  cy={point.cpInY}
                  r={3 / stageScale}
                  fill="#ff6600"
                  stroke="#fff"
                  strokeWidth={1 / stageScale}
                />
              </>
            )}
            {/* Anchor point */}
            <circle
              cx={point.x}
              cy={point.y}
              r={5 / stageScale}
              fill={index === 0 ? '#ccff00' : '#0d99ff'}
              stroke="#ffffff"
              strokeWidth={2 / stageScale}
            />
            {/* Close path indicator on first point */}
            {index === 0 && points.length >= 3 && (
              <circle
                cx={point.x}
                cy={point.y}
                r={10 / stageScale}
                fill="none"
                stroke="#ccff00"
                strokeWidth={1 / stageScale}
                strokeDasharray={`${3 / stageScale} ${3 / stageScale}`}
                opacity={0.6}
              />
            )}
          </g>
        ))}

        {/* Dragging handle preview */}
        {isDraggingHandle && dragStartPoint && currentPoint && currentPoint.cpOutX !== undefined && (
          <g>
            <line
              x1={dragStartPoint.x}
              y1={dragStartPoint.y}
              x2={currentPoint.cpOutX}
              y2={currentPoint.cpOutY!}
              stroke="#ff6600"
              strokeWidth={1 / stageScale}
              opacity={0.9}
            />
            <line
              x1={dragStartPoint.x}
              y1={dragStartPoint.y}
              x2={currentPoint.cpInX!}
              y2={currentPoint.cpInY!}
              stroke="#ff6600"
              strokeWidth={1 / stageScale}
              opacity={0.9}
            />
            <circle
              cx={currentPoint.cpOutX}
              cy={currentPoint.cpOutY!}
              r={4 / stageScale}
              fill="#ff6600"
              stroke="#fff"
              strokeWidth={1 / stageScale}
            />
            <circle
              cx={currentPoint.cpInX!}
              cy={currentPoint.cpInY!}
              r={4 / stageScale}
              fill="#ff6600"
              stroke="#fff"
              strokeWidth={1 / stageScale}
            />
            <circle
              cx={dragStartPoint.x}
              cy={dragStartPoint.y}
              r={5 / stageScale}
              fill="#0d99ff"
              stroke="#fff"
              strokeWidth={2 / stageScale}
            />
          </g>
        )}

        {/* Current mouse position (click mode, not dragging) */}
        {mode === 'click' && currentPoint && !isDraggingHandle && (
          <circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r={4 / stageScale}
            fill="#ccff00"
            opacity={0.6}
          />
        )}
      </g>

      {/* Floating toolbar */}
      <foreignObject x={20} y={100} width={240} height={Math.min(620, viewportHeight - 120)}>
        <div
          className="bg-card border border-border rounded-lg p-3 shadow-2xl max-h-full overflow-y-auto"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2.5">
            {/* Mode selector */}
            <div className="flex gap-1 p-1 bg-secondary rounded">
              <button
                onClick={(e) => handleModeSwitch('click', e)}
                className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                  mode === 'click'
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Click to place points (drag to create curves)"
              >
                <MousePointer2 className="w-3.5 h-3.5 mx-auto" />
              </button>
              <button
                onClick={(e) => handleModeSwitch('draw', e)}
                className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                  mode === 'draw'
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Free draw"
              >
                <span className="text-sm">✏️</span>
              </button>
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Width</span>
                <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">
                  {strokeWidth}px
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                style={{ accentColor: strokeColor }}
              />
            </div>

            {/* Color Swatches */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Color</span>
              <RecentColors onSelect={handleStrokeColorChange} currentColor={strokeColor} />
              <div className="grid grid-cols-6 gap-1.5">
                {['#000000', '#ffffff', '#ccff00', '#ff6600', '#00ffff', '#ff00ff'].map((color) => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStrokeColorChange(color);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                      strokeColor === color ? 'border-accent ring-2 ring-accent/30' : 'border-border/50'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => handleStrokeColorChange(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-8 border border-border rounded cursor-pointer"
                title="Custom color"
              />
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Opacity</span>
                <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                style={{ accentColor: strokeColor }}
              />
            </div>

            {/* Line Style */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Style</span>
              <div className="flex gap-1.5">
                {(['solid', 'dashed', 'dotted'] as DashStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDashStyle(style);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`flex-1 h-10 rounded border-2 transition-all hover:scale-105 ${
                      dashStyle === style
                        ? 'bg-accent/10 border-accent'
                        : 'bg-secondary border-border hover:border-accent/50'
                    }`}
                    title={style}
                  >
                    <div className="h-full flex items-center justify-center">
                      <div
                        className="w-8 h-0.5"
                        style={{
                          background: strokeColor,
                          borderTop: style === 'dashed' ? `2px dashed ${strokeColor}` :
                                     style === 'dotted' ? `2px dotted ${strokeColor}` :
                                     `2px solid ${strokeColor}`
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions & actions */}
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {mode === 'click'
                  ? points.length === 0
                    ? 'Click to place points. Drag to curve.'
                    : points.length >= 3
                      ? 'Click first point to close, or Enter to finish'
                      : `${points.length} point${points.length !== 1 ? 's' : ''} — keep clicking`
                  : isDrawing
                    ? 'Drawing...'
                    : 'Click and drag to draw'
                }
              </p>
              <div className="flex gap-1.5">
                {points.length > 0 && (
                  <button
                    onClick={handleUndoClick}
                    className="flex-1 py-2 px-3 text-xs bg-secondary hover:bg-secondary/80 text-muted-foreground border border-border rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <Undo className="w-3.5 h-3.5" />
                    Undo
                  </button>
                )}
                {points.length >= 2 && (
                  <button
                    onClick={handleCompleteClick}
                    className="flex-1 py-2 px-3 text-xs bg-accent text-accent-foreground border border-accent rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Done
                  </button>
                )}
              </div>
              <button
                onClick={handleCancelClick}
                className="w-full py-2 px-3 text-xs bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-border hover:border-destructive/50 rounded transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-3.5 h-3.5" />
                Cancel (ESC)
              </button>
            </div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
}
