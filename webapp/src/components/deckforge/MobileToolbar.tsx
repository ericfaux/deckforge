import { useState } from 'react';
import {
  Save, 
  Download, 
  Undo, 
  Redo, 
  Layers, 
  Settings, 
  Clock,
  Menu,
  X,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { useDeckForgeStore } from '@/store/deckforge';
import { cn } from '@/lib/utils';

interface MobileToolbarProps {
  onSave: () => void;
  onExport: () => void;
  onOpenHistory: () => void;
  onOpenInspector: () => void;
  onOpenLayers: () => void;
  isSaving: boolean;
  isExporting: boolean;
  localSaveStatus?: 'idle' | 'saved';
}

export function MobileToolbar({
  onSave,
  onExport,
  onOpenHistory,
  onOpenInspector,
  onOpenLayers,
  isSaving,
  isExporting,
  localSaveStatus = 'idle',
}: MobileToolbarProps) {
  const { undo, redo, past, future, selectedId, deleteObject } = useDeckForgeStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Haptic feedback helper
  const vibrate = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleUndo = () => {
    vibrate(10);
    undo();
  };

  const handleRedo = () => {
    vibrate(10);
    redo();
  };

  const handleDelete = () => {
    if (selectedId) {
      vibrate([10, 50, 10]); // Double vibration for destructive action
      deleteObject(selectedId);
    }
  };

  return (
    <>
      {/* Overlay when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Mobile toolbar */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 transition-all duration-300',
          isExpanded ? 'h-48' : 'h-14'
        )}
      >
        {/* Expand/collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -top-8 right-4 w-12 h-8 bg-card border border-border border-b-0 rounded-t-lg flex items-center justify-center hover:bg-secondary transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </button>

        {/* Main toolbar */}
        <div className="h-14 flex items-center justify-around px-1">
          <button
            onClick={handleUndo}
            disabled={past.length === 0}
            className="flex flex-col items-center gap-0.5 p-2 min-w-[56px] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            <Undo className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">Undo</span>
          </button>

          <button
            onClick={handleRedo}
            disabled={future.length === 0}
            className="flex flex-col items-center gap-0.5 p-2 min-w-[56px] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            <Redo className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">Redo</span>
          </button>

          {selectedId && (
            <button
              onClick={handleDelete}
              className="flex flex-col items-center gap-0.5 p-2 min-w-[56px] text-destructive active:scale-95 transition-transform"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-wider">Delete</span>
            </button>
          )}

          <button
            onClick={() => { vibrate(10); onOpenLayers(); }}
            className="flex flex-col items-center gap-0.5 p-2 min-w-[56px] active:scale-95 transition-transform"
          >
            <Layers className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">Layers</span>
          </button>

          <button
            onClick={() => { vibrate(10); onOpenInspector(); }}
            className="flex flex-col items-center gap-0.5 p-2 min-w-[56px] active:scale-95 transition-transform"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">Props</span>
          </button>

          <button
            onClick={() => { vibrate(10); onOpenHistory(); }}
            className="flex flex-col items-center gap-0.5 p-2 min-w-[56px] active:scale-95 transition-transform"
          >
            <Clock className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">History</span>
          </button>
        </div>

        {/* Expanded section */}
        {isExpanded && (
          <div className="border-t border-border p-3 space-y-2">
            {localSaveStatus === 'saved' && (
              <div className="flex items-center justify-center gap-1.5 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-[11px] text-green-600 font-medium">Saved</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onSave();
                  setIsExpanded(false);
                }}
                disabled={isSaving}
                className="btn-brutal text-sm py-2.5 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>

              <button
                onClick={() => {
                  onExport();
                  setIsExpanded(false);
                }}
                disabled={isExporting}
                className="btn-brutal text-sm py-2.5 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Tap outside to close
            </p>
          </div>
        )}
      </div>
    </>
  );
}
