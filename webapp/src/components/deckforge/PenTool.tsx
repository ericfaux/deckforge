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
  
  // Default pen settings - user can edit in Inspector after drawing
  const strokeWidth = 2;
  const strokeColor = '#000000';
  const opacity = 1.0;
  const dashStyle: DashStyle = 'solid';

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
            opacity={0.8}
            strokeDasharray="4 4"
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

      {/* Minimal hint overlay - appears only when drawing */}
      {points.length > 0 && (
        <foreignObject x={20} y={20} width={200} height={60}>
          <div 
            className="bg-card/90 backdrop-blur border border-border rounded px-3 py-2 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-muted-foreground">
              {mode === 'click' 
                ? 'Click to finish line'
                : 'Release to finish'
              }
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              Press ESC to cancel
            </p>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
