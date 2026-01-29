import { useState, useRef, useEffect } from 'react';
import { Check, X, Undo, MousePointer2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface PenToolProps {
  isActive: boolean;
  onComplete: (pathData: string, strokeWidth: number) => void;
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
      onComplete(pathData, strokeWidth);
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

    onComplete(pathData, strokeWidth);
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
            stroke="#ccff00"
            strokeWidth={strokeWidth / stageScale}
            fill="none"
            strokeDasharray={mode === 'click' ? "4 4" : "none"}
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

      {/* Toolbar */}
      <foreignObject x={10} y={10} width={500} height={140}>
        <div 
          className="bg-card border-2 border-accent p-4 shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-3">
            {/* Mode selector */}
            <div className="flex gap-2">
              <button
                onClick={(e) => handleModeSwitch('click', e)}
                className={`flex-1 px-3 py-2 text-xs font-display uppercase tracking-wider transition-colors ${
                  mode === 'click'
                    ? 'bg-accent text-accent-foreground border-2 border-accent'
                    : 'bg-secondary text-muted-foreground border-2 border-border hover:border-accent'
                }`}
              >
                <MousePointer2 className="w-3 h-3 inline mr-1" />
                Click Points
              </button>
              <button
                onClick={(e) => handleModeSwitch('draw', e)}
                className={`flex-1 px-3 py-2 text-xs font-display uppercase tracking-wider transition-colors ${
                  mode === 'draw'
                    ? 'bg-accent text-accent-foreground border-2 border-accent'
                    : 'bg-secondary text-muted-foreground border-2 border-border hover:border-accent'
                }`}
              >
                Free Draw
              </button>
            </div>

            {/* Stroke Width */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                Line Width
              </span>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 h-2 bg-secondary border border-border appearance-none cursor-pointer"
                style={{
                  accentColor: 'hsl(var(--accent))',
                }}
              />
              <span className="text-sm font-mono text-foreground w-8 text-right">
                {strokeWidth}px
              </span>
            </div>

            {/* Instructions & controls */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest flex-1">
                {mode === 'click' 
                  ? points.length === 0
                    ? 'Click START point • Click END point to finish'
                    : points.length === 1
                      ? 'Click END point to finish line'
                      : 'Drawing...'
                  : isDrawing
                    ? 'Release mouse to finish • ESC to cancel'
                    : 'Hold & drag to draw • Release to finish'
                }
              </span>
              <div className="flex gap-1">
                <button
                  onClick={handleCancelClick}
                  className="p-2 bg-destructive hover:bg-destructive/90 border border-destructive transition-colors"
                  title="Cancel (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
}
