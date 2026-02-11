import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import type { BrushType, BrushPoint } from '@/store/deckforge';
import { useColorHistory } from '@/store/colorHistory';
import { RecentColors } from './RecentColors';

// ---- Smoothing Algorithms ----

// Ramer-Douglas-Peucker point reduction
function rdpSimplify(points: BrushPoint[], epsilon: number): BrushPoint[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDist(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function perpendicularDist(p: BrushPoint, a: BrushPoint, b: BrushPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

// Catmull-Rom spline interpolation for smooth curves
function catmullRomSpline(points: BrushPoint[], segments: number = 8): BrushPoint[] {
  if (points.length < 2) return points;
  const result: BrushPoint[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let t = 0; t < segments; t++) {
      const f = t / segments;
      const f2 = f * f;
      const f3 = f2 * f;

      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * f +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * f2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * f3);
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * f +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * f2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * f3);

      // Interpolate pressure
      const pressure = p1.pressure + (p2.pressure - p1.pressure) * f;

      result.push({ x, y, pressure });
    }
  }

  // Add last point
  result.push(points[points.length - 1]);
  return result;
}

// Apply smoothing pipeline
function smoothPoints(raw: BrushPoint[], smoothingLevel: number): BrushPoint[] {
  if (raw.length < 3 || smoothingLevel === 0) return raw;
  // RDP epsilon scales with smoothing level (higher smoothing = more simplification)
  const epsilon = 0.2 + (smoothingLevel / 100) * 1.5;
  const simplified = rdpSimplify(raw, epsilon);
  if (simplified.length < 2) return raw;
  // Catmull-Rom segments scale with smoothing too
  const segments = Math.max(2, Math.round(4 + (smoothingLevel / 100) * 8));
  return catmullRomSpline(simplified, segments);
}

// ---- SVG Path Generators ----

export function buildStrokePath(points: BrushPoint[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

// Generate variable-width outline path from points with pressure
export function buildVariableWidthPath(
  points: BrushPoint[],
  baseSize: number,
  pressureSensitivity: boolean,
  nibAngle?: number // For calligraphy
): string {
  if (points.length < 2) return '';

  const leftSide: Array<{ x: number; y: number }> = [];
  const rightSide: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const pressure = pressureSensitivity ? pt.pressure : 0.5;
    let halfWidth = (baseSize * pressure) / 2;
    if (halfWidth < 0.3) halfWidth = 0.3;

    // Compute tangent direction
    let dx: number, dy: number;
    if (i === 0) {
      dx = points[1].x - pt.x;
      dy = points[1].y - pt.y;
    } else if (i === points.length - 1) {
      dx = pt.x - points[i - 1].x;
      dy = pt.y - points[i - 1].y;
    } else {
      dx = points[i + 1].x - points[i - 1].x;
      dy = points[i + 1].y - points[i - 1].y;
    }
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    if (nibAngle !== undefined) {
      // Calligraphy: angled nib, width varies based on stroke direction relative to nib
      const nibRad = (nibAngle * Math.PI) / 180;
      const nibDx = Math.cos(nibRad);
      const nibDy = Math.sin(nibRad);
      // Cross product gives sine of angle between stroke direction and nib
      const cross = Math.abs(dx * nibDy - dy * nibDx);
      halfWidth *= 0.3 + cross * 0.7; // Min 30% width, max 100%
    }

    // Normal perpendicular to tangent
    const nx = -dy;
    const ny = dx;

    leftSide.push({ x: pt.x + nx * halfWidth, y: pt.y + ny * halfWidth });
    rightSide.push({ x: pt.x - nx * halfWidth, y: pt.y - ny * halfWidth });
  }

  // Build closed polygon: forward along left side, backward along right side
  let d = `M ${leftSide[0].x} ${leftSide[0].y}`;
  for (let i = 1; i < leftSide.length; i++) {
    d += ` L ${leftSide[i].x} ${leftSide[i].y}`;
  }
  // Rounded end cap
  const lastLeft = leftSide[leftSide.length - 1];
  const lastRight = rightSide[rightSide.length - 1];
  const midEndX = (lastLeft.x + lastRight.x) / 2;
  const midEndY = (lastLeft.y + lastRight.y) / 2;
  d += ` Q ${midEndX + (lastLeft.x - midEndX) * 0.5} ${midEndY + (lastLeft.y - midEndY) * 0.5} ${lastRight.x} ${lastRight.y}`;

  for (let i = rightSide.length - 2; i >= 0; i--) {
    d += ` L ${rightSide[i].x} ${rightSide[i].y}`;
  }
  // Rounded start cap
  const firstLeft = leftSide[0];
  const firstRight = rightSide[0];
  const midStartX = (firstLeft.x + firstRight.x) / 2;
  const midStartY = (firstLeft.y + firstRight.y) / 2;
  d += ` Q ${midStartX + (firstRight.x - midStartX) * 0.5} ${midStartY + (firstRight.y - midStartY) * 0.5} ${firstLeft.x} ${firstLeft.y}`;

  d += ' Z';
  return d;
}

// Generate spray paint dots around points
function generateSprayDots(
  points: BrushPoint[],
  brushSize: number
): Array<{ x: number; y: number; r: number }> {
  const dots: Array<{ x: number; y: number; r: number }> = [];
  const radius = brushSize / 2;

  // Sample every few points to avoid too many dots
  const step = Math.max(1, Math.floor(points.length / 100));
  for (let i = 0; i < points.length; i += step) {
    const pt = points[i];
    const density = Math.round(3 + pt.pressure * 8);
    for (let j = 0; j < density; j++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const dotR = 0.3 + Math.random() * 1.2;
      dots.push({
        x: pt.x + Math.cos(angle) * dist,
        y: pt.y + Math.sin(angle) * dist,
        r: dotR,
      });
    }
  }
  return dots;
}

// ---- Types ----

export interface BrushStrokeData {
  brushType: BrushType;
  brushPoints: BrushPoint[];
  smoothedPoints: BrushPoint[];
  strokeColor: string;
  brushSize: number;
  opacity: number;
  hardness: number;
  pressureSensitivity: boolean;
  smoothing: number;
  sprayDots?: Array<{ x: number; y: number; r: number }>;
}

interface BrushToolProps {
  isActive: boolean;
  onComplete: (data: BrushStrokeData) => void;
  onCancel: () => void;
  stageRef: React.RefObject<SVGSVGElement>;
  deckX: number;
  deckY: number;
  stageScale: number;
}

// ---- Component ----

export function BrushTool({
  isActive,
  onComplete,
  onCancel,
  stageRef,
  deckX,
  deckY,
  stageScale,
}: BrushToolProps) {
  const [brushType, setBrushType] = useState<BrushType>('pencil');
  const [brushSize, setBrushSize] = useState(4);
  const [brushOpacity, setBrushOpacity] = useState(1.0);
  const [brushHardness, setBrushHardness] = useState(100);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const { addColor } = useColorHistory();
  const [pressureSensitivity, setPressureSensitivity] = useState(false);

  const handleBrushColorChange = (color: string) => {
    setBrushColor(color);
    addColor(color);
  };
  const [smoothing, setSmoothing] = useState(50);

  const [isDrawing, setIsDrawing] = useState(false);
  const pointsRef = useRef<BrushPoint[]>([]);
  const [previewPoints, setPreviewPoints] = useState<BrushPoint[]>([]);
  const sprayDotsRef = useRef<Array<{ x: number; y: number; r: number }>>([]);
  const [previewSprayDots, setPreviewSprayDots] = useState<Array<{ x: number; y: number; r: number }>>([]);

  useEffect(() => {
    if (!isActive) {
      pointsRef.current = [];
      sprayDotsRef.current = [];
      setPreviewPoints([]);
      setPreviewSprayDots([]);
      setIsDrawing(false);
    }
  }, [isActive]);

  // ESC to cancel
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onCancel]);

  const getPoint = useCallback(
    (e: React.PointerEvent): BrushPoint | null => {
      if (!stageRef.current) return null;
      const rect = stageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - deckX) / stageScale;
      const y = (e.clientY - rect.top - deckY) / stageScale;
      const pressure = e.pressure > 0 ? e.pressure : 0.5;
      return { x, y, pressure };
    },
    [stageRef, deckX, deckY, stageScale]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (!isActive) return;
      const pt = getPoint(e);
      if (!pt) return;

      setIsDrawing(true);
      pointsRef.current = [pt];
      sprayDotsRef.current = [];

      if (brushType === 'spray') {
        const dots = generateSprayDots([pt], brushSize);
        sprayDotsRef.current = dots;
        setPreviewSprayDots([...dots]);
      }

      setPreviewPoints([pt]);

      // Capture pointer for smooth drawing outside element
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [isActive, getPoint, brushType, brushSize]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive || !isDrawing) return;
      const pt = getPoint(e);
      if (!pt) return;

      pointsRef.current.push(pt);

      if (brushType === 'spray') {
        const newDots = generateSprayDots([pt], brushSize);
        sprayDotsRef.current.push(...newDots);
        setPreviewSprayDots([...sprayDotsRef.current]);
      }

      // Update preview at a reasonable rate
      setPreviewPoints([...pointsRef.current]);
    },
    [isActive, isDrawing, getPoint, brushType, brushSize]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;
      setIsDrawing(false);

      const raw = pointsRef.current;
      if (raw.length < 2) {
        pointsRef.current = [];
        setPreviewPoints([]);
        setPreviewSprayDots([]);
        return;
      }

      const smoothed = smoothPoints(raw, smoothing);

      const data: BrushStrokeData = {
        brushType,
        brushPoints: raw,
        smoothedPoints: smoothed,
        strokeColor: brushColor,
        brushSize,
        opacity: brushOpacity,
        hardness: brushHardness,
        pressureSensitivity,
        smoothing,
        sprayDots: brushType === 'spray' ? sprayDotsRef.current : undefined,
      };

      onComplete(data);

      pointsRef.current = [];
      sprayDotsRef.current = [];
      setPreviewPoints([]);
      setPreviewSprayDots([]);
    },
    [isDrawing, brushType, brushColor, brushSize, brushOpacity, brushHardness, pressureSensitivity, smoothing, onComplete]
  );

  if (!isActive) return null;

  // ---- Preview rendering ----
  const renderPreview = () => {
    if (previewPoints.length < 2 && previewSprayDots.length === 0) return null;

    const pts = previewPoints;

    if (brushType === 'spray') {
      return (
        <g style={{ pointerEvents: 'none' }}>
          {previewSprayDots.map((dot, i) => (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              fill={brushColor}
              opacity={brushOpacity * 0.8}
            />
          ))}
        </g>
      );
    }

    if (brushType === 'calligraphy' && pts.length >= 2) {
      const outlinePath = buildVariableWidthPath(pts, brushSize, pressureSensitivity, 45);
      return (
        <path
          d={outlinePath}
          fill={brushColor}
          opacity={brushOpacity}
          style={{ pointerEvents: 'none' }}
        />
      );
    }

    if (brushType === 'marker' && pts.length >= 2) {
      const pathD = buildStrokePath(pts);
      return (
        <path
          d={pathD}
          fill="none"
          stroke={brushColor}
          strokeWidth={brushSize}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={brushOpacity * 0.6}
          style={{ pointerEvents: 'none' }}
        />
      );
    }

    // Pencil: thin crisp stroke
    if (pts.length >= 2) {
      const usePressure = pressureSensitivity && pts.some((p) => p.pressure !== 0.5);
      if (usePressure) {
        const outlinePath = buildVariableWidthPath(pts, brushSize, true);
        return (
          <path
            d={outlinePath}
            fill={brushColor}
            opacity={brushOpacity}
            style={{ pointerEvents: 'none' }}
          />
        );
      }
      const pathD = buildStrokePath(pts);
      return (
        <path
          d={pathD}
          fill="none"
          stroke={brushColor}
          strokeWidth={brushSize}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={brushOpacity}
          style={{ pointerEvents: 'none' }}
        />
      );
    }

    return null;
  };

  const viewportWidth = stageRef.current?.clientWidth || 3000;
  const viewportHeight = stageRef.current?.clientHeight || 3000;

  const brushTypes: Array<{ id: BrushType; label: string; desc: string }> = [
    { id: 'pencil', label: 'Pencil', desc: 'Hard, natural pencil' },
    { id: 'marker', label: 'Marker', desc: 'Thick, semi-transparent' },
    { id: 'spray', label: 'Spray', desc: 'Scattered dot pattern' },
    { id: 'calligraphy', label: 'Calligraphy', desc: 'Angled nib, varies width' },
  ];

  return (
    <g style={{ pointerEvents: 'all' }}>
      {/* Capture overlay */}
      <rect
        x={0}
        y={0}
        width={viewportWidth}
        height={viewportHeight}
        fill="rgba(0,0,0,0.01)"
        style={{ cursor: 'crosshair', pointerEvents: 'all', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Live preview */}
      <g
        transform={`translate(${deckX}, ${deckY}) scale(${stageScale})`}
        style={{ pointerEvents: 'none' }}
      >
        {renderPreview()}
      </g>

      {/* Floating settings panel */}
      <foreignObject x={20} y={100} width={250} height={560}>
        <div
          className="bg-card border border-border rounded-lg p-3 shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2.5">
            {/* Brush Type Selector */}
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Brush Type</span>
              <div className="grid grid-cols-2 gap-1">
                {brushTypes.map((bt) => (
                  <button
                    key={bt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setBrushType(bt.id);
                    }}
                    className={`px-2 py-1.5 text-xs rounded border transition-all ${
                      brushType === bt.id
                        ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                        : 'bg-secondary text-muted-foreground border-border hover:border-accent/50'
                    }`}
                    title={bt.desc}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brush Size */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Size</span>
                <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">
                  {brushSize}px
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                style={{ accentColor: brushColor }}
              />
            </div>

            {/* Opacity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Opacity</span>
                <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">
                  {Math.round(brushOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(brushOpacity * 100)}
                onChange={(e) => setBrushOpacity(Number(e.target.value) / 100)}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                style={{ accentColor: brushColor }}
              />
            </div>

            {/* Hardness */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Hardness</span>
                <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">
                  {brushHardness}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={brushHardness}
                onChange={(e) => setBrushHardness(Number(e.target.value))}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                style={{ accentColor: brushColor }}
              />
            </div>

            {/* Smoothing */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Smoothing</span>
                <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">
                  {smoothing}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={smoothing}
                onChange={(e) => setSmoothing(Number(e.target.value))}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                style={{ accentColor: brushColor }}
              />
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Color</span>
              <RecentColors onSelect={handleBrushColorChange} currentColor={brushColor} />
              <div className="grid grid-cols-6 gap-1.5">
                {['#000000', '#ffffff', '#ccff00', '#ff6600', '#00ffff', '#ff00ff'].map(
                  (color) => (
                    <button
                      key={color}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBrushColorChange(color);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                        brushColor === color
                          ? 'border-accent ring-2 ring-accent/30'
                          : 'border-border/50'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  )
                )}
              </div>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => handleBrushColorChange(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full h-8 border border-border rounded cursor-pointer"
                title="Custom color"
              />
            </div>

            {/* Pressure Sensitivity Toggle */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">Pressure Sensitivity</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPressureSensitivity(!pressureSensitivity);
                }}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  pressureSensitivity ? 'bg-accent' : 'bg-secondary border border-border'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${
                    pressureSensitivity ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Cancel */}
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {isDrawing ? 'Drawing...' : 'Click and drag to paint'}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
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

// ---- Exported rendering helpers for WorkbenchStage ----

export function renderBrushStroke(
  obj: {
    brushType?: BrushType;
    brushPoints?: BrushPoint[];
    brushSize?: number;
    brushHardness?: number;
    stroke?: string;
    opacity?: number;
    sprayDots?: Array<{ x: number; y: number; r: number }>;
    pathPoints?: Array<{ x: number; y: number }>;
  },
  pressureSensitivity: boolean = true
): React.ReactNode {
  const brushType = obj.brushType || 'pencil';
  const color = obj.stroke || '#ffffff';
  const opacity = obj.opacity ?? 1;
  const size = obj.brushSize || 4;
  const hardness = obj.brushHardness ?? 100;
  const points: BrushPoint[] = obj.brushPoints || [];

  // SVG filter for soft edges (low hardness)
  const softFilter = hardness < 80 ? `blur(${((100 - hardness) / 100) * 1.5}px)` : undefined;

  if (brushType === 'spray' && obj.sprayDots && obj.sprayDots.length > 0) {
    return (
      <g opacity={opacity} style={softFilter ? { filter: softFilter } : undefined}>
        {obj.sprayDots.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={dot.r} fill={color} />
        ))}
      </g>
    );
  }

  if (brushType === 'calligraphy' && points.length >= 2) {
    const outlinePath = buildVariableWidthPath(points, size, pressureSensitivity, 45);
    return (
      <path
        d={outlinePath}
        fill={color}
        opacity={opacity}
        style={softFilter ? { filter: softFilter, pointerEvents: 'none' } : { pointerEvents: 'none' }}
      />
    );
  }

  if (brushType === 'marker') {
    // Use pathPoints (smoothed) if available, else brushPoints
    const pts = obj.pathPoints?.length ? obj.pathPoints.map((p) => ({ ...p, pressure: 0.5 })) : points;
    if (pts.length < 2) return null;
    const pathD = buildStrokePath(pts);
    return (
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={size}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 0.6}
        style={softFilter ? { filter: softFilter, pointerEvents: 'none' } : { pointerEvents: 'none' }}
      />
    );
  }

  // Pencil (default) - check for pressure sensitivity
  const hasPressure = pressureSensitivity && points.length >= 2 && points.some((p) => p.pressure !== 0.5);
  if (hasPressure && points.length >= 2) {
    const outlinePath = buildVariableWidthPath(points, size, true);
    return (
      <path
        d={outlinePath}
        fill={color}
        opacity={opacity}
        style={softFilter ? { filter: softFilter, pointerEvents: 'none' } : { pointerEvents: 'none' }}
      />
    );
  }

  // Simple stroke path
  const pts = obj.pathPoints?.length ? obj.pathPoints.map((p) => ({ ...p, pressure: 0.5 })) : points;
  if (pts.length < 2) return null;
  const pathD = buildStrokePath(pts);
  return (
    <path
      d={pathD}
      fill="none"
      stroke={color}
      strokeWidth={size}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      style={softFilter ? { filter: softFilter, pointerEvents: 'none' } : { pointerEvents: 'none' }}
    />
  );
}
