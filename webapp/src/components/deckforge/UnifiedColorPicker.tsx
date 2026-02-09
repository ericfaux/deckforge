import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Pipette, Plus, Trash2, RotateCw, BookmarkPlus, Bookmark, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useDeckForgeStore } from '@/store/deckforge';
import { useColorHistory } from '@/store/colorHistory';
import { RecentColors } from './RecentColors';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────

export type FillMode = 'solid' | 'linear-gradient' | 'radial-gradient';

export interface GradientStop {
  offset: number;
  color: string;
}

export interface GradientConfig {
  stops: GradientStop[];
  angle: number;
  centerX: number;
  centerY: number;
  radius: number;
}

export interface UnifiedColorPickerProps {
  /** Current solid color value */
  color: string;
  /** Current fill mode */
  fillMode?: FillMode;
  /** Current gradient configuration */
  gradientConfig?: GradientConfig;
  /** Called when solid color changes */
  onColorChange: (color: string) => void;
  /** Called when fill mode changes */
  onFillModeChange?: (mode: FillMode) => void;
  /** Called when gradient config changes */
  onGradientChange?: (config: GradientConfig) => void;
  /** Label above the picker */
  label?: string;
  /** Whether to show gradient tabs (default true) */
  showGradients?: boolean;
  /** Whether to show eyedropper (default true) */
  showEyedropper?: boolean;
  /** Compact mode - just a swatch that opens popover */
  compact?: boolean;
}

// ─── Presets ─────────────────────────────────────────────────────

const LINEAR_PRESETS: { name: string; stops: GradientStop[]; angle: number }[] = [
  { name: 'Sunset', stops: [{ offset: 0, color: '#ff6b6b' }, { offset: 0.5, color: '#feca57' }, { offset: 1, color: '#ee5a6f' }], angle: 135 },
  { name: 'Ocean', stops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }], angle: 135 },
  { name: 'Neon', stops: [{ offset: 0, color: '#ccff00' }, { offset: 1, color: '#00ffff' }], angle: 135 },
  { name: 'Fire', stops: [{ offset: 0, color: '#f12711' }, { offset: 1, color: '#f5af19' }], angle: 135 },
  { name: 'Midnight', stops: [{ offset: 0, color: '#0f0c29' }, { offset: 0.5, color: '#302b63' }, { offset: 1, color: '#24243e' }], angle: 180 },
  { name: 'Forest', stops: [{ offset: 0, color: '#134e5e' }, { offset: 1, color: '#71b280' }], angle: 135 },
  { name: 'Candy', stops: [{ offset: 0, color: '#fc5c7d' }, { offset: 1, color: '#6a82fb' }], angle: 135 },
  { name: 'Chrome', stops: [{ offset: 0, color: '#bdc3c7' }, { offset: 0.5, color: '#2c3e50' }, { offset: 1, color: '#bdc3c7' }], angle: 135 },
  { name: 'Peach', stops: [{ offset: 0, color: '#ed6ea0' }, { offset: 1, color: '#ec8c69' }], angle: 135 },
  { name: 'Aurora', stops: [{ offset: 0, color: '#43e97b' }, { offset: 1, color: '#38f9d7' }], angle: 135 },
  { name: 'Berry', stops: [{ offset: 0, color: '#8e2de2' }, { offset: 1, color: '#4a00e0' }], angle: 135 },
  { name: 'Gold', stops: [{ offset: 0, color: '#f7971e' }, { offset: 1, color: '#ffd200' }], angle: 135 },
  { name: 'Pastel', stops: [{ offset: 0, color: '#fbc2eb' }, { offset: 0.5, color: '#a6c1ee' }, { offset: 1, color: '#fad0c4' }], angle: 135 },
];

const RADIAL_PRESETS: { name: string; stops: GradientStop[] }[] = [
  { name: 'Spotlight', stops: [{ offset: 0, color: '#ffffff' }, { offset: 1, color: '#000000' }] },
  { name: 'Glow', stops: [{ offset: 0, color: '#ccff00' }, { offset: 0.6, color: '#00ff88' }, { offset: 1, color: '#000000' }] },
  { name: 'Halo', stops: [{ offset: 0, color: '#ffd200' }, { offset: 0.4, color: '#ff6600' }, { offset: 1, color: '#330000' }] },
  { name: 'Orb', stops: [{ offset: 0, color: '#00d2ff' }, { offset: 1, color: '#3a47d5' }] },
  { name: 'Vortex', stops: [{ offset: 0, color: '#fc5c7d' }, { offset: 0.5, color: '#6a82fb' }, { offset: 1, color: '#000033' }] },
  { name: 'Eclipse', stops: [{ offset: 0, color: '#1a1a2e' }, { offset: 0.5, color: '#e94560' }, { offset: 1, color: '#0f3460' }] },
  { name: 'Pastel', stops: [{ offset: 0, color: '#ffecd2' }, { offset: 0.5, color: '#fcb69f' }, { offset: 1, color: '#fbc2eb' }] },
];

// ─── Color utilities ─────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 50];
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

function buildGradientCSS(stops: GradientStop[], angle: number): string {
  const s = stops.map(st => `${st.color} ${(st.offset * 100).toFixed(0)}%`).join(', ');
  return `linear-gradient(${angle}deg, ${s})`;
}

function buildRadialGradientCSS(stops: GradientStop[], cx = 50, cy = 50): string {
  const s = stops.map(st => `${st.color} ${(st.offset * 100).toFixed(0)}%`).join(', ');
  return `radial-gradient(circle at ${cx}% ${cy}%, ${s})`;
}

// ─── LocalStorage for saved palette / recent colors ──────────────

const LS_SAVED = 'deckforge-saved-palette';

function getSavedPalette(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_SAVED) || '[]');
  } catch { return []; }
}

function savePalette(colors: string[]) {
  localStorage.setItem(LS_SAVED, JSON.stringify(colors.slice(0, 24)));
}

// ─── Spectrum Picker (HSL-based) ─────────────────────────────────

function SpectrumPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLCanvasElement>(null);
  const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl(color));
  const isDragging = useRef(false);
  const isHueDragging = useRef(false);

  // Sync external color changes
  useEffect(() => {
    const newHsl = hexToHsl(color);
    // Only update if significantly different (avoid feedback loops)
    if (Math.abs(newHsl[0] - hsl[0]) > 2 || Math.abs(newHsl[1] - hsl[1]) > 2 || Math.abs(newHsl[2] - hsl[2]) > 2) {
      setHsl(newHsl);
    }
  }, [color]);

  // Draw spectrum canvas (saturation x lightness for current hue)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // White -> hue gradient (horizontal)
    const gradH = ctx.createLinearGradient(0, 0, w, 0);
    gradH.addColorStop(0, '#ffffff');
    gradH.addColorStop(1, hslToHex(hsl[0], 100, 50));
    ctx.fillStyle = gradH;
    ctx.fillRect(0, 0, w, h);

    // Transparent -> black gradient (vertical)
    const gradV = ctx.createLinearGradient(0, 0, 0, h);
    gradV.addColorStop(0, 'rgba(0,0,0,0)');
    gradV.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = gradV;
    ctx.fillRect(0, 0, w, h);
  }, [hsl[0]]);

  // Draw hue bar
  useEffect(() => {
    const canvas = hueRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 360; i += 30) {
      grad.addColorStop(i / 360, hslToHex(i, 100, 50));
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, []);

  const handleSpectrumInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // Convert x,y to saturation,lightness
    const s = Math.round(x * 100);
    const l = Math.round((1 - y) * (100 - s / 2));

    const newHsl: [number, number, number] = [hsl[0], s, l];
    setHsl(newHsl);
    onChange(hslToHex(newHsl[0], newHsl[1], newHsl[2]));
  }, [hsl, onChange]);

  const handleHueInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = hueRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const h = Math.round(x * 360);
    const newHsl: [number, number, number] = [h, hsl[1], hsl[2]];
    setHsl(newHsl);
    onChange(hslToHex(newHsl[0], newHsl[1], newHsl[2]));
  }, [hsl, onChange]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) handleSpectrumInteraction(e);
      if (isHueDragging.current) handleHueInteraction(e);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      isHueDragging.current = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleSpectrumInteraction, handleHueInteraction]);

  // Compute cursor position on spectrum
  const specX = hsl[1] / 100;
  const specY = 1 - (hsl[2] / (100 - hsl[1] / 2) || 0);

  return (
    <div className="space-y-2">
      {/* Spectrum */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={200}
          height={120}
          className="w-full h-28 rounded border border-border cursor-crosshair"
          onMouseDown={(e) => { isDragging.current = true; handleSpectrumInteraction(e); }}
        />
        {/* Cursor */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white pointer-events-none"
          style={{
            left: `${specX * 100}%`,
            top: `${Math.max(0, Math.min(1, specY)) * 100}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 2px rgba(0,0,0,0.5)',
            backgroundColor: color,
          }}
        />
      </div>
      {/* Hue bar */}
      <div className="relative">
        <canvas
          ref={hueRef}
          width={200}
          height={14}
          className="w-full h-3 rounded-sm border border-border cursor-pointer"
          onMouseDown={(e) => { isHueDragging.current = true; handleHueInteraction(e); }}
        />
        <div
          className="absolute top-0 w-1 h-full bg-white border border-black/30 pointer-events-none rounded-sm"
          style={{ left: `${(hsl[0] / 360) * 100}%`, transform: 'translateX(-50%)' }}
        />
      </div>
    </div>
  );
}

// ─── Gradient Stop Editor ────────────────────────────────────────

function GradientStopEditor({
  stops,
  angle,
  isRadial,
  onChange,
  onAngleChange,
}: {
  stops: GradientStop[];
  angle: number;
  isRadial: boolean;
  onChange: (stops: GradientStop[]) => void;
  onAngleChange: (angle: number) => void;
}) {
  const [selectedStopIdx, setSelectedStopIdx] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const draggingIdx = useRef<number | null>(null);

  const gradientCSS = isRadial
    ? buildRadialGradientCSS(stops)
    : buildGradientCSS(stops, 90); // Always show bar left-to-right

  const handleBarClick = (e: React.MouseEvent) => {
    if (draggingIdx.current !== null) return;
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    const offset = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    // Interpolate color at this offset
    let newColor = '#888888';
    for (let i = 0; i < stops.length - 1; i++) {
      if (offset >= stops[i].offset && offset <= stops[i + 1].offset) {
        const t = (offset - stops[i].offset) / (stops[i + 1].offset - stops[i].offset);
        const [r1, g1, b1] = hexToRgb(stops[i].color);
        const [r2, g2, b2] = hexToRgb(stops[i + 1].color);
        newColor = rgbToHex(
          r1 + (r2 - r1) * t,
          g1 + (g2 - g1) * t,
          b1 + (b2 - b1) * t,
        );
        break;
      }
    }
    const newStops = [...stops, { offset, color: newColor }].sort((a, b) => a.offset - b.offset);
    onChange(newStops);
    setSelectedStopIdx(newStops.findIndex(s => s.offset === offset));
  };

  const handleStopDrag = useCallback((e: MouseEvent) => {
    if (draggingIdx.current === null) return;
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    const offset = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newStops = [...stops];
    newStops[draggingIdx.current] = { ...newStops[draggingIdx.current], offset };
    onChange(newStops.sort((a, b) => a.offset - b.offset));
  }, [stops, onChange]);

  const handleStopDragEnd = useCallback(() => {
    draggingIdx.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleStopDrag);
    window.addEventListener('mouseup', handleStopDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleStopDrag);
      window.removeEventListener('mouseup', handleStopDragEnd);
    };
  }, [handleStopDrag, handleStopDragEnd]);

  const updateStopColor = (idx: number, color: string) => {
    const newStops = [...stops];
    newStops[idx] = { ...newStops[idx], color };
    onChange(newStops);
  };

  const removeStop = (idx: number) => {
    if (stops.length <= 2) return;
    const newStops = stops.filter((_, i) => i !== idx);
    onChange(newStops);
    if (selectedStopIdx >= newStops.length) setSelectedStopIdx(newStops.length - 1);
  };

  return (
    <div className="space-y-3">
      {/* Gradient preview bar with stops */}
      <div className="relative pt-3 pb-1">
        <div
          ref={barRef}
          className="h-6 rounded border border-border cursor-pointer"
          style={{ background: gradientCSS }}
          onClick={handleBarClick}
        />
        {/* Stop handles */}
        {stops.map((stop, idx) => (
          <div
            key={idx}
            className={cn(
              "absolute top-0 w-4 h-4 rounded-full border-2 cursor-grab active:cursor-grabbing",
              selectedStopIdx === idx ? "border-primary ring-2 ring-primary/30 z-10" : "border-white z-0"
            )}
            style={{
              left: `${stop.offset * 100}%`,
              transform: 'translateX(-50%)',
              backgroundColor: stop.color,
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              draggingIdx.current = idx;
              setSelectedStopIdx(idx);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStopIdx(idx);
            }}
          />
        ))}
      </div>

      {/* Selected stop controls */}
      {stops[selectedStopIdx] && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={stops[selectedStopIdx].color}
            onChange={(e) => updateStopColor(selectedStopIdx, e.target.value)}
            className="w-8 h-8 border border-border cursor-pointer bg-transparent shrink-0"
          />
          <Input
            type="text"
            value={stops[selectedStopIdx].color}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '') {
                updateStopColor(selectedStopIdx, val);
              }
            }}
            className="h-7 text-[10px] font-mono bg-secondary border-border flex-1"
          />
          <span className="text-[9px] text-muted-foreground w-8 text-right">
            {Math.round(stops[selectedStopIdx].offset * 100)}%
          </span>
          {stops.length > 2 && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeStop(selectedStopIdx)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* Angle control (linear only) */}
      {!isRadial && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">
              Angle: {angle}°
            </Label>
            {/* Quick angle buttons */}
            <div className="flex gap-0.5">
              {[0, 45, 90, 135, 180].map(a => (
                <button
                  key={a}
                  onClick={() => onAngleChange(a)}
                  className={cn(
                    "px-1.5 py-0.5 text-[8px] border transition-colors",
                    angle === a ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"
                  )}
                >
                  {a}°
                </button>
              ))}
            </div>
          </div>
          <Slider
            value={[angle]}
            onValueChange={([val]) => onAngleChange(val)}
            min={0}
            max={360}
            step={1}
          />
        </div>
      )}

      {/* Add stop button */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[9px] gap-1 flex-1"
          onClick={() => {
            const newOffset = 0.5;
            const newStops = [...stops, { offset: newOffset, color: '#888888' }].sort((a, b) => a.offset - b.offset);
            onChange(newStops);
          }}
        >
          <Plus className="w-3 h-3" /> Add Stop
        </Button>
      </div>
    </div>
  );
}

// ─── Angle Wheel ─────────────────────────────────────────────────

function AngleWheel({ angle, onChange }: { angle: number; onChange: (a: number) => void }) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
    const el = wheelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let a = Math.round(Math.atan2(dy, dx) * (180 / Math.PI) + 90);
    if (a < 0) a += 360;
    onChange(a);
  }, [onChange]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isDragging.current) handleInteraction(e);
    };
    const handleUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [handleInteraction]);

  const rad = (angle - 90) * (Math.PI / 180);
  const r = 14;
  const dotX = 16 + Math.cos(rad) * r;
  const dotY = 16 + Math.sin(rad) * r;

  return (
    <div
      ref={wheelRef}
      className="w-8 h-8 rounded-full border-2 border-border bg-secondary relative cursor-pointer shrink-0"
      onMouseDown={(e) => { isDragging.current = true; handleInteraction(e); }}
    >
      <div
        className="absolute w-2 h-2 rounded-full bg-primary"
        style={{ left: dotX - 4, top: dotY - 4 }}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function UnifiedColorPicker({
  color,
  fillMode = 'solid',
  gradientConfig,
  onColorChange,
  onFillModeChange,
  onGradientChange,
  label,
  showGradients = true,
  showEyedropper = true,
  compact = false,
}: UnifiedColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FillMode>(fillMode);
  const { addColor } = useColorHistory();
  const [savedPalette, setSavedPalette] = useState<string[]>(() => getSavedPalette());
  const [showPalette, setShowPalette] = useState(false);
  const { objects } = useDeckForgeStore();
  const [isEyedropperOpen, setIsEyedropperOpen] = useState(false);

  // Default gradient config
  const gc = gradientConfig || {
    stops: [{ offset: 0, color: '#ff0000' }, { offset: 1, color: '#0000ff' }],
    angle: 135,
    centerX: 0.5,
    centerY: 0.5,
    radius: 0.5,
  };

  // Sync tab with external fillMode
  useEffect(() => {
    setActiveTab(fillMode);
  }, [fillMode]);

  const handleColorChange = useCallback((c: string) => {
    onColorChange(c);
    addColor(c);
  }, [onColorChange, addColor]);

  const handleTabChange = useCallback((tab: FillMode) => {
    setActiveTab(tab);
    onFillModeChange?.(tab);
  }, [onFillModeChange]);

  const handleGradientChange = useCallback((updates: Partial<GradientConfig>) => {
    const newConfig = { ...gc, ...updates };
    onGradientChange?.(newConfig);
    // Also set fill color to first stop as fallback
    if (updates.stops && updates.stops.length > 0) {
      onColorChange(updates.stops[0].color);
    }
  }, [gc, onGradientChange, onColorChange]);

  const handleReverse = useCallback(() => {
    const reversed = [...gc.stops].reverse().map((s, i, arr) => ({
      ...s,
      offset: 1 - s.offset,
    })).sort((a, b) => a.offset - b.offset);
    handleGradientChange({ stops: reversed });
  }, [gc.stops, handleGradientChange]);

  const handleSaveToPalette = useCallback(() => {
    if (savedPalette.includes(color)) {
      toast('Color already in palette');
      return;
    }
    const updated = [...savedPalette, color].slice(0, 24);
    setSavedPalette(updated);
    savePalette(updated);
    toast.success('Saved to palette');
  }, [color, savedPalette]);

  const handleRemoveFromPalette = useCallback((c: string) => {
    const updated = savedPalette.filter(p => p !== c);
    setSavedPalette(updated);
    savePalette(updated);
  }, [savedPalette]);

  // Canvas colors for eyedropper
  const canvasColors = useMemo(() => Array.from(
    new Set(
      objects
        .flatMap((obj) => [obj.fill, obj.stroke, obj.colorize])
        .filter((c): c is string => !!c && c !== 'none')
    )
  ).slice(0, 12), [objects]);

  // Gradient preview CSS
  const gradientPreviewCSS = activeTab === 'linear-gradient'
    ? buildGradientCSS(gc.stops, gc.angle)
    : activeTab === 'radial-gradient'
      ? buildRadialGradientCSS(gc.stops, (gc.centerX ?? 0.5) * 100, (gc.centerY ?? 0.5) * 100)
      : undefined;

  // The main preview swatch
  const swatchStyle = activeTab === 'solid'
    ? { backgroundColor: color }
    : { background: gradientPreviewCSS };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium block">
          {label}
        </label>
      )}

      {/* ─── Fill mode toggle: [Solid] [Gradient] ─── always visible ─── */}
      {showGradients && (
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => handleTabChange('solid')}
            className={cn(
              "py-1.5 px-2 text-[10px] uppercase tracking-wider font-medium rounded-sm border transition-colors",
              activeTab === 'solid'
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary/50 bg-secondary text-muted-foreground"
            )}
          >
            Solid
          </button>
          <button
            onClick={() => handleTabChange(activeTab === 'radial-gradient' ? 'radial-gradient' : 'linear-gradient')}
            className={cn(
              "py-1.5 px-2 text-[10px] uppercase tracking-wider font-medium rounded-sm border transition-colors",
              activeTab !== 'solid'
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary/50 bg-secondary text-muted-foreground"
            )}
          >
            Gradient
          </button>
        </div>
      )}

      {/* ═══════════ SOLID MODE ═══════════ */}
      {activeTab === 'solid' && (
        <>
          {/* Preview swatch + quick controls */}
          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 rounded border-2 border-border shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0"
              style={{ backgroundColor: color }}
              onClick={() => setIsOpen(!isOpen)}
              title={color}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1 h-10 border border-border rounded cursor-pointer min-w-0"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '') {
                  handleColorChange(val);
                }
              }}
              placeholder="#000000"
              maxLength={7}
              className="w-20 h-10 px-2 text-xs font-mono border border-border rounded bg-background"
            />
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 h-10 w-10 p-0"
              onClick={() => setIsOpen(!isOpen)}
              title="Open color picker"
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
            </Button>
          </div>

          {/* Expanded solid picker */}
          {isOpen && (
            <div className="border border-accent/30 bg-accent/5 rounded p-3 space-y-3">
              {/* HSL Spectrum */}
              <SpectrumPicker color={color} onChange={handleColorChange} />

              {/* RGB Sliders */}
              <div className="space-y-1.5">
                {(() => {
                  const [r, g, b] = hexToRgb(color);
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-muted-foreground w-3">R</span>
                        <Slider
                          value={[r]}
                          onValueChange={([v]) => handleColorChange(rgbToHex(v, g, b))}
                          min={0} max={255} step={1}
                          className="flex-1"
                        />
                        <span className="text-[9px] font-mono w-7 text-right">{r}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-muted-foreground w-3">G</span>
                        <Slider
                          value={[g]}
                          onValueChange={([v]) => handleColorChange(rgbToHex(r, v, b))}
                          min={0} max={255} step={1}
                          className="flex-1"
                        />
                        <span className="text-[9px] font-mono w-7 text-right">{g}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-muted-foreground w-3">B</span>
                        <Slider
                          value={[b]}
                          onValueChange={([v]) => handleColorChange(rgbToHex(r, g, v))}
                          min={0} max={255} step={1}
                          className="flex-1"
                        />
                        <span className="text-[9px] font-mono w-7 text-right">{b}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* HSL Sliders */}
              <div className="space-y-1.5">
                {(() => {
                  const [h, s, l] = hexToHsl(color);
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-muted-foreground w-3">H</span>
                        <Slider
                          value={[h]}
                          onValueChange={([v]) => handleColorChange(hslToHex(v, s, l))}
                          min={0} max={360} step={1}
                          className="flex-1"
                        />
                        <span className="text-[9px] font-mono w-7 text-right">{h}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-muted-foreground w-3">S</span>
                        <Slider
                          value={[s]}
                          onValueChange={([v]) => handleColorChange(hslToHex(h, v, l))}
                          min={0} max={100} step={1}
                          className="flex-1"
                        />
                        <span className="text-[9px] font-mono w-7 text-right">{s}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-muted-foreground w-3">L</span>
                        <Slider
                          value={[l]}
                          onValueChange={([v]) => handleColorChange(hslToHex(h, s, v))}
                          min={0} max={100} step={1}
                          className="flex-1"
                        />
                        <span className="text-[9px] font-mono w-7 text-right">{l}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Eyedropper */}
              {showEyedropper && canvasColors.length > 0 && (
                <div className="space-y-1.5">
                  <button
                    onClick={() => setIsEyedropperOpen(!isEyedropperOpen)}
                    className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pipette className="w-3 h-3" /> Pick from canvas
                  </button>
                  {isEyedropperOpen && (
                    <div className="grid grid-cols-6 gap-1.5">
                      {canvasColors.map((c, idx) => (
                        <button
                          key={`${c}-${idx}`}
                          onClick={() => { handleColorChange(c); setIsEyedropperOpen(false); }}
                          className={cn(
                            "w-8 h-8 rounded border-2 transition-all hover:scale-110",
                            color.toLowerCase() === c.toLowerCase()
                              ? "border-accent ring-2 ring-accent/30"
                              : "border-border/50 hover:border-accent/50"
                          )}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recent colors */}
              <RecentColors onSelect={handleColorChange} currentColor={color} />

              {/* Saved palette */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowPalette(!showPalette)}
                    className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Bookmark className="w-3 h-3" /> Saved Palette
                  </button>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={handleSaveToPalette} title="Save current color">
                    <BookmarkPlus className="w-3 h-3" />
                  </Button>
                </div>
                {showPalette && savedPalette.length > 0 && (
                  <div className="grid grid-cols-8 gap-1">
                    {savedPalette.map((c, idx) => (
                      <button
                        key={`${c}-${idx}`}
                        onClick={() => handleColorChange(c)}
                        onContextMenu={(e) => { e.preventDefault(); handleRemoveFromPalette(c); }}
                        className={cn(
                          "w-7 h-7 rounded border transition-all hover:scale-110",
                          color.toLowerCase() === c.toLowerCase()
                            ? "border-accent ring-1 ring-accent/30"
                            : "border-border/50"
                        )}
                        style={{ backgroundColor: c }}
                        title={`${c} (right-click to remove)`}
                      />
                    ))}
                  </div>
                )}
                {showPalette && savedPalette.length === 0 && (
                  <p className="text-[8px] text-muted-foreground">Click + to save current color</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════ GRADIENT MODE ═══════════ */}
      {activeTab !== 'solid' && (
        <div className="border border-accent/30 bg-accent/5 rounded p-3 space-y-3">
          {/* Gradient type selector: Linear / Radial */}
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => handleTabChange('linear-gradient')}
              className={cn(
                "py-1 px-2 text-[9px] uppercase tracking-wider font-medium rounded-sm border transition-colors",
                activeTab === 'linear-gradient'
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border hover:border-accent/50 bg-secondary text-muted-foreground"
              )}
            >
              Linear
            </button>
            <button
              onClick={() => handleTabChange('radial-gradient')}
              className={cn(
                "py-1 px-2 text-[9px] uppercase tracking-wider font-medium rounded-sm border transition-colors",
                activeTab === 'radial-gradient'
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border hover:border-accent/50 bg-secondary text-muted-foreground"
              )}
            >
              Radial
            </button>
          </div>

          {/* Live preview bar */}
          <div
            className="h-8 rounded border border-border"
            style={{ background: gradientPreviewCSS }}
            title={`${activeTab === 'linear-gradient' ? 'Linear' : 'Radial'} gradient preview`}
          />

          {/* Gradient stop editor with color pickers */}
          <GradientStopEditor
            stops={gc.stops}
            angle={gc.angle}
            isRadial={activeTab === 'radial-gradient'}
            onChange={(stops) => handleGradientChange({ stops })}
            onAngleChange={(angle) => handleGradientChange({ angle })}
          />

          {/* Radial-specific controls */}
          {activeTab === 'radial-gradient' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  Center X: {Math.round((gc.centerX ?? 0.5) * 100)}%
                </Label>
                <Slider
                  value={[Math.round((gc.centerX ?? 0.5) * 100)]}
                  onValueChange={([val]) => handleGradientChange({ centerX: val / 100 })}
                  min={0} max={100} step={1}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  Center Y: {Math.round((gc.centerY ?? 0.5) * 100)}%
                </Label>
                <Slider
                  value={[Math.round((gc.centerY ?? 0.5) * 100)]}
                  onValueChange={([val]) => handleGradientChange({ centerY: val / 100 })}
                  min={0} max={100} step={1}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  Radius: {Math.round((gc.radius ?? 0.5) * 100)}%
                </Label>
                <Slider
                  value={[Math.round((gc.radius ?? 0.5) * 100)]}
                  onValueChange={([val]) => handleGradientChange({ radius: val / 100 })}
                  min={10} max={100} step={1}
                />
              </div>
            </>
          )}

          {/* Reverse button */}
          <Button
            size="sm"
            variant="outline"
            className="w-full h-6 text-[9px] gap-1"
            onClick={handleReverse}
          >
            <RotateCw className="w-3 h-3" /> Reverse
          </Button>

          {/* Gradient Presets */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Presets</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(activeTab === 'linear-gradient' ? LINEAR_PRESETS : RADIAL_PRESETS).map(preset => (
                <button
                  key={preset.name}
                  onClick={() => {
                    if (activeTab === 'linear-gradient') {
                      handleGradientChange({ stops: preset.stops, angle: (preset as typeof LINEAR_PRESETS[number]).angle });
                    } else {
                      handleGradientChange({ stops: preset.stops, centerX: 0.5, centerY: 0.5, radius: 0.5 });
                    }
                    toast.success(`Applied ${preset.name}`);
                  }}
                  className="group space-y-1"
                >
                  <div
                    className="h-6 rounded border border-border group-hover:border-primary transition-colors group-hover:scale-105 transform transition-transform"
                    style={{
                      background: activeTab === 'linear-gradient'
                        ? buildGradientCSS(preset.stops, 90)
                        : buildRadialGradientCSS(preset.stops)
                    }}
                  />
                  <span className="text-[8px] text-muted-foreground group-hover:text-foreground block text-center">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
