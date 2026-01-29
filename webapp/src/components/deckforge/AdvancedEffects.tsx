import { useState } from 'react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Sparkles, Droplets, Sun, Filter } from 'lucide-react';

export function AdvancedEffects() {
  const { selectedId, objects, updateObject } = useDeckForgeStore();
  const [activeTab, setActiveTab] = useState<'gradient' | 'shadow' | 'glow' | 'filters'>('gradient');

  const selectedObject = objects.find(obj => obj.id === selectedId);

  if (!selectedId || !selectedObject) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Select an object to add effects
      </div>
    );
  }

  // Only show for shapes and text
  if (selectedObject.type !== 'shape' && selectedObject.type !== 'text' && selectedObject.type !== 'sticker') {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Effects only available for shapes, text, and stickers
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2 border-b border-border pb-2">
          <Button
            variant={activeTab === 'gradient' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('gradient')}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Gradient
          </Button>
          <Button
            variant={activeTab === 'shadow' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('shadow')}
          >
            <Droplets className="w-3 h-3 mr-1" />
            Shadow
          </Button>
          <Button
            variant={activeTab === 'glow' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('glow')}
          >
            <Sun className="w-3 h-3 mr-1" />
            Glow
          </Button>
          <Button
            variant={activeTab === 'filters' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('filters')}
          >
            <Filter className="w-3 h-3 mr-1" />
            Filters
          </Button>
        </div>

        {activeTab === 'gradient' && <GradientPanel object={selectedObject} updateObject={updateObject} />}
        {activeTab === 'shadow' && <ShadowPanel object={selectedObject} updateObject={updateObject} />}
        {activeTab === 'glow' && <GlowPanel object={selectedObject} updateObject={updateObject} />}
        {activeTab === 'filters' && <FiltersPanel object={selectedObject} updateObject={updateObject} />}
      </div>
    </ScrollArea>
  );
}

function GradientPanel({ object, updateObject }: {
  object: CanvasObject;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
}) {
  const fillType = object.fillType || 'solid';
  const gradientStops = object.gradientStops || [
    { offset: 0, color: '#ff0000' },
    { offset: 1, color: '#0000ff' },
  ];
  const gradientAngle = object.gradientAngle || 0;

  const setFillType = (type: 'solid' | 'linear-gradient' | 'radial-gradient') => {
    updateObject(object.id, {
      fillType: type,
      gradientStops: type !== 'solid' ? gradientStops : undefined,
      gradientAngle: type === 'linear-gradient' ? gradientAngle : undefined,
    });
  };

  const updateStop = (index: number, updates: Partial<typeof gradientStops[0]>) => {
    const newStops = [...gradientStops];
    newStops[index] = { ...newStops[index], ...updates };
    updateObject(object.id, { gradientStops: newStops });
  };

  const addStop = () => {
    const newStops = [
      ...gradientStops,
      { offset: 0.5, color: '#00ff00' },
    ].sort((a, b) => a.offset - b.offset);
    updateObject(object.id, { gradientStops: newStops });
  };

  const removeStop = (index: number) => {
    if (gradientStops.length <= 2) return; // Keep at least 2 stops
    const newStops = gradientStops.filter((_, i) => i !== index);
    updateObject(object.id, { gradientStops: newStops });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Fill Type</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={fillType === 'solid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFillType('solid')}
            className="text-xs"
          >
            Solid
          </Button>
          <Button
            variant={fillType === 'linear-gradient' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFillType('linear-gradient')}
            className="text-xs"
          >
            Linear
          </Button>
          <Button
            variant={fillType === 'radial-gradient' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFillType('radial-gradient')}
            className="text-xs"
          >
            Radial
          </Button>
        </div>
      </div>

      {fillType !== 'solid' && (
        <>
          {fillType === 'linear-gradient' && (
            <div className="space-y-2">
              <Label className="text-xs">Angle: {gradientAngle}°</Label>
              <Slider
                value={[gradientAngle]}
                onValueChange={([val]) => updateObject(object.id, { gradientAngle: val })}
                min={0}
                max={360}
                step={1}
              />
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Color Stops</Label>
              <Button size="sm" variant="ghost" onClick={addStop}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {gradientStops.map((stop, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(idx, { color: e.target.value })}
                  className="w-12 h-8 p-1 cursor-pointer"
                />
                <Slider
                  value={[stop.offset * 100]}
                  onValueChange={([val]) => updateStop(idx, { offset: val / 100 })}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {Math.round(stop.offset * 100)}%
                </span>
                {gradientStops.length > 2 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeStop(idx)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ShadowPanel({ object, updateObject }: {
  object: CanvasObject;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
}) {
  const shadow = object.dropShadow || {
    enabled: false,
    offsetX: 4,
    offsetY: 4,
    blur: 8,
    color: '#000000',
    opacity: 0.5,
  };

  const updateShadow = (updates: Partial<typeof shadow>) => {
    updateObject(object.id, {
      dropShadow: { ...shadow, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Drop Shadow</Label>
        <Switch
          checked={shadow.enabled}
          onCheckedChange={(enabled) => updateShadow({ enabled })}
        />
      </div>

      {shadow.enabled && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Offset X: {shadow.offsetX}px</Label>
            <Slider
              value={[shadow.offsetX]}
              onValueChange={([val]) => updateShadow({ offsetX: val })}
              min={-50}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Offset Y: {shadow.offsetY}px</Label>
            <Slider
              value={[shadow.offsetY]}
              onValueChange={([val]) => updateShadow({ offsetY: val })}
              min={-50}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Blur: {shadow.blur}px</Label>
            <Slider
              value={[shadow.blur]}
              onValueChange={([val]) => updateShadow({ blur: val })}
              min={0}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Opacity: {Math.round(shadow.opacity * 100)}%</Label>
            <Slider
              value={[shadow.opacity * 100]}
              onValueChange={([val]) => updateShadow({ opacity: val / 100 })}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Color</Label>
            <Input
              type="color"
              value={shadow.color}
              onChange={(e) => updateShadow({ color: e.target.value })}
              className="w-full h-10 cursor-pointer"
            />
          </div>
        </>
      )}
    </div>
  );
}

function GlowPanel({ object, updateObject }: {
  object: CanvasObject;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
}) {
  const glow = object.glow || {
    enabled: false,
    radius: 10,
    color: '#ffffff',
    intensity: 0.8,
  };

  const updateGlow = (updates: Partial<typeof glow>) => {
    updateObject(object.id, {
      glow: { ...glow, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Glow Effect</Label>
        <Switch
          checked={glow.enabled}
          onCheckedChange={(enabled) => updateGlow({ enabled })}
        />
      </div>

      {glow.enabled && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Radius: {glow.radius}px</Label>
            <Slider
              value={[glow.radius]}
              onValueChange={([val]) => updateGlow({ radius: val })}
              min={0}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Intensity: {Math.round(glow.intensity * 100)}%</Label>
            <Slider
              value={[glow.intensity * 100]}
              onValueChange={([val]) => updateGlow({ intensity: val / 100 })}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Color</Label>
            <Input
              type="color"
              value={glow.color}
              onChange={(e) => updateGlow({ color: e.target.value })}
              className="w-full h-10 cursor-pointer"
            />
          </div>
        </>
      )}
    </div>
  );
}

function FiltersPanel({ object, updateObject }: {
  object: CanvasObject;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
}) {
  const duotone = object.duotone || {
    enabled: false,
    color1: '#000000',
    color2: '#ccff00',
  };

  const updateDuotone = (updates: Partial<typeof duotone>) => {
    updateObject(object.id, {
      duotone: { ...duotone, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      {/* Blur */}
      <div className="space-y-2">
        <Label className="text-xs">Blur: {object.blur || 0}px</Label>
        <Slider
          value={[object.blur || 0]}
          onValueChange={([val]) => updateObject(object.id, { blur: val })}
          min={0}
          max={20}
          step={0.5}
        />
        <p className="text-[9px] text-muted-foreground">
          Gaussian blur effect (0-20px)
        </p>
      </div>

      <Separator />

      {/* Saturate */}
      <div className="space-y-2">
        <Label className="text-xs">Saturation: {object.saturate || 100}%</Label>
        <Slider
          value={[object.saturate || 100]}
          onValueChange={([val]) => updateObject(object.id, { saturate: val })}
          min={0}
          max={200}
          step={5}
        />
        <p className="text-[9px] text-muted-foreground">
          0% = grayscale, 100% = normal, 200% = hyper-saturated
        </p>
      </div>

      <Separator />

      {/* Sepia */}
      <div className="space-y-2">
        <Label className="text-xs">Sepia: {object.sepia || 0}%</Label>
        <Slider
          value={[object.sepia || 0]}
          onValueChange={([val]) => updateObject(object.id, { sepia: val })}
          min={0}
          max={100}
          step={5}
        />
        <p className="text-[9px] text-muted-foreground">
          Vintage photo tone effect
        </p>
      </div>

      <Separator />

      {/* Posterize */}
      <div className="space-y-2">
        <Label className="text-xs">Posterize: {object.posterize || 32} levels</Label>
        <Slider
          value={[object.posterize || 32]}
          onValueChange={([val]) => updateObject(object.id, { posterize: val })}
          min={2}
          max={32}
          step={1}
        />
        <p className="text-[9px] text-muted-foreground">
          Reduce color levels (lower = more posterized)
        </p>
      </div>

      <Separator />

      {/* Duotone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Duotone Effect</Label>
          <Switch
            checked={duotone.enabled}
            onCheckedChange={(enabled) => updateDuotone({ enabled })}
          />
        </div>

        {duotone.enabled && (
          <>
            <div className="space-y-2">
              <Label className="text-xs">Shadow Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={duotone.color1}
                  onChange={(e) => updateDuotone({ color1: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <div className="flex gap-1 flex-1">
                  {['#000000', '#1a1a1a', '#0000ff', '#ff0000'].map((color) => (
                    <button
                      key={color}
                      onClick={() => updateDuotone({ color1: color })}
                      className="w-8 h-8 border border-border hover:border-primary transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Highlight Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={duotone.color2}
                  onChange={(e) => updateDuotone({ color2: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <div className="flex gap-1 flex-1">
                  {['#ccff00', '#00ffff', '#ff00ff', '#ffff00'].map((color) => (
                    <button
                      key={color}
                      onClick={() => updateDuotone({ color2: color })}
                      className="w-8 h-8 border border-border hover:border-primary transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground">
              Classic punk/skate magazine effect
            </p>
          </>
        )}
      </div>

      <Separator />

      {/* Reset Button */}
      <Button
        onClick={() => updateObject(object.id, {
          blur: 0,
          saturate: 100,
          sepia: 0,
          posterize: 32,
          duotone: { enabled: false, color1: '#000000', color2: '#ccff00' },
        })}
        variant="outline"
        size="sm"
        className="w-full"
      >
        Reset All Filters
      </Button>
    </div>
  );
}
