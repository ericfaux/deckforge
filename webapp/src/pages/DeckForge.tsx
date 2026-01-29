import { useEffect, useState } from 'react';
import { ToolRail } from '@/components/deckforge/ToolRail';
import { ToolDrawer } from '@/components/deckforge/ToolDrawer';
import { WorkbenchStage } from '@/components/deckforge/WorkbenchStage';
import { Inspector } from '@/components/deckforge/Inspector';
import { useDeckForgeStore } from '@/store/deckforge';
import { useAuthStore } from '@/store/auth';
import { designsAPI } from '@/lib/api';
import { exportToPNG, downloadBlob } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Save, Download, User, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KeyboardShortcuts } from '@/components/deckforge/KeyboardShortcuts';

export default function DeckForge() {
  const { selectedId, deleteObject, undo, redo, getCanvasState, currentDesignId, setDesignId, setSaving, isSaving, objects, designName } = useDeckForgeStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const handleSave = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setSaving(true);
    setSaveStatus('Saving...');

    try {
      const canvasState = getCanvasState();
      
      if (currentDesignId) {
        // Update existing design
        await designsAPI.update(currentDesignId, {
          canvas_data: canvasState,
          name: canvasState.name,
        });
        setSaveStatus('Saved!');
      } else {
        // Create new design
        const result = await designsAPI.create({
          name: canvasState.name,
          canvas_data: canvasState,
        });
        setDesignId(result.design.id);
        setSaveStatus('Saved!');
      }

      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('Save failed');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setSaveStatus('Exporting...');

    try {
      // Export at 3x resolution for print quality
      const blob = await exportToPNG(objects, {
        scale: 3,
        format: 'png',
        includeBackground: true,
      });

      // Generate filename from design name
      const filename = `${designName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
      downloadBlob(blob, filename);

      setSaveStatus('Exported!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Export failed:', err);
      setSaveStatus('Export failed');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setIsExporting(false);
    }
  };

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
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden md:block mr-4">
            Fingerboard Graphics Editor
          </span>
          
          {saveStatus && (
            <span className="text-xs text-primary">{saveStatus}</span>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export PNG'}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/templates')}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Templates
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(isAuthenticated ? '/designs' : '/auth')}
            className="gap-2"
          >
            <User className="w-4 h-4" />
            {isAuthenticated ? 'My Designs' : 'Login'}
          </Button>

          <KeyboardShortcuts />
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
