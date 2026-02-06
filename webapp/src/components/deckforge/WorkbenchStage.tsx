import { useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { ZoomControls } from './ZoomControls';
import { PenTool } from './PenTool';
import { BrushTool, renderBrushStroke } from './BrushTool';
import type { BrushStrokeData } from './BrushTool';
import { TransformHandles } from './TransformHandles';
import { SnapGuides, calculateSnapGuides, calculateSnapPosition } from './SnapGuides';
import { RulerOverlay } from './RulerOverlay';
import { HardwareGuideOverlay } from './HardwareGuideOverlay';
import { BleedSafeZoneOverlay } from './BleedSafeZoneOverlay';
import { MeasurementTool } from './MeasurementTool';
import { SymmetryGuide } from './SymmetryGuide';
import { getGuideSnapTargets, getAccurateDeckPath } from '@/lib/deck-guides';
import { CanvasContextMenu } from './ContextMenu';
import { ContextMenu as ContextMenuRoot, ContextMenuTrigger } from '@/components/ui/context-menu';
import { SelectionBox } from './SelectionBox';
import { MultiSelectBoundingBox } from './MultiSelectBoundingBox';
import type { LucideIcon } from 'lucide-react';
import { Skull, Flame, Zap, Sword, Ghost, Bug, Eye, Target, Radio, Disc3, Music2, Rocket, Crown, Anchor, Sun, Moon, Triangle, Hexagon, Circle, Square, Star, Heart, Sparkles, Hand, Cat, Dog, Fish, Bird, Leaf, Cloud, Undo2, Redo2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDeckSize } from '@/lib/deck-sizes';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { useLongPress } from '@/hooks/use-long-press';
import { generateArcPath, generateWarpPath, pathPointsToSvgPath, hasTextWarp } from '@/lib/text-warp';

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
// Uses accurate fingerboard proportions: nose is slightly rounder than tail
function getDeckPath(x: number, y: number, width: number, height: number): string {
  // Nose (top) has a slightly wider radius than tail (bottom)
  const noseRadius = width * 0.52;
  const tailRadius = width * 0.48;

  return `
    M ${x} ${y + noseRadius}
    C ${x} ${y + noseRadius * 0.35} ${x + width * 0.15} ${y} ${x + width / 2} ${y}
    C ${x + width * 0.85} ${y} ${x + width} ${y + noseRadius * 0.35} ${x + width} ${y + noseRadius}
    L ${x + width} ${y + height - tailRadius}
    C ${x + width} ${y + height - tailRadius * 0.35} ${x + width * 0.85} ${y + height} ${x + width / 2} ${y + height}
    C ${x + width * 0.15} ${y + height} ${x} ${y + height - tailRadius * 0.35} ${x} ${y + height - tailRadius}
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

  // Drop shadow via CSS filter
  if (obj.dropShadow?.enabled) {
    const { offsetX, offsetY, blur, color, opacity } = obj.dropShadow;
    // Convert hex color + opacity to rgba
    const shadowColor = hexToRgba(color || '#000000', opacity ?? 0.5);
    filters.push(`drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${shadowColor})`);
  }

  // Glow via CSS drop-shadow with no offset and bright color
  if (obj.glow?.enabled) {
    const { blur, color, opacity } = obj.glow;
    const glowColor = hexToRgba(color || '#ffffff', opacity ?? 0.8);
    filters.push(`drop-shadow(0 0 ${blur}px ${glowColor})`);
  }

  // Duotone: apply grayscale then use SVG filter reference
  if (obj.duotone?.enabled) {
    filters.push(`url(#duotone-${obj.id})`);
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

// Convert hex color + opacity to rgba string
function hexToRgba(hex: string, opacity: number): string {
  // Handle rgba strings passed through
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    return hex;
  }
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${opacity})`;
}

// Build outline stroke props for SVG elements
function getOutlineStrokeProps(obj: CanvasObject, isSelected: boolean): { stroke?: string; strokeWidth?: number; paintOrder?: string } {
  if (obj.outlineStroke?.enabled) {
    return {
      stroke: obj.outlineStroke.color || '#000000',
      strokeWidth: obj.outlineStroke.width || 2,
      paintOrder: 'stroke fill',
    };
  }
  if (isSelected) {
    return {
      stroke: '#ccff00',
      strokeWidth: 2,
    };
  }
  return {};
}

// Generate SVG filter defs for duotone effect
function DuotoneFilterDef({ obj }: { obj: CanvasObject }) {
  if (!obj.duotone?.enabled) return null;
  const { color1, color2 } = obj.duotone;
  // Parse hex colors to 0-1 RGB values
  const parseHex = (hex: string) => {
    const h = hex.replace('#', '');
    return {
      r: (parseInt(h.substring(0, 2), 16) || 0) / 255,
      g: (parseInt(h.substring(2, 4), 16) || 0) / 255,
      b: (parseInt(h.substring(4, 6), 16) || 0) / 255,
    };
  };
  const c1 = parseHex(color1 || '#000000');
  const c2 = parseHex(color2 || '#ccff00');

  return (
    <filter id={`duotone-${obj.id}`} colorInterpolationFilters="sRGB">
      {/* Convert to grayscale */}
      <feColorMatrix type="saturate" values="0" />
      {/* Map grayscale to duotone: shadow color (c1) to highlight color (c2) */}
      <feComponentTransfer>
        <feFuncR type="table" tableValues={`${c1.r} ${c2.r}`} />
        <feFuncG type="table" tableValues={`${c1.g} ${c2.g}`} />
        <feFuncB type="table" tableValues={`${c1.b} ${c2.b}`} />
      </feComponentTransfer>
    </filter>
  );
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
  onMultiDrag,
  isPartOfMultiSelect,
  onDoubleClick,
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
  onMultiDrag?: (deltaX: number, deltaY: number) => void;
  isPartOfMultiSelect?: boolean;
  onDoubleClick?: () => void;
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
    // Don't stopPropagation — let the event bubble to the Radix ContextMenuTrigger
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

      // If this object is part of a multi-selection, move all other selected objects too
      if (isPartOfMultiSelect && onMultiDrag) {
        onMultiDrag(deltaX, deltaY);
      }

      onDragMove?.({ ...obj, x: newX, y: newY });
    }
  }, [isDragging, dragStart, stageScale, onChange, onDragMove, obj, isPartOfMultiSelect, onMultiDrag]);

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
        onDoubleClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onDoubleClick?.();
        }}
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

    // Outline stroke for text
    const textOutline = getOutlineStrokeProps(obj, false);

    // Check if text has warp/curve applied
    const isWarped = hasTextWarp(obj);

    // Generate warp path if needed
    let warpPathData = '';
    const warpPathId = `warp-path-${obj.id}`;

    if (isWarped) {
      if (obj.textPathId) {
        // Text attached to a custom path - look up the path object
        const allObjects = useDeckForgeStore.getState().objects;
        const pathObj = allObjects.find(o => o.id === obj.textPathId);
        if (pathObj?.pathPoints && pathObj.pathPoints.length > 0) {
          warpPathData = pathPointsToSvgPath(pathObj.pathPoints, obj.x, obj.y);
        }
      } else if (obj.warpType && obj.warpType !== 'none') {
        // Check for arc with direction
        if ((obj.warpType === 'arc-up' || obj.warpType === 'arc-down') && obj.arcAngle) {
          const direction = obj.warpType === 'arc-up'
            ? (obj.arcDirection || 'convex')
            : (obj.arcDirection === 'convex' ? 'concave' : 'convex');
          warpPathData = generateArcPath({
            width: obj.width * obj.scaleX,
            height: obj.height * obj.scaleY,
            radius: obj.arcRadius,
            angle: obj.arcAngle,
            direction,
          });
        } else {
          warpPathData = generateWarpPath({
            warpType: obj.warpType,
            width: obj.width * obj.scaleX,
            height: obj.height * obj.scaleY,
            intensity: obj.warpIntensity ?? 50,
          });
        }
      }
    }

    // Calculate startOffset for text alignment on path
    let startOffset = '0%';
    if (isWarped && warpPathData) {
      if (obj.align === 'center') startOffset = '50%';
      else if (obj.align === 'right') startOffset = '100%';
    }

    const gradientDefs = obj.gradientStops ? (
      obj.fillType === 'radial-gradient' ? (
        <radialGradient
          id={gradientId!}
          cx={`${(obj.gradientCenterX ?? 0.5) * 100}%`}
          cy={`${(obj.gradientCenterY ?? 0.5) * 100}%`}
          r={`${(obj.gradientRadius ?? 0.5) * 100}%`}
        >
          {obj.gradientStops.map((stop, i) => (
            <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
          ))}
        </radialGradient>
      ) : (
        <linearGradient id={gradientId!} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${obj.gradientAngle || 0})`}>
          {obj.gradientStops.map((stop, i) => (
            <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
          ))}
        </linearGradient>
      )
    ) : null;

    const textEl = (
      <>
        <defs>
          {gradientDefs}
          {isWarped && warpPathData && (
            <path id={warpPathId} d={warpPathData} fill="none" />
          )}
        </defs>
        <text
          transform={transform}
          fill={fillValue}
          fontSize={obj.fontSize || 24}
          fontFamily={obj.fontFamily || 'Oswald, sans-serif'}
          fontWeight={obj.fontWeight || 'normal'}
          fontStyle={obj.fontStyle || 'normal'}
          textAnchor={isWarped && warpPathData
            ? (obj.align === 'center' ? 'middle' : obj.align === 'right' ? 'end' : 'start')
            : (obj.align === 'center' ? 'middle' : obj.align === 'right' ? 'end' : 'start')
          }
          opacity={obj.opacity}
          letterSpacing={obj.letterSpacing || 0}
          stroke={textOutline.stroke}
          strokeWidth={textOutline.strokeWidth}
          style={{
            cursor,
            filter: filterStyle,
            textShadow,
            textDecoration: textDecoration === 'underline' ? 'underline' : textDecoration === 'line-through' ? 'line-through' : 'none',
            paintOrder: textOutline.paintOrder,
          }}
          onMouseDown={handleMouseDown}
        >
          {isWarped && warpPathData ? (
            <textPath
              href={`#${warpPathId}`}
              startOffset={startOffset}
            >
              {displayText}
            </textPath>
          ) : (
            displayText
          )}
        </text>
      </>
    );
    return textEl;
  }

  // Render brush stroke objects
  if (obj.type === 'path' && obj.brushType) {
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    return (
      <g transform={`rotate(${obj.rotation} ${centerX} ${centerY})`}>
        {/* Invisible thick stroke for easier clicking/dragging */}
        {obj.pathPoints && obj.pathPoints.length >= 2 && (
          <path
            d={(() => {
              const pts = obj.pathPoints!;
              let d = `M ${pts[0].x} ${pts[0].y}`;
              for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
              return d;
            })()}
            fill="none"
            stroke="transparent"
            strokeWidth={Math.max(obj.brushSize || obj.strokeWidth || 4, 12)}
            style={{ cursor }}
            onMouseDown={handleMouseDown}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {obj.brushType === 'spray' && obj.sprayDots && (
          <rect
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            fill="transparent"
            style={{ cursor }}
            onMouseDown={handleMouseDown}
          />
        )}
        {/* Visible brush stroke */}
        {renderBrushStroke(obj)}
        {/* Selection highlight */}
        {isSelected && obj.pathPoints && obj.pathPoints.length >= 2 && (
          <path
            d={(() => {
              const pts = obj.pathPoints!;
              let d = `M ${pts[0].x} ${pts[0].y}`;
              for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
              return d;
            })()}
            fill="none"
            stroke="#ccff00"
            strokeWidth={(obj.brushSize || obj.strokeWidth || 4) + 2}
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
    // Support image pattern fill, gradient fill, or solid fill
    const fillValue = obj.fillPatternImageSrc
      ? `url(#imgfill-${obj.id})`
      : gradientId ? `url(#${gradientId})` : (obj.fill || '#ffffff');
    
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

    // Compute outline stroke props for shapes
    const outlineProps = getOutlineStrokeProps(obj, isSelected);

    if (obj.shapeType === 'circle') {
      const el = (
        <>
          {obj.gradientStops && (
            <defs>
              {obj.fillType === 'radial-gradient' ? (
                <radialGradient id={gradientId!} cx={`${(obj.gradientCenterX ?? 0.5) * 100}%`} cy={`${(obj.gradientCenterY ?? 0.5) * 100}%`} r={`${(obj.gradientRadius ?? 0.5) * 100}%`}>
                  {obj.gradientStops.map((stop, i) => (
                    <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                  ))}
                </radialGradient>
              ) : (
                <linearGradient id={gradientId!} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${obj.gradientAngle || 0})`}>
                  {obj.gradientStops.map((stop, i) => (
                    <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                  ))}
                </linearGradient>
              )}
            </defs>
          )}
          <circle
            cx={obj.x + obj.width / 2}
            cy={obj.y + obj.height / 2}
            r={obj.width / 2 * obj.scaleX}
            fill={fillValue}
            opacity={obj.opacity}
            style={{ ...baseStyle, paintOrder: outlineProps.paintOrder }}
            onMouseDown={handleMouseDown}
            stroke={outlineProps.stroke || 'none'}
            strokeWidth={outlineProps.strokeWidth || 0}
          />
          {/* Selection highlight when outline stroke is active */}
          {obj.outlineStroke?.enabled && isSelected && (
            <circle
              cx={obj.x + obj.width / 2}
              cy={obj.y + obj.height / 2}
              r={obj.width / 2 * obj.scaleX + (obj.outlineStroke.width || 2) + 2}
              fill="none"
              stroke="#ccff00"
              strokeWidth={1}
              strokeDasharray="4,2"
              style={{ pointerEvents: 'none' }}
            />
          )}
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
              {obj.fillType === 'radial-gradient' ? (
                <radialGradient id={gradientId!} cx={`${(obj.gradientCenterX ?? 0.5) * 100}%`} cy={`${(obj.gradientCenterY ?? 0.5) * 100}%`} r={`${(obj.gradientRadius ?? 0.5) * 100}%`}>
                  {obj.gradientStops.map((stop, i) => (
                    <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                  ))}
                </radialGradient>
              ) : (
                <linearGradient id={gradientId!} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${obj.gradientAngle || 0})`}>
                  {obj.gradientStops.map((stop, i) => (
                    <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                  ))}
                </linearGradient>
              )}
            </defs>
          )}
          <polygon
            points={points.join(' ')}
            fill={fillValue}
            opacity={obj.opacity}
            style={{ ...baseStyle, paintOrder: outlineProps.paintOrder }}
            onMouseDown={handleMouseDown}
            stroke={outlineProps.stroke || 'none'}
            strokeWidth={outlineProps.strokeWidth || 0}
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
            {obj.fillType === 'radial-gradient' ? (
              <radialGradient id={gradientId!} cx={`${(obj.gradientCenterX ?? 0.5) * 100}%`} cy={`${(obj.gradientCenterY ?? 0.5) * 100}%`} r={`${(obj.gradientRadius ?? 0.5) * 100}%`}>
                {obj.gradientStops.map((stop, i) => (
                  <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </radialGradient>
            ) : (
              <linearGradient id={gradientId!} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${obj.gradientAngle || 0})`}>
                {obj.gradientStops.map((stop, i) => (
                  <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </linearGradient>
            )}
          </defs>
        )}
        <rect
          x={obj.x}
          y={obj.y}
          width={obj.width * obj.scaleX}
          height={obj.height * obj.scaleY}
          fill={fillValue}
          opacity={obj.opacity}
          style={{ ...baseStyle, paintOrder: outlineProps.paintOrder }}
          onMouseDown={handleMouseDown}
          stroke={outlineProps.stroke || 'none'}
          strokeWidth={outlineProps.strokeWidth || 0}
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
    const lineGradientId = obj.gradientStops ? `gradient-${obj.id}` : null;
    const strokeColor = lineGradientId ? `url(#${lineGradientId})` : (obj.stroke || '#ffffff');
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
        {/* Gradient defs for line stroke */}
        {obj.gradientStops && lineGradientId && (
          <defs>
            {obj.fillType === 'radial-gradient' ? (
              <radialGradient id={lineGradientId} cx={`${(obj.gradientCenterX ?? 0.5) * 100}%`} cy={`${(obj.gradientCenterY ?? 0.5) * 100}%`} r={`${(obj.gradientRadius ?? 0.5) * 100}%`}>
                {obj.gradientStops.map((stop, i) => (
                  <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </radialGradient>
            ) : (
              <linearGradient id={lineGradientId} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${obj.gradientAngle || 0})`}>
                {obj.gradientStops.map((stop, i) => (
                  <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </linearGradient>
            )}
          </defs>
        )}
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
    const pathGradientId = obj.gradientStops ? `gradient-${obj.id}` : null;
    const strokeColor = obj.stroke || '#ffffff';
    const strokeW = obj.strokeWidth || 3;
    const capStyle = obj.lineCapStyle || 'round';
    const fillColor = pathGradientId ? `url(#${pathGradientId})` : (obj.solidFill !== false ? (obj.fill || '#ffffff') : 'none');

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
        {/* Gradient defs for path */}
        {obj.gradientStops && pathGradientId && (
          <defs>
            {obj.fillType === 'radial-gradient' ? (
              <radialGradient id={pathGradientId} cx={`${(obj.gradientCenterX ?? 0.5) * 100}%`} cy={`${(obj.gradientCenterY ?? 0.5) * 100}%`} r={`${(obj.gradientRadius ?? 0.5) * 100}%`}>
                {obj.gradientStops.map((stop, i) => (
                  <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </radialGradient>
            ) : (
              <linearGradient id={pathGradientId} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${obj.gradientAngle || 0})`}>
                {obj.gradientStops.map((stop, i) => (
                  <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </linearGradient>
            )}
          </defs>
        )}
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
    const width = obj.width * Math.abs(obj.scaleX);
    const height = obj.height * Math.abs(obj.scaleY);
    const imgOutline = getOutlineStrokeProps(obj, false);

    // Compute flip transform
    const flipScaleX = obj.flipH ? -1 : 1;
    const flipScaleY = obj.flipV ? -1 : 1;
    const flipTransform = (obj.flipH || obj.flipV)
      ? `translate(${obj.flipH ? width : 0}, ${obj.flipV ? height : 0}) scale(${flipScaleX}, ${flipScaleY})`
      : '';

    const el = (
      <g
        transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation}, ${width/2}, ${height/2})`}
        opacity={obj.opacity}
        style={{ cursor, filter: filterStyle }}
        onMouseDown={handleMouseDown}
        clipPath={obj.clipToDeck ? `url(#deck-clip-local)` : undefined}
      >
        <g transform={flipTransform}>
          <image
            href={obj.src}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
        {/* Outline stroke border */}
        {obj.outlineStroke?.enabled && (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="none"
            stroke={imgOutline.stroke}
            strokeWidth={imgOutline.strokeWidth}
          />
        )}
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
  const [contextTargetId, setContextTargetId] = useState<string | null>(null);
  // Multi-drag: track initial positions for all selected objects
  const multiDragStartRef = useRef<Map<string, { x: number; y: number }>>(new Map());
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
    showBleedSafeZone,
    showSymmetryGuide,
    measureToolActive,
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
    isolatedGroupId,
    enterIsolationMode,
    exitIsolationMode,
  } = useDeckForgeStore();

  // Get current deck dimensions based on selected size
  const currentDeckSize = getDeckSize(deckSizeId);
  const deckWidth = currentDeckSize.canvasWidth;
  const deckHeight = currentDeckSize.canvasHeight;

  // Guide snap targets for hardware guides, safe zones, etc.
  const guideSnapTargets = useMemo(
    () => (showHardwareGuide || showBleedSafeZone) ? getGuideSnapTargets(deckSizeId) : [],
    [deckSizeId, showHardwareGuide, showBleedSafeZone]
  );

  // Snap tooltip label
  const [snapTooltip, setSnapTooltip] = useState<string | null>(null);

  // Welcome overlay state - persisted via localStorage
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('deckforge_welcome_dismissed') && objects.length === 0;
  });
  const [welcomeFading, setWelcomeFading] = useState(false);

  const dismissWelcome = useCallback(() => {
    if (!showWelcome || welcomeFading) return;
    setWelcomeFading(true);
    localStorage.setItem('deckforge_welcome_dismissed', 'true');
    setTimeout(() => {
      setShowWelcome(false);
      setWelcomeFading(false);
    }, 300);
  }, [showWelcome, welcomeFading]);

  // Auto-dismiss when first object is added
  useEffect(() => {
    if (objects.length > 0 && showWelcome) {
      dismissWelcome();
    }
  }, [objects.length, showWelcome, dismissWelcome]);

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
    // Don't interfere with pen/brush tools
    if (activeTool === 'pen' || activeTool === 'brush') {
      return;
    }
    // Dismiss welcome overlay on any canvas click
    if (showWelcome) {
      dismissWelcome();
    }
    if (e.target === e.currentTarget) {
      // Exit isolation mode if clicking on empty space
      if (isolatedGroupId) {
        exitIsolationMode();
      } else {
        selectObject(null);
      }
    }
  }, [selectObject, activeTool, isolatedGroupId, exitIsolationMode, showWelcome, dismissWelcome]);

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

  // Handle brush tool stroke completion
  const handleBrushToolComplete = useCallback((data: BrushStrokeData) => {
    const points = data.smoothedPoints;
    if (points.length < 2 && (!data.sprayDots || data.sprayDots.length === 0)) return;

    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    if (data.brushType === 'spray' && data.sprayDots && data.sprayDots.length > 0) {
      for (const dot of data.sprayDots) {
        minX = Math.min(minX, dot.x - dot.r);
        maxX = Math.max(maxX, dot.x + dot.r);
        minY = Math.min(minY, dot.y - dot.r);
        maxY = Math.max(maxY, dot.y + dot.r);
      }
    } else {
      for (const pt of points) {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
      }
    }

    const padding = data.brushSize * 2;
    const actualWidth = (maxX - minX) || data.brushSize;
    const actualHeight = (maxY - minY) || data.brushSize;

    const pathPoints = points.map((p) => ({ x: p.x, y: p.y }));

    const newObj = {
      type: 'path' as const,
      x: minX - padding,
      y: minY - padding,
      width: actualWidth + padding * 2,
      height: actualHeight + padding * 2,
      rotation: 0,
      opacity: data.opacity,
      scaleX: 1,
      scaleY: 1,
      pathPoints,
      pathClosed: false,
      stroke: data.strokeColor,
      strokeWidth: data.brushSize,
      fill: 'none',
      brushType: data.brushType,
      brushPoints: data.brushPoints,
      brushSize: data.brushSize,
      brushHardness: data.hardness,
      sprayDots: data.sprayDots,
    };

    addObject(newObj);
    selectObject(null);
  }, [addObject, selectObject]);

  // Get enabled textures
  const enabledTextures = textureOverlays.filter((t) => t.enabled);

  return (
    <ContextMenuRoot onOpenChange={(open) => { if (!open) setContextTargetId(null); }}>
    <ContextMenuTrigger asChild>
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
      onContextMenuCapture={() => setContextTargetId(null)}
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

          {/* Clip path for deck shape in local coordinates (used by clipToDeck on images) */}
          <clipPath id="deck-clip-local">
            <path d={getDeckPath(0, 0, deckWidth, deckHeight)} />
          </clipPath>

          {/* Shape mask clip paths - shapes that act as masks for images above them */}
          {visibleObjects.map((obj) => {
            if (!obj.isMask) return null;
            const w = obj.width * obj.scaleX;
            const h = obj.height * obj.scaleY;
            let clipContent: React.ReactNode = null;

            if (obj.type === 'shape') {
              if (obj.shapeType === 'circle') {
                clipContent = (
                  <ellipse
                    cx={obj.x + w / 2}
                    cy={obj.y + h / 2}
                    rx={w / 2}
                    ry={h / 2}
                    transform={obj.rotation ? `rotate(${obj.rotation}, ${obj.x + w / 2}, ${obj.y + h / 2})` : undefined}
                  />
                );
              } else if (obj.shapeType === 'star') {
                const cx = obj.x + w / 2;
                const cy = obj.y + h / 2;
                const outerR = w / 2;
                const innerR = outerR * 0.4;
                const points: string[] = [];
                for (let i = 0; i < 10; i++) {
                  const r = i % 2 === 0 ? outerR : innerR;
                  const angle = (Math.PI / 5) * i - Math.PI / 2;
                  points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
                }
                clipContent = (
                  <polygon
                    points={points.join(' ')}
                    transform={obj.rotation ? `rotate(${obj.rotation}, ${cx}, ${cy})` : undefined}
                  />
                );
              } else if (obj.shapeType === 'polygon' && obj.polygonSides) {
                const cx = obj.x + w / 2;
                const cy = obj.y + h / 2;
                const r = w / 2;
                const sides = obj.polygonSides;
                const points: string[] = [];
                for (let i = 0; i < sides; i++) {
                  const angle = (2 * Math.PI / sides) * i - Math.PI / 2;
                  points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
                }
                clipContent = (
                  <polygon
                    points={points.join(' ')}
                    transform={obj.rotation ? `rotate(${obj.rotation}, ${cx}, ${cy})` : undefined}
                  />
                );
              } else {
                // Default rect
                clipContent = (
                  <rect
                    x={obj.x}
                    y={obj.y}
                    width={w}
                    height={h}
                    transform={obj.rotation ? `rotate(${obj.rotation}, ${obj.x + w / 2}, ${obj.y + h / 2})` : undefined}
                  />
                );
              }
            }
            if (!clipContent) return null;
            return (
              <clipPath key={`mask-${obj.id}`} id={`mask-${obj.id}`}>
                {clipContent}
              </clipPath>
            );
          })}

          {/* Pattern fill definitions for shapes with fillPatternImageSrc */}
          {visibleObjects.map((obj) => {
            if (!obj.fillPatternImageSrc) return null;
            const scale = obj.fillPatternScale || 1;
            const patternSize = 50 * scale;
            return (
              <pattern
                key={`imgfill-${obj.id}`}
                id={`imgfill-${obj.id}`}
                patternUnits="userSpaceOnUse"
                width={patternSize}
                height={patternSize}
                x={obj.fillPatternOffsetX || 0}
                y={obj.fillPatternOffsetY || 0}
              >
                <image
                  href={obj.fillPatternImageSrc}
                  width={patternSize}
                  height={patternSize}
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            );
          })}

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

          {/* Duotone SVG filters for each object */}
          {objects.filter(o => o.duotone?.enabled).map(o => (
            <DuotoneFilterDef key={`duotone-${o.id}`} obj={o} />
          ))}

          {/* Background gradient (multi-stop support) */}
          {backgroundFillType === 'linear-gradient' && (
            <linearGradient
              id="deck-bg-gradient"
              x1={`${50 - Math.cos(backgroundGradient.angle * Math.PI / 180) * 50}%`}
              y1={`${50 - Math.sin(backgroundGradient.angle * Math.PI / 180) * 50}%`}
              x2={`${50 + Math.cos(backgroundGradient.angle * Math.PI / 180) * 50}%`}
              y2={`${50 + Math.sin(backgroundGradient.angle * Math.PI / 180) * 50}%`}
            >
              {(backgroundGradient.stops && backgroundGradient.stops.length > 0)
                ? backgroundGradient.stops.map((stop, i) => (
                    <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                  ))
                : <>
                    <stop offset="0%" stopColor={backgroundGradient.startColor} />
                    <stop offset="100%" stopColor={backgroundGradient.endColor} />
                  </>
              }
            </linearGradient>
          )}
          {backgroundFillType === 'radial-gradient' && (
            <radialGradient
              id="deck-bg-gradient"
              cx={`${(backgroundGradient.centerX ?? 0.5) * 100}%`}
              cy={`${(backgroundGradient.centerY ?? 0.5) * 100}%`}
              r={`${(backgroundGradient.radius ?? 0.5) * 100}%`}
            >
              {(backgroundGradient.stops && backgroundGradient.stops.length > 0)
                ? backgroundGradient.stops.map((stop, i) => (
                    <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                  ))
                : <>
                    <stop offset="0%" stopColor={backgroundGradient.startColor} />
                    <stop offset="100%" stopColor={backgroundGradient.endColor} />
                  </>
              }
            </radialGradient>
          )}
          {/* Legacy gradient support */}
          {backgroundFillType === ('gradient' as any) && backgroundGradient.direction === 'linear' && (
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
          {backgroundFillType === ('gradient' as any) && backgroundGradient.direction === 'radial' && (
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
            fill={(backgroundFillType === 'gradient' || backgroundFillType === 'linear-gradient' || backgroundFillType === 'radial-gradient') ? 'url(#deck-bg-gradient)' : backgroundColor}
            style={{ transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />

          {/* Render all objects inside the clip mask */}
          <g 
            transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
            style={{ transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {visibleObjects.map((obj) => {
              // Skip mask shapes from normal rendering - they're rendered as part of clip defs
              // but still show a dimmed version for visual reference
              const isMaskShape = obj.isMask && obj.type === 'shape';

              // In isolation mode, dim objects that are not the isolated group
              const isIsolated = isolatedGroupId !== null;
              const isIsolatedGroup = obj.id === isolatedGroupId;
              const dimForIsolation = isIsolated && !isIsolatedGroup;

              // Apply visual feedback classes
              const visualClasses = [
                obj.id === copiedObjectId ? 'copy-flash' : '',
                obj.id === pastedObjectId ? 'paste-flash' : '',
                undoRedoChangedIds.includes(obj.id) ? 'undo-highlight' : '',
              ].filter(Boolean).join(' ');

              // Determine if this image has a mask applied
              const maskClipPath = obj.maskTargetId ? `url(#mask-${obj.maskTargetId})` : undefined;

              const isPartOfMultiSelect = selectedIds.length > 1 && selectedIds.includes(obj.id);

              return (
                <g
                  key={obj.id}
                  className={visualClasses}
                  clipPath={maskClipPath}
                  style={{
                    ...(isMaskShape ? { opacity: 0.3 } : {}),
                    ...(dimForIsolation ? { opacity: 0.15, pointerEvents: 'none' as const } : {}),
                  }}
                >
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
                      // Store initial positions of all selected objects for multi-drag
                      if (selectedIds.length > 1) {
                        const startPositions = new Map<string, { x: number; y: number }>();
                        selectedIds.forEach(id => {
                          const o = objects.find(ob => ob.id === id);
                          if (o) startPositions.set(id, { x: o.x, y: o.y });
                        });
                        multiDragStartRef.current = startPositions;
                      }
                    }}
                    onDragMove={(draggedObj) => {
                      // Calculate snap position and guides (including hardware guide targets)
                      const otherObjects = objects.filter(o => o.id !== draggedObj.id && !selectedIds.includes(o.id));
                      const snap = calculateSnapPosition(draggedObj, otherObjects, 5, deckWidth, deckHeight, guideSnapTargets);
                      setSnapGuides(snap.guides);
                      setSnapTooltip(snap.snapLabel || null);

                      // Apply snapping
                      const snapDeltaX = snap.snappedX - draggedObj.x;
                      const snapDeltaY = snap.snappedY - draggedObj.y;
                      if (snapDeltaX !== 0 || snapDeltaY !== 0) {
                        updateObject(obj.id, { x: snap.snappedX, y: snap.snappedY });
                        // Also snap multi-selected objects
                        if (selectedIds.length > 1) {
                          selectedIds.forEach(id => {
                            if (id !== obj.id) {
                              const o = objects.find(ob => ob.id === id);
                              if (o) {
                                updateObject(id, { x: o.x + snapDeltaX, y: o.y + snapDeltaY });
                              }
                            }
                          });
                        }
                      }
                    }}
                    onDragEnd={() => {
                      setIsDraggingObject(false);
                      setSnapGuides([]);
                      setSnapTooltip(null);
                      multiDragStartRef.current = new Map();
                    }}
                    onContextMenu={(_e, objId) => {
                      setContextTargetId(objId);
                      selectObject(objId);
                    }}
                    isPartOfMultiSelect={isPartOfMultiSelect}
                    onMultiDrag={isPartOfMultiSelect ? (deltaX, deltaY) => {
                      // Move all other selected objects by the same delta
                      selectedIds.forEach(id => {
                        if (id !== obj.id) {
                          const startPos = multiDragStartRef.current.get(id);
                          if (startPos) {
                            updateObject(id, {
                              x: startPos.x + deltaX,
                              y: startPos.y + deltaY,
                            });
                          }
                        }
                      });
                    } : undefined}
                    onDoubleClick={obj.type === 'group' ? () => enterIsolationMode(obj.id) : undefined}
                  />
                </g>
              );
            })}

            {/* Transform handles for single selected object */}
            {selectedId && selectedIds.length === 1 && activeTool !== 'pen' && activeTool !== 'brush' && !isDraggingObject && (() => {
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
                  onEndTransform={() => {}}
                />
              );
            })()}

            {/* Multi-select bounding box */}
            {selectedIds.length > 1 && activeTool !== 'pen' && activeTool !== 'brush' && (() => {
              const selectedObjects = objects.filter(o => selectedIds.includes(o.id));
              if (selectedObjects.length < 2) return null;
              return (
                <MultiSelectBoundingBox
                  objects={selectedObjects}
                  stageScale={stageScale}
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

        {/* Bleed & Safe Zone Overlay */}
        {activeTool !== 'pen' && activeTool !== 'brush' && (
          <BleedSafeZoneOverlay
            deckX={deckX}
            deckY={deckY}
            stageScale={stageScale}
            enabled={showBleedSafeZone}
          />
        )}

        {/* Hardware Guide Overlay - Visual only, not exported */}
        {activeTool !== 'pen' && activeTool !== 'brush' && (
          <HardwareGuideOverlay
            deckX={deckX}
            deckY={deckY}
            stageScale={stageScale}
            enabled={showHardwareGuide}
          />
        )}

        {/* Symmetry Guide */}
        {activeTool !== 'pen' && activeTool !== 'brush' && (
          <SymmetryGuide
            deckX={deckX}
            deckY={deckY}
            stageScale={stageScale}
            enabled={showSymmetryGuide}
          />
        )}

        {/* Snap tooltip when snapping to guides */}
        {snapTooltip && isDraggingObject && (
          <g pointerEvents="none">
            <rect
              x={deckX + deckWidth * stageScale / 2 - 60}
              y={deckY - 20}
              width={120}
              height={16}
              fill="rgba(13, 153, 255, 0.95)"
              rx={4}
            />
            <text
              x={deckX + deckWidth * stageScale / 2}
              y={deckY - 9}
              textAnchor="middle"
              fill="white"
              fontSize={9}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              {snapTooltip}
            </text>
          </g>
        )}

        {/* Measurement Tool */}
        {activeTool !== 'pen' && activeTool !== 'brush' && (
          <MeasurementTool
            deckX={deckX}
            deckY={deckY}
            stageScale={stageScale}
            enabled={measureToolActive}
            svgRef={svgRef}
          />
        )}

        {/* Welcome overlay moved to HTML overlay below */}

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

        {/* Brush Tool */}
        <BrushTool
          isActive={activeTool === 'brush'}
          onComplete={handleBrushToolComplete}
          onCancel={() => setActiveTool(null)}
          stageRef={svgRef}
          deckX={deckX}
          deckY={deckY}
          stageScale={stageScale}
        />
      </svg>

      {/* Zoom controls */}
      <ZoomControls />

      {/* Welcome overlay */}
      {showWelcome && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          style={{
            opacity: welcomeFading ? 0 : 1,
            transition: 'opacity 300ms ease-out',
          }}
        >
          <div className="relative text-center pointer-events-auto">
            <button
              onClick={(e) => { e.stopPropagation(); dismissWelcome(); }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center text-sm transition-colors"
              aria-label="Dismiss welcome"
            >
              ×
            </button>
            <h2
              className="text-white font-bold text-base"
              style={{ fontFamily: 'Oswald, sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            >
              Welcome to DeckForge
            </h2>
            <p className="text-[#888] text-[11px] mt-1">
              Design your custom fingerboard deck
            </p>
            <div className="flex gap-2 justify-center mt-4">
              {[
                { key: 'T', label: 'Text' },
                { key: 'S', label: 'Stickers' },
                { key: 'U', label: 'Upload' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="w-9 h-9 rounded border border-white/80 bg-white/10 flex items-center justify-center text-white font-bold text-lg"
                >
                  {item.key}
                </div>
              ))}
            </div>
            <p className="text-[#666] text-[9px] font-mono mt-3">
              Press T for Text  •  S for Stickers  •  U to Upload
            </p>
            <p className="text-[#555] text-[9px] font-mono mt-1">
              Or click the tool rail on the left
            </p>
          </div>
        </div>
      )}

      {/* Isolation mode banner */}
      {isolatedGroupId && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium">
          <span>Editing Group</span>
          <span className="text-blue-200">|</span>
          <button
            onClick={exitIsolationMode}
            className="text-blue-100 hover:text-white underline"
          >
            Exit (Esc)
          </button>
        </div>
      )}

    </div>
    </ContextMenuTrigger>
    <CanvasContextMenu targetObjectId={contextTargetId} />
    </ContextMenuRoot>
  );
}
