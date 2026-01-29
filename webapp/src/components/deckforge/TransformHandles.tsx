import { useState, useCallback, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { CanvasObject } from '@/store/deckforge';

interface TransformHandlesProps {
  object: CanvasObject;
  stageScale: number;
  onUpdate: (updates: Partial<CanvasObject>) => void;
  onStartTransform: () => void;
  onEndTransform: () => void;
}

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate';

export function TransformHandles({
  object,
  stageScale,
  onUpdate,
  onStartTransform,
  onEndTransform,
}: TransformHandlesProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<HandleType | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialBounds, setInitialBounds] = useState({ x: 0, y: 0, width: 0, height: 0, rotation: 0 });
  const [lockAspect, setLockAspect] = useState(false);

  // Calculate object bounds
  const width = object.width * object.scaleX;
  const height = object.height * object.scaleY;
  const x = object.x;
  const y = object.y;
  const rotation = object.rotation || 0;

  // Handle size scaled to screen (so they're always visible)
  const handleSize = 8 / stageScale;
  const rotateHandleDistance = 30 / stageScale;

  // Handle positions (before rotation)
  const handles = {
    nw: { x: x, y: y },
    n: { x: x + width / 2, y: y },
    ne: { x: x + width, y: y },
    e: { x: x + width, y: y + height / 2 },
    se: { x: x + width, y: y + height },
    s: { x: x + width / 2, y: y + height },
    sw: { x: x, y: y + height },
    w: { x: x, y: y + height / 2 },
    rotate: { x: x + width / 2, y: y - rotateHandleDistance },
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: HandleType) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBounds({ x, y, width, height, rotation });
    setLockAspect(e.shiftKey);
    onStartTransform();
  }, [x, y, width, height, rotation, onStartTransform]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragHandle) return;

    const dx = (e.clientX - dragStart.x) / stageScale;
    const dy = (e.clientY - dragStart.y) / stageScale;

    if (dragHandle === 'rotate') {
      // Calculate rotation angle
      const centerX = initialBounds.x + initialBounds.width / 2;
      const centerY = initialBounds.y + initialBounds.height / 2;
      
      const angle = Math.atan2(
        e.clientY / stageScale - centerY,
        e.clientX / stageScale - centerX
      );
      
      const degrees = (angle * 180) / Math.PI + 90;
      onUpdate({ rotation: Math.round(degrees) });
    } else {
      // Resize logic
      let newX = initialBounds.x;
      let newY = initialBounds.y;
      let newWidth = initialBounds.width;
      let newHeight = initialBounds.height;

      // Calculate based on handle position
      switch (dragHandle) {
        case 'nw':
          newX = initialBounds.x + dx;
          newY = initialBounds.y + dy;
          newWidth = initialBounds.width - dx;
          newHeight = initialBounds.height - dy;
          break;
        case 'n':
          newY = initialBounds.y + dy;
          newHeight = initialBounds.height - dy;
          break;
        case 'ne':
          newY = initialBounds.y + dy;
          newWidth = initialBounds.width + dx;
          newHeight = initialBounds.height - dy;
          break;
        case 'e':
          newWidth = initialBounds.width + dx;
          break;
        case 'se':
          newWidth = initialBounds.width + dx;
          newHeight = initialBounds.height + dy;
          break;
        case 's':
          newHeight = initialBounds.height + dy;
          break;
        case 'sw':
          newX = initialBounds.x + dx;
          newWidth = initialBounds.width - dx;
          newHeight = initialBounds.height + dy;
          break;
        case 'w':
          newX = initialBounds.x + dx;
          newWidth = initialBounds.width - dx;
          break;
      }

      // Lock aspect ratio if Shift is held
      const aspectLocked = lockAspect || e.shiftKey;
      if (aspectLocked && (dragHandle === 'nw' || dragHandle === 'ne' || dragHandle === 'se' || dragHandle === 'sw')) {
        const aspectRatio = initialBounds.width / initialBounds.height;
        
        if (Math.abs(newWidth / aspectRatio) > Math.abs(newHeight)) {
          newHeight = newWidth / aspectRatio;
          if (dragHandle === 'nw' || dragHandle === 'ne') {
            newY = initialBounds.y + initialBounds.height - newHeight;
          }
        } else {
          newWidth = newHeight * aspectRatio;
          if (dragHandle === 'nw' || dragHandle === 'sw') {
            newX = initialBounds.x + initialBounds.width - newWidth;
          }
        }
      }

      // Prevent negative dimensions
      if (newWidth < 10) newWidth = 10;
      if (newHeight < 10) newHeight = 10;

      // Calculate new scale
      const scaleX = newWidth / object.width;
      const scaleY = newHeight / object.height;

      onUpdate({
        x: newX,
        y: newY,
        scaleX,
        scaleY,
      });
    }
  }, [isDragging, dragHandle, dragStart, initialBounds, lockAspect, stageScale, object.width, object.height, onUpdate]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragHandle(null);
      onEndTransform();
    }
  }, [isDragging, onEndTransform]);

  // Attach global listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <g style={{ pointerEvents: 'all' }}>
      {/* Bounding box */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="#ccff00"
        strokeWidth={2 / stageScale}
        strokeDasharray={`${4 / stageScale} ${2 / stageScale}`}
        style={{ pointerEvents: 'none' }}
      />

      {/* Resize handles (corners) */}
      {(['nw', 'ne', 'se', 'sw'] as const).map((handle) => (
        <rect
          key={handle}
          x={handles[handle].x - handleSize / 2}
          y={handles[handle].y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="#ffffff"
          stroke="#000000"
          strokeWidth={1 / stageScale}
          style={{ cursor: `${handle}-resize`, pointerEvents: 'all' }}
          onMouseDown={(e) => handleMouseDown(e, handle)}
          className="hover:fill-primary transition-colors"
        />
      ))}

      {/* Resize handles (edges) */}
      {(['n', 'e', 's', 'w'] as const).map((handle) => (
        <rect
          key={handle}
          x={handles[handle].x - handleSize / 2}
          y={handles[handle].y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="#ccff00"
          stroke="#000000"
          strokeWidth={1 / stageScale}
          style={{ cursor: `${handle}-resize`, pointerEvents: 'all' }}
          onMouseDown={(e) => handleMouseDown(e, handle)}
          className="hover:fill-primary transition-colors"
        />
      ))}

      {/* Rotation handle */}
      <g>
        <line
          x1={x + width / 2}
          y1={y}
          x2={handles.rotate.x}
          y2={handles.rotate.y}
          stroke="#ccff00"
          strokeWidth={1 / stageScale}
          strokeDasharray={`${2 / stageScale} ${2 / stageScale}`}
          style={{ pointerEvents: 'none' }}
        />
        <circle
          cx={handles.rotate.x}
          cy={handles.rotate.y}
          r={handleSize}
          fill="#00d9ff"
          stroke="#000000"
          strokeWidth={1 / stageScale}
          style={{ cursor: 'grab', pointerEvents: 'all' }}
          onMouseDown={(e) => handleMouseDown(e, 'rotate')}
          className="hover:fill-primary transition-colors"
        />
        <foreignObject
          x={handles.rotate.x - handleSize}
          y={handles.rotate.y - handleSize}
          width={handleSize * 2}
          height={handleSize * 2}
          style={{ pointerEvents: 'none', overflow: 'visible' }}
        >
          <div className="flex items-center justify-center w-full h-full">
            <RotateCw className="w-3 h-3 text-white" style={{ filter: 'drop-shadow(0 0 2px black)' }} />
          </div>
        </foreignObject>
      </g>

      {/* Dimensions display */}
      {isDragging && dragHandle !== 'rotate' && (
        <g>
          <rect
            x={x + width / 2 - 30 / stageScale}
            y={y - 25 / stageScale}
            width={60 / stageScale}
            height={18 / stageScale}
            fill="rgba(0,0,0,0.8)"
            rx={3 / stageScale}
          />
          <text
            x={x + width / 2}
            y={y - 12 / stageScale}
            textAnchor="middle"
            fill="#ccff00"
            fontSize={10 / stageScale}
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            {Math.round(width)}×{Math.round(height)}
          </text>
        </g>
      )}

      {/* Rotation display */}
      {isDragging && dragHandle === 'rotate' && (
        <g>
          <rect
            x={x + width / 2 - 25 / stageScale}
            y={y - 25 / stageScale}
            width={50 / stageScale}
            height={18 / stageScale}
            fill="rgba(0,0,0,0.8)"
            rx={3 / stageScale}
          />
          <text
            x={x + width / 2}
            y={y - 12 / stageScale}
            textAnchor="middle"
            fill="#00d9ff"
            fontSize={10 / stageScale}
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            {Math.round(rotation)}°
          </text>
        </g>
      )}

      {/* Shift key hint */}
      {isDragging && !lockAspect && (dragHandle === 'nw' || dragHandle === 'ne' || dragHandle === 'se' || dragHandle === 'sw') && (
        <g>
          <rect
            x={x + width / 2 - 60 / stageScale}
            y={y + height + 10 / stageScale}
            width={120 / stageScale}
            height={18 / stageScale}
            fill="rgba(0,0,0,0.8)"
            rx={3 / stageScale}
          />
          <text
            x={x + width / 2}
            y={y + height + 23 / stageScale}
            textAnchor="middle"
            fill="#888888"
            fontSize={9 / stageScale}
            fontFamily="sans-serif"
            style={{ pointerEvents: 'none' }}
          >
            Hold Shift to lock ratio
          </text>
        </g>
      )}
    </g>
  );
}
