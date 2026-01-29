import { useState, useRef, useEffect } from 'react';
import { Check, X, Undo } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface PenToolProps {
  isActive: boolean;
  onComplete: (pathData: string) => void;
  onCancel: () => void;
  stageRef: React.RefObject<SVGSVGElement>;
}

export function PenTool({ isActive, onComplete, onCancel, stageRef }: PenToolProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setPoints([]);
      setCurrentPoint(null);
      setIsDrawing(false);
    }
  }, [isActive]);

  const handleStageClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isActive || !stageRef.current) return;

    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (points.length === 0) {
      // First point - start path
      setPoints([{ x, y }]);
      setIsDrawing(true);
    } else {
      // Add subsequent points
      setPoints([...points, { x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isActive || !isDrawing || !stageRef.current) return;

    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPoint({ x, y });
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1));
      if (points.length === 1) {
        setIsDrawing(false);
      }
    }
  };

  const handleComplete = () => {
    if (points.length < 2) {
      onCancel();
      return;
    }

    // Generate SVG path data
    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    // Use quadratic bezier curves for smooth paths
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      
      if (i === 1) {
        // First segment - simple line
        pathData += ` L ${p2.x} ${p2.y}`;
      } else {
        // Create smooth curves between points
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        pathData += ` Q ${p1.x} ${p1.y} ${midX} ${midY}`;
      }
    }

    onComplete(pathData);
  };

  if (!isActive) return null;

  // Generate preview path
  let previewPath = '';
  if (points.length > 0) {
    previewPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      previewPath += ` L ${points[i].x} ${points[i].y}`;
    }
    if (currentPoint && points.length > 0) {
      previewPath += ` L ${currentPoint.x} ${currentPoint.y}`;
    }
  }

  return (
    <>
      {/* Overlay to capture clicks */}
      <g
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
        style={{ cursor: 'crosshair' }}
      >
        <rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="transparent"
        />
      </g>

      {/* Draw preview path */}
      {previewPath && (
        <g>
          <path
            d={previewPath}
            stroke="#ccff00"
            strokeWidth={2}
            fill="none"
            strokeDasharray="4 4"
          />
          
          {/* Draw points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={index === 0 ? '#ccff00' : '#ffffff'}
              stroke="#000000"
              strokeWidth={1}
            />
          ))}
          
          {/* Draw current point preview */}
          {currentPoint && (
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r={3}
              fill="#ccff00"
              opacity={0.5}
            />
          )}
        </g>
      )}

      {/* Toolbar */}
      {isDrawing && (
        <foreignObject x={10} y={10} width={300} height={60}>
          <div className="bg-card border-2 border-accent p-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                Click to add points. {points.length} point{points.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-1 ml-auto">
                <button
                  onClick={handleUndo}
                  disabled={points.length === 0}
                  className="p-1.5 bg-secondary hover:bg-secondary/80 border border-border disabled:opacity-50"
                  title="Undo last point"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={handleComplete}
                  disabled={points.length < 2}
                  className="p-1.5 bg-accent hover:bg-accent/90 border border-accent disabled:opacity-50"
                  title="Complete path"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={onCancel}
                  className="p-1.5 bg-destructive hover:bg-destructive/90 border border-destructive"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </foreignObject>
      )}
    </>
  );
}
