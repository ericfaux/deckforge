import { Download, Grid3X3, RotateCcw, ChevronDown, Lock, Unlock, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { usePanelResize } from '@/hooks/use-panel-resize';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayerList } from './LayerList';
import { AdvancedEffects } from './AdvancedEffects';
import { FontUploadModal } from './FontUploadModal';
import { GoogleFontPicker } from './GoogleFontPicker';
import { ComponentErrorBoundary } from '@/components/ComponentErrorBoundary';
import { ObjectEffects } from './ObjectEffects';
import { HueRotateDial } from './HueRotateDial';
import { GradientPicker } from './GradientPicker';
import { ColorPicker } from './ColorPicker';
import { UnifiedColorPicker, FillMode, GradientConfig } from './UnifiedColorPicker';
import { useColorHistory } from '@/store/colorHistory';
import { RecentColors } from './RecentColors';
import { CollapsibleSection } from './CollapsibleSection';
import { useDeckDimensions } from './WorkbenchStage';
import { getMmPerPixel } from '@/lib/deck-guides';
import { getDeckSize } from '@/lib/deck-sizes';
import { preloadUserFonts, Font, loadFont, clearUserFontsCache } from '@/lib/fonts';
import { preloadTopFonts, loadGoogleFont, getGoogleFonts } from '@/lib/google-fonts';
import toast from 'react-hot-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const DEFAULT_SECTIONS: Record<string, boolean> = {
  'layer-transform': true,
  'text-properties': true,
  'appearance': true,
  'filters': false,
  'effects': false,
  'advanced': false,
};

function loadSectionState(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem('inspector-sections');
    return saved ? { ...DEFAULT_SECTIONS, ...JSON.parse(saved) } : { ...DEFAULT_SECTIONS };
  } catch {
    return { ...DEFAULT_SECTIONS };
  }
}

// Helper to check if all values are the same, or return 'mixed'
function getSharedValue<T>(values: T[]): T | 'mixed' {
  if (values.length === 0) return 'mixed';
  const first = values[0];
  return values.every(v => v === first) ? first : 'mixed';
}

function MultiSelectInspector() {
  const { objects, selectedIds, updateObject, saveToHistory } = useDeckForgeStore();
  const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));

  if (selectedObjects.length < 2) return null;

  const opacities = selectedObjects.map(obj => obj.opacity);
  const blendModes = selectedObjects.map(obj => obj.mixBlendMode || 'normal');

  const sharedOpacity = getSharedValue(opacities);
  const sharedBlendMode = getSharedValue(blendModes);

  const types = selectedObjects.map(obj => obj.type);
  const typeCount: Record<string, number> = {};
  types.forEach(t => { typeCount[t] = (typeCount[t] || 0) + 1; });

  const updateAll = (updates: Partial<CanvasObject>) => {
    saveToHistory();
    selectedIds.forEach(id => updateObject(id, updates));
  };

  const blendModeOptions: Array<{ value: string; label: string }> = [
    { value: 'normal', label: 'Normal' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'screen', label: 'Screen' },
    { value: 'overlay', label: 'Overlay' },
    { value: 'darken', label: 'Darken' },
    { value: 'lighten', label: 'Lighten' },
    { value: 'color-dodge', label: 'Color Dodge' },
    { value: 'color-burn', label: 'Color Burn' },
    { value: 'hard-light', label: 'Hard Light' },
    { value: 'soft-light', label: 'Soft Light' },
    { value: 'difference', label: 'Difference' },
    { value: 'exclusion', label: 'Exclusion' },
  ];

  return (
    <div className="p-3 space-y-4">
      <div className="py-2 border-b border-border">
        <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
          {selectedIds.length} Objects Selected
        </span>
      </div>

      {/* Type breakdown */}
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Selection</Label>
        <div className="flex flex-wrap gap-1">
          {Object.entries(typeCount).map(([type, count]) => (
            <span key={type} className="px-2 py-0.5 text-[10px] font-medium bg-secondary rounded border border-border">
              {count} {type}{count > 1 ? 's' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Shared Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Opacity</Label>
          {sharedOpacity === 'mixed' ? (
            <span className="text-[10px] text-muted-foreground italic">Mixed</span>
          ) : (
            <span className="text-[10px] text-muted-foreground font-mono">{Math.round(sharedOpacity * 100)}%</span>
          )}
        </div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[sharedOpacity === 'mixed' ? 1 : sharedOpacity]}
          onValueChange={([v]) => updateAll({ opacity: v })}
        />
      </div>

      {/* Shared Blend Mode */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Blend Mode</Label>
          {sharedBlendMode === 'mixed' && (
            <span className="text-[10px] text-muted-foreground italic">Mixed</span>
          )}
        </div>
        <select
          value={sharedBlendMode === 'mixed' ? '' : sharedBlendMode}
          onChange={(e) => updateAll({ mixBlendMode: e.target.value as any })}
          className="w-full h-8 px-2 text-xs bg-background border border-border rounded"
        >
          {sharedBlendMode === 'mixed' && <option value="">Mixed values</option>}
          {blendModeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Quick actions */}
      <div className="space-y-2 pt-2 border-t border-border">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick Actions</Label>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => updateAll({ hidden: true })}
            className="px-2 py-1.5 text-[10px] bg-secondary hover:bg-secondary/80 border border-border rounded transition-colors"
          >
            Hide All
          </button>
          <button
            onClick={() => updateAll({ hidden: false })}
            className="px-2 py-1.5 text-[10px] bg-secondary hover:bg-secondary/80 border border-border rounded transition-colors"
          >
            Show All
          </button>
          <button
            onClick={() => updateAll({ locked: true })}
            className="px-2 py-1.5 text-[10px] bg-secondary hover:bg-secondary/80 border border-border rounded transition-colors"
          >
            Lock All
          </button>
          <button
            onClick={() => updateAll({ locked: false })}
            className="px-2 py-1.5 text-[10px] bg-secondary hover:bg-secondary/80 border border-border rounded transition-colors"
          >
            Unlock All
          </button>
        </div>
      </div>
    </div>
  );
}

/** Shows real-world dimensions of a selected object in millimeters */
function RealDimensions({ object }: { object: CanvasObject }) {
  const deckSizeId = useDeckForgeStore(state => state.deckSizeId);
  const deckSize = getDeckSize(deckSizeId);
  const mmPerPx = getMmPerPixel(deckSize);

  const widthMm = (object.width * object.scaleX * mmPerPx.x).toFixed(1);
  const heightMm = (object.height * object.scaleY * mmPerPx.y).toFixed(1);
  const xMm = (object.x * mmPerPx.x).toFixed(1);
  const yMm = (object.y * mmPerPx.y).toFixed(1);

  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
        Real Size (mm)
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground w-3">X</span>
          <span className="text-[11px] font-mono text-foreground">{xMm}mm</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground w-3">Y</span>
          <span className="text-[11px] font-mono text-foreground">{yMm}mm</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground w-3">W</span>
          <span className="text-[11px] font-mono text-foreground">{widthMm}mm</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground w-3">H</span>
          <span className="text-[11px] font-mono text-foreground">{heightMm}mm</span>
        </div>
      </div>
      <p className="text-[9px] text-muted-foreground">
        Based on {deckSize.name} deck ({deckSize.width}x{deckSize.length}mm)
      </p>
    </div>
  );
}

export function Inspector() {
  const { objects, selectedId, selectedIds, updateObject, saveToHistory, generatePattern, moveLayer, bringToFront, sendToBack } = useDeckForgeStore();
  const { isAuthenticated } = useAuthStore();
  const { addColor } = useColorHistory();
  
  // Get current deck dimensions (dynamic based on selected size)
  const { width: DECK_WIDTH, height: DECK_HEIGHT } = useDeckDimensions();
  
  // Resizable panel
  const { width: panelWidth, isResizing, startResize } = usePanelResize(320, 256, 600);
  
  // Memoize selected object lookup to avoid recalculating on every render
  const selectedObject = useMemo(() => {
    return objects.find((obj) => obj.id === selectedId);
  }, [objects, selectedId]);

  // Pattern generator state
  const [patternGap, setPatternGap] = useState(5);
  const [patternRandomRotation, setPatternRandomRotation] = useState(0);

  // Font management state
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [userFonts, setUserFonts] = useState<Font[]>([]);
  const [fontsLoading, setFontsLoading] = useState(false);
  const [fontsError, setFontsError] = useState<string | undefined>();

  // Ref for scrollable properties container
  const propertiesPanelRef = useRef<HTMLDivElement>(null);

  // Collapsible section state with localStorage persistence
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(loadSectionState);

  useEffect(() => {
    localStorage.setItem('inspector-sections', JSON.stringify(openSections));
  }, [openSections]);

  const toggleSection = useCallback((key: string, open: boolean) => {
    setOpenSections(prev => ({ ...prev, [key]: open }));
  }, []);

  const expandAll = useCallback(() => {
    setOpenSections(prev => {
      const next: Record<string, boolean> = {};
      for (const k of Object.keys(prev)) next[k] = true;
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setOpenSections(prev => {
      const next: Record<string, boolean> = {};
      for (const k of Object.keys(prev)) next[k] = false;
      return next;
    });
  }, []);

  // Auto-scroll to relevant section when object type changes
  useEffect(() => {
    if (!selectedObject || !propertiesPanelRef.current) return;

    // Map object types to section identifiers (data attributes or IDs)
    const sectionMap: Record<string, string> = {
      text: 'text-controls',
      sticker: 'sticker-controls',
      shape: 'shape-controls',
      image: 'image-controls',
      path: 'path-controls',
      pattern: 'pattern-controls',
    };

    const sectionId = sectionMap[selectedObject.type];
    if (!sectionId) return;

    // Find the section element
    const sectionElement = propertiesPanelRef.current.querySelector(`[data-section="${sectionId}"]`);
    if (sectionElement) {
      // Scroll smoothly to the section
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedObject?.type, selectedObject?.id]);

  // Load user fonts on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      setFontsLoading(true);
      setFontsError(undefined);
      preloadUserFonts()
        .then((result) => {
          setUserFonts(result.fonts);
          setFontsError(result.error);
        })
        .finally(() => setFontsLoading(false));
    }
  }, [isAuthenticated]);

  // Preload top Google Fonts on mount
  useEffect(() => {
    preloadTopFonts();
  }, []);

  // When a text object is selected, ensure its Google Font is loaded
  useEffect(() => {
    if (selectedObject?.type === 'text' && selectedObject.fontFamily) {
      const gFonts = getGoogleFonts();
      const gFont = gFonts.find(f => f.family === selectedObject.fontFamily);
      if (gFont) {
        loadGoogleFont(gFont.family, gFont.variants);
      }
    }
  }, [selectedObject?.fontFamily]);

  const handleExport = () => {
    // Export functionality - placeholder for now
    alert('Export feature coming soon! The deck design will be exported as a high-resolution PNG.');
  };

  const updateWithHistory = (updates: Partial<CanvasObject>) => {
    if (!selectedId) return;
    saveToHistory();
    updateObject(selectedId, updates);
  };

  const { backgroundColor, setBackgroundColor, backgroundFillType, setBackgroundFillType, backgroundGradient, setBackgroundGradient } = useDeckForgeStore();

  return (
    <div 
      className="bg-card border-l border-border h-full flex flex-col relative" 
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary transition-colors group",
          isResizing && "bg-primary"
        )}
        onMouseDown={startResize}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-primary" />
        </div>
      </div>
      {/* Export button */}
      <div className="p-3 border-b border-border">
        <button
          onClick={handleExport}
          className="w-full bg-accent text-accent-foreground font-display text-sm uppercase tracking-wider py-2.5 px-4 border border-accent hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Print
        </button>
      </div>

      {/* Deck Background */}
      <div className="p-3 border-b border-border space-y-3">
        <UnifiedColorPicker
          label="Deck Background"
          color={backgroundColor}
          fillMode={backgroundFillType as FillMode}
          gradientConfig={{
            stops: backgroundGradient.stops || [
              { offset: 0, color: backgroundGradient.startColor },
              { offset: 1, color: backgroundGradient.endColor },
            ],
            angle: backgroundGradient.angle,
            centerX: backgroundGradient.centerX ?? 0.5,
            centerY: backgroundGradient.centerY ?? 0.5,
            radius: backgroundGradient.radius ?? 0.5,
          }}
          onColorChange={setBackgroundColor}
          onFillModeChange={(mode) => setBackgroundFillType(mode as any)}
          onGradientChange={(config) => {
            setBackgroundGradient({
              stops: config.stops,
              angle: config.angle,
              startColor: config.stops[0]?.color || '#ff6b35',
              endColor: config.stops[config.stops.length - 1]?.color || '#f7c948',
              direction: backgroundFillType === 'radial-gradient' ? 'radial' : 'linear',
              centerX: config.centerX,
              centerY: config.centerY,
              radius: config.radius,
            });
          }}
          showGradients={true}
          showEyedropper={true}
        />
      </div>

      {/* Properties panel */}
      <div ref={propertiesPanelRef} className="flex-1 overflow-auto">
        {selectedObject ? (
          <div className="space-y-0">
            <div className="px-3 pt-3 pb-2 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                  Properties
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={expandAll}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="Expand all sections"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={collapseAll}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="Collapse all sections"
                  >
                    <Minimize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => updateWithHistory({ locked: !selectedObject.locked })}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs transition-colors ${
                  selectedObject.locked
                    ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
                title={selectedObject.locked ? 'Unlock object' : 'Lock object'}
              >
                {selectedObject.locked ? (
                  <>
                    <Lock className="w-3 h-3" />
                    <span className="uppercase tracking-wider">Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span className="uppercase tracking-wider">Unlocked</span>
                  </>
                )}
              </button>
            </div>

            {/* ═══════════ LAYER & TRANSFORM ═══════════ */}
            <CollapsibleSection
              title="Layer & Transform"
              isOpen={openSections['layer-transform'] ?? true}
              onToggle={(open) => toggleSection('layer-transform', open)}
              activeCount={
                (selectedObject.rotation !== 0 ? 1 : 0) +
                (selectedObject.scaleX !== 1 ? 1 : 0) +
                (selectedObject.scaleY !== 1 ? 1 : 0)
              }
            >
            <div className="space-y-4">
            {/* Layer Ordering */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Layer Order
              </Label>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => {
                    moveLayer(selectedId!, 'up');
                    toast.success('Moved forward');
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-secondary hover:bg-secondary/80 border border-border transition-colors"
                  title="Bring forward (Ctrl+])"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase">Forward</span>
                </button>
                <button
                  onClick={() => {
                    moveLayer(selectedId!, 'down');
                    toast.success('Moved backward');
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-secondary hover:bg-secondary/80 border border-border transition-colors"
                  title="Send backward (Ctrl+[)"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase">Back</span>
                </button>
                <button
                  onClick={() => {
                    bringToFront(selectedId!);
                    toast.success('Brought to front');
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-secondary hover:bg-secondary/80 border border-border transition-colors"
                  title="Bring to front (Ctrl+Shift+])"
                >
                  <ChevronsUp className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase">Front</span>
                </button>
                <button
                  onClick={() => {
                    sendToBack(selectedId!);
                    toast.success('Sent to back');
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-secondary hover:bg-secondary/80 border border-border transition-colors"
                  title="Send to back (Ctrl+Shift+[)"
                >
                  <ChevronsDown className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase">Back</span>
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground">
                Move layer in front of or behind other objects
              </p>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Rotation
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={Math.round(selectedObject.rotation)}
                  onChange={(e) => updateWithHistory({ rotation: Number(e.target.value) })}
                  className="h-8 text-xs font-mono bg-secondary border-border"
                />
                <span className="text-[11px] text-muted-foreground">deg</span>
              </div>
            </div>

            {/* Scale */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Scale
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-muted-foreground">X</span>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={selectedObject.scaleX.toFixed(2)}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= 0.1 && value <= 10) {
                        updateWithHistory({ scaleX: value });
                      }
                    }}
                    className="h-8 text-xs font-mono bg-secondary border-border"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground">Y</span>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={selectedObject.scaleY.toFixed(2)}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= 0.1 && value <= 10) {
                        updateWithHistory({ scaleY: value });
                      }
                    }}
                    className="h-8 text-xs font-mono bg-secondary border-border"
                  />
                </div>
              </div>
            </div>

            {/* Real-world dimensions (mm) */}
            <RealDimensions object={selectedObject} />
            </div>
            </CollapsibleSection>

            {/* ═══════════ APPEARANCE ═══════════ */}
            <CollapsibleSection
              title="Appearance"
              isOpen={openSections['appearance'] ?? true}
              onToggle={(open) => toggleSection('appearance', open)}
              activeCount={
                (selectedObject.opacity < 1 ? 1 : 0) +
                (selectedObject.mixBlendMode && selectedObject.mixBlendMode !== 'normal' ? 1 : 0) +
                ((selectedObject.type === 'text' || selectedObject.type === 'shape') && selectedObject.fill ? 1 : 0)
              }
            >
            <div className="space-y-4">
            {/* Opacity */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Opacity
              </Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[selectedObject.opacity * 100]}
                  onValueChange={([value]) => updateWithHistory({ opacity: value / 100 })}
                  max={100}
                  min={0}
                  step={1}
                  className="flex-1"
                />
                <span className="text-[11px] font-mono w-10 text-right">
                  {Math.round(selectedObject.opacity * 100)}%
                </span>
              </div>
            </div>

            {/* Blend Mode */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Blend Mode
              </Label>
              <select
                value={selectedObject.mixBlendMode || 'normal'}
                onChange={(e) => updateWithHistory({ mixBlendMode: e.target.value as any })}
                className="w-full h-8 text-xs bg-secondary border border-border px-2"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="color-burn">Color Burn</option>
                <option value="hard-light">Hard Light</option>
                <option value="soft-light">Soft Light</option>
                <option value="difference">Difference</option>
                <option value="exclusion">Exclusion</option>
                <option value="hue">Hue</option>
                <option value="saturation">Saturation</option>
                <option value="color">Color</option>
                <option value="luminosity">Luminosity</option>
              </select>
            </div>

            {/* Color (for text/shapes) */}
            {(selectedObject.type === 'text' || selectedObject.type === 'shape') && (
              <div className="space-y-2">
                <UnifiedColorPicker
                  label="Fill Color"
                  color={selectedObject.fill || '#ffffff'}
                  fillMode={selectedObject.fillType || 'solid'}
                  gradientConfig={{
                    stops: selectedObject.gradientStops || [
                      { offset: 0, color: selectedObject.fill || '#ff0000' },
                      { offset: 1, color: '#0000ff' },
                    ],
                    angle: selectedObject.gradientAngle || 135,
                    centerX: selectedObject.gradientCenterX ?? 0.5,
                    centerY: selectedObject.gradientCenterY ?? 0.5,
                    radius: selectedObject.gradientRadius ?? 0.5,
                  }}
                  onColorChange={(color) => updateWithHistory({ fill: color, fillType: 'solid' })}
                  onFillModeChange={(mode) => {
                    updateWithHistory({
                      fillType: mode,
                      gradientStops: mode !== 'solid'
                        ? (selectedObject.gradientStops || [
                            { offset: 0, color: selectedObject.fill || '#ff0000' },
                            { offset: 1, color: '#0000ff' },
                          ])
                        : undefined,
                    });
                  }}
                  onGradientChange={(config) => {
                    updateWithHistory({
                      fillType: selectedObject.fillType === 'radial-gradient' ? 'radial-gradient' : 'linear-gradient',
                      gradientStops: config.stops,
                      gradientAngle: config.angle,
                      gradientCenterX: config.centerX,
                      gradientCenterY: config.centerY,
                      gradientRadius: config.radius,
                      fill: config.stops[0]?.color || '#ffffff',
                    });
                  }}
                  showGradients={true}
                  showEyedropper={true}
                />
              </div>
            )}
            </div>
            </CollapsibleSection>

            {/* Pattern Controls (for shapes with patterns) */}
            {selectedObject.type === 'shape' && selectedObject.patternType && (
              <div data-section="shape-controls" className="pt-4 border-t border-border space-y-4">
                <div className="py-2">
                  <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                    Pattern Settings
                  </span>
                </div>

                {/* Pattern Type Selector */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Pattern Type
                  </Label>
                  <select
                    value={selectedObject.patternType}
                    onChange={(e) => updateWithHistory({ patternType: e.target.value as any })}
                    className="w-full h-8 text-xs bg-secondary border-border rounded px-2"
                  >
                    <option value="checkerboard">Checkerboard</option>
                    <option value="speed-lines">Speed Lines</option>
                    <option value="halftone">Halftone</option>
                    <option value="diagonal-stripes">Diagonal Stripes</option>
                    <option value="hexagons">Hexagons</option>
                    <option value="crosshatch">Crosshatch</option>
                  </select>
                </div>

                {/* Primary Color */}
                <UnifiedColorPicker
                  label="Primary Color"
                  color={selectedObject.patternPrimaryColor || '#1e3a8a'}
                  onColorChange={(color) => updateWithHistory({ patternPrimaryColor: color })}
                  showGradients={false}
                  showEyedropper={true}
                />

                {/* Secondary Color */}
                <UnifiedColorPicker
                  label="Secondary Color"
                  color={selectedObject.patternSecondaryColor || '#3b82f6'}
                  onColorChange={(color) => updateWithHistory({ patternSecondaryColor: color })}
                  showGradients={false}
                  showEyedropper={true}
                />

                {/* Pattern Scale */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Pattern Scale
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[selectedObject.patternScale || 20]}
                      onValueChange={([value]) => updateWithHistory({ patternScale: value })}
                      max={100}
                      min={5}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono w-10 text-right">
                      {selectedObject.patternScale || 20}px
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Image Fill (pattern fill from image for shapes) */}
            {selectedObject.type === 'shape' && (
              <div className="pt-4 border-t border-border space-y-4">
                <div className="py-2">
                  <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                    Image Fill
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Fill with Image
                    </Label>
                    <button
                      onClick={() => {
                        if (selectedObject.fillPatternImageSrc) {
                          updateWithHistory({ fillPatternImageSrc: undefined, fillPatternScale: undefined, fillPatternOffsetX: undefined, fillPatternOffsetY: undefined });
                        }
                      }}
                      className={`px-2 py-1 text-[9px] uppercase tracking-wider border transition-colors rounded ${
                        selectedObject.fillPatternImageSrc
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-muted-foreground border-border'
                      }`}
                    >
                      {selectedObject.fillPatternImageSrc ? 'Clear' : 'Off'}
                    </button>
                  </div>

                  {/* Image URL input */}
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">
                      Paste image URL or select from uploads
                    </Label>
                    <Input
                      type="text"
                      placeholder="Image URL..."
                      value={selectedObject.fillPatternImageSrc || ''}
                      onChange={(e) => updateWithHistory({ fillPatternImageSrc: e.target.value || undefined })}
                      className="h-7 text-xs font-mono bg-secondary border-border"
                    />
                  </div>

                  {selectedObject.fillPatternImageSrc && (
                    <>
                      {/* Tile Scale */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Tile Scale
                        </Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[selectedObject.fillPatternScale ?? 1]}
                            onValueChange={([value]) => updateWithHistory({ fillPatternScale: value })}
                            max={5}
                            min={0.1}
                            step={0.1}
                            className="flex-1"
                          />
                          <span className="text-[11px] font-mono w-10 text-right">
                            {(selectedObject.fillPatternScale ?? 1).toFixed(1)}x
                          </span>
                        </div>
                      </div>

                      {/* Offset X */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Offset X
                        </Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[selectedObject.fillPatternOffsetX ?? 0]}
                            onValueChange={([value]) => updateWithHistory({ fillPatternOffsetX: value })}
                            max={100}
                            min={-100}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-[11px] font-mono w-10 text-right">
                            {selectedObject.fillPatternOffsetX ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* Offset Y */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Offset Y
                        </Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[selectedObject.fillPatternOffsetY ?? 0]}
                            onValueChange={([value]) => updateWithHistory({ fillPatternOffsetY: value })}
                            max={100}
                            min={-100}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-[11px] font-mono w-10 text-right">
                            {selectedObject.fillPatternOffsetY ?? 0}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <p className="text-[9px] text-muted-foreground">
                    Fill shape with a repeating image pattern
                  </p>
                </div>
              </div>
            )}

            {/* Image Controls */}
            {selectedObject.type === 'image' && (
              <div data-section="image-controls" className="pt-4 border-t border-border space-y-4">
                <div className="py-2">
                  <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                    Image Options
                  </span>
                </div>

                {/* Clip to Deck */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Clip to Deck
                    </Label>
                    <button
                      onClick={() => updateWithHistory({ clipToDeck: !selectedObject.clipToDeck })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        selectedObject.clipToDeck ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          selectedObject.clipToDeck ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    Clip image to the deck outline shape
                  </p>
                </div>

                {/* Fit to Deck / Center on Deck */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Position & Size
                  </Label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => {
                        saveToHistory();
                        // Scale image to fill deck while maintaining aspect ratio
                        const imgAspect = selectedObject.width / selectedObject.height;
                        const deckAspect = DECK_WIDTH / DECK_HEIGHT;
                        let newWidth, newHeight;
                        if (imgAspect > deckAspect) {
                          // Image is wider - fit to height
                          newHeight = DECK_HEIGHT;
                          newWidth = DECK_HEIGHT * imgAspect;
                        } else {
                          // Image is taller - fit to width
                          newWidth = DECK_WIDTH;
                          newHeight = DECK_WIDTH / imgAspect;
                        }
                        updateObject(selectedId!, {
                          width: newWidth,
                          height: newHeight,
                          scaleX: 1,
                          scaleY: 1,
                          x: (DECK_WIDTH - newWidth) / 2,
                          y: (DECK_HEIGHT - newHeight) / 2,
                        });
                      }}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-secondary hover:bg-secondary/80 border border-border transition-colors"
                      title="Scale and position image to fill the deck"
                    >
                      <span className="text-[9px] uppercase">Fit to Deck</span>
                    </button>
                    <button
                      onClick={() => {
                        saveToHistory();
                        const w = selectedObject.width * selectedObject.scaleX;
                        const h = selectedObject.height * selectedObject.scaleY;
                        updateObject(selectedId!, {
                          x: (DECK_WIDTH - w) / 2,
                          y: (DECK_HEIGHT - h) / 2,
                        });
                      }}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-secondary hover:bg-secondary/80 border border-border transition-colors"
                      title="Center image on the deck"
                    >
                      <span className="text-[9px] uppercase">Center</span>
                    </button>
                  </div>
                </div>

                {/* Flip H / Flip V */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Flip
                  </Label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => updateWithHistory({ flipH: !selectedObject.flipH })}
                      className={`flex items-center justify-center gap-1 px-2 py-1.5 text-xs border transition-colors ${
                        selectedObject.flipH
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary hover:bg-secondary/80 border-border'
                      }`}
                    >
                      <span className="text-[9px] uppercase">Flip H</span>
                    </button>
                    <button
                      onClick={() => updateWithHistory({ flipV: !selectedObject.flipV })}
                      className={`flex items-center justify-center gap-1 px-2 py-1.5 text-xs border transition-colors ${
                        selectedObject.flipV
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary hover:bg-secondary/80 border-border'
                      }`}
                    >
                      <span className="text-[9px] uppercase">Flip V</span>
                    </button>
                  </div>
                </div>

                {/* Image Adjustments */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Brightness
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[selectedObject.brightness ?? 100]}
                      onValueChange={([value]) => updateWithHistory({ brightness: value })}
                      max={200}
                      min={0}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono w-10 text-right">
                      {selectedObject.brightness ?? 100}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Contrast
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[selectedObject.contrast ?? 100]}
                      onValueChange={([value]) => updateWithHistory({ contrast: value })}
                      max={200}
                      min={0}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono w-10 text-right">
                      {selectedObject.contrast ?? 100}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Hue Rotate
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[selectedObject.hueRotate ?? 0]}
                      onValueChange={([value]) => updateWithHistory({ hueRotate: value })}
                      max={360}
                      min={0}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono w-10 text-right">
                      {selectedObject.hueRotate ?? 0}°
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Saturation
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[selectedObject.saturate ?? 100]}
                      onValueChange={([value]) => updateWithHistory({ saturate: value })}
                      max={200}
                      min={0}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono w-10 text-right">
                      {selectedObject.saturate ?? 100}%
                    </span>
                  </div>
                </div>

                {/* Color Tint */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Color Tint
                    </Label>
                    <button
                      onClick={() => updateWithHistory({
                        colorize: selectedObject.colorize ? null : '#ccff00'
                      })}
                      className={`px-2 py-1 text-[9px] uppercase tracking-wider border transition-colors rounded ${
                        selectedObject.colorize
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-muted-foreground border-border hover:border-primary'
                      }`}
                    >
                      {selectedObject.colorize ? 'On' : 'Off'}
                    </button>
                  </div>
                  {selectedObject.colorize && (
                    <UnifiedColorPicker
                      color={selectedObject.colorize}
                      onColorChange={(color) => updateWithHistory({ colorize: color })}
                      showGradients={false}
                      showEyedropper={true}
                    />
                  )}
                </div>

                {/* Remove Background */}
                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      if (!selectedObject.src) return;
                      toast.loading('Removing background...', { id: 'bg-remove' });
                      try {
                        const { removeBackground } = await import('@imgly/background-removal');
                        const response = await fetch(selectedObject.src);
                        const blob = await response.blob();
                        const resultBlob = await removeBackground(blob);
                        const url = URL.createObjectURL(resultBlob);
                        saveToHistory();
                        updateObject(selectedId!, { src: url });
                        toast.success('Background removed', { id: 'bg-remove' });
                      } catch (err) {
                        console.error('Background removal failed:', err);
                        toast.error('Background removal failed', { id: 'bg-remove', description: 'Try a different image or check your connection' });
                      }
                    }}
                    className="w-full border border-border hover:border-primary transition-colors py-1.5 px-3 text-[10px] uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    Remove Background
                  </button>
                  <p className="text-[9px] text-muted-foreground">
                    AI-powered background removal (may take a moment)
                  </p>
                </div>
              </div>
            )}

            {/* Path Controls (color tint + stroke) */}
            {selectedObject.type === 'path' && (
              <div data-section="path-controls" className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Color Tint
                  </Label>
                  <button
                    onClick={() => updateWithHistory({
                      colorize: selectedObject.colorize ? null : '#ccff00'
                    })}
                    className={`px-2 py-1 text-[9px] uppercase tracking-wider border transition-colors rounded ${
                      selectedObject.colorize
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-muted-foreground border-border hover:border-primary'
                    }`}
                  >
                    {selectedObject.colorize ? 'On' : 'Off'}
                  </button>
                </div>
                {selectedObject.colorize && (
                  <UnifiedColorPicker
                    color={selectedObject.colorize}
                    onColorChange={(color) => updateWithHistory({ colorize: color })}
                    showGradients={false}
                    showEyedropper={true}
                  />
                )}
                <UnifiedColorPicker
                  label="Stroke Color"
                  color={selectedObject.stroke || '#ffffff'}
                  onColorChange={(color) => updateWithHistory({ stroke: color })}
                  showGradients={false}
                  showEyedropper={true}
                />
                <p className="text-[9px] text-muted-foreground">
                  Apply a color overlay to the path
                </p>
              </div>
            )}

            {/* Sticker-specific controls */}
            {selectedObject.type === 'sticker' && (
              <div data-section="sticker-controls" className="pt-4 border-t border-border space-y-4">
                <div className="py-2">
                  <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                    Sticker Options
                  </span>
                </div>

                {/* Fill Color / Tint */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Fill Color
                    </Label>
                    <button
                      onClick={() => updateWithHistory({
                        colorize: selectedObject.colorize ? null : '#ccff00'
                      })}
                      className={`px-2 py-1 text-[9px] uppercase tracking-wider border transition-colors rounded ${
                        selectedObject.colorize
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-muted-foreground border-border hover:border-primary'
                      }`}
                    >
                      {selectedObject.colorize ? 'On' : 'Off'}
                    </button>
                  </div>
                  {selectedObject.colorize && (
                    <UnifiedColorPicker
                      color={selectedObject.colorize}
                      fillMode={selectedObject.fillType || 'solid'}
                      gradientConfig={{
                        stops: selectedObject.gradientStops || [
                          { offset: 0, color: selectedObject.colorize || '#ccff00' },
                          { offset: 1, color: '#0000ff' },
                        ],
                        angle: selectedObject.gradientAngle || 135,
                        centerX: selectedObject.gradientCenterX ?? 0.5,
                        centerY: selectedObject.gradientCenterY ?? 0.5,
                        radius: selectedObject.gradientRadius ?? 0.5,
                      }}
                      onColorChange={(color) => updateWithHistory({ colorize: color })}
                      onFillModeChange={(mode) => {
                        updateWithHistory({
                          fillType: mode,
                          gradientStops: mode !== 'solid'
                            ? (selectedObject.gradientStops || [
                                { offset: 0, color: selectedObject.colorize || '#ccff00' },
                                { offset: 1, color: '#0000ff' },
                              ])
                            : undefined,
                        });
                      }}
                      onGradientChange={(config) => {
                        updateWithHistory({
                          fillType: selectedObject.fillType === 'radial-gradient' ? 'radial-gradient' : 'linear-gradient',
                          gradientStops: config.stops,
                          gradientAngle: config.angle,
                          gradientCenterX: config.centerX,
                          gradientCenterY: config.centerY,
                          gradientRadius: config.radius,
                          colorize: config.stops[0]?.color || '#ccff00',
                        });
                      }}
                      showGradients={true}
                      showEyedropper={true}
                    />
                  )}
                  <p className="text-[9px] text-muted-foreground">
                    Tint the sticker with a color or gradient
                  </p>
                </div>

                {/* Stroke Color */}
                <UnifiedColorPicker
                  label="Stroke Color"
                  color={selectedObject.stroke || '#ffffff'}
                  onColorChange={(color) => updateWithHistory({ stroke: color })}
                  showGradients={false}
                  showEyedropper={true}
                />

                {/* Stroke Width */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Stroke Width
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[selectedObject.strokeWidth ?? 3]}
                      onValueChange={([value]) => updateWithHistory({ strokeWidth: value })}
                      max={8}
                      min={1}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono w-10 text-right">
                      {selectedObject.strokeWidth ?? 3}px
                    </span>
                  </div>
                </div>

                {/* Stroke Dash Style */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Line Style
                  </Label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => updateWithHistory({ strokeDashStyle: style })}
                        className={`px-2 py-1.5 text-[10px] uppercase tracking-wider border transition-colors ${
                          (selectedObject.strokeDashStyle || 'solid') === style
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary text-muted-foreground border-border hover:border-primary'
                        }`}
                      >
                        {style === 'solid' ? '━━' : style === 'dashed' ? '╌╌' : '┄┄'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Solid Fill Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Solid Fill
                    </Label>
                    <button
                      onClick={() => updateWithHistory({ solidFill: !selectedObject.solidFill })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        selectedObject.solidFill ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          selectedObject.solidFill ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    Fill the icon with solid color instead of outline
                  </p>
                </div>
              </div>
            )}

            {/* Texture-specific controls */}
            {selectedObject.type === 'texture' && (
              <div className="pt-4 border-t border-border space-y-4">
                <div className="py-2">
                  <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                    Texture Options
                  </span>
                </div>

                {/* Blend Mode */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Blend Mode
                  </Label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['multiply', 'overlay', 'soft-light', 'color-burn', 'normal'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateWithHistory({ blendMode: mode })}
                        className={`py-1.5 px-2 text-[9px] uppercase tracking-wider border transition-colors ${
                          selectedObject.blendMode === mode
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Line-specific controls */}
            {selectedObject.type === 'line' && (
              <div className="pt-4 border-t border-border space-y-4">
                <div className="py-2">
                  <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                    Line Options
                  </span>
                </div>

                {/* Line Type */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Line Type
                  </Label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['straight', 'curved', 'zigzag', 'dashed'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => updateWithHistory({ lineType: type })}
                        className={`py-1.5 px-2 text-[9px] uppercase tracking-wider border transition-colors ${
                          selectedObject.lineType === type
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stroke Color */}
                <UnifiedColorPicker
                  label="Stroke Color"
                  color={selectedObject.stroke || '#ffffff'}
                  fillMode={selectedObject.fillType || 'solid'}
                  gradientConfig={{
                    stops: selectedObject.gradientStops || [
                      { offset: 0, color: selectedObject.stroke || '#ffffff' },
                      { offset: 1, color: '#0000ff' },
                    ],
                    angle: selectedObject.gradientAngle || 135,
                    centerX: selectedObject.gradientCenterX ?? 0.5,
                    centerY: selectedObject.gradientCenterY ?? 0.5,
                    radius: selectedObject.gradientRadius ?? 0.5,
                  }}
                  onColorChange={(color) => updateWithHistory({ stroke: color })}
                  onFillModeChange={(mode) => {
                    updateWithHistory({
                      fillType: mode,
                      gradientStops: mode !== 'solid'
                        ? (selectedObject.gradientStops || [
                            { offset: 0, color: selectedObject.stroke || '#ffffff' },
                            { offset: 1, color: '#0000ff' },
                          ])
                        : undefined,
                    });
                  }}
                  onGradientChange={(config) => {
                    updateWithHistory({
                      fillType: selectedObject.fillType === 'radial-gradient' ? 'radial-gradient' : 'linear-gradient',
                      gradientStops: config.stops,
                      gradientAngle: config.angle,
                      gradientCenterX: config.centerX,
                      gradientCenterY: config.centerY,
                      gradientRadius: config.radius,
                      stroke: config.stops[0]?.color || '#ffffff',
                    });
                  }}
                  showGradients={true}
                  showEyedropper={true}
                />

                {/* Stroke Width */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Stroke Width
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[selectedObject.strokeWidth ?? 3]}
                      onValueChange={([value]) => updateWithHistory({ strokeWidth: value })}
                      max={12}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono w-10 text-right">
                      {selectedObject.strokeWidth ?? 3}px
                    </span>
                  </div>
                </div>

                {/* Stroke Dash Style */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Line Style
                  </Label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => updateWithHistory({ strokeDashStyle: style })}
                        className={`px-2 py-1.5 text-[10px] uppercase tracking-wider border transition-colors ${
                          (selectedObject.strokeDashStyle || 'solid') === style
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary text-muted-foreground border-border hover:border-primary'
                        }`}
                      >
                        {style === 'solid' ? '━━' : style === 'dashed' ? '╌╌' : '┄┄'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* End Point X */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Length (X)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[selectedObject.lineEndX ?? 60]}
                      onValueChange={([value]) => updateWithHistory({ lineEndX: value })}
                      max={200}
                      min={-200}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono w-10 text-right">
                      {selectedObject.lineEndX ?? 60}
                    </span>
                  </div>
                </div>

                {/* End Point Y */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Length (Y)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[selectedObject.lineEndY ?? 0]}
                      onValueChange={([value]) => updateWithHistory({ lineEndY: value })}
                      max={200}
                      min={-200}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono w-10 text-right">
                      {selectedObject.lineEndY ?? 0}
                    </span>
                  </div>
                </div>

                {/* Curve Amount (only for curved lines) */}
                {selectedObject.lineType === 'curved' && (
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Curve Amount
                    </Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[selectedObject.lineCurve ?? 50]}
                        onValueChange={([value]) => updateWithHistory({ lineCurve: value })}
                        max={100}
                        min={-100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-[11px] font-mono w-10 text-right">
                        {selectedObject.lineCurve ?? 50}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground">
                      Negative = curve down, Positive = curve up
                    </p>
                  </div>
                )}

                {/* Cap Style */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Cap Style
                  </Label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['butt', 'round', 'square'] as const).map((cap) => (
                      <button
                        key={cap}
                        onClick={() => updateWithHistory({ lineCapStyle: cap })}
                        className={`py-1.5 px-2 text-[9px] uppercase tracking-wider border transition-colors ${
                          selectedObject.lineCapStyle === cap
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ TEXT PROPERTIES ═══════════ */}
            {selectedObject.type === 'text' && (
              <CollapsibleSection
                title="Text Properties"
                isOpen={openSections['text-properties'] ?? true}
                onToggle={(open) => toggleSection('text-properties', open)}
                activeCount={
                  (selectedObject.fontFamily && selectedObject.fontFamily !== 'Roboto' ? 1 : 0) +
                  (selectedObject.letterSpacing ? 1 : 0) +
                  (selectedObject.lineHeight && selectedObject.lineHeight !== 1.2 ? 1 : 0) +
                  (selectedObject.textTransform && selectedObject.textTransform !== 'none' ? 1 : 0) +
                  (selectedObject.textDecoration && selectedObject.textDecoration !== 'none' ? 1 : 0) +
                  (selectedObject.warpType && selectedObject.warpType !== 'none' ? 1 : 0) +
                  (selectedObject.textShadow?.enabled ? 1 : 0)
                }
                className="border-t border-border"
              >
              <div data-section="text-controls" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Text
                  </Label>
                  <Input
                    type="text"
                    value={selectedObject.text || ''}
                    onChange={(e) => updateWithHistory({ text: e.target.value })}
                    className="h-8 text-xs font-mono bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Font Family
                  </Label>
                  <GoogleFontPicker
                    value={selectedObject.fontFamily || 'Roboto'}
                    onChange={(fontFamily) => updateWithHistory({ fontFamily })}
                    userFonts={userFonts}
                    onUploadClick={() => setIsFontModalOpen(true)}
                    loading={fontsLoading}
                    error={fontsError}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Font Size
                  </Label>
                  <Input
                    type="number"
                    min="6"
                    max="200"
                    value={selectedObject.fontSize || 24}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= 6 && value <= 200) {
                        updateWithHistory({ fontSize: value });
                      }
                    }}
                    className="h-8 text-xs font-mono bg-secondary border-border"
                  />
                </div>

                {/* Text Alignment */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Alignment
                  </Label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['left', 'center', 'right'] as const).map(align => (
                      <button
                        key={align}
                        onClick={() => updateWithHistory({ align })}
                        className={`h-8 text-xs uppercase transition-colors ${
                          (selectedObject.align || 'left') === align
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {align[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Weight & Style */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Weight
                    </Label>
                    <select
                      value={selectedObject.fontWeight || 'normal'}
                      onChange={(e) => updateWithHistory({ fontWeight: e.target.value as any })}
                      className="w-full h-8 text-xs bg-secondary border border-border px-2"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="300">Light</option>
                      <option value="600">Semi-Bold</option>
                      <option value="800">Extra-Bold</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Style
                    </Label>
                    <select
                      value={selectedObject.fontStyle || 'normal'}
                      onChange={(e) => updateWithHistory({ fontStyle: e.target.value as any })}
                      className="w-full h-8 text-xs bg-secondary border border-border px-2"
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                </div>

                {/* Letter Spacing */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Letter Spacing: {selectedObject.letterSpacing || 0}px
                  </Label>
                  <Slider
                    value={[selectedObject.letterSpacing || 0]}
                    onValueChange={([value]) => updateWithHistory({ letterSpacing: value })}
                    max={20}
                    min={-5}
                    step={0.5}
                    className="flex-1"
                  />
                </div>

                {/* Line Height */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Line Height: {(selectedObject.lineHeight || 1.2).toFixed(1)}
                  </Label>
                  <Slider
                    value={[selectedObject.lineHeight || 1.2]}
                    onValueChange={([value]) => updateWithHistory({ lineHeight: value })}
                    max={3}
                    min={0.5}
                    step={0.1}
                    className="flex-1"
                  />
                </div>

                {/* Text Transform */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Transform
                  </Label>
                  <select
                    value={selectedObject.textTransform || 'none'}
                    onChange={(e) => updateWithHistory({ textTransform: e.target.value as any })}
                    className="w-full h-8 text-xs bg-secondary border border-border px-2"
                  >
                    <option value="none">None</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                    <option value="capitalize">Capitalize</option>
                  </select>
                </div>

                {/* Text Decoration */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Decoration
                  </Label>
                  <select
                    value={selectedObject.textDecoration || 'none'}
                    onChange={(e) => updateWithHistory({ textDecoration: e.target.value as any })}
                    className="w-full h-8 text-xs bg-secondary border border-border px-2"
                  >
                    <option value="none">None</option>
                    <option value="underline">Underline</option>
                    <option value="line-through">Strike-through</option>
                  </select>
                </div>

                {/* Text Warp / Curved Text */}
                <Accordion type="single" collapsible className="border-t border-border">
                  <AccordionItem value="text-warp">
                    <AccordionTrigger className="text-[10px] uppercase tracking-widest text-muted-foreground py-2">
                      Text Warp {selectedObject.warpType && selectedObject.warpType !== 'none' && '✓'}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                      {/* Warp Preset */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Warp Style
                        </Label>
                        <select
                          value={selectedObject.warpType || 'none'}
                          onChange={(e) => {
                            const warpType = e.target.value as any;
                            const updates: Partial<CanvasObject> = { warpType };
                            if (warpType === 'none') {
                              updates.warpIntensity = undefined;
                              updates.arcRadius = undefined;
                              updates.arcAngle = undefined;
                              updates.arcDirection = undefined;
                            } else if (!selectedObject.warpIntensity) {
                              updates.warpIntensity = 50;
                            }
                            if ((warpType === 'arc-up' || warpType === 'arc-down') && !selectedObject.arcAngle) {
                              updates.arcAngle = 180;
                              updates.arcDirection = 'convex';
                            }
                            updateWithHistory(updates);
                          }}
                          className="w-full h-8 text-xs bg-secondary border border-border px-2"
                        >
                          <option value="none">None (Flat)</option>
                          <optgroup label="Arc">
                            <option value="arc-up">Arc Up</option>
                            <option value="arc-down">Arc Down</option>
                          </optgroup>
                          <optgroup label="Warp">
                            <option value="bridge">Bridge</option>
                            <option value="valley">Valley</option>
                            <option value="flag">Flag</option>
                            <option value="wave">Wave</option>
                          </optgroup>
                          <optgroup label="Distort">
                            <option value="bulge">Bulge</option>
                            <option value="fish-eye">Fish Eye</option>
                            <option value="rise">Rise</option>
                            <option value="inflate">Inflate</option>
                          </optgroup>
                        </select>
                      </div>

                      {/* Warp Intensity */}
                      {selectedObject.warpType && selectedObject.warpType !== 'none' && (
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Intensity: {selectedObject.warpIntensity ?? 50}%
                          </Label>
                          <Slider
                            value={[selectedObject.warpIntensity ?? 50]}
                            onValueChange={([value]) => updateWithHistory({ warpIntensity: value })}
                            max={100}
                            min={0}
                            step={1}
                            className="flex-1"
                          />
                        </div>
                      )}

                      {/* Arc-specific controls */}
                      {(selectedObject.warpType === 'arc-up' || selectedObject.warpType === 'arc-down') && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Arc Angle: {selectedObject.arcAngle ?? 180}°
                            </Label>
                            <Slider
                              value={[selectedObject.arcAngle ?? 180]}
                              onValueChange={([value]) => updateWithHistory({ arcAngle: value })}
                              max={350}
                              min={10}
                              step={5}
                              className="flex-1"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Direction
                            </Label>
                            <div className="grid grid-cols-2 gap-1">
                              {(['convex', 'concave'] as const).map(dir => (
                                <button
                                  key={dir}
                                  onClick={() => updateWithHistory({ arcDirection: dir })}
                                  className={`h-8 text-xs capitalize transition-colors ${
                                    (selectedObject.arcDirection || 'convex') === dir
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary hover:bg-secondary/80'
                                  }`}
                                >
                                  {dir === 'convex' ? 'Convex ⌣' : 'Concave ⌢'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Text on Path indicator */}
                      {selectedObject.textPathId && (
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Attached to Path
                          </Label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex-1">Following custom path</span>
                            <button
                              onClick={() => updateWithHistory({ textPathId: undefined })}
                              className="h-7 px-2 text-[10px] uppercase bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-colors"
                            >
                              Detach
                            </button>
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Text Shadow */}
                <Accordion type="single" collapsible className="border-t border-border">
                  <AccordionItem value="text-shadow">
                    <AccordionTrigger className="text-[10px] uppercase tracking-widest text-muted-foreground py-2">
                      Text Shadow {selectedObject.textShadow?.enabled && '✓'}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedObject.textShadow?.enabled || false}
                          onChange={(e) => updateWithHistory({
                            textShadow: {
                              enabled: e.target.checked,
                              offsetX: selectedObject.textShadow?.offsetX || 2,
                              offsetY: selectedObject.textShadow?.offsetY || 2,
                              blur: selectedObject.textShadow?.blur || 4,
                              color: selectedObject.textShadow?.color || '#000000',
                            }
                          })}
                          className="w-4 h-4"
                        />
                        <Label className="text-xs">Enable Shadow</Label>
                      </div>

                      {selectedObject.textShadow?.enabled && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Offset X: {selectedObject.textShadow?.offsetX || 0}px
                            </Label>
                            <Slider
                              value={[selectedObject.textShadow?.offsetX || 2]}
                              onValueChange={([value]) => updateWithHistory({
                                textShadow: { ...selectedObject.textShadow!, offsetX: value }
                              })}
                              max={20}
                              min={-20}
                              step={1}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Offset Y: {selectedObject.textShadow?.offsetY || 0}px
                            </Label>
                            <Slider
                              value={[selectedObject.textShadow?.offsetY || 2]}
                              onValueChange={([value]) => updateWithHistory({
                                textShadow: { ...selectedObject.textShadow!, offsetY: value }
                              })}
                              max={20}
                              min={-20}
                              step={1}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Blur: {selectedObject.textShadow?.blur || 0}px
                            </Label>
                            <Slider
                              value={[selectedObject.textShadow?.blur || 4]}
                              onValueChange={([value]) => updateWithHistory({
                                textShadow: { ...selectedObject.textShadow!, blur: value }
                              })}
                              max={30}
                              min={0}
                              step={1}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Shadow Color
                            </Label>
                            <RecentColors
                              onSelect={(color) => { addColor(color); updateWithHistory({ textShadow: { ...selectedObject.textShadow!, color } }); }}
                              currentColor={selectedObject.textShadow?.color}
                            />
                            <input
                              type="color"
                              value={selectedObject.textShadow?.color || '#000000'}
                              onChange={(e) => { addColor(e.target.value); updateWithHistory({
                                textShadow: { ...selectedObject.textShadow!, color: e.target.value }
                              }); }}
                              className="w-full h-8 cursor-pointer"
                            />
                          </div>
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              </CollapsibleSection>
            )}

            {/* ═══════════ FILTERS SECTION ═══════════ */}
            <CollapsibleSection
              title="Filters"
              isOpen={openSections['filters'] ?? false}
              onToggle={(open) => toggleSection('filters', open)}
              activeCount={
                ((selectedObject.contrast ?? 100) !== 100 ? 1 : 0) +
                ((selectedObject.brightness ?? 100) !== 100 ? 1 : 0) +
                ((selectedObject.grayscale ?? 0) !== 0 ? 1 : 0) +
                (selectedObject.threshold ? 1 : 0) +
                ((selectedObject.blur ?? 0) !== 0 ? 1 : 0) +
                ((selectedObject.saturate ?? 100) !== 100 ? 1 : 0) +
                ((selectedObject.sepia ?? 0) !== 0 ? 1 : 0) +
                ((selectedObject.hueRotate ?? 0) !== 0 ? 1 : 0) +
                ((selectedObject.posterize ?? 32) !== 32 ? 1 : 0) +
                (selectedObject.invert ? 1 : 0) +
                (selectedObject.pixelate ? 1 : 0) +
                (selectedObject.colorize ? 1 : 0) +
                (selectedObject.duotone?.enabled ? 1 : 0)
              }
            >
            <div className="space-y-4">
              {/* Contrast */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Contrast
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[selectedObject.contrast ?? 100]}
                    onValueChange={([value]) => updateWithHistory({ contrast: value })}
                    max={200}
                    min={0}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-[11px] font-mono w-10 text-right">
                    {selectedObject.contrast ?? 100}%
                  </span>
                </div>
              </div>

              {/* Brightness */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Brightness
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[selectedObject.brightness ?? 100]}
                    onValueChange={([value]) => updateWithHistory({ brightness: value })}
                    max={200}
                    min={0}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-[11px] font-mono w-10 text-right">
                    {selectedObject.brightness ?? 100}%
                  </span>
                </div>
              </div>

              {/* Grayscale */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Grayscale
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[selectedObject.grayscale ?? 0]}
                    onValueChange={([value]) => updateWithHistory({ grayscale: value })}
                    max={100}
                    min={0}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-[11px] font-mono w-10 text-right">
                    {selectedObject.grayscale ?? 0}%
                  </span>
                </div>
              </div>

              {/* Threshold Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Threshold
                  </Label>
                  <button
                    onClick={() => updateWithHistory({ threshold: !selectedObject.threshold })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      selectedObject.threshold ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        selectedObject.threshold ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  High-contrast black & white xerox effect
                </p>
              </div>

              {/* Blur */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Blur
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[selectedObject.blur ?? 0]}
                    onValueChange={([value]) => updateWithHistory({ blur: value })}
                    max={20}
                    min={0}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-[11px] font-mono w-10 text-right">
                    {selectedObject.blur ?? 0}px
                  </span>
                </div>
              </div>

              {/* Saturate */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Saturate
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[selectedObject.saturate ?? 100]}
                    onValueChange={([value]) => updateWithHistory({ saturate: value })}
                    max={200}
                    min={0}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-[11px] font-mono w-10 text-right">
                    {selectedObject.saturate ?? 100}%
                  </span>
                </div>
              </div>

              {/* Sepia */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Sepia
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[selectedObject.sepia ?? 0]}
                    onValueChange={([value]) => updateWithHistory({ sepia: value })}
                    max={100}
                    min={0}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-[11px] font-mono w-10 text-right">
                    {selectedObject.sepia ?? 0}%
                  </span>
                </div>
              </div>

              {/* Hue Rotate - Circular Dial */}
              <HueRotateDial
                value={selectedObject.hueRotate ?? 0}
                onChange={(value) => updateWithHistory({ hueRotate: value })}
              />

              {/* Posterize */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Posterize
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[selectedObject.posterize ?? 32]}
                    onValueChange={([value]) => updateWithHistory({ posterize: value })}
                    max={32}
                    min={2}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-[11px] font-mono w-14 text-right">
                    {selectedObject.posterize ?? 32} lvl
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Reduce color levels (lower = more posterized)
                </p>
              </div>

              {/* Invert Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Invert
                  </Label>
                  <button
                    onClick={() => updateWithHistory({ invert: !selectedObject.invert })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      selectedObject.invert ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        selectedObject.invert ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Flip colors to negative
                </p>
              </div>

              {/* Pixelate Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Pixelate
                  </Label>
                  <button
                    onClick={() => updateWithHistory({ pixelate: !selectedObject.pixelate })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      selectedObject.pixelate ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        selectedObject.pixelate ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Lo-fi 8-bit effect (images only)
                </p>
              </div>

              {/* Colorize */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Colorize
                  </Label>
                  <button
                    onClick={() => updateWithHistory({
                      colorize: selectedObject.colorize ? null : '#00ff00'
                    })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      selectedObject.colorize ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        selectedObject.colorize ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {selectedObject.colorize && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedObject.colorize}
                        onChange={(e) => { addColor(e.target.value); updateWithHistory({ colorize: e.target.value }); }}
                        className="w-8 h-8 border border-border cursor-pointer bg-transparent"
                      />
                      <div className="flex gap-1">
                        {['#ccff00', '#ff6600', '#00ffff', '#ff00ff', '#ffffff'].map((color) => (
                          <button
                            key={color}
                            onClick={() => { addColor(color); updateWithHistory({ colorize: color }); }}
                            className={`w-6 h-6 border ${
                              selectedObject.colorize === color ? 'border-primary' : 'border-border'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <RecentColors
                      onSelect={(color) => { addColor(color); updateWithHistory({ colorize: color }); }}
                      currentColor={selectedObject.colorize}
                    />
                  </div>
                )}
                <p className="text-[9px] text-muted-foreground">
                  Tint the whole object in a single color
                </p>
              </div>

              {/* Duotone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Duotone
                  </Label>
                  <button
                    onClick={() => updateWithHistory({
                      duotone: {
                        enabled: !(selectedObject.duotone?.enabled),
                        color1: selectedObject.duotone?.color1 || '#000000',
                        color2: selectedObject.duotone?.color2 || '#ccff00',
                      }
                    })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      selectedObject.duotone?.enabled ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        selectedObject.duotone?.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {selectedObject.duotone?.enabled && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-[9px] text-muted-foreground w-16">Shadow</Label>
                      <input
                        type="color"
                        value={selectedObject.duotone?.color1 || '#000000'}
                        onChange={(e) => { addColor(e.target.value); updateWithHistory({
                          duotone: { ...selectedObject.duotone!, color1: e.target.value }
                        }); }}
                        className="w-8 h-6 border border-border cursor-pointer bg-transparent"
                      />
                      <div className="flex gap-1">
                        {['#000000', '#1a1a1a', '#0000ff', '#ff0000'].map((c) => (
                          <button
                            key={c}
                            onClick={() => { addColor(c); updateWithHistory({
                              duotone: { ...selectedObject.duotone!, color1: c }
                            }); }}
                            className="w-5 h-5 border border-border"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[9px] text-muted-foreground w-16">Highlight</Label>
                      <input
                        type="color"
                        value={selectedObject.duotone?.color2 || '#ccff00'}
                        onChange={(e) => { addColor(e.target.value); updateWithHistory({
                          duotone: { ...selectedObject.duotone!, color2: e.target.value }
                        }); }}
                        className="w-8 h-6 border border-border cursor-pointer bg-transparent"
                      />
                      <div className="flex gap-1">
                        {['#ccff00', '#00ffff', '#ff00ff', '#ffff00'].map((c) => (
                          <button
                            key={c}
                            onClick={() => { addColor(c); updateWithHistory({
                              duotone: { ...selectedObject.duotone!, color2: c }
                            }); }}
                            className="w-5 h-5 border border-border"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <RecentColors
                      onSelect={(color) => { addColor(color); updateWithHistory({ duotone: { ...selectedObject.duotone!, color1: color } }); }}
                      currentColor={selectedObject.duotone?.color1}
                    />
                  </div>
                )}
                <p className="text-[9px] text-muted-foreground">
                  Two-color tone mapping effect
                </p>
              </div>

              {/* Reset All Filters */}
              <button
                onClick={() => updateWithHistory({
                  hueRotate: 0,
                  invert: false,
                  pixelate: false,
                  contrast: 100,
                  brightness: 100,
                  grayscale: 0,
                  threshold: false,
                  colorize: null,
                  blur: 0,
                  saturate: 100,
                  sepia: 0,
                  posterize: 32,
                  duotone: { enabled: false, color1: '#000000', color2: '#ccff00' },
                })}
                className="w-full border border-border hover:border-primary transition-colors py-1.5 px-3 text-[10px] uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All Filters
              </button>
            </div>
            </CollapsibleSection>

            {/* ═══════════ EFFECTS SECTION ═══════════ */}
            <CollapsibleSection
              title="Effects"
              isOpen={openSections['effects'] ?? false}
              onToggle={(open) => toggleSection('effects', open)}
            >
              <ObjectEffects />
            </CollapsibleSection>

            {/* ═══════════ ADVANCED SECTION ═══════════ */}
            <CollapsibleSection
              title="Advanced"
              isOpen={openSections['advanced'] ?? false}
              onToggle={(open) => toggleSection('advanced', open)}
            >
              <div className="space-y-4">
                <AdvancedEffects />

                {/* Pattern Generator */}
                {(selectedObject.type === 'shape' || selectedObject.type === 'image' || selectedObject.type === 'sticker') && (
                  <div className="pt-4 border-t border-border space-y-4">
                    <div className="py-2">
                      <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                        Pattern Generator
                      </span>
                    </div>

                    {/* Gap Control */}
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Gap (spacing)
                      </Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[patternGap]}
                          onValueChange={([value]) => setPatternGap(value)}
                          max={30}
                          min={0}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-[11px] font-mono w-10 text-right">
                          {patternGap}px
                        </span>
                      </div>
                    </div>

                    {/* Random Rotation Control */}
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Random Rotation
                      </Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[patternRandomRotation]}
                          onValueChange={([value]) => setPatternRandomRotation(value)}
                          max={180}
                          min={0}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-[11px] font-mono w-10 text-right">
                          {patternRandomRotation}°
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">
                        0° = neat grid, 180° = chaotic sticker bomb
                      </p>
                    </div>

                    {/* Make Pattern Button */}
                    <button
                      onClick={() => {
                        if (selectedId) {
                          generatePattern(selectedId, patternGap, patternRandomRotation, DECK_WIDTH, DECK_HEIGHT);
                        }
                      }}
                      className="w-full bg-primary text-primary-foreground font-display text-sm uppercase tracking-wider py-2.5 px-4 border border-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Grid3X3 className="w-4 h-4" />
                      Make Pattern
                    </button>
                    <p className="text-[9px] text-muted-foreground text-center">
                      Tiles the selected sticker across the entire deck
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>
        ) : selectedIds.length > 1 ? (
          <MultiSelectInspector />
        ) : (
          <div className="p-4 text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Select an object
            </span>
          </div>
        )}
      </div>

      {/* Layer list */}
      <LayerList />

      {/* Font Upload Modal */}
      <ComponentErrorBoundary componentName="Custom Fonts" onReset={() => setIsFontModalOpen(false)}>
        <FontUploadModal
          isOpen={isFontModalOpen}
          onClose={() => setIsFontModalOpen(false)}
          onFontUploaded={async (font) => {
            // Add to list
            setUserFonts([...userFonts, font]);

            // Load font dynamically so it's immediately available
            try {
              await loadFont(font);
              toast.success(`Font "${font.name}" ready to use`, {
                description: 'Select it from the font dropdown',
                duration: 3000,
              });

              // Auto-apply to selected text if applicable
              if (selectedObject && selectedObject.type === 'text') {
                updateWithHistory({ fontFamily: font.font_family });
                toast.info('Applied to selected text', {
                  duration: 2000,
                });
              }
            } catch (err) {
              console.error('Failed to load font:', err);
              toast.error('Font uploaded but failed to load', {
                description: 'Try refreshing the page',
              });
            }
          }}
        />
      </ComponentErrorBoundary>
    </div>
  );
}
