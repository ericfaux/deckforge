import { useState } from 'react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Sparkles, Droplets, Sun } from 'lucide-react';

export function AdvancedEffects() {
  const { selectedId, objects, updateObject } = useDeckForgeStore();
  const [activeTab, setActiveTab] = useState<'gradient' | 'shadow' | 'glow'>('gradient');

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
        <div className="flex gap-2 border-b border-border">
          <Button
            variant={activeTab === 'gradient' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('gradient')}
            className="flex-1"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Gradient
          </Button>
          <Button
            variant={activeTab === 'shadow' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('shadow')}
            className="flex-1"
          >
            <Droplets className="w-3 h-3 mr-1" />
            Shadow
          </Button>
          <Button
            variant={activeTab === 'glow' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('glow')}
            className="flex-1"
          >
            <Sun className="w-3 h-3 mr-1" />
            Glow
          </Button>
        </div>

        {activeTab === 'gradient' && <GradientPanel object={selectedObject} updateObject={updateObject} />}
        {activeTab === 'shadow' && <ShadowPanel object={selectedObject} updateObject={updateObject} />}
        {activeTab === 'glow' && <GlowPanel object={selectedObject} updateObject={updateObject} />}
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
