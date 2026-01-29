import { useState, useRef, useEffect } from 'react';
import { Check, X, Undo, MousePointer2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

type DashStyle = 'solid' | 'dashed' | 'dotted';

interface PenToolProps {
  isActive: boolean;
  onComplete: (pathData: string, strokeWidth: number, strokeColor: string, opacity: number, dashStyle: DashStyle) => void;
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

  useEffect(() => {
    if (!isActive) {
      setPoints([]);
      setCurrentPoint(null);
      setIsDrawing(false);
      setMode('click');
    }
  }, [isActive]);

  // ESC to cancel
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
  }, [isActive, points, onCancel]);

  const handleStageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling
    if (!isActive || !stageRef.current || mode === 'draw') return;

    const rect = stageRef.current.getBoundingClientRect();
    // Transform screen coordinates to deck-relative coordinates
    const x = (e.clientX - rect.left - deckX) / stageScale;
    const y = (e.clientY - rect.top - deckY) / stageScale;

    // First click - add point
    if (points.length === 0) {
      setPoints([{ x, y }]);
      return;
    }

    // Second click - complete the line immediately
    if (points.length === 1) {
      const pathData = `M ${points[0].x} ${points[0].y} L ${x} ${y}`;
      setPoints([]); // Clear state immediately
      onComplete(pathData, strokeWidth, strokeColor, opacity, dashStyle);
      return;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling
    if (!isActive || !stageRef.current || mode !== 'draw') return;

    const rect = stageRef.current.getBoundingClientRect();
    // Transform screen coordinates to deck-relative coordinates
    const x = (e.clientX - rect.left - deckX) / stageScale;
    const y = (e.clientY - rect.top - deckY) / stageScale;

    setIsDrawing(true);
    setPoints([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isActive || !stageRef.current) return;

    const rect = stageRef.current.getBoundingClientRect();
    // Transform screen coordinates to deck-relative coordinates
    const x = (e.clientX - rect.left - deckX) / stageScale;
    const y = (e.clientY - rect.top - deckY) / stageScale;
    setCurrentPoint({ x, y });

    // Free draw mode
    if (mode === 'draw' && isDrawing) {
      setPoints([...points, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (mode === 'draw' && isDrawing) {
      setIsDrawing(false);
      if (points.length >= 2) {
        handleComplete();
      } else {
        // Not enough points, cancel
        onCancel();
      }
    }
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1));
    }
  };

  const handleComplete = () => {
    if (points.length < 2) {
      onCancel();
      return;
    }

    // Generate SVG path data with smooth curves
    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    if (mode === 'draw') {
      // Free draw - use all points with smoothing
      for (let i = 1; i < points.length; i++) {
        if (i % 3 === 0 || i === points.length - 1) {
          pathData += ` L ${points[i].x} ${points[i].y}`;
        }
      }
    } else {
      // Click mode - create smooth bezier curves
      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        
        if (i === 1) {
          pathData += ` L ${p2.x} ${p2.y}`;
        } else {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          pathData += ` Q ${p1.x} ${p1.y} ${midX} ${midY}`;
        }
      }
    }

    onComplete(pathData, strokeWidth, strokeColor, opacity, dashStyle);
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
  let previewPath = '';
  if (points.length > 0) {
    previewPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      previewPath += ` L ${points[i].x} ${points[i].y}`;
    }
    if (currentPoint && points.length > 0 && mode === 'click') {
      previewPath += ` L ${currentPoint.x} ${currentPoint.y}`;
    }
  }

  // Get viewport dimensions from stageRef
  const viewportWidth = stageRef.current?.clientWidth || 3000;
  const viewportHeight = stageRef.current?.clientHeight || 3000;

  return (
    <g style={{ pointerEvents: 'all' }}>
      {/* Massive overlay to capture ALL interactions */}
      <rect
        x={0}
        y={0}
        width={viewportWidth}
        height={viewportHeight}
        fill="rgba(0,0,0,0.01)"
        style={{ 
          cursor: mode === 'draw' ? 'crosshair' : 'pointer',
          pointerEvents: 'all'
        }}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Draw preview path - transform to screen coordinates */}
      {previewPath && (
        <g 
          transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
          style={{ pointerEvents: 'none' }}
        >
          <path
            d={previewPath}
            stroke={strokeColor}
            strokeWidth={strokeWidth / stageScale}
            fill="none"
            opacity={opacity}
            strokeDasharray={
              mode === 'click' 
                ? "4 4" 
                : dashStyle === 'dashed' 
                  ? `${strokeWidth * 2} ${strokeWidth}`
                  : dashStyle === 'dotted'
                    ? `1 ${strokeWidth}`
                    : "none"
            }
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Draw points (only in click mode) */}
          {mode === 'click' && points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={5 / stageScale}
              fill={index === 0 ? '#ccff00' : '#ffffff'}
              stroke="#000000"
              strokeWidth={2 / stageScale}
            />
          ))}
          
          {/* Draw current point preview (click mode) */}
          {mode === 'click' && currentPoint && (
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r={4 / stageScale}
              fill="#ccff00"
              opacity={0.6}
            />
          )}
        </g>
      )}

      {/* Canva-style floating toolbar - clean and compact */}
      <foreignObject x={20} y={100} width={240} height={420}>
        <div 
          className="bg-card border border-border rounded-lg p-3 shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2.5">
            {/* Mode selector - compact */}
            <div className="flex gap-1 p-1 bg-secondary rounded">
              <button
                onClick={(e) => handleModeSwitch('click', e)}
                className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                  mode === 'click'
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Click to place points"
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

            {/* Stroke Width - visual */}
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

            {/* Color Swatches - Canva style */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Color</span>
              <div className="grid grid-cols-6 gap-1.5">
                {['#000000', '#ffffff', '#ccff00', '#ff6600', '#00ffff', '#ff00ff'].map((color) => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      setStrokeColor(color);
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
                onChange={(e) => setStrokeColor(e.target.value)}
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

            {/* Line Style - visual previews */}
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

            {/* Instructions - clean */}
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {mode === 'click' 
                  ? points.length === 0
                    ? 'Click to place start point'
                    : 'Click to finish line'
                  : isDrawing
                    ? 'Drawing...'
                    : 'Click and drag to draw'
                }
              </p>
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
