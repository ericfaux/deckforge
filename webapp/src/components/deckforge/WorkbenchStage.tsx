import { useRef, useEffect, useState, useCallback } from 'react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { ZoomControls } from './ZoomControls';
import { PenTool } from './PenTool';
import { TransformHandles } from './TransformHandles';
import type { LucideIcon } from 'lucide-react';
import { Skull, Flame, Zap, Sword, Ghost, Bug, Eye, Target, Radio, Disc3, Music2, Rocket, Crown, Anchor, Sun, Moon, Triangle, Hexagon, Circle, Square, Star, Heart, Sparkles, Hand, Cat, Dog, Fish, Bird, Leaf, Cloud } from 'lucide-react';

// Deck dimensions (32:98 aspect ratio for fingerboard)
export const DECK_WIDTH = 96;
export const DECK_HEIGHT = 294;

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  Skull,
  Flame,
  Zap,
  Sword,
  Ghost,
  Bug,
  Eye,
  Target,
  Radio,
  Disc: Disc3,
  Music: Music2,
  Rocket,
  Crown,
  Anchor,
  Sun,
  Moon,
  Triangle,
  Hexagon,
  Circle,
  Square,
  Star,
  Heart,
  Sparkles,
  Hand,
  Cat,
  Dog,
  Fish,
  Bird,
  Leaf,
  Cloud,
};

// Generate deck path for SVG
function getDeckPath(x: number, y: number): string {
  const noseRadius = DECK_WIDTH / 2;
  return `
    M ${x} ${y + noseRadius}
    Q ${x} ${y} ${x + DECK_WIDTH / 2} ${y}
    Q ${x + DECK_WIDTH} ${y} ${x + DECK_WIDTH} ${y + noseRadius}
    L ${x + DECK_WIDTH} ${y + DECK_HEIGHT - noseRadius}
    Q ${x + DECK_WIDTH} ${y + DECK_HEIGHT} ${x + DECK_WIDTH / 2} ${y + DECK_HEIGHT}
    Q ${x} ${y + DECK_HEIGHT} ${x} ${y + DECK_HEIGHT - noseRadius}
    Z
  `;
}

// Build CSS filter string from object properties
function buildFilterStyle(obj: CanvasObject): string {
  const filters: string[] = [];

  if (obj.contrast !== undefined && obj.contrast !== 100) {
    filters.push(`contrast(${obj.contrast}%)`);
  }
  if (obj.brightness !== undefined && obj.brightness !== 100) {
    filters.push(`brightness(${obj.brightness}%)`);
  }
  if (obj.grayscale !== undefined && obj.grayscale > 0) {
    filters.push(`grayscale(${obj.grayscale}%)`);
  }
  if (obj.threshold) {
    // High contrast threshold effect (simulate xerox look)
    filters.push('contrast(300%)', 'grayscale(100%)');
  }
  // Remix filters
  if (obj.hueRotate !== undefined && obj.hueRotate > 0) {
    filters.push(`hue-rotate(${obj.hueRotate}deg)`);
  }
  if (obj.invert) {
    filters.push('invert(100%)');
  }
  // Advanced filters
  if (obj.blur !== undefined && obj.blur > 0) {
    filters.push(`blur(${obj.blur}px)`);
  }
  if (obj.saturate !== undefined && obj.saturate !== 100) {
    filters.push(`saturate(${obj.saturate}%)`);
  }
  if (obj.sepia !== undefined && obj.sepia > 0) {
    filters.push(`sepia(${obj.sepia}%)`);
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

// Get colorize overlay color with reduced opacity for blend
function getColorizeStyle(obj: CanvasObject): React.CSSProperties | undefined {
  if (!obj.colorize) return undefined;
  return {
    mixBlendMode: 'color' as const,
  };
}

// Individual object component
function CanvasObjectItem({
  obj,
  isSelected,
  onSelect,
  onChange,
  deckX,
  deckY,
}: {
  obj: CanvasObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<CanvasObject>) => void;
  deckX: number;
  deckY: number;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX - obj.x, y: e.clientY - obj.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      onChange({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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

  const transform = `translate(${obj.x}, ${obj.y}) rotate(${obj.rotation}) scale(${obj.scaleX}, ${obj.scaleY})`;
  const cursor = isDragging ? 'grabbing' : 'grab';
  const filterStyle = buildFilterStyle(obj);

  // Wrapper for colorize effect
  const renderWithColorize = (element: React.ReactNode) => {
    if (!obj.colorize) return element;
    return (
      <g>
        {element}
        {/* Colorize overlay */}
        <g style={getColorizeStyle(obj)}>
          {element}
          <rect
            x={obj.x - 5}
            y={obj.y - 5}
            width={(obj.width * obj.scaleX) + 10}
            height={(obj.height * obj.scaleY) + 10}
            fill={obj.colorize}
            opacity={0.7}
            style={{ mixBlendMode: 'color' }}
            pointerEvents="none"
          />
        </g>
      </g>
    );
  };

  if (obj.type === 'text') {
    const gradientId = obj.gradientStops ? `gradient-${obj.id}` : null;
    const fillValue = gradientId ? `url(#${gradientId})` : (obj.colorize || obj.fill || '#ffffff');
    
    const textEl = (
      <>
        {obj.gradientStops && (
          <defs>
            <linearGradient id={gradientId!} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${obj.gradientAngle || 0})`}>
              {obj.gradientStops.map((stop, i) => (
                <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
        )}
        <text
          transform={transform}
          fill={fillValue}
          fontSize={obj.fontSize || 24}
          fontFamily={obj.fontFamily || 'Oswald, sans-serif'}
          opacity={obj.opacity}
          style={{ cursor, filter: filterStyle }}
          onMouseDown={handleMouseDown}
        >
          {obj.text || 'Text'}
        </text>
      </>
    );
    return textEl;
  }

  // Render path objects (pen tool / bezier curves)
  if (obj.type === 'path' && obj.pathPoints && obj.pathPoints.length > 0) {
    let pathData = `M ${obj.pathPoints[0].x} ${obj.pathPoints[0].y}`;
    
    for (let i = 1; i < obj.pathPoints.length; i++) {
      const point = obj.pathPoints[i];
      const prevPoint = obj.pathPoints[i - 1];
      
      if (point.cp1x !== undefined && point.cp1y !== undefined) {
        // Bezier curve with control points
        if (point.cp2x !== undefined && point.cp2y !== undefined) {
          pathData += ` C ${point.cp1x} ${point.cp1y} ${point.cp2x} ${point.cp2y} ${point.x} ${point.y}`;
        } else {
          pathData += ` Q ${point.cp1x} ${point.cp1y} ${point.x} ${point.y}`;
        }
      } else {
        // Straight line
        pathData += ` L ${point.x} ${point.y}`;
      }
    }
    
    if (obj.pathClosed) {
      pathData += ' Z';
    }

    const el = (
      <path
        d={pathData}
        fill={obj.pathClosed ? (obj.fill || 'none') : 'none'}
        stroke={obj.stroke || '#000000'}
        strokeWidth={obj.strokeWidth || 2}
        opacity={obj.opacity}
        style={{ cursor, filter: filterStyle }}
        onMouseDown={handleMouseDown}
        transform={`rotate(${obj.rotation} ${obj.x + obj.width / 2} ${obj.y + obj.height / 2})`}
      />
    );
    
    if (isSelected) {
      return (
        <g>
          {el}
          <path
            d={pathData}
            fill="none"
            stroke="#ccff00"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </g>
      );
    }
    return el;
  }

  if (obj.type === 'shape') {
    const baseStyle = { cursor, filter: filterStyle };
    
    // Generate gradient ID if gradient exists
    const gradientId = obj.gradientStops ? `gradient-${obj.id}` : null;
    const fillValue = gradientId ? `url(#${gradientId})` : (obj.fill || '#ffffff');

    if (obj.shapeType === 'circle') {
      const el = (
        <>
          {obj.gradientStops && (
            <defs>
              <linearGradient id={gradientId!} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${obj.gradientAngle || 0})`}>
                {obj.gradientStops.map((stop, i) => (
                  <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
          )}
          <circle
            cx={obj.x + obj.width / 2}
            cy={obj.y + obj.height / 2}
            r={obj.width / 2 * obj.scaleX}
            fill={fillValue}
            opacity={obj.opacity}
            style={baseStyle}
            onMouseDown={handleMouseDown}
            stroke={isSelected ? '#ccff00' : 'none'}
            strokeWidth={isSelected ? 2 : 0}
          />
        </>
      );
      return renderWithColorize(el);
    }
    if (obj.shapeType === 'star') {
      const cx = obj.x + obj.width / 2;
      const cy = obj.y + obj.height / 2;
      const outerR = obj.width / 2 * obj.scaleX;
      const innerR = outerR * 0.4;
      const points: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      const el = (
        <>
          {obj.gradientStops && (
            <defs>
              <linearGradient id={gradientId!} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${obj.gradientAngle || 0})`}>
                {obj.gradientStops.map((stop, i) => (
                  <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
          )}
          <polygon
            points={points.join(' ')}
            fill={fillValue}
            opacity={obj.opacity}
            style={baseStyle}
            onMouseDown={handleMouseDown}
            stroke={isSelected ? '#ccff00' : 'none'}
            strokeWidth={isSelected ? 2 : 0}
          />
        </>
      );
      return renderWithColorize(el);
    }
    // Default rect
    const el = (
      <>
        {obj.gradientStops && (
          <defs>
            <linearGradient id={gradientId!} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${obj.gradientAngle || 0})`}>
              {obj.gradientStops.map((stop, i) => (
                <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
        )}
        <rect
          x={obj.x}
          y={obj.y}
          width={obj.width * obj.scaleX}
          height={obj.height * obj.scaleY}
          fill={fillValue}
          opacity={obj.opacity}
          style={baseStyle}
          onMouseDown={handleMouseDown}
          stroke={isSelected ? '#ccff00' : 'none'}
          strokeWidth={isSelected ? 2 : 0}
        />
      </>
    );
    return renderWithColorize(el);
  }

  // Render sticker (Lucide icon)
  if (obj.type === 'sticker' && obj.iconName) {
    const IconComponent = iconMap[obj.iconName];
    if (!IconComponent) return null;

    const size = obj.width * obj.scaleX;
    const strokeW = obj.strokeWidth || 3;
    const strokeColor = obj.stroke || '#ffffff';
    const fillColor = obj.solidFill ? strokeColor : 'none';

    return (
      <g
        transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation}, ${size/2}, ${size/2})`}
        opacity={obj.opacity}
        style={{ cursor, filter: filterStyle }}
        onMouseDown={handleMouseDown}
      >
        <foreignObject width={size} height={size}>
          <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconComponent
              width={size}
              height={size}
              strokeWidth={strokeW}
              stroke={strokeColor}
              fill={fillColor}
            />
          </div>
        </foreignObject>
        {isSelected && (
          <rect
            x={0}
            y={0}
            width={size}
            height={size}
            fill="none"
            stroke="#ccff00"
            strokeWidth={2}
            strokeDasharray="4,2"
          />
        )}
      </g>
    );
  }

  // Render texture (image with blend mode)
  if (obj.type === 'texture' && obj.textureUrl) {
    const width = obj.width * obj.scaleX;
    const height = obj.height * obj.scaleY;
    const blendMode = obj.blendMode || 'multiply';

    return (
      <g
        transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation})`}
        style={{
          cursor,
          filter: filterStyle,
          mixBlendMode: blendMode,
        }}
        onMouseDown={handleMouseDown}
      >
        <image
          href={obj.textureUrl}
          width={width}
          height={height}
          opacity={obj.opacity}
          preserveAspectRatio="xMidYMid slice"
        />
        {isSelected && (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="none"
            stroke="#ccff00"
            strokeWidth={2}
            strokeDasharray="4,2"
          />
        )}
      </g>
    );
  }

  // Render line (straight, curved, zigzag, dashed)
  if (obj.type === 'line') {
    const endX = obj.lineEndX ?? 60;
    const endY = obj.lineEndY ?? 0;
    const curveAmount = obj.lineCurve ?? 0;
    const strokeColor = obj.stroke || '#ffffff';
    const strokeW = obj.strokeWidth || 3;
    const capStyle = obj.lineCapStyle || 'round';
    const lineType = obj.lineType || 'straight';

    // Calculate path based on line type
    let pathD = '';
    if (lineType === 'straight') {
      pathD = `M 0 0 L ${endX} ${endY}`;
    } else if (lineType === 'curved') {
      // Quadratic bezier curve
      const ctrlX = endX / 2;
      const ctrlY = endY / 2 - curveAmount;
      pathD = `M 0 0 Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
    } else if (lineType === 'zigzag') {
      // Create zigzag pattern
      const segments = 5;
      const segWidth = endX / segments;
      const zigHeight = 10;
      let path = 'M 0 0';
      for (let i = 1; i <= segments; i++) {
        const yOffset = i % 2 === 1 ? -zigHeight : zigHeight;
        path += ` L ${segWidth * i} ${(endY / segments) * i + yOffset}`;
      }
      pathD = path;
    } else if (lineType === 'dashed') {
      pathD = `M 0 0 L ${endX} ${endY}`;
    }

    return (
      <g
        transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation})`}
        opacity={obj.opacity}
        style={{ cursor, filter: filterStyle }}
        onMouseDown={handleMouseDown}
      >
        <path
          d={pathD}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinecap={capStyle}
          strokeDasharray={lineType === 'dashed' ? `${strokeW * 2},${strokeW * 2}` : undefined}
          fill="none"
        />
        {/* Invisible wider path for easier selection */}
        <path
          d={pathD}
          stroke="transparent"
          strokeWidth={Math.max(strokeW + 10, 15)}
          fill="none"
        />
        {isSelected && (
          <>
            {/* Start point handle */}
            <circle
              cx={0}
              cy={0}
              r={4}
              fill="#ccff00"
              stroke="#000"
              strokeWidth={1}
            />
            {/* End point handle */}
            <circle
              cx={endX}
              cy={endY}
              r={4}
              fill="#ccff00"
              stroke="#000"
              strokeWidth={1}
            />
            {/* Control point for curves */}
            {lineType === 'curved' && (
              <circle
                cx={endX / 2}
                cy={endY / 2 - curveAmount}
                r={3}
                fill="#ff6600"
                stroke="#000"
                strokeWidth={1}
              />
            )}
          </>
        )}
      </g>
    );
  }

  // Render path (pen tool / bezier curves)
  if (obj.type === 'path' && obj.pathPoints && obj.pathPoints.length > 0) {
    const strokeColor = obj.stroke || '#ffffff';
    const strokeW = obj.strokeWidth || 3;
    const capStyle = obj.lineCapStyle || 'round';
    const fillColor = obj.solidFill !== false ? (obj.fill || '#ffffff') : 'none';

    // Generate SVG path data from points
    let pathD = `M ${obj.pathPoints[0].x} ${obj.pathPoints[0].y}`;

    for (let i = 1; i < obj.pathPoints.length; i++) {
      const point = obj.pathPoints[i];
      const prevPoint = obj.pathPoints[i - 1];

      // Check if this segment uses bezier curves
      if (prevPoint.cp2x !== undefined && prevPoint.cp2y !== undefined &&
          point.cp1x !== undefined && point.cp1y !== undefined) {
        // Cubic bezier curve
        pathD += ` C ${prevPoint.cp2x} ${prevPoint.cp2y}, ${point.cp1x} ${point.cp1y}, ${point.x} ${point.y}`;
      } else if (prevPoint.cp2x !== undefined && prevPoint.cp2y !== undefined) {
        // Quadratic bezier curve
        pathD += ` Q ${prevPoint.cp2x} ${prevPoint.cp2y}, ${point.x} ${point.y}`;
      } else {
        // Straight line
        pathD += ` L ${point.x} ${point.y}`;
      }
    }

    // Close path if specified
    if (obj.pathClosed) {
      pathD += ' Z';
    }

    return (
      <g
        transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation}) scale(${obj.scaleX}, ${obj.scaleY})`}
        opacity={obj.opacity}
        style={{ cursor, filter: filterStyle }}
        onMouseDown={handleMouseDown}
      >
        <path
          d={pathD}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinecap={capStyle}
          strokeLinejoin="round"
          fill={fillColor}
        />
        {/* Invisible wider path for easier selection */}
        <path
          d={pathD}
          stroke="transparent"
          strokeWidth={Math.max(strokeW + 10, 15)}
          fill="none"
        />
        {isSelected && (
          <>
            {/* Anchor points */}
            {obj.pathPoints.map((point, index) => (
              <g key={`point-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  fill="#00d9ff"
                  stroke="#fff"
                  strokeWidth={1.5}
                />
                {/* Control point 1 */}
                {point.cp1x !== undefined && point.cp1y !== undefined && (
                  <>
                    <line
                      x1={point.x}
                      y1={point.y}
                      x2={point.cp1x}
                      y2={point.cp1y}
                      stroke="#ff6600"
                      strokeWidth={1}
                      strokeDasharray="3,3"
                    />
                    <circle
                      cx={point.cp1x}
                      cy={point.cp1y}
                      r={3}
                      fill="#ff6600"
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  </>
                )}
                {/* Control point 2 */}
                {point.cp2x !== undefined && point.cp2y !== undefined && (
                  <>
                    <line
                      x1={point.x}
                      y1={point.y}
                      x2={point.cp2x}
                      y2={point.cp2y}
                      stroke="#ff6600"
                      strokeWidth={1}
                      strokeDasharray="3,3"
                    />
                    <circle
                      cx={point.cp2x}
                      cy={point.cp2y}
                      r={3}
                      fill="#ff6600"
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  </>
                )}
              </g>
            ))}
          </>
        )}
      </g>
    );
  }

  // Render image (regular images + imported SVGs)
  if (obj.type === 'image' && obj.src) {
    const width = obj.width * obj.scaleX;
    const height = obj.height * obj.scaleY;

    const el = (
      <g
        transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation}, ${width/2}, ${height/2})`}
        opacity={obj.opacity}
        style={{ cursor, filter: filterStyle }}
        onMouseDown={handleMouseDown}
      >
        <image
          href={obj.src}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid meet"
        />
        {isSelected && (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="none"
            stroke="#ccff00"
            strokeWidth={2}
            strokeDasharray="4,2"
          />
        )}
      </g>
    );
    return renderWithColorize(el);
  }

  return null;
}

export function WorkbenchStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [touchDistance, setTouchDistance] = useState<number | null>(null);

  const {
    objects,
    selectedId,
    selectObject,
    updateObject,
    addObject,
    stageScale,
    setStageScale,
    saveToHistory,
    textureOverlays,
    showHardwareGuide,
    activeTool,
    setActiveTool,
  } = useDeckForgeStore();

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate center position for deck
  const deckX = containerSize.width / 2 - (DECK_WIDTH * stageScale) / 2;
  const deckY = containerSize.height / 2 - (DECK_HEIGHT * stageScale) / 2;

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleBy = 1.1;
    const oldScale = stageScale;
    const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setStageScale(Math.max(0.5, Math.min(3, newScale)));
  }, [stageScale, setStageScale]);

  // Mobile: Pinch to zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setTouchDistance(distance);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistance) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scale = distance / touchDistance;
      const newScale = stageScale * scale;
      setStageScale(Math.max(0.5, Math.min(3, newScale)));
      setTouchDistance(distance);
    }
  }, [touchDistance, stageScale, setStageScale]);

  const handleTouchEnd = useCallback(() => {
    setTouchDistance(null);
  }, []);

  // Handle drop from drawer
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const objData = JSON.parse(data);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - deckX) / stageScale;
      const y = (e.clientY - rect.top - deckY) / stageScale;

      addObject({
        type: objData.type || 'shape',
        x: x - (objData.width || 30) / 2,
        y: y - (objData.height || 30) / 2,
        width: objData.width || 60,
        height: objData.height || 60,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        shapeType: objData.shapeType,
        fill: objData.fill || '#ffffff',
        text: objData.text,
        fontSize: objData.fontSize,
      });
    } catch (err) {
      console.error('Failed to parse drop data', err);
    }
  }, [addObject, stageScale, deckX, deckY]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleStageClick = useCallback((e: React.MouseEvent) => {
    // Don't interfere with pen tool
    if (activeTool === 'pen') {
      return;
    }
    if (e.target === e.currentTarget) {
      selectObject(null);
    }
  }, [selectObject, activeTool]);

  // Handle pen tool path completion
  const handlePenToolComplete = useCallback((pathData: string, strokeWidth: number) => {
    // Close tool immediately to prevent further clicks
    setActiveTool(null);
    
    // Parse SVG path data into PathPoints
    const pathPoints: Array<{ x: number; y: number; cp1x?: number; cp1y?: number; cp2x?: number; cp2y?: number }> = [];
    
    // Simple regex to extract coordinates from path data
    const commands = pathData.match(/[MLQCmlqc][^MLQCmlqc]*/g) || [];
    
    commands.forEach((cmd) => {
      const type = cmd[0];
      const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
      
      if (type === 'M' || type === 'm') {
        pathPoints.push({ x: coords[0], y: coords[1] });
      } else if (type === 'L' || type === 'l') {
        pathPoints.push({ x: coords[0], y: coords[1] });
      } else if (type === 'Q' || type === 'q') {
        pathPoints.push({
          x: coords[2],
          y: coords[3],
          cp1x: coords[0],
          cp1y: coords[1],
        });
      } else if (type === 'C' || type === 'c') {
        pathPoints.push({
          x: coords[4],
          y: coords[5],
          cp1x: coords[0],
          cp1y: coords[1],
          cp2x: coords[2],
          cp2y: coords[3],
        });
      }
    });

    if (pathPoints.length > 0) {
      addObject({
        type: 'path',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        pathPoints,
        pathClosed: false,
        stroke: '#000000',
        strokeWidth: strokeWidth,
        fill: 'none',
      });
    }
  }, [addObject, setActiveTool]);

  // Get enabled textures
  const enabledTextures = textureOverlays.filter((t) => t.enabled);

  return (
    <div
      className="relative flex-1 h-full overflow-hidden"
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleStageClick}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid bg-background" />

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="absolute inset-0"
        width={containerSize.width}
        height={containerSize.height}
        onClick={handleStageClick}
      >
        <defs>
          {/* Clip path for deck shape */}
          <clipPath id="deck-clip">
            <path d={getDeckPath(0, 0)} transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`} />
          </clipPath>

          {/* Texture patterns */}
          <pattern id="scratched-wood-pattern" patternUnits="userSpaceOnUse" width="40" height="40">
            <line x1="0" y1="5" x2="40" y2="6" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
            <line x1="0" y1="12" x2="40" y2="11" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3" />
            <line x1="0" y1="20" x2="40" y2="21" stroke="rgba(0,0,0,0.25)" strokeWidth="0.4" />
            <line x1="0" y1="28" x2="40" y2="27" stroke="rgba(0,0,0,0.3)" strokeWidth="0.3" />
            <line x1="0" y1="35" x2="40" y2="36" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
            <line x1="8" y1="0" x2="9" y2="40" stroke="rgba(0,0,0,0.15)" strokeWidth="0.3" />
            <line x1="22" y1="0" x2="21" y2="40" stroke="rgba(0,0,0,0.2)" strokeWidth="0.2" />
          </pattern>

          <pattern id="grip-tape-dust-pattern" patternUnits="userSpaceOnUse" width="30" height="30">
            <circle cx="5" cy="8" r="0.8" fill="rgba(255,255,255,0.4)" />
            <circle cx="12" cy="3" r="0.5" fill="rgba(255,255,255,0.3)" />
            <circle cx="22" cy="12" r="1" fill="rgba(255,255,255,0.35)" />
            <circle cx="8" cy="18" r="0.6" fill="rgba(255,255,255,0.4)" />
            <circle cx="26" cy="22" r="0.7" fill="rgba(255,255,255,0.3)" />
            <circle cx="15" cy="26" r="0.9" fill="rgba(255,255,255,0.35)" />
          </pattern>

          <pattern id="halftone-dots-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
            <circle cx="4" cy="4" r="1.5" fill="rgba(0,0,0,0.4)" />
          </pattern>
        </defs>

        {/* Group for deck content with clipping */}
        <g clipPath="url(#deck-clip)">
          {/* Deck background */}
          <path
            d={getDeckPath(0, 0)}
            transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
            fill="#1a1a1a"
          />

          {/* Render all objects inside the clip mask */}
          <g transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}>
            {objects.map((obj) => (
              <CanvasObjectItem
                key={obj.id}
                obj={obj}
                isSelected={selectedId === obj.id}
                onSelect={() => selectObject(obj.id)}
                onChange={(updates) => {
                  saveToHistory();
                  updateObject(obj.id, updates);
                }}
                deckX={deckX}
                deckY={deckY}
              />
            ))}

            {/* Transform handles for selected object */}
            {selectedId && activeTool !== 'pen' && (() => {
              const selectedObj = objects.find(obj => obj.id === selectedId);
              if (!selectedObj) return null;
              
              return (
                <TransformHandles
                  object={selectedObj}
                  stageScale={stageScale}
                  onUpdate={(updates) => {
                    updateObject(selectedId, updates);
                  }}
                  onStartTransform={() => {
                    saveToHistory();
                  }}
                  onEndTransform={() => {
                    // Optional: could trigger another history save or validation
                  }}
                />
              );
            })()}
          </g>

          {/* Texture overlays with blend modes */}
          {enabledTextures.map((texture) => (
            <g
              key={texture.id}
              style={{
                mixBlendMode: texture.blendMode,
                opacity: texture.opacity,
              }}
            >
              <path
                d={getDeckPath(0, 0)}
                transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
                fill={`url(#${texture.id}-pattern)`}
              />
            </g>
          ))}
        </g>

        {/* Deck outline (outside clip for full visibility) */}
        <path
          d={getDeckPath(0, 0)}
          transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
          stroke="#ccff00"
          strokeWidth={2}
          fill="none"
          pointerEvents="none"
        />

        {/* Hardware Guide Overlay - Visual only, not exported */}
        {showHardwareGuide && activeTool !== 'pen' && (
          <g transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`} pointerEvents="none">
            {/* Front Truck Baseplate */}
            <rect
              x={DECK_WIDTH / 2 - 20}
              y={35}
              width={40}
              height={18}
              fill="rgba(255, 102, 0, 0.3)"
              stroke="#ff6600"
              strokeWidth={1}
              strokeDasharray="3,2"
            />
            {/* Front Truck Mounting Screws (4 holes) */}
            <circle cx={DECK_WIDTH / 2 - 12} cy={40} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={DECK_WIDTH / 2 + 12} cy={40} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={DECK_WIDTH / 2 - 12} cy={48} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={DECK_WIDTH / 2 + 12} cy={48} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />

            {/* Rear Truck Baseplate */}
            <rect
              x={DECK_WIDTH / 2 - 20}
              y={DECK_HEIGHT - 53}
              width={40}
              height={18}
              fill="rgba(255, 102, 0, 0.3)"
              stroke="#ff6600"
              strokeWidth={1}
              strokeDasharray="3,2"
            />
            {/* Rear Truck Mounting Screws (4 holes) */}
            <circle cx={DECK_WIDTH / 2 - 12} cy={DECK_HEIGHT - 48} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={DECK_WIDTH / 2 + 12} cy={DECK_HEIGHT - 48} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={DECK_WIDTH / 2 - 12} cy={DECK_HEIGHT - 40} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={DECK_WIDTH / 2 + 12} cy={DECK_HEIGHT - 40} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />

            {/* Labels */}
            <text
              x={DECK_WIDTH / 2}
              y={28}
              textAnchor="middle"
              fontSize={6}
              fontFamily="JetBrains Mono, monospace"
              fill="#ff6600"
            >
              FRONT TRUCK
            </text>
            <text
              x={DECK_WIDTH / 2}
              y={DECK_HEIGHT - 58}
              textAnchor="middle"
              fontSize={6}
              fontFamily="JetBrains Mono, monospace"
              fill="#ff6600"
            >
              REAR TRUCK
            </text>
          </g>
        )}

        {/* Instructions when empty */}
        {objects.length === 0 && (
          <text
            x={deckX + (DECK_WIDTH * stageScale) / 2}
            y={deckY + DECK_HEIGHT * stageScale + 25}
            textAnchor="middle"
            fontSize={10}
            fontFamily="JetBrains Mono, monospace"
            fill="#666666"
            pointerEvents="none"
          >
            Click tools on left to add elements
          </text>
        )}

        {/* Pen Tool - Must be LAST to be on top */}
        <PenTool
          isActive={activeTool === 'pen'}
          onComplete={handlePenToolComplete}
          onCancel={() => setActiveTool(null)}
          stageRef={svgRef}
          deckX={deckX}
          deckY={deckY}
          stageScale={stageScale}
        />
      </svg>

      {/* Zoom controls */}
      <ZoomControls />
    </div>
  );
}
