import { useEffect, useState } from 'react';
import { ToolRail } from '@/components/deckforge/ToolRail';
import { ToolDrawer } from '@/components/deckforge/ToolDrawer';
import { WorkbenchStage } from '@/components/deckforge/WorkbenchStage';
import { Inspector } from '@/components/deckforge/Inspector';
import { VersionHistory } from '@/components/deckforge/VersionHistory';
import { ShareModal } from '@/components/deckforge/ShareModal';
import { AnimationPreview } from '@/components/deckforge/AnimationPreview';
import { BrandKitModal } from '@/components/deckforge/BrandKitModal';
import { FontUploadModal } from '@/components/deckforge/FontUploadModal';
import { ExportPreview } from '@/components/deckforge/ExportPreview';
import { MobileToolbar } from '@/components/deckforge/MobileToolbar';
import { MobileDrawer } from '@/components/deckforge/MobileDrawer';
import { LayerList } from '@/components/deckforge/LayerList';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { useAuthStore } from '@/store/auth';
import { designsAPI } from '@/lib/api';
import { exportToPNG, exportToSVG, downloadBlob } from '@/lib/export';
import { preloadUserFonts } from '@/lib/fonts';
import { Button } from '@/components/ui/button';
import { Save, Download, User, Sparkles, Clock, Menu, Share2, Play, ChevronDown, Palette, Undo, Redo, Type } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KeyboardShortcuts } from '@/components/deckforge/KeyboardShortcuts';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DeckForge() {
  const { selectedId, deleteObject, undo, redo, getCanvasState, currentDesignId, setDesignId, setSaving, isSaving, objects, designName, createVersion, past, future, updateObject, saveToHistory } = useDeckForgeStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAnimationPreviewOpen, setIsAnimationPreviewOpen] = useState(false);
  const [isBrandKitModalOpen, setIsBrandKitModalOpen] = useState(false);
  const [isFontUploadModalOpen, setIsFontUploadModalOpen] = useState(false);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
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
        toast.success('Design saved successfully');
      } else {
        // Create new design
        const result = await designsAPI.create({
          name: canvasState.name,
          canvas_data: canvasState,
        });
        setDesignId(result.design.id);
        setSaveStatus('Saved!');
        toast.success('Design created successfully');
      }

      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('Save failed');
      toast.error('Failed to save design. Please try again.');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setSaveStatus('Exporting PNG...');
    setShowExportMenu(false);

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

      setSaveStatus('Exported PNG!');
      toast.success(`Exported as ${filename}`);
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Export failed:', err);
      setSaveStatus('Export failed');
      toast.error('Failed to export PNG. Please try again.');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = async () => {
    setIsExporting(true);
    setSaveStatus('Exporting SVG...');
    setShowExportMenu(false);

    try {
      // Export as scalable vector
      const blob = await exportToSVG(objects, {
        includeBackground: true,
      });

      // Generate filename from design name
      const filename = `${designName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.svg`;
      downloadBlob(blob, filename);

      setSaveStatus('Exported SVG!');
      toast.success(`Exported vector as ${filename}`);
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('SVG export failed:', err);
      setSaveStatus('Export failed');
      toast.error('Failed to export SVG. Please try again.');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  // Preload user's custom fonts on mount
  useEffect(() => {
    if (isAuthenticated) {
      preloadUserFonts().catch(console.error);
    }
  }, [isAuthenticated]);

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

              {/* Undo/Redo with history indicator */}
              <div className="flex items-center gap-1 border border-border rounded">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={undo}
                  disabled={past.length === 0}
                  className="gap-1.5 rounded-r-none border-r border-border"
                  title={`Undo (Ctrl+Z) - ${past.length} action${past.length !== 1 ? 's' : ''} available`}
                >
                  <Undo className="w-4 h-4" />
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {past.length}
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={redo}
                  disabled={future.length === 0}
                  className="gap-1.5 rounded-l-none"
                  title={`Redo (Ctrl+Shift+Z) - ${future.length} action${future.length !== 1 ? 's' : ''} available`}
                >
                  <Redo className="w-4 h-4" />
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {future.length}
                  </span>
                </Button>
              </div>
              
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

              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Export'}
                  <ChevronDown className="w-3 h-3" />
                </Button>

                {showExportMenu && !isExporting && (
                  <div className="absolute top-full mt-1 right-0 z-50 bg-card border border-border shadow-lg min-w-[120px]">
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        setIsExportPreviewOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors"
                    >
                      PNG (High-Res)
                      <span className="ml-2 text-[9px] text-muted-foreground">Preview first</span>
                    </button>
                    <button
                      onClick={handleExportSVG}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors border-t border-border"
                    >
                      SVG (Vector)
                      <span className="ml-2 text-[10px] text-accent">PRO</span>
                    </button>
                  </div>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsBrandKitModalOpen(true)}
                className="gap-2"
              >
                <Palette className="w-4 h-4" />
                Brand Kits
                <span className="ml-1 text-[9px] text-accent">PRO</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFontUploadModalOpen(true)}
                className="gap-2"
              >
                <Type className="w-4 h-4" />
                Custom Fonts
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

      {/* Font Upload Modal */}
      <FontUploadModal
        isOpen={isFontUploadModalOpen}
        onClose={() => setIsFontUploadModalOpen(false)}
        onFontUploaded={(font) => {
          toast.success(`${font.name} is now available!`, {
            description: 'You can now use this font in your text objects.',
          });
        }}
      />

      {/* Brand Kit Modal */}
      <BrandKitModal
        isOpen={isBrandKitModalOpen}
        onClose={() => setIsBrandKitModalOpen(false)}
        currentColors={(() => {
          // Extract unique colors from all objects
          const colors = new Set<string>();
          objects.forEach(obj => {
            if (obj.fill) colors.add(obj.fill);
            if (obj.stroke) colors.add(obj.stroke);
            if (obj.colorize) colors.add(obj.colorize);
          });
          return Array.from(colors);
        })()}
        onApplyKit={(kit) => {
          // Extract current unique colors
          const currentColors = new Set<string>();
          objects.forEach(obj => {
            if (obj.fill && obj.fill !== 'none') currentColors.add(obj.fill);
            if (obj.stroke) currentColors.add(obj.stroke);
            if (obj.colorize) currentColors.add(obj.colorize);
          });
          
          const currentColorsArray = Array.from(currentColors);
          const newColors = kit.colors;
          
          // Create color mapping (old → new)
          const colorMap = new Map<string, string>();
          currentColorsArray.forEach((oldColor, index) => {
            // Map to new color at same index, or cycle through if more old colors than new
            const newColor = newColors[index % newColors.length];
            colorMap.set(oldColor, newColor);
          });
          
          // Save to history before making changes
          saveToHistory();
          
          // Update all objects with new colors
          let changedCount = 0;
          objects.forEach(obj => {
            const updates: Partial<CanvasObject> = {};
            
            if (obj.fill && colorMap.has(obj.fill)) {
              updates.fill = colorMap.get(obj.fill);
              changedCount++;
            }
            if (obj.stroke && colorMap.has(obj.stroke)) {
              updates.stroke = colorMap.get(obj.stroke);
              changedCount++;
            }
            if (obj.colorize && colorMap.has(obj.colorize)) {
              updates.colorize = colorMap.get(obj.colorize);
              changedCount++;
            }
            
            if (Object.keys(updates).length > 0) {
              updateObject(obj.id, updates);
            }
          });
          
          // Show success message
          if (changedCount > 0) {
            toast.success(`Applied "${kit.name}" - ${changedCount} color${changedCount !== 1 ? 's' : ''} changed`);
          } else {
            toast.info(`Applied "${kit.name}" - No matching colors found`);
          }
        }}
      />

      {/* Export Preview Modal */}
      <ExportPreview
        isOpen={isExportPreviewOpen}
        onClose={() => setIsExportPreviewOpen(false)}
        objects={objects}
        designName={designName}
        onConfirmExport={() => {
          toast.success('Design exported successfully');
        }}
      />
    </div>
  );
}
