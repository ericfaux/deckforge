import { useState } from 'react';
import { Pipette, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeckForgeStore } from '@/store/deckforge';
import toast from 'react-hot-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  showEyedropper?: boolean;
}

export function ColorPicker({ value, onChange, label, showEyedropper = true }: ColorPickerProps) {
  const [isEyedropperOpen, setIsEyedropperOpen] = useState(false);
  const { objects } = useDeckForgeStore();

  // Extract unique colors from canvas objects
  const canvasColors = Array.from(
    new Set(
      objects
        .flatMap((obj) => [obj.fill, obj.stroke, obj.colorize])
        .filter((color): color is string => !!color && color !== 'none')
    )
  ).slice(0, 12); // Limit to 12 most recent colors

  const handlePickColor = (color: string) => {
    onChange(color);
    setIsEyedropperOpen(false);
    toast.success('Color picked!', {
      description: color.toUpperCase(),
    });
  };

  const presetColors = [
    '#000000', '#ffffff', '#ccff00', '#ff6600', 
    '#00ffff', '#ff00ff', '#ff0000', '#00ff00',
  ];

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium block">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-2">
        {/* Current color swatch */}
        <div 
          className="w-10 h-10 rounded border-2 border-border shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0"
          style={{ backgroundColor: value }}
          title={value}
        />

        {/* Color input */}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-10 border border-border rounded cursor-pointer min-w-0"
        />

        {/* Eyedropper tool */}
        {showEyedropper && canvasColors.length > 0 && (
          <Popover open={isEyedropperOpen} onOpenChange={setIsEyedropperOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 shrink-0"
                title="Pick color from canvas"
              >
                <Pipette className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Pick from canvas</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsEyedropperOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {canvasColors.map((color, idx) => (
                    <button
                      key={`${color}-${idx}`}
                      onClick={() => handlePickColor(color)}
                      className={`w-9 h-9 rounded border-2 transition-all hover:scale-110 ${
                        value.toLowerCase() === color.toLowerCase()
                          ? 'border-accent ring-2 ring-accent/30'
                          : 'border-border/50 hover:border-accent/50'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Colors from your design
                </p>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Preset color swatches */}
      <div className="grid grid-cols-8 gap-1.5">
        {presetColors.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
              value.toLowerCase() === color.toLowerCase()
                ? 'border-accent ring-2 ring-accent/30'
                : 'border-border/50'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Hex input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '') {
              onChange(val);
            }
          }}
          placeholder="#000000"
          maxLength={7}
          className="flex-1 h-8 px-2 text-xs font-mono border border-border rounded bg-background"
        />
      </div>
    </div>
  );
}
