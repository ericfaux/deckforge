import { ZoomIn, ZoomOut, Undo, Redo, Wrench } from 'lucide-react';
import { useDeckForgeStore } from '@/store/deckforge';
import { cn } from '@/lib/utils';

export function ZoomControls() {
  const { stageScale, setStageScale, undo, redo, past, future, showHardwareGuide, toggleHardwareGuide } = useDeckForgeStore();

  const zoomIn = () => setStageScale(stageScale * 1.2);
  const zoomOut = () => setStageScale(stageScale / 1.2);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card border border-border p-1">
      <button
        onClick={undo}
        disabled={past.length === 0}
        className="w-8 h-8 flex items-center justify-center hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        onClick={redo}
        disabled={future.length === 0}
        className="w-8 h-8 flex items-center justify-center hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        onClick={zoomOut}
        className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-[10px] font-mono w-12 text-center text-muted-foreground">
        {Math.round(stageScale * 100)}%
      </span>
      <button
        onClick={zoomIn}
        className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        onClick={toggleHardwareGuide}
        className={cn(
          "w-8 h-8 flex items-center justify-center transition-colors",
          showHardwareGuide
            ? "bg-accent text-accent-foreground"
            : "hover:bg-secondary"
        )}
        title="Show Hardware Guide (trucks & screws)"
      >
        <Wrench className="w-4 h-4" />
      </button>
    </div>
  );
}
