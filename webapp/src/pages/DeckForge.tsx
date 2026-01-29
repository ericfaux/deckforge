import { useEffect } from 'react';
import { ToolRail } from '@/components/deckforge/ToolRail';
import { ToolDrawer } from '@/components/deckforge/ToolDrawer';
import { WorkbenchStage } from '@/components/deckforge/WorkbenchStage';
import { Inspector } from '@/components/deckforge/Inspector';
import { useDeckForgeStore } from '@/store/deckforge';

export default function DeckForge() {
  const { selectedId, deleteObject, undo, redo } = useDeckForgeStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Delete selected object
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteObject(selectedId);
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteObject, undo, redo]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-border flex items-center px-4 bg-card shrink-0">
        <h1 className="font-display text-lg uppercase tracking-widest text-foreground">
          Deck<span className="text-primary">Forge</span>
        </h1>
        <div className="ml-4 flex items-center gap-2">
          <span className="tag-brutal">v1.0</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden md:block">
            Fingerboard Graphics Editor
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Tool Rail */}
        <ToolRail />

        {/* Tool Drawer */}
        <ToolDrawer />

        {/* Center: Workbench */}
        <WorkbenchStage />

        {/* Right: Inspector */}
        <Inspector />
      </div>
    </div>
  );
}
