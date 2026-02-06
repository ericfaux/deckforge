import { ZoomIn, ZoomOut, Undo, Redo, Wrench, Scan, Ruler, FlipVertical2 } from 'lucide-react';
import { useDeckForgeStore } from '@/store/deckforge';
import { cn } from '@/lib/utils';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';

export function ZoomControls() {
  const {
    stageScale, setStageScale, undo, redo, past, future,
    showHardwareGuide, toggleHardwareGuide,
    showBleedSafeZone, toggleBleedSafeZone,
    measureToolActive, toggleMeasureTool,
    showSymmetryGuide, toggleSymmetryGuide,
  } = useDeckForgeStore();

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

  const btnClass = "w-12 h-12 md:w-9 md:h-9 flex items-center justify-center transition-all active:scale-95 touch-manipulation rounded touch-target";
  const btnDefault = "hover:bg-secondary active:bg-secondary/80";
  const btnActive = "bg-accent text-accent-foreground";

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card border border-border p-1 md:p-1 shadow-lg rounded-lg">
      <EnhancedTooltip content="Undo" shortcut="Ctrl+Z" side="top">
        <button
          onClick={handleUndo}
          disabled={past.length === 0}
          className="w-12 h-12 md:w-9 md:h-9 flex items-center justify-center hover:bg-secondary active:bg-secondary/80 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-manipulation rounded touch-target"
        >
          <Undo className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>

      <EnhancedTooltip content="Redo" shortcut="Ctrl+Shift+Z" side="top">
        <button
          onClick={handleRedo}
          disabled={future.length === 0}
          className="w-12 h-12 md:w-9 md:h-9 flex items-center justify-center hover:bg-secondary active:bg-secondary/80 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-manipulation rounded touch-target"
        >
          <Redo className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>

      <div className="w-px h-10 md:h-7 bg-border mx-0.5" />

      <EnhancedTooltip content="Zoom Out" shortcut="Ctrl+-" side="top">
        <button
          onClick={zoomOut}
          className={cn(btnClass, btnDefault)}
        >
          <ZoomOut className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>

      <span className="text-xs md:text-[10px] font-mono w-12 md:w-10 text-center text-muted-foreground">
        {Math.round(stageScale * 100)}%
      </span>

      <EnhancedTooltip content="Zoom In" shortcut="Ctrl+=" side="top">
        <button
          onClick={zoomIn}
          className={cn(btnClass, btnDefault)}
        >
          <ZoomIn className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>

      <div className="w-px h-10 md:h-7 bg-border mx-0.5" />

      <EnhancedTooltip
        content={showHardwareGuide ? "Hide Hardware Guide" : "Show Hardware Guide"}
        shortcut="H"
        side="top"
      >
        <button
          onClick={() => { vibrate(10); toggleHardwareGuide(); }}
          className={cn(btnClass, showHardwareGuide ? btnActive : btnDefault)}
        >
          <Wrench className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>

      <EnhancedTooltip
        content={showBleedSafeZone ? "Hide Bleed & Safe Zones" : "Show Bleed & Safe Zones"}
        shortcut="Ctrl+Shift+B"
        side="top"
      >
        <button
          onClick={() => { vibrate(10); toggleBleedSafeZone(); }}
          className={cn(btnClass, showBleedSafeZone ? btnActive : btnDefault)}
        >
          <Scan className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>

      <EnhancedTooltip
        content={measureToolActive ? "Disable Measure Tool" : "Enable Measure Tool"}
        side="top"
      >
        <button
          onClick={() => { vibrate(10); toggleMeasureTool(); }}
          className={cn(btnClass, measureToolActive ? btnActive : btnDefault)}
        >
          <Ruler className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>

      <EnhancedTooltip
        content={showSymmetryGuide ? "Hide Symmetry Guide" : "Show Symmetry Guide"}
        side="top"
      >
        <button
          onClick={() => { vibrate(10); toggleSymmetryGuide(); }}
          className={cn(btnClass, showSymmetryGuide ? btnActive : btnDefault)}
        >
          <FlipVertical2 className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </EnhancedTooltip>
    </div>
  );
}
