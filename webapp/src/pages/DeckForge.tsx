import { useEffect, useState } from 'react';
import { ToolRail } from '@/components/deckforge/ToolRail';
import { ToolDrawer } from '@/components/deckforge/ToolDrawer';
import { WorkbenchStage } from '@/components/deckforge/WorkbenchStage';
import { Inspector } from '@/components/deckforge/Inspector';
import { VersionHistory } from '@/components/deckforge/VersionHistory';
import { ShareModal } from '@/components/deckforge/ShareModal';
import { AnimationPreview } from '@/components/deckforge/AnimationPreview';
import { MobileToolbar } from '@/components/deckforge/MobileToolbar';
import { MobileDrawer } from '@/components/deckforge/MobileDrawer';
import { LayerList } from '@/components/deckforge/LayerList';
import { useDeckForgeStore } from '@/store/deckforge';
import { useAuthStore } from '@/store/auth';
import { designsAPI } from '@/lib/api';
import { exportToPNG, downloadBlob } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Save, Download, User, Sparkles, Clock, Menu, Share2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KeyboardShortcuts } from '@/components/deckforge/KeyboardShortcuts';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function DeckForge() {
  const { selectedId, deleteObject, undo, redo, getCanvasState, currentDesignId, setDesignId, setSaving, isSaving, objects, designName, createVersion } = useDeckForgeStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAnimationPreviewOpen, setIsAnimationPreviewOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Auto-save versions every 5 minutes
  useEffect(() => {
    if (objects.length === 0) return; // Don't auto-save empty canvas

    const interval = setInterval(() => {
      createVersion(undefined, true); // Auto-save
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [objects.length, createVersion]);

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
      <header className={cn(
        "border-b border-border flex items-center px-4 bg-card shrink-0",
        isMobile ? "h-12" : "h-12"
      )}>
        <h1 className={cn(
          "font-display uppercase tracking-widest text-foreground",
          isMobile ? "text-base" : "text-lg"
        )}>
          Deck<span className="text-primary">Forge</span>
        </h1>
        
        {!isMobile && (
          <div className="ml-4 flex items-center gap-2">
            <span className="tag-brutal">v1.0</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {!isMobile && (
            <>
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

              {currentDesignId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsShareModalOpen(true)}
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsVersionHistoryOpen(true)}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                History
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAnimationPreviewOpen(true)}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Preview
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/gallery')}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Gallery
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
            </>
          )}

          {isMobile && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMobileMenuOpen(true)}
              className="gap-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className={cn(
        "flex-1 flex overflow-hidden",
        isMobile && "pb-14" // Space for mobile toolbar
      )}>
        {/* Desktop layout */}
        {!isMobile && (
          <>
            <ToolRail />
            <ToolDrawer />
            <WorkbenchStage />
            <Inspector />
          </>
        )}

        {/* Mobile layout */}
        {isMobile && (
          <>
            <ToolRail />
            <ToolDrawer />
            <WorkbenchStage />
          </>
        )}
      </div>

      {/* Mobile toolbar */}
      {isMobile && (
        <MobileToolbar
          onSave={handleSave}
          onExport={handleExport}
          onOpenHistory={() => setIsVersionHistoryOpen(true)}
          onOpenInspector={() => setMobileInspectorOpen(true)}
          onOpenLayers={() => setMobileLayersOpen(true)}
          isSaving={isSaving}
          isExporting={isExporting}
        />
      )}

      {/* Mobile drawers */}
      <MobileDrawer
        isOpen={mobileInspectorOpen}
        onClose={() => setMobileInspectorOpen(false)}
        title="Properties"
      >
        <Inspector />
      </MobileDrawer>

      <MobileDrawer
        isOpen={mobileLayersOpen}
        onClose={() => setMobileLayersOpen(false)}
        title="Layers"
      >
        <LayerList />
      </MobileDrawer>

      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Menu"
      >
        <div className="space-y-2">
          <button
            onClick={() => {
              navigate('/templates');
              setMobileMenuOpen(false);
            }}
            className="w-full btn-brutal text-left py-3 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => {
              navigate(isAuthenticated ? '/designs' : '/auth');
              setMobileMenuOpen(false);
            }}
            className="w-full btn-brutal text-left py-3 flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            {isAuthenticated ? 'My Designs' : 'Login'}
          </button>
          {saveStatus && (
            <p className="text-xs text-primary text-center py-2">{saveStatus}</p>
          )}
        </div>
      </MobileDrawer>

      {/* Version History Modal */}
      <VersionHistory 
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
      />

      {/* Share Modal */}
      {currentDesignId && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          designId={currentDesignId}
          designName={designName}
        />
      )}

      {/* Animation Preview */}
      <AnimationPreview
        isOpen={isAnimationPreviewOpen}
        onClose={() => setIsAnimationPreviewOpen(false)}
      />
    </div>
  );
}
