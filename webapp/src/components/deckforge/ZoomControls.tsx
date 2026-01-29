import { ZoomIn, ZoomOut, Undo, Redo, Wrench } from 'lucide-react';
import { useDeckForgeStore } from '@/store/deckforge';
import { cn } from '@/lib/utils';

export function ZoomControls() {
  const { stageScale, setStageScale, undo, redo, past, future, showHardwareGuide, toggleHardwareGuide } = useDeckForgeStore();

  const zoomIn = () => setStageScale(stageScale * 1.2);
  const zoomOut = () => setStageScale(stageScale / 1.2);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card border border-border p-1 md:p-1">
      <button
        onClick={undo}
        disabled={past.length === 0}
        className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center hover:bg-secondary active:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-5 h-5 md:w-4 md:h-4" />
      </button>
      <button
        onClick={redo}
        disabled={future.length === 0}
        className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center hover:bg-secondary active:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo className="w-5 h-5 md:w-4 md:h-4" />
      </button>

      <div className="w-px h-8 md:h-6 bg-border mx-1" />

      <button
        onClick={zoomOut}
        className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center hover:bg-secondary active:bg-secondary/80 transition-colors touch-manipulation"
        title="Zoom Out"
      >
        <ZoomOut className="w-5 h-5 md:w-4 md:h-4" />
      </button>
      <span className="text-xs md:text-[10px] font-mono w-14 md:w-12 text-center text-muted-foreground">
        {Math.round(stageScale * 100)}%
      </span>
      <button
        onClick={zoomIn}
        className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center hover:bg-secondary active:bg-secondary/80 transition-colors touch-manipulation"
        title="Zoom In"
      >
        <ZoomIn className="w-5 h-5 md:w-4 md:h-4" />
      </button>

      <div className="w-px h-8 md:h-6 bg-border mx-1" />

      <button
        onClick={toggleHardwareGuide}
        className={cn(
          "w-10 h-10 md:w-8 md:h-8 flex items-center justify-center transition-colors touch-manipulation",
          showHardwareGuide
            ? "bg-accent text-accent-foreground"
            : "hover:bg-secondary active:bg-secondary/80"
        )}
        title="Show Hardware Guide (trucks & screws)"
      >
        <Wrench className="w-5 h-5 md:w-4 md:h-4" />
      </button>
    </div>
  );
}
