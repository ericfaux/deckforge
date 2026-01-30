import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function ObjectEffects() {
  const { selectedId, objects, updateObject, saveToHistory } = useDeckForgeStore();
  const selectedObject = objects.find((obj) => obj.id === selectedId);

  if (!selectedObject) return null;

  const updateWithHistory = (updates: Partial<CanvasObject>) => {
    if (!selectedId) return;
    saveToHistory();
    updateObject(selectedId, updates);
  };

  return (
    <Accordion type="multiple" className="border-t border-border">
      {/* Drop Shadow */}
      <AccordionItem value="drop-shadow">
        <AccordionTrigger className="text-[10px] uppercase tracking-widest text-muted-foreground py-2">
          Drop Shadow {selectedObject.dropShadow?.enabled && '✓'}
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedObject.dropShadow?.enabled || false}
              onChange={(e) => updateWithHistory({
                dropShadow: {
                  enabled: e.target.checked,
                  offsetX: selectedObject.dropShadow?.offsetX || 4,
                  offsetY: selectedObject.dropShadow?.offsetY || 4,
                  blur: selectedObject.dropShadow?.blur || 8,
                  color: selectedObject.dropShadow?.color || 'rgba(0,0,0,0.5)',
                }
              })}
              className="w-4 h-4"
            />
            <Label className="text-xs">Enable Drop Shadow</Label>
          </div>

          {selectedObject.dropShadow?.enabled && (
            <>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Offset X: {selectedObject.dropShadow?.offsetX || 0}px
                </Label>
                <Slider
                  value={[selectedObject.dropShadow?.offsetX || 4]}
                  onValueChange={([value]) => updateWithHistory({
                    dropShadow: { ...selectedObject.dropShadow!, offsetX: value }
                  })}
                  max={50}
                  min={-50}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Offset Y: {selectedObject.dropShadow?.offsetY || 0}px
                </Label>
                <Slider
                  value={[selectedObject.dropShadow?.offsetY || 4]}
                  onValueChange={([value]) => updateWithHistory({
                    dropShadow: { ...selectedObject.dropShadow!, offsetY: value }
                  })}
                  max={50}
                  min={-50}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Blur: {selectedObject.dropShadow?.blur || 0}px
                </Label>
                <Slider
                  value={[selectedObject.dropShadow?.blur || 8]}
                  onValueChange={([value]) => updateWithHistory({
                    dropShadow: { ...selectedObject.dropShadow!, blur: value }
                  })}
                  max={50}
                  min={0}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Shadow Color
                </Label>
                <input
                  type="color"
                  value={selectedObject.dropShadow?.color?.replace(/rgba?\(|\)|[\s,]+/g, '#') || '#000000'}
                  onChange={(e) => updateWithHistory({
                    dropShadow: { ...selectedObject.dropShadow!, color: e.target.value }
                  })}
                  className="w-full h-8 cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Opacity: {Math.round((selectedObject.dropShadow?.opacity || 0.5) * 100)}%
                </Label>
                <Slider
                  value={[selectedObject.dropShadow?.opacity || 0.5]}
                  onValueChange={([value]) => updateWithHistory({
                    dropShadow: { ...selectedObject.dropShadow!, opacity: value }
                  })}
                  max={1}
                  min={0}
                  step={0.05}
                />
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Glow Effect */}
      <AccordionItem value="glow">
        <AccordionTrigger className="text-[10px] uppercase tracking-widest text-muted-foreground py-2">
          Glow {selectedObject.glow?.enabled && '✓'}
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedObject.glow?.enabled || false}
              onChange={(e) => updateWithHistory({
                glow: {
                  enabled: e.target.checked,
                  blur: selectedObject.glow?.blur || 15,
                  color: selectedObject.glow?.color || '#ffffff',
                  opacity: selectedObject.glow?.opacity || 0.8,
                }
              })}
              className="w-4 h-4"
            />
            <Label className="text-xs">Enable Glow</Label>
          </div>

          {selectedObject.glow?.enabled && (
            <>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Blur: {selectedObject.glow?.blur || 0}px
                </Label>
                <Slider
                  value={[selectedObject.glow?.blur || 15]}
                  onValueChange={([value]) => updateWithHistory({
                    glow: { ...selectedObject.glow!, blur: value }
                  })}
                  max={50}
                  min={0}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Glow Color
                </Label>
                <input
                  type="color"
                  value={selectedObject.glow?.color || '#ffffff'}
                  onChange={(e) => updateWithHistory({
                    glow: { ...selectedObject.glow!, color: e.target.value }
                  })}
                  className="w-full h-8 cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Opacity: {Math.round((selectedObject.glow?.opacity || 0.8) * 100)}%
                </Label>
                <Slider
                  value={[selectedObject.glow?.opacity || 0.8]}
                  onValueChange={([value]) => updateWithHistory({
                    glow: { ...selectedObject.glow!, opacity: value }
                  })}
                  max={1}
                  min={0}
                  step={0.05}
                />
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Stroke Outline */}
      <AccordionItem value="outline">
        <AccordionTrigger className="text-[10px] uppercase tracking-widest text-muted-foreground py-2">
          Outline Stroke {selectedObject.outlineStroke?.enabled && '✓'}
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedObject.outlineStroke?.enabled || false}
              onChange={(e) => updateWithHistory({
                outlineStroke: {
                  enabled: e.target.checked,
                  width: selectedObject.outlineStroke?.width || 2,
                  color: selectedObject.outlineStroke?.color || '#000000',
                }
              })}
              className="w-4 h-4"
            />
            <Label className="text-xs">Enable Outline</Label>
          </div>

          {selectedObject.outlineStroke?.enabled && (
            <>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Width: {selectedObject.outlineStroke?.width || 0}px
                </Label>
                <Slider
                  value={[selectedObject.outlineStroke?.width || 2]}
                  onValueChange={([value]) => updateWithHistory({
                    outlineStroke: { ...selectedObject.outlineStroke!, width: value }
                  })}
                  max={20}
                  min={0.5}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Stroke Color
                </Label>
                <input
                  type="color"
                  value={selectedObject.outlineStroke?.color || '#000000'}
                  onChange={(e) => updateWithHistory({
                    outlineStroke: { ...selectedObject.outlineStroke!, color: e.target.value }
                  })}
                  className="w-full h-8 cursor-pointer"
                />
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
