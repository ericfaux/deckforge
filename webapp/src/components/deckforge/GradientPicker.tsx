import { useState } from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GradientPreset {
  id: string;
  name: string;
  gradient: string;
  stops: Array<{ offset: number; color: string }>;
  angle?: number;
}

const gradientPresets: GradientPreset[] = [
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ee5a6f 100%)',
    stops: [
      { offset: 0, color: '#ff6b6b' },
      { offset: 0.5, color: '#feca57' },
      { offset: 1, color: '#ee5a6f' },
    ],
    angle: 135,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    stops: [
      { offset: 0, color: '#667eea' },
      { offset: 1, color: '#764ba2' },
    ],
    angle: 135,
  },
  {
    id: 'fire',
    name: 'Fire',
    gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
    stops: [
      { offset: 0, color: '#f12711' },
      { offset: 1, color: '#f5af19' },
    ],
    angle: 135,
  },
  {
    id: 'mint',
    name: 'Mint',
    gradient: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
    stops: [
      { offset: 0, color: '#00d2ff' },
      { offset: 1, color: '#3a7bd5' },
    ],
    angle: 135,
  },
  {
    id: 'purple',
    name: 'Purple Haze',
    gradient: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
    stops: [
      { offset: 0, color: '#8e2de2' },
      { offset: 1, color: '#4a00e0' },
    ],
    angle: 135,
  },
  {
    id: 'neon',
    name: 'Neon',
    gradient: 'linear-gradient(135deg, #ccff00 0%, #00ffff 100%)',
    stops: [
      { offset: 0, color: '#ccff00' },
      { offset: 1, color: '#00ffff' },
    ],
    angle: 135,
  },
];

interface GradientPickerProps {
  currentFill?: string;
  onApplyGradient: (stops: Array<{ offset: number; color: string }>, angle: number) => void;
  onApplySolid: (color: string) => void;
}

export function GradientPicker({ currentFill, onApplyGradient, onApplySolid }: GradientPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <input
            type="color"
            value={currentFill || '#ffffff'}
            onChange={(e) => onApplySolid(e.target.value)}
            className="w-8 h-8 border border-border cursor-pointer bg-transparent"
          />
          <Input
            type="text"
            value={currentFill || '#ffffff'}
            onChange={(e) => onApplySolid(e.target.value)}
            className="h-8 text-xs font-mono bg-secondary border-border flex-1"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-1.5 shrink-0"
          title="Apply gradient fill"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[10px]">Gradient</span>
        </Button>
      </div>

      {isOpen && (
        <div className="p-3 border border-accent/30 bg-accent/5 rounded space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Palette className="w-3 h-3" />
              Gradient Presets
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[9px] text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {gradientPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onApplyGradient(preset.stops, preset.angle || 0);
                  toast.success(`Applied ${preset.name} gradient`);
                  setIsOpen(false);
                }}
                className="group space-y-1.5"
              >
                <div
                  className={cn(
                    "h-12 rounded border border-border group-hover:border-primary transition-colors",
                    "group-hover:scale-105 transform transition-transform"
                  )}
                  style={{ background: preset.gradient }}
                />
                <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition-colors block text-center">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-[9px] text-muted-foreground">
              💡 Tip: After applying a gradient, adjust colors and angle in the Advanced panel below
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
