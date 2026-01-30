import { ZoomIn, ZoomOut, Undo, Redo, Wrench } from 'lucide-react';
import { useDeckForgeStore } from '@/store/deckforge';
import { cn } from '@/lib/utils';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';

export function ZoomControls() {
  const { stageScale, setStageScale, undo, redo, past, future, showHardwareGuide, toggleHardwareGuide } = useDeckForgeStore();

  // Haptic feedback helper for mobile
  const vibrate = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const zoomIn = () => {
    vibrate(10);
    setStageScale(stageScale * 1.2);
  };
  
  const zoomOut = () => {
    vibrate(10);
    setStageScale(stageScale / 1.2);
  };

  const handleUndo = () => {
    vibrate(10);
    undo();
  };

  const handleRedo = () => {
    vibrate(10);
    redo();
  };

  const handleToggleGuide = () => {
    vibrate(10);
    toggleHardwareGuide();
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card border border-border p-1 md:p-1 shadow-lg rounded-lg">
      <EnhancedTooltip content="Undo" shortcut="Ctrl+Z" side="top">
        <button
          onClick={handleUndo}
          disabled={past.length === 0}
          className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center hover:bg-secondary active:bg-secondary/80 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-manipulation rounded"
        >
          <Undo className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>

      <EnhancedTooltip content="Redo" shortcut="Ctrl+Shift+Z" side="top">
        <button
          onClick={handleRedo}
          disabled={future.length === 0}
          className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center hover:bg-secondary active:bg-secondary/80 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-manipulation rounded"
        >
          <Redo className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>

      <div className="w-px h-8 md:h-6 bg-border mx-1" />

      <EnhancedTooltip content="Zoom Out" shortcut="Ctrl+-" side="top">
        <button
          onClick={zoomOut}
          className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center hover:bg-secondary active:bg-secondary/80 active:scale-95 transition-all touch-manipulation rounded"
        >
          <ZoomOut className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>

      <span className="text-xs md:text-[10px] font-mono w-14 md:w-12 text-center text-muted-foreground">
        {Math.round(stageScale * 100)}%
      </span>

      <EnhancedTooltip content="Zoom In" shortcut="Ctrl+=" side="top">
        <button
          onClick={zoomIn}
          className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center hover:bg-secondary active:bg-secondary/80 active:scale-95 transition-all touch-manipulation rounded"
        >
          <ZoomIn className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>

      <div className="w-px h-8 md:h-6 bg-border mx-1" />

      <EnhancedTooltip 
        content={showHardwareGuide ? "Hide Hardware Guide" : "Show Hardware Guide"} 
        side="top"
      >
        <button
          onClick={handleToggleGuide}
          className={cn(
            "w-10 h-10 md:w-8 md:h-8 flex items-center justify-center transition-all active:scale-95 touch-manipulation rounded",
            showHardwareGuide
              ? "bg-accent text-accent-foreground"
              : "hover:bg-secondary active:bg-secondary/80"
          )}
        >
          <Wrench className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>
    </div>
  );
}
