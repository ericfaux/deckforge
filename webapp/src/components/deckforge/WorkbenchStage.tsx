import { useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { ZoomControls } from './ZoomControls';
import { PenTool } from './PenTool';
import { TransformHandles } from './TransformHandles';
import { SnapGuides, calculateSnapGuides } from './SnapGuides';
import { RulerOverlay } from './RulerOverlay';
import { ContextMenu } from './ContextMenu';
import { SelectionBox } from './SelectionBox';
import type { LucideIcon } from 'lucide-react';
import { Skull, Flame, Zap, Sword, Ghost, Bug, Eye, Target, Radio, Disc3, Music2, Rocket, Crown, Anchor, Sun, Moon, Triangle, Hexagon, Circle, Square, Star, Heart, Sparkles, Hand, Cat, Dog, Fish, Bird, Leaf, Cloud, Undo2, Redo2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDeckSize } from '@/lib/deck-sizes';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { useLongPress } from '@/hooks/use-long-press';

// Legacy deck dimensions (kept for backward compatibility - DO NOT USE)
// Use useDeckDimensions() hook instead for dynamic sizing
export const DECK_WIDTH = 96;
export const DECK_HEIGHT = 294;

/**
 * Hook to get current deck dimensions based on selected size
 * Use this instead of DECK_WIDTH/DECK_HEIGHT constants
 */
export function useDeckDimensions() {
  const deckSizeId = useDeckForgeStore(state => state.deckSizeId);
  const currentDeckSize = getDeckSize(deckSizeId);
  return {
    width: currentDeckSize.canvasWidth,
    height: currentDeckSize.canvasHeight,
  };
}

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
function getDeckPath(x: number, y: number, width: number, height: number): string {
  const noseRadius = width / 2;
  return `
    M ${x} ${y + noseRadius}
    Q ${x} ${y} ${x + width / 2} ${y}
    Q ${x + width} ${y} ${x + width} ${y + noseRadius}
    L ${x + width} ${y + height - noseRadius}
    Q ${x + width} ${y + height} ${x + width / 2} ${y + height}
    Q ${x} ${y + height} ${x} ${y + height - noseRadius}
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
const CanvasObjectItem = memo(function CanvasObjectItem({
  obj,
  isSelected,
  onSelect,
  onChange,
  deckX,
  deckY,
  stageScale,
  onDragStart,
  onDragMove,
  onDragEnd,
  onContextMenu,
}: {
  obj: CanvasObject;
  isSelected: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onChange: (updates: Partial<CanvasObject>) => void;
  deckX: number;
  deckY: number;
  stageScale: number;
  onDragStart?: () => void;
  onDragMove?: (obj: CanvasObject) => void;
  onDragEnd?: () => void;
  onContextMenu?: (e: React.MouseEvent, objId: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ objX: 0, objY: 0, clientX: 0, clientY: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Mobile long-press handler for context menu
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    
    // Start long-press timer (500ms)
    longPressTimerRef.current = setTimeout(() => {
      // Trigger context menu at touch position
      if (onContextMenu && touchStartPosRef.current) {
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          clientX: touchStartPosRef.current.x,
          clientY: touchStartPosRef.current.y,
        } as React.MouseEvent;
        
        onContextMenu(syntheticEvent, obj.id);
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]); // Double vibration
        }
      }
    }, 500); // 500ms long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long-press if finger moves
    if (touchStartPosRef.current && longPressTimerRef.current) {
      const touch = e.touches[0];
      const distance = Math.hypot(
        touch.clientX - touchStartPosRef.current.x,
        touch.clientY - touchStartPosRef.current.y
      );
      
      if (distance > 10) { // 10px threshold
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    // Clear long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Locked objects can be selected but not moved
    onSelect(e);
    
    if (obj.locked) {
      toast.error('Object is locked', 'Unlock it in the Inspector to move or edit');
      return;
    }
    
    setIsDragging(true);
    setDragStart({
      objX: obj.x,
      objY: obj.y,
      clientX: e.clientX,
      clientY: e.clientY,
    });
    onDragStart?.();
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, obj.id);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      // Calculate delta in screen space, then convert to deck space
      const deltaX = (e.clientX - dragStart.clientX) / stageScale;
      const deltaY = (e.clientY - dragStart.clientY) / stageScale;
      
      const newX = dragStart.objX + deltaX;
      const newY = dragStart.objY + deltaY;
      
      onChange({
        x: newX,
        y: newY,
      });
      
      onDragMove?.({ ...obj, x: newX, y: newY });
    }
  }, [isDragging, dragStart, stageScale, onChange, onDragMove, obj]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
  }, [isDragging, onDragEnd]);

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

  // Render group objects
  if (obj.type === 'group' && obj.children && obj.children.length > 0) {
    return (
      <g
        transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation}) scale(${obj.scaleX}, ${obj.scaleY})`}
        opacity={obj.opacity}
        style={{ 
          cursor, 
          mixBlendMode: obj.mixBlendMode || 'normal',
          transition: 'opacity 0.2s ease-out, transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleRightClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Render all children */}
        {obj.children.map((child) => (
          <g key={child.id}>
            {/* Recursively render child object */}
            <CanvasObjectItem
              obj={child}
              isSelected={false} // Children don't show individual selection
              onSelect={() => {}} // Group handles selection
              onChange={(updates) => {
                // When child is modified, update it within the group
                const newChildren = obj.children!.map(c => 
                  c.id === child.id ? { ...c, ...updates } : c
                );
                onChange({ children: newChildren });
              }}
              deckX={0}
              deckY={0}
              stageScale={1} // Scale is already applied to group
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
            />
          </g>
        ))}
        
        {/* Selection highlight for group */}
        {isSelected && (
          <rect
            x={0}
            y={0}
            width={obj.width}
            height={obj.height}
            fill="none"
            stroke="#ccff00"
            strokeWidth={2 / stageScale}
            strokeDasharray={`${8 / stageScale} ${4 / stageScale}`}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </g>
    );
  }

  if (obj.type === 'text') {
    const gradientId = obj.gradientStops ? `gradient-${obj.id}` : null;
    const fillValue = gradientId ? `url(#${gradientId})` : (obj.colorize || obj.fill || '#ffffff');
    
    // Apply text transform
    let displayText = obj.text || 'Text';
    if (obj.textTransform === 'uppercase') displayText = displayText.toUpperCase();
    else if (obj.textTransform === 'lowercase') displayText = displayText.toLowerCase();
    else if (obj.textTransform === 'capitalize') {
      displayText = displayText.replace(/\b\w/g, char => char.toUpperCase());
    }
    
    // Build text shadow
    let textShadow = 'none';
    if (obj.textShadow?.enabled) {
      const { offsetX, offsetY, blur, color } = obj.textShadow;
      textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
    }
    
    // Build text decoration (SVG doesn't support text-decoration directly, use tspan)
    const textDecoration = obj.textDecoration || 'none';
    
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
          fontWeight={obj.fontWeight || 'normal'}
          fontStyle={obj.fontStyle || 'normal'}
          textAnchor={obj.align === 'center' ? 'middle' : obj.align === 'right' ? 'end' : 'start'}
          opacity={obj.opacity}
          letterSpacing={obj.letterSpacing || 0}
          style={{ 
            cursor, 
            filter: filterStyle,
            textShadow,
            textDecoration: textDecoration === 'underline' ? 'underline' : textDecoration === 'line-through' ? 'line-through' : 'none'
          }}
          onMouseDown={handleMouseDown}
        >
          {displayText}
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

    // Wrap in group with transform applied to the group (not individual paths)
    // This ensures rotation works properly with transform handles
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    
    // Calculate dash array based on style - make patterns more visible
    const getDashArray = () => {
      const strokeWidth = obj.strokeWidth || 2;
      if (!obj.strokeDashStyle || obj.strokeDashStyle === 'solid') return 'none';
      // Dashed: longer dashes with visible gaps
      if (obj.strokeDashStyle === 'dashed') return `${strokeWidth * 4} ${strokeWidth * 3}`;
      // Dotted: small dots with spacing
      if (obj.strokeDashStyle === 'dotted') return `${strokeWidth * 0.5} ${strokeWidth * 2}`;
      return 'none';
    };
    
    return (
      <g transform={`rotate(${obj.rotation} ${centerX} ${centerY})`}>
        {/* Invisible thick stroke for easier clicking/dragging */}
        <path
          d={pathData}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(obj.strokeWidth || 2, 12)}
          style={{ cursor }}
          onMouseDown={handleMouseDown}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Visible stroke */}
        <path
          d={pathData}
          fill={obj.pathClosed ? (obj.fill || 'none') : 'none'}
          stroke={obj.stroke || '#000000'}
          strokeWidth={obj.strokeWidth || 2}
          strokeDasharray={getDashArray()}
          opacity={obj.opacity}
          style={{ filter: filterStyle, pointerEvents: 'none' }}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Selection highlight */}
        {isSelected && (
          <path
            d={pathData}
            fill="none"
            stroke="#ccff00"
            strokeWidth={(obj.strokeWidth || 2) + 2}
            strokeDasharray="6 4"
            opacity={0.6}
            style={{ pointerEvents: 'none' }}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>
    );
  }

  if (obj.type === 'shape') {
    const baseStyle = { cursor, filter: filterStyle };
    
    // Generate pattern background if pattern type exists
    let patternBackground = null;
    if (obj.patternType) {
      const primary = obj.patternPrimaryColor || '#1e3a8a';
      const secondary = obj.patternSecondaryColor || '#3b82f6';
      const scale = obj.patternScale || 20;
      
      switch (obj.patternType) {
        case 'checkerboard':
          patternBackground = `repeating-linear-gradient(45deg, ${primary} 0px, ${primary} ${scale}px, ${secondary} ${scale}px, ${secondary} ${scale*2}px), repeating-linear-gradient(-45deg, transparent 0px, transparent ${scale}px, ${secondary} ${scale}px, ${secondary} ${scale*2}px)`;
          break;
        case 'speed-lines':
          patternBackground = `repeating-linear-gradient(90deg, ${primary} 0px, ${primary} ${scale/4}px, ${secondary} ${scale/4}px, ${secondary} ${scale/2}px)`;
          break;
        case 'halftone':
          patternBackground = `radial-gradient(${primary} ${scale/6}px, ${secondary} ${scale/6}px)`;
          break;
        case 'diagonal-stripes':
          patternBackground = `repeating-linear-gradient(45deg, ${primary} 0px, ${primary} ${scale}px, ${secondary} ${scale}px, ${secondary} ${scale*2}px)`;
          break;
        case 'hexagons':
          patternBackground = `repeating-conic-gradient(from 30deg, ${primary} 0deg 60deg, ${secondary} 60deg 120deg, ${primary} 120deg 180deg, ${secondary} 180deg 240deg, ${primary} 240deg 300deg, ${secondary} 300deg 360deg)`;
          break;
        case 'crosshatch':
          patternBackground = `repeating-linear-gradient(0deg, transparent, transparent ${scale}px, ${secondary} ${scale}px, ${secondary} ${scale+2}px), repeating-linear-gradient(90deg, transparent, transparent ${scale}px, ${primary} ${scale}px, ${primary} ${scale+2}px)`;
          break;
        default:
          patternBackground = `linear-gradient(${primary}, ${secondary})`;
      }
    }
    
    // Generate gradient ID if gradient exists
    const gradientId = obj.gradientStops ? `gradient-${obj.id}` : null;
    const fillValue = gradientId ? `url(#${gradientId})` : (obj.fill || '#ffffff');
    
    // If we have a pattern, render using foreignObject with CSS background
    if (patternBackground) {
      const el = (
        <foreignObject
          x={obj.x}
          y={obj.y}
          width={obj.width * obj.scaleX}
          height={obj.height * obj.scaleY}
          style={baseStyle}
          onMouseDown={handleMouseDown}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: patternBackground,
              backgroundSize: obj.patternType === 'hexagons' ? `${obj.patternScale * 2}px ${obj.patternScale * 2}px` : 'auto',
              opacity: obj.opacity,
              filter: filterStyle,
              border: isSelected ? '2px solid #ccff00' : 'none',
            }}
          />
        </foreignObject>
      );
      return renderWithColorize(el);
    }

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
        style={{ 
          cursor, 
          filter: filterStyle,
          transition: 'opacity 0.2s ease-out, transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease-out',
        }}
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
          transition: 'opacity 0.2s ease-out, transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease-out',
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

    // Calculate dash array based on strokeDashStyle - make patterns more visible
    const getLineDashArray = () => {
      // Legacy: if lineType is 'dashed', use old behavior for backward compatibility
      if (lineType === 'dashed' && !obj.strokeDashStyle) {
        return `${strokeW * 2},${strokeW * 2}`;
      }
      // New: use strokeDashStyle with more visible patterns
      if (!obj.strokeDashStyle || obj.strokeDashStyle === 'solid') return undefined;
      // Dashed: longer dashes with visible gaps
      if (obj.strokeDashStyle === 'dashed') return `${strokeW * 4} ${strokeW * 3}`;
      // Dotted: small dots with spacing
      if (obj.strokeDashStyle === 'dotted') return `${strokeW * 0.5} ${strokeW * 2}`;
      return undefined;
    };

    // Calculate path based on line type
    let pathD = '';
    if (lineType === 'straight' || lineType === 'dashed') {
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
          strokeDasharray={getLineDashArray()}
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
});

export function WorkbenchStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [touchDistance, setTouchDistance] = useState<number | null>(null);
  const [snapGuides, setSnapGuides] = useState<Array<{ type: 'vertical' | 'horizontal'; position: number; label?: string }>>([]);
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objectId: string } | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [swipeFeedback, setSwipeFeedback] = useState<'undo' | 'redo' | null>(null);

  const {
    objects,
    selectedId,
    selectedIds,
    selectObject,
    toggleSelectObject,
    updateObject,
    addObject,
    stageScale,
    setStageScale,
    saveToHistory,
    textureOverlays,
    showHardwareGuide,
    showRulers,
    activeTool,
    setActiveTool,
    backgroundColor,
    backgroundFillType,
    backgroundGradient,
    copiedObjectId,
    pastedObjectId,
    undoRedoChangedIds,
    deckSizeId,
    undo,
    redo,
    past,
    future,
  } = useDeckForgeStore();

  // Get current deck dimensions based on selected size
  const currentDeckSize = getDeckSize(deckSizeId);
  const deckWidth = currentDeckSize.canvasWidth;
  const deckHeight = currentDeckSize.canvasHeight;

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

  // Force re-center when deck size changes
  useEffect(() => {
    console.log('[DeckForge] Deck size changed:', deckSizeId, `→ ${deckWidth}x${deckHeight}px`);
    // Trigger re-calculation of deck position by forcing container size update
    if (containerRef.current) {
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, [deckSizeId, deckWidth, deckHeight]);

  // Memoize visible objects (filter only when objects change)
  const visibleObjects = useMemo(() => {
    return objects.filter(obj => !obj.hidden);
  }, [objects]);

  // Memoize selected object lookup
  const selectedObject = useMemo(() => {
    return selectedId ? objects.find(obj => obj.id === selectedId) : null;
  }, [objects, selectedId]);

  // Calculate center position for deck
  const deckX = useMemo(() => {
    return containerSize.width / 2 - (deckWidth * stageScale) / 2;
  }, [containerSize.width, deckWidth, stageScale]);

  const deckY = useMemo(() => {
    return containerSize.height / 2 - (deckHeight * stageScale) / 2;
  }, [containerSize.height, deckHeight, stageScale]);

  // Mobile swipe gesture callbacks
  const handleSwipeUndo = useCallback(() => {
    if (past.length === 0) return;
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Visual feedback
    setSwipeFeedback('undo');
    setTimeout(() => setSwipeFeedback(null), 400);
    
    // Perform undo
    undo();
    console.log('[WorkbenchStage] Swipe undo triggered');
  }, [past.length, undo]);

  const handleSwipeRedo = useCallback(() => {
    if (future.length === 0) return;
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Visual feedback
    setSwipeFeedback('redo');
    setTimeout(() => setSwipeFeedback(null), 400);
    
    // Perform redo
    redo();
    console.log('[WorkbenchStage] Swipe redo triggered');
  }, [future.length, redo]);

  // Add swipe gesture support (3-finger swipes for undo/redo)
  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeRight: handleSwipeUndo,
    onSwipeLeft: handleSwipeRedo,
    minFingers: 3, // Require 3 fingers to avoid conflicts with pan/zoom
    minDistance: 80, // Require substantial swipe
  });

  // Merge refs (containerRef and swipeRef)
  useEffect(() => {
    if (containerRef.current && swipeRef.current !== containerRef.current) {
      swipeRef.current = containerRef.current;
    }
  }, [swipeRef]);

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
    setIsDraggingFiles(false);
    
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
    setIsDraggingFiles(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the container itself, not child elements
    if (e.currentTarget === e.target) {
      setIsDraggingFiles(false);
    }
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

  const handleObjectSelect = useCallback((objId: string, e?: React.MouseEvent) => {
    // Check if object is locked
    const obj = objects.find(o => o.id === objId);
    if (obj?.locked) {
      toast.error('Layer is locked', {
        description: 'Unlock it in the Layers panel to edit',
      });
      return;
    }

    if (e?.shiftKey) {
      // Shift+click: toggle this object in multi-select
      toggleSelectObject(objId);
    } else {
      // Normal click: select only this object
      selectObject(objId);
    }
  }, [selectObject, toggleSelectObject, objects]);

  // Handle pen tool path completion
  const handlePenToolComplete = useCallback((pathData: string, strokeWidth: number, strokeColor: string, opacity: number, dashStyle: 'solid' | 'dashed' | 'dotted', mode: 'click' | 'draw') => {
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
      // Calculate actual bounding box from path points
      const xs = pathPoints.map(p => p.x);
      const ys = pathPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      const actualWidth = maxX - minX || strokeWidth;
      const actualHeight = maxY - minY || strokeWidth;
      
      // Pad slightly for stroke width
      const padding = strokeWidth * 2;
      
      const newObj = {
        type: 'path' as const,
        x: minX - padding,
        y: minY - padding,
        width: actualWidth + padding * 2,
        height: actualHeight + padding * 2,
        rotation: 0,
        opacity: opacity,
        scaleX: 1,
        scaleY: 1,
        pathPoints,
        pathClosed: false,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashStyle: dashStyle,
        fill: 'none',
      };
      
      addObject(newObj);
      
      // Only deselect for free draw mode
      // Click mode (straight lines) keeps selection to show transform handles
      if (mode === 'draw') {
        selectObject(null);
      }
      // For 'click' mode, addObject auto-selects, so transform handles will appear
    }
  }, [addObject, setActiveTool, selectObject]);

  // Get enabled textures
  const enabledTextures = textureOverlays.filter((t) => t.enabled);

  return (
    <div
      id="main-canvas"
      className="relative flex-1 h-full overflow-hidden"
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleStageClick}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={-1}
    >
      {/* Drag overlay */}
      {isDraggingFiles && (
        <div className="absolute inset-0 z-[9998] bg-primary/10 backdrop-blur-sm border-4 border-dashed border-primary animate-in fade-in duration-200 flex items-center justify-center">
          <div className="text-center space-y-3 bg-card/90 rounded-lg p-8 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Drop image here</p>
              <p className="text-sm text-muted-foreground mt-1">Your image will be added to the canvas</p>
            </div>
          </div>
        </div>
      )}

      {/* Swipe gesture feedback */}
      {swipeFeedback && (
        <div className={`absolute inset-0 z-[9997] pointer-events-none flex items-center justify-center ${swipeFeedback === 'undo' ? 'swipe-undo-feedback' : 'swipe-redo-feedback'}`}>
          <div className="bg-card/90 rounded-full p-6 shadow-2xl border-2 border-primary">
            {swipeFeedback === 'undo' ? (
              <Undo2 className="w-12 h-12 text-primary" />
            ) : (
              <Redo2 className="w-12 h-12 text-primary" />
            )}
          </div>
        </div>
      )}
      
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
            <path d={getDeckPath(0, 0, deckWidth, deckHeight)} transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`} />
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

          {/* Background gradient */}
          {backgroundFillType === 'gradient' && backgroundGradient.direction === 'linear' && (
            <linearGradient
              id="deck-bg-gradient"
              x1={`${50 - Math.cos(backgroundGradient.angle * Math.PI / 180) * 50}%`}
              y1={`${50 - Math.sin(backgroundGradient.angle * Math.PI / 180) * 50}%`}
              x2={`${50 + Math.cos(backgroundGradient.angle * Math.PI / 180) * 50}%`}
              y2={`${50 + Math.sin(backgroundGradient.angle * Math.PI / 180) * 50}%`}
            >
              <stop offset="0%" stopColor={backgroundGradient.startColor} />
              <stop offset="100%" stopColor={backgroundGradient.endColor} />
            </linearGradient>
          )}
          {backgroundFillType === 'gradient' && backgroundGradient.direction === 'radial' && (
            <radialGradient id="deck-bg-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={backgroundGradient.startColor} />
              <stop offset="100%" stopColor={backgroundGradient.endColor} />
            </radialGradient>
          )}
        </defs>

        {/* Group for deck content with clipping */}
        <g clipPath="url(#deck-clip)">
          {/* Deck background */}
          <path
            d={getDeckPath(0, 0, deckWidth, deckHeight)}
            transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
            fill={backgroundFillType === 'gradient' ? 'url(#deck-bg-gradient)' : backgroundColor}
            style={{ transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />

          {/* Render all objects inside the clip mask */}
          <g 
            transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
            style={{ transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {visibleObjects.map((obj) => {
              // Apply visual feedback classes
              const visualClasses = [
                obj.id === copiedObjectId ? 'copy-flash' : '',
                obj.id === pastedObjectId ? 'paste-flash' : '',
                undoRedoChangedIds.includes(obj.id) ? 'undo-highlight' : '',
              ].filter(Boolean).join(' ');

              return (
                <g key={obj.id} className={visualClasses}>
                  <CanvasObjectItem
                    obj={obj}
                    isSelected={selectedIds.includes(obj.id)}
                    onSelect={(e) => handleObjectSelect(obj.id, e)}
                    onChange={(updates) => {
                      updateObject(obj.id, updates);
                    }}
                    deckX={deckX}
                    deckY={deckY}
                    stageScale={stageScale}
                    onDragStart={() => {
                      saveToHistory();
                      setIsDraggingObject(true);
                    }}
                    onDragMove={(draggedObj) => {
                      // Calculate snap guides
                      const otherObjects = objects.filter(o => o.id !== draggedObj.id);
                      const guides = calculateSnapGuides(draggedObj, otherObjects, 5, deckWidth, deckHeight);
                      setSnapGuides(guides);
                    }}
                    onDragEnd={() => {
                      setIsDraggingObject(false);
                      setSnapGuides([]);
                    }}
                    onContextMenu={(e, objId) => {
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        objectId: objId,
                      });
                    }}
                  />
                </g>
              );
            })}

            {/* Transform handles for selected object */}
            {selectedId && activeTool !== 'pen' && !isDraggingObject && (() => {
              if (!selectedObject || selectedObject.locked) return null;
              
              return (
                <TransformHandles
                  object={selectedObject}
                  stageScale={stageScale}
                  deckX={deckX}
                  deckY={deckY}
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

          {/* Snap guides (rendered outside clip so they extend full height/width) */}
          {isDraggingObject && (
            <SnapGuides
              guides={snapGuides}
              deckX={deckX}
              deckY={deckY}
              stageScale={stageScale}
            />
          )}

          {/* Ruler overlay */}
          <RulerOverlay
            deckX={deckX}
            deckY={deckY}
            stageScale={stageScale}
            enabled={showRulers}
          />

          {/* Selection box for multi-select */}
          <g transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}>
            <SelectionBox
              deckX={deckX}
              deckY={deckY}
              stageScale={stageScale}
            />
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
                d={getDeckPath(0, 0, deckWidth, deckHeight)}
                transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
                fill={`url(#${texture.id}-pattern)`}
              />
            </g>
          ))}
        </g>

        {/* Deck outline (outside clip for full visibility) */}
        <path
          d={getDeckPath(0, 0, deckWidth, deckHeight)}
          transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
          stroke="#ccff00"
          strokeWidth={2}
          fill="none"
          pointerEvents="none"
          style={{ transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        {/* Hardware Guide Overlay - Visual only, not exported */}
        {showHardwareGuide && activeTool !== 'pen' && (
          <g transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`} pointerEvents="none">
            {/* Front Truck Baseplate */}
            <rect
              x={deckWidth / 2 - 20}
              y={35}
              width={40}
              height={18}
              fill="rgba(255, 102, 0, 0.3)"
              stroke="#ff6600"
              strokeWidth={1}
              strokeDasharray="3,2"
            />
            {/* Front Truck Mounting Screws (4 holes) */}
            <circle cx={deckWidth / 2 - 12} cy={40} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={deckWidth / 2 + 12} cy={40} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={deckWidth / 2 - 12} cy={48} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={deckWidth / 2 + 12} cy={48} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />

            {/* Rear Truck Baseplate */}
            <rect
              x={deckWidth / 2 - 20}
              y={deckHeight - 53}
              width={40}
              height={18}
              fill="rgba(255, 102, 0, 0.3)"
              stroke="#ff6600"
              strokeWidth={1}
              strokeDasharray="3,2"
            />
            {/* Rear Truck Mounting Screws (4 holes) */}
            <circle cx={deckWidth / 2 - 12} cy={deckHeight - 48} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={deckWidth / 2 + 12} cy={deckHeight - 48} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={deckWidth / 2 - 12} cy={deckHeight - 40} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />
            <circle cx={deckWidth / 2 + 12} cy={deckHeight - 40} r={2.5} fill="rgba(255, 102, 0, 0.5)" stroke="#ff6600" strokeWidth={0.5} />

            {/* Labels */}
            <text
              x={deckWidth / 2}
              y={28}
              textAnchor="middle"
              fontSize={6}
              fontFamily="JetBrains Mono, monospace"
              fill="#ff6600"
            >
              FRONT TRUCK
            </text>
            <text
              x={deckWidth / 2}
              y={deckHeight - 58}
              textAnchor="middle"
              fontSize={6}
              fontFamily="JetBrains Mono, monospace"
              fill="#ff6600"
            >
              REAR TRUCK
            </text>
          </g>
        )}

        {/* Improved empty state with onboarding */}
        {objects.length === 0 && activeTool !== 'pen' && (
          <g transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`} pointerEvents="none">
            {/* Welcome message */}
            <text
              x={deckWidth / 2}
              y={deckHeight / 2 - 40}
              textAnchor="middle"
              fontSize={16 / stageScale}
              fontFamily="Oswald, sans-serif"
              fill="#ffffff"
              stroke="#333333"
              strokeWidth={0.5 / stageScale}
              fontWeight="bold"
            >
              Welcome to DeckForge
            </text>
            
            <text
              x={deckWidth / 2}
              y={deckHeight / 2 - 20}
              textAnchor="middle"
              fontSize={11 / stageScale}
              fontFamily="sans-serif"
              fill="#888888"
            >
              Design your custom fingerboard deck
            </text>

            {/* Quick start icons */}
            <g transform={`translate(${deckWidth / 2 - 60}, ${deckHeight / 2 + 10})`}>
              {/* Text tool hint */}
              <g>
                <rect
                  x={0}
                  y={0}
                  width={35}
                  height={35}
                  fill="rgba(255, 255, 255, 0.1)"
                  stroke="#ffffff"
                  strokeWidth={1.5 / stageScale}
                  rx={3 / stageScale}
                />
                <text
                  x={17.5}
                  y={23}
                  textAnchor="middle"
                  fontSize={20 / stageScale}
                  fill="#ffffff"
                  fontWeight="bold"
                >
                  T
                </text>
              </g>
              
              {/* Stickers hint */}
              <g transform="translate(40, 0)">
                <rect
                  x={0}
                  y={0}
                  width={35}
                  height={35}
                  fill="rgba(255, 255, 255, 0.1)"
                  stroke="#ffffff"
                  strokeWidth={1.5 / stageScale}
                  rx={3 / stageScale}
                />
                <text
                  x={17.5}
                  y={23}
                  textAnchor="middle"
                  fontSize={20 / stageScale}
                  fill="#ffffff"
                  fontWeight="bold"
                >
                  S
                </text>
              </g>
              
              {/* Upload hint */}
              <g transform="translate(80, 0)">
                <rect
                  x={0}
                  y={0}
                  width={35}
                  height={35}
                  fill="rgba(255, 255, 255, 0.1)"
                  stroke="#ffffff"
                  strokeWidth={1.5 / stageScale}
                  rx={3 / stageScale}
                />
                <text
                  x={17.5}
                  y={23}
                  textAnchor="middle"
                  fontSize={20 / stageScale}
                  fill="#ffffff"
                  fontWeight="bold"
                >
                  U
                </text>
              </g>
            </g>

            {/* Hints text */}
            <text
              x={deckWidth / 2}
              y={deckHeight / 2 + 60}
              textAnchor="middle"
              fontSize={9 / stageScale}
              fontFamily="monospace"
              fill="#666666"
            >
              Press T for Text  •  S for Stickers  •  U to Upload
            </text>
            
            <text
              x={deckWidth / 2}
              y={deckHeight / 2 + 75}
              textAnchor="middle"
              fontSize={9 / stageScale}
              fontFamily="monospace"
              fill="#555555"
            >
              Or click the tool rail on the left
            </text>

            {/* Arrow pointing to tool rail */}
            <g transform={`translate(-10, ${deckHeight / 2})`}>
              <path
                d="M 0 0 L -15 -5 L -15 5 Z"
                fill="#ffffff"
                opacity={0.7}
              />
              <line
                x1={-15}
                y1={0}
                x2={-30}
                y2={0}
                stroke="#ffffff"
                strokeWidth={2 / stageScale}
                opacity={0.7}
              />
            </g>
          </g>
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

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          objectId={contextMenu.objectId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
