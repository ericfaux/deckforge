import { Download, Grid3X3, RotateCcw, ChevronDown, Type, Lock, Unlock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayerList } from './LayerList';
import { AdvancedEffects } from './AdvancedEffects';
import { FontUploadModal } from './FontUploadModal';
import { GradientPicker } from './GradientPicker';
import { ColorPicker } from './ColorPicker';
import { DECK_WIDTH, DECK_HEIGHT } from './WorkbenchStage';
import { preloadUserFonts, Font, loadFont } from '@/lib/fonts';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function Inspector() {
  const { objects, selectedId, updateObject, saveToHistory, generatePattern } = useDeckForgeStore();
  const selectedObject = objects.find((obj) => obj.id === selectedId);

  // Pattern generator state
  const [patternGap, setPatternGap] = useState(5);
  const [patternRandomRotation, setPatternRandomRotation] = useState(0);

  // Font management state
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [userFonts, setUserFonts] = useState<Font[]>([]);

  // Load user fonts on mount
  useEffect(() => {
    preloadUserFonts().then(setUserFonts);
  }, []);

  const handleExport = () => {
    // Export functionality - placeholder for now
    alert('Export feature coming soon! The deck design will be exported as a high-resolution PNG.');
  };

  const updateWithHistory = (updates: Partial<CanvasObject>) => {
    if (!selectedId) return;
    saveToHistory();
    updateObject(selectedId, updates);
  };

  const { backgroundColor, setBackgroundColor } = useDeckForgeStore();

  return (
    <div className="w-64 bg-card border-l border-border h-full flex flex-col">
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

      {/* Background Color Picker */}
      <div className="p-3 border-b border-border space-y-2">
        <ColorPicker
          label="Deck Background"
          value={backgroundColor}
          onChange={setBackgroundColor}
          showEyedropper={true}
        />
      </div>

      {/* Properties panel */}
      <div className="flex-1 overflow-auto">
        {selectedObject ? (
          <div className="p-3 space-y-4">
            <div className="py-2 border-b border-border flex items-center justify-between">
              <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                Properties
              </span>
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
                    value={selectedObject.scaleX.toFixed(2)}
                    onChange={(e) => updateWithHistory({ scaleX: Number(e.target.value) })}
                    className="h-8 text-xs font-mono bg-secondary border-border"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground">Y</span>
                  <Input
                    type="number"
                    step="0.1"
                    value={selectedObject.scaleY.toFixed(2)}
                    onChange={(e) => updateWithHistory({ scaleY: Number(e.target.value) })}
                    className="h-8 text-xs font-mono bg-secondary border-border"
                  />
                </div>
              </div>
            </div>

            {/* Color (for text/shapes) */}
            {(selectedObject.type === 'text' || selectedObject.type === 'shape') && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Color
                </Label>
                <GradientPicker
                  currentFill={selectedObject.fill}
                  onApplySolid={(color) => updateWithHistory({ fill: color })}
                  onApplyGradient={(stops, angle) => {
                    updateWithHistory({
                      gradientType: 'linear',
                      gradientStops: stops,
                      gradientAngle: angle,
                      fill: stops[0].color, // Fallback color
                    });
                  }}
                />
              </div>
            )}

            {/* Color Tint (for images/paths) */}
            {(selectedObject.type === 'image' || selectedObject.type === 'path') && (
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
                  <ColorPicker
                    label=""
                    value={selectedObject.colorize}
                    onChange={(color) => updateWithHistory({ colorize: color })}
                    showEyedropper={true}
                  />
                )}
                <p className="text-[9px] text-muted-foreground">
                  Apply a color overlay to the {selectedObject.type}
                </p>
              </div>
            )}

            {/* Sticker-specific controls */}
            {selectedObject.type === 'sticker' && (
              <div className="pt-4 border-t border-border space-y-4">
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
                    <ColorPicker
                      label=""
                      value={selectedObject.colorize}
                      onChange={(color) => updateWithHistory({ colorize: color })}
                      showEyedropper={true}
                    />
                  )}
                  <p className="text-[9px] text-muted-foreground">
                    Tint the sticker with a solid color
                  </p>
                </div>

                {/* Stroke Color */}
                <ColorPicker
                  label="Stroke Color"
                  value={selectedObject.stroke || '#ffffff'}
                  onChange={(color) => updateWithHistory({ stroke: color })}
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
                <ColorPicker
                  label="Stroke Color"
                  value={selectedObject.stroke || '#ffffff'}
                  onChange={(color) => updateWithHistory({ stroke: color })}
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

            {/* Text specific */}
            {selectedObject.type === 'text' && (
              <>
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
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Font Family {userFonts.length > 0 && (
                        <span className="text-accent font-normal">
                          ({userFonts.length} custom)
                        </span>
                      )}
                    </Label>
                    <button
                      onClick={() => setIsFontModalOpen(true)}
                      className="text-[10px] uppercase tracking-widest text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                    >
                      <Type className="w-3 h-3" />
                      {userFonts.length > 0 ? 'Manage' : 'Upload'}
                    </button>
                  </div>
                  <select
                    value={selectedObject.fontFamily || 'Arial'}
                    onChange={(e) => updateWithHistory({ fontFamily: e.target.value })}
                    className="w-full h-8 text-xs bg-secondary border border-border px-2 cursor-pointer hover:border-primary transition-colors"
                  >
                    {userFonts.length > 0 && (
                      <optgroup label="✨ Your Custom Fonts">
                        {userFonts.map((font) => (
                          <option key={font.id} value={font.font_family}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="System Fonts">
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Impact">Impact</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                    </optgroup>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Font Size
                  </Label>
                  <Input
                    type="number"
                    value={selectedObject.fontSize || 24}
                    onChange={(e) => updateWithHistory({ fontSize: Number(e.target.value) })}
                    className="h-8 text-xs font-mono bg-secondary border-border"
                  />
                </div>
              </>
            )}

            {/* Filters Section - Punk Zine Aesthetic */}
            <div className="pt-4 border-t border-border space-y-4">
              <div className="py-2">
                <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                  Filters
                </span>
              </div>

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
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="color"
                      value={selectedObject.colorize}
                      onChange={(e) => updateWithHistory({ colorize: e.target.value })}
                      className="w-8 h-8 border border-border cursor-pointer bg-transparent"
                    />
                    <div className="flex gap-1">
                      {['#ccff00', '#ff6600', '#00ffff', '#ff00ff', '#ffffff'].map((color) => (
                        <button
                          key={color}
                          onClick={() => updateWithHistory({ colorize: color })}
                          className={`w-6 h-6 border ${
                            selectedObject.colorize === color ? 'border-primary' : 'border-border'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[9px] text-muted-foreground">
                  Cast in a single punk zine color
                </p>
              </div>
            </div>

            {/* Remix Toolbar Section */}
            <div className="pt-4 border-t border-border space-y-4">
              <div className="py-2">
                <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                  Remix Effects
                </span>
              </div>

              {/* Hue Shift */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Hue Shift
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[selectedObject.hueRotate ?? 0]}
                    onValueChange={([value]) => updateWithHistory({ hueRotate: value })}
                    max={360}
                    min={0}
                    step={15}
                    className="flex-1"
                  />
                  <span className="text-[11px] font-mono w-10 text-right">
                    {selectedObject.hueRotate ?? 0}°
                  </span>
                </div>
                <div
                  className="h-3 w-full rounded"
                  style={{
                    background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                  }}
                />
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

              {/* Reset Remix Button */}
              <button
                onClick={() => updateWithHistory({
                  hueRotate: 0,
                  invert: false,
                  pixelate: false,
                  contrast: 100,
                  brightness: 100,
                  grayscale: 0,
                  threshold: false,
                  colorize: null
                })}
                className="w-full border border-border hover:border-primary transition-colors py-1.5 px-3 text-[10px] uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All Filters
              </button>
            </div>

            {/* Advanced Effects Section */}
            <Accordion type="single" collapsible className="border-t border-border">
              <AccordionItem value="effects" className="border-none">
                <AccordionTrigger className="py-3 px-0 hover:no-underline">
                  <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                    Advanced Effects
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <AdvancedEffects />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Pattern Generator Section */}
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
    </div>
  );
}
