import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { ToolRail } from '@/components/deckforge/ToolRail';
import { ToolDrawer } from '@/components/deckforge/ToolDrawer';
import { WorkbenchStage } from '@/components/deckforge/WorkbenchStage';
import { Inspector } from '@/components/deckforge/Inspector';
import { BatchActionsToolbar } from '@/components/deckforge/BatchActionsToolbar';
import { MobileToolbar } from '@/components/deckforge/MobileToolbar';
import { AlignmentTools } from '@/components/deckforge/AlignmentTools';
import { DeckSizeSelector } from '@/components/deckforge/DeckSizeSelector';
import { useDebounce } from '@/hooks/use-debounce';

// Lazy load modals for better performance
const VersionHistory = lazy(() => import('@/components/deckforge/VersionHistory').then(m => ({ default: m.VersionHistory })));
const ShareModal = lazy(() => import('@/components/deckforge/ShareModal').then(m => ({ default: m.ShareModal })));
const AnimationPreview = lazy(() => import('@/components/deckforge/AnimationPreview').then(m => ({ default: m.AnimationPreview })));
const BrandKitModal = lazy(() => import('@/components/deckforge/BrandKitModal').then(m => ({ default: m.BrandKitModal })));
const FontUploadModal = lazy(() => import('@/components/deckforge/FontUploadModal').then(m => ({ default: m.FontUploadModal })));
const ColorExtractorModal = lazy(() => import('@/components/deckforge/ColorExtractorModal').then(m => ({ default: m.ColorExtractorModal })));
const SmartDuplicateModal = lazy(() => import('@/components/deckforge/SmartDuplicateModal').then(m => ({ default: m.SmartDuplicateModal })));
const ArrayDuplicateModal = lazy(() => import('@/components/deckforge/ArrayDuplicateModal').then(m => ({ default: m.ArrayDuplicateModal })));
const ExportPreview = lazy(() => import('@/components/deckforge/ExportPreview').then(m => ({ default: m.ExportPreview })));
const ExportPresetsModal = lazy(() => import('@/components/deckforge/ExportPresetsModal').then(m => ({ default: m.ExportPresetsModal })));
const TemplateGalleryModal = lazy(() => import('@/components/deckforge/TemplateGalleryModal').then(m => ({ default: m.TemplateGalleryModal })));
const DeckGenerator3D = lazy(() => import('@/components/deckforge/DeckGenerator3D').then(m => ({ default: m.default })));
import { MobileDrawer } from '@/components/deckforge/MobileDrawer';
import { LayerList } from '@/components/deckforge/LayerList';
import { ComponentErrorBoundary } from '@/components/ComponentErrorBoundary';
import { useDeckDimensions } from '@/components/deckforge/WorkbenchStage';
import { getDeckSize } from '@/lib/deck-sizes';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { useAuthStore } from '@/store/auth';
import { designsAPI } from '@/lib/api';
import { exportToPNG, exportToSVG, exportToPDF, downloadBlob } from '@/lib/export';
import { preloadUserFonts } from '@/lib/fonts';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Save, Download, User, Sparkles, Clock, Menu, Share2, Play, ChevronDown, Palette, Undo, Redo, Type, Ruler, Loader2, FileImage, FileText, Zap, Image, Check, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KeyboardShortcuts } from '@/components/deckforge/KeyboardShortcuts';
import { CommandPalette } from '@/components/CommandPalette';
import { QuickAccessToolbar } from '@/components/deckforge/QuickAccessToolbar';
import { EditorLoadingSkeleton } from '@/components/deckforge/EditorLoadingSkeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWindowSize } from '@/hooks/use-window-size';
import { ToolbarOverflowMenu, OverflowItem } from '@/components/deckforge/ToolbarOverflowMenu';
import { cn } from '@/lib/utils';
import { toastUtils } from '@/lib/toast-utils';
import toast from 'react-hot-toast';
import { saveToLocalStorage, getLatestAutosave, hasAutosaveData, clearAutosaveData, type AutosaveData } from '@/lib/autosave';
import { AutosaveRecoveryDialog } from '@/components/deckforge/AutosaveRecoveryDialog';

export default function DeckForge() {
  const { selectedId, selectedIds, deleteObject, undo, redo, getCanvasState, currentDesignId, setDesignId, setSaving, isSaving, objects, designName, createVersion, past, future, updateObject, saveToHistory, addObject, selectObject, setActiveTool, stageScale, setStageScale, arrayDuplicate, showRulers, toggleRulers, groupObjects, ungroupObject, flashCopiedObject, flashPastedObject, lastAction, undoRedoChangedIds, deckSizeId, backgroundColor, backgroundFillType, backgroundGradient, textureOverlays, loadDesign, setBackgroundColor, setDeckSize } = useDeckForgeStore();
  
  // Get current deck dimensions (dynamic based on selected size)
  const { width: deckWidth, height: deckHeight } = useDeckDimensions();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { width: windowWidth } = useWindowSize();

  // Toolbar overflow: determine how many collapsible items to hide
  // >1400px: show all, 1000-1400px: collapse last 4, <1000px: collapse last 8
  const toolbarOverflowCount = windowWidth > 1400 ? 0 : windowWidth >= 1000 ? 4 : 8;

  const [isInitializing, setIsInitializing] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingModal, setLoadingModal] = useState<string | null>(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAnimationPreviewOpen, setIsAnimationPreviewOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isBrandKitModalOpen, setIsBrandKitModalOpen] = useState(false);
  const [isFontUploadModalOpen, setIsFontUploadModalOpen] = useState(false);
  const [isArrayDuplicateOpen, setIsArrayDuplicateOpen] = useState(false);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [isExportPresetsOpen, setIsExportPresetsOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [is3DGeneratorOpen, setIs3DGeneratorOpen] = useState(false);
  const [isColorExtractorOpen, setIsColorExtractorOpen] = useState(false);
  const [isSmartDuplicateOpen, setIsSmartDuplicateOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Autosave recovery
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [recoveryData, setRecoveryData] = useState<AutosaveData | null>(null);

  // Local save status indicator
  const [localSaveStatus, setLocalSaveStatus] = useState<'idle' | 'saved'>('idle');
  
  // Helper to open modals with loading state
  const openModal = (modalName: string, setterFn: (open: boolean) => void) => {
    setLoadingModal(modalName);
    // Use setTimeout to ensure spinner shows before lazy load
    setTimeout(() => {
      setterFn(true);
      setLoadingModal(null);
    }, 10);
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      // Save locally first for guests
      saveToLocalStorage({
        timestamp: Date.now(),
        objects,
        textureOverlays,
        backgroundColor,
        backgroundFillType,
        backgroundGradient,
        deckSizeId,
        designName,
      });
      setLocalSaveStatus('saved');
      setTimeout(() => setLocalSaveStatus('idle'), 3000);
      toastUtils.success('Design saved locally!', 'Login to save to cloud and access from anywhere');
      return;
    }

    cancelAutoSave(); // Cancel any pending auto-save
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
        setHasUnsavedChanges(false);
        toastUtils.success('Design saved successfully', 'Your changes have been saved to the cloud');
      } else {
        // Create new design
        const result = await designsAPI.create({
          name: canvasState.name,
          canvas_data: canvasState,
        });
        setDesignId(result.design.id);
        setSaveStatus('Saved!');
        setHasUnsavedChanges(false);
        toastUtils.success('Design created successfully', 'Your design has been saved');
      }

      // Also save locally as backup
      saveToLocalStorage({
        timestamp: Date.now(),
        objects,
        textureOverlays,
        backgroundColor,
        backgroundFillType,
        backgroundGradient,
        deckSizeId,
        designName,
      });

      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('Save failed');
      toastUtils.error('Failed to save design', 'Please check your connection and try again');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save to reduce DB calls
  const performAutoSave = async () => {
    if (!isAuthenticated || !currentDesignId) return; // Only auto-save existing designs
    if (isSaving) return; // Don't auto-save if manual save in progress

    setSaving(true);
    setSaveStatus('Auto-saving...');

    try {
      const canvasState = getCanvasState();
      await designsAPI.update(currentDesignId, {
        canvas_data: canvasState,
        name: canvasState.name,
      });
      setSaveStatus('Auto-saved');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Auto-save failed:', err);
      // Silently fail for auto-save (don't show toast)
      setSaveStatus('');
    } finally {
      setSaving(false);
    }
  };

  const [debouncedAutoSave, cancelAutoSave] = useDebounce(performAutoSave, 3000); // 3s delay

  const handleExport = async () => {
    setIsExporting(true);
    setSaveStatus('Exporting PNG...');

    try {
      // Export at 300 DPI for print quality (300dpi / 25.4mm per inch ≈ 12x scale)
      const blob = await exportToPNG(objects, {
        scale: 12,
        format: 'png',
        includeBackground: true,
        width: deckWidth,
        height: deckHeight,
        backgroundColor,
        backgroundFillType,
        backgroundGradient,
      });

      const filename = `${designName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_300dpi_${Date.now()}.png`;
      downloadBlob(blob, filename);

      setSaveStatus('Exported PNG!');
      toastUtils.success(`Exported as ${filename}`, 'High-resolution 300 DPI PNG ready to print');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Export failed:', err);
      setSaveStatus('Export failed');
      toastUtils.error('Failed to export PNG', 'Please try again or check browser console for details');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNGScreen = async () => {
    setIsExporting(true);
    setSaveStatus('Exporting PNG (Screen)...');

    try {
      // Export at 72 DPI for screen (72dpi / 25.4mm ≈ 3x scale)
      const blob = await exportToPNG(objects, {
        scale: 3,
        format: 'png',
        includeBackground: true,
        width: deckWidth,
        height: deckHeight,
        backgroundColor,
        backgroundFillType,
        backgroundGradient,
      });

      const filename = `${designName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_72dpi_${Date.now()}.png`;
      downloadBlob(blob, filename);

      setSaveStatus('Exported PNG!');
      toastUtils.success(`Exported as ${filename}`, 'Screen-resolution 72 DPI PNG');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Export failed:', err);
      setSaveStatus('Export failed');
      toastUtils.error('Failed to export PNG', 'Please try again or check browser console for details');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = async () => {
    setIsExporting(true);
    setSaveStatus('Exporting SVG...');

    try {
      const blob = await exportToSVG(objects, {
        includeBackground: true,
        width: deckWidth,
        height: deckHeight,
        backgroundColor,
        backgroundFillType,
        backgroundGradient,
      });

      const filename = `${designName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.svg`;
      downloadBlob(blob, filename);

      setSaveStatus('Exported SVG!');
      toastUtils.success(`Exported vector as ${filename}`, 'Scalable SVG file ready');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('SVG export failed:', err);
      setSaveStatus('Export failed');
      toastUtils.error('Failed to export SVG', 'Please try again or check browser console for details');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setSaveStatus('Exporting PDF...');

    try {
      const blob = await exportToPDF(objects, {
        scale: 12,
        includeBackground: true,
        title: designName,
        backgroundColor,
        backgroundFillType,
        backgroundGradient,
      });

      const filename = `${designName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
      downloadBlob(blob, filename);

      setSaveStatus('Exported PDF!');
      toastUtils.success(`Exported as ${filename}`, 'Print-ready PDF document');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('PDF export failed:', err);
      setSaveStatus('Export failed');
      toastUtils.error('Failed to export PDF', 'Please try again or check browser console for details');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = async () => {
    setIsExporting(true);
    setSaveStatus('Quick exporting...');

    try {
      const blob = await exportToPNG(objects, {
        scale: 1,
        format: 'png',
        includeBackground: true,
        width: deckWidth,
        height: deckHeight,
        backgroundColor,
        backgroundFillType,
        backgroundGradient,
      });

      const filename = `${designName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
      downloadBlob(blob, filename);

      setSaveStatus('Exported!');
      toastUtils.success(`Quick exported as ${filename}`, '1x PNG instant download');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Quick export failed:', err);
      setSaveStatus('Export failed');
      toastUtils.error('Failed to export', 'Please try again');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);


  // Preload user's custom fonts on mount
  // Initialize editor (preload fonts, set up canvas, etc.)
  useEffect(() => {
    const initialize = async () => {
      try {
        if (isAuthenticated) {
          await preloadUserFonts();
        }
      } catch (error) {
        console.error('Failed to initialize editor:', error);
      } finally {
        // Show editor after brief delay for smooth transition
        setTimeout(() => {
          setIsInitializing(false);
        }, 300);
      }
    };

    initialize();
  }, [isAuthenticated]);

  // Auto-save versions every 5 minutes
  useEffect(() => {
    if (objects.length === 0) return; // Don't auto-save empty canvas

    const interval = setInterval(() => {
      createVersion(undefined, true); // Auto-save
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [objects.length, createVersion]);

  // Track unsaved changes
  useEffect(() => {
    if (past.length > 0 && !isSaving) {
      setHasUnsavedChanges(true);
    }
  }, [past.length, isSaving]);

  // Auto-save after changes (debounced to reduce DB calls)
  useEffect(() => {
    if (hasUnsavedChanges && currentDesignId && isAuthenticated) {
      debouncedAutoSave();
    }

    return () => {
      cancelAutoSave(); // Cancel pending auto-save on unmount or deps change
    };
  }, [hasUnsavedChanges, currentDesignId, isAuthenticated, debouncedAutoSave, cancelAutoSave]);

  // Check for autosave recovery data on mount
  useEffect(() => {
    if (hasAutosaveData() && objects.length === 0 && !currentDesignId) {
      const data = getLatestAutosave();
      if (data && data.objects.length > 0) {
        setRecoveryData(data);
        setRecoveryDialogOpen(true);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save to localStorage every 30 seconds (for all users, including guests)
  useEffect(() => {
    if (objects.length === 0) return;

    const interval = setInterval(() => {
      saveToLocalStorage({
        timestamp: Date.now(),
        objects,
        textureOverlays,
        backgroundColor,
        backgroundFillType,
        backgroundGradient,
        deckSizeId,
        designName,
      });
    }, 30_000);

    return () => clearInterval(interval);
  }, [objects, textureOverlays, backgroundColor, deckSizeId, designName]);

  // Save to localStorage on significant changes (add/remove object)
  const prevObjectCountRef = useRef(objects.length);
  useEffect(() => {
    const prevCount = prevObjectCountRef.current;
    prevObjectCountRef.current = objects.length;

    // Only trigger on add/remove (count changed), not on every render
    if (objects.length !== prevCount && objects.length > 0) {
      saveToLocalStorage({
        timestamp: Date.now(),
        objects,
        textureOverlays,
        backgroundColor,
        backgroundFillType,
        backgroundGradient,
        deckSizeId,
        designName,
      });
    }
  }, [objects.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecoverAutosave = () => {
    if (recoveryData) {
      loadDesign({
        objects: recoveryData.objects,
        textureOverlays: recoveryData.textureOverlays,
        name: recoveryData.designName,
        id: null,
        backgroundColor: recoveryData.backgroundColor,
        backgroundFillType: recoveryData.backgroundFillType,
        backgroundGradient: recoveryData.backgroundGradient,
      });
      if (recoveryData.backgroundColor) {
        setBackgroundColor(recoveryData.backgroundColor);
      }
      if (recoveryData.deckSizeId) {
        setDeckSize(recoveryData.deckSizeId);
      }
      toastUtils.success('Design recovered!', 'Your previous work has been restored');
    }
    setRecoveryDialogOpen(false);
    setRecoveryData(null);
  };

  const handleDiscardAutosave = () => {
    clearAutosaveData();
    setRecoveryDialogOpen(false);
    setRecoveryData(null);
  };

  // Show feedback for undo/redo actions
  useEffect(() => {
    if (lastAction && undoRedoChangedIds.length > 0) {
      const count = undoRedoChangedIds.length;
      const action = lastAction === 'undo' ? 'Undone' : 'Redone';
      toastUtils.success(`${action}`, `${count} object${count !== 1 ? 's' : ''} changed`);
    }
  }, [lastAction, undoRedoChangedIds]);

  // Clipboard paste for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't interfere with pasting in text inputs
      if (document.activeElement instanceof HTMLInputElement || 
          document.activeElement instanceof HTMLTextAreaElement) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          try {
            toastUtils.info('Processing image...', 'Compressing and uploading');

            // Upload the image (auto-compressed)
            const result = await assetsAPI.upload(file);

            // Add to canvas at center
            const newObj: CanvasObject = {
              id: crypto.randomUUID(),
              type: 'image',
              x: deckWidth / 2,
              y: deckHeight / 2,
              width: Math.min(result.width, deckWidth * 0.6),
              height: Math.min(result.height, deckHeight * 0.6),
              src: result.url,
              opacity: 1,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
            };

            addObject(newObj);
            selectObject(newObj.id);
            flashPastedObject(newObj.id);
            
            // Show compression savings if applicable
            let description = 'Press T to add text or edit in Inspector';
            if (result.originalSize && result.compressedSize && result.compressedSize < result.originalSize) {
              const savings = ((1 - result.compressedSize / result.originalSize) * 100).toFixed(0);
              description = `Compressed ${savings}% • ${description}`;
            }
            
            toastUtils.success('Image pasted!', description);
          } catch (error) {
            console.error('Paste image failed:', error);
            toastUtils.error('Failed to paste image', 'Try uploading instead');
          }
          
          return; // Only process first image
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [addObject, selectObject, flashPastedObject]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // === FILE OPERATIONS ===
      
      // Save (Ctrl+S)
      if (ctrl && key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Export (Ctrl+E)
      if (ctrl && key === 'e') {
        e.preventDefault();
        handleExport();
        return;
      }

      // === EDITING ===

      // Delete selected object
      if ((key === 'delete' || key === 'backspace') && selectedId) {
        e.preventDefault();
        deleteObject(selectedId);
        return;
      }

      // Undo (Ctrl+Z)
      if (ctrl && key === 'z' && !shift) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo (Ctrl+Shift+Z)
      if (ctrl && key === 'z' && shift) {
        e.preventDefault();
        redo();
        return;
      }

      // Duplicate (Ctrl+D)
      if (ctrl && key === 'd' && !shift && selectedId) {
        e.preventDefault();
        const obj = objects.find(o => o.id === selectedId);
        if (obj) {
          const { id, ...objWithoutId } = obj;
          addObject({
            ...objWithoutId,
            x: obj.x + 10,
            y: obj.y + 10,
          });
          toastUtils.success('Object duplicated', 'New copy created 20px offset');
        }
        return;
      }

      // Smart Duplicate (Ctrl+Shift+D) - Open smart duplicate modal
      if (ctrl && shift && key === 'd' && selectedId) {
        e.preventDefault();
        setIsSmartDuplicateOpen(true);
        return;
      }

      // === TOOL SELECTION ===

      // Text tool (T)
      if (key === 't' && !ctrl && !alt) {
        e.preventDefault();
        setActiveTool('text');
        return;
      }

      // Pen tool (P)
      if (key === 'p' && !ctrl && !alt) {
        e.preventDefault();
        setActiveTool('pen');
        return;
      }

      // Graphics/Shapes (G)
      if (key === 'g' && !ctrl && !alt) {
        e.preventDefault();
        setActiveTool('graphics');
        return;
      }

      // Lines (L)
      if (key === 'l' && !ctrl && !alt) {
        e.preventDefault();
        setActiveTool('lines');
        return;
      }

      // Stickers (S)
      if (key === 's' && !ctrl && !alt) {
        e.preventDefault();
        setActiveTool('stickers');
        return;
      }

      // Uploads (U)
      if (key === 'u' && !ctrl && !alt) {
        e.preventDefault();
        setActiveTool('uploads');
        return;
      }

      // Escape to deselect/close tools
      if (key === 'escape') {
        e.preventDefault();
        selectObject(null);
        setActiveTool(null);
        return;
      }

      // === VIEW TOGGLES ===

      // Toggle rulers (Ctrl+Shift+R) - only when no objects selected
      // When objects are selected, Ctrl+Shift+R is used for Align Right
      if (ctrl && shift && key === 'r' && selectedIds.length === 0) {
        e.preventDefault();
        useDeckForgeStore.getState().toggleRulers();
        const newState = useDeckForgeStore.getState().showRulers;
        toast.success(newState ? 'Rulers enabled' : 'Rulers disabled');
        return;
      }

      // === LOCK/UNLOCK OBJECT ===
      
      // Lock/unlock selected object (Ctrl+L)
      if (ctrl && key === 'l' && selectedId) {
        e.preventDefault();
        const obj = objects.find(o => o.id === selectedId);
        if (obj) {
          updateObject(selectedId, { locked: !obj.locked });
          toast.success(obj.locked ? 'Object unlocked' : 'Object locked');
        }
        return;
      }

      // === GROUP/UNGROUP OBJECTS ===
      
      // Group objects (Ctrl+G)
      if (ctrl && key === 'g' && !shift && selectedIds.length >= 2) {
        e.preventDefault();
        groupObjects(selectedIds);
        toastUtils.success(`Grouped ${selectedIds.length} objects`, 'Objects now move together');
        return;
      }

      // Ungroup object (Ctrl+Shift+G)
      if (ctrl && shift && key === 'g' && selectedIds.length === 1) {
        e.preventDefault();
        const obj = objects.find(o => o.id === selectedIds[0]);
        if (obj && obj.type === 'group') {
          ungroupObject(selectedIds[0]);
          toastUtils.success('Ungrouped objects', 'Objects are now independent');
        } else {
          toast.error('Selected object is not a group');
        }
        return;
      }

      // === ALIGNMENT (Ctrl+Shift shortcuts, works for 1+ selected objects) ===

      if (selectedIds.length >= 1 && ctrl && shift) {
        // Align Left (Ctrl+Shift+L)
        if (key === 'l') {
          e.preventDefault();
          useDeckForgeStore.getState().alignObjects('left');
          toast.success(selectedIds.length === 1 ? 'Aligned to left edge' : 'Aligned left');
          return;
        }

        // Align Right (Ctrl+Shift+R)
        if (key === 'r') {
          e.preventDefault();
          useDeckForgeStore.getState().alignObjects('right');
          toast.success(selectedIds.length === 1 ? 'Aligned to right edge' : 'Aligned right');
          return;
        }

        // Align Center Horizontal (Ctrl+Shift+C)
        if (key === 'c') {
          e.preventDefault();
          useDeckForgeStore.getState().alignObjects('center');
          toast.success(selectedIds.length === 1 ? 'Centered horizontally' : 'Aligned center');
          return;
        }

        // Align Top (Ctrl+Shift+T)
        if (key === 't') {
          e.preventDefault();
          useDeckForgeStore.getState().alignObjects('top');
          toast.success(selectedIds.length === 1 ? 'Aligned to top edge' : 'Aligned top');
          return;
        }

        // Align Bottom (Ctrl+Shift+B)
        if (key === 'b') {
          e.preventDefault();
          useDeckForgeStore.getState().alignObjects('bottom');
          toast.success(selectedIds.length === 1 ? 'Aligned to bottom edge' : 'Aligned bottom');
          return;
        }

        // Align Center Vertical (Ctrl+Shift+M)
        if (key === 'm') {
          e.preventDefault();
          useDeckForgeStore.getState().alignObjects('middle');
          toast.success(selectedIds.length === 1 ? 'Centered vertically' : 'Aligned middle');
          return;
        }
      }

      // === NUDGING WITH ARROW KEYS ===
      
      if (selectedId && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        const obj = objects.find(o => o.id === selectedId);
        if (!obj) return;

        const nudgeAmount = shift ? 10 : 1; // Shift = 10px, normal = 1px
        const updates: Partial<CanvasObject> = {};

        if (key === 'arrowup') updates.y = obj.y - nudgeAmount;
        if (key === 'arrowdown') updates.y = obj.y + nudgeAmount;
        if (key === 'arrowleft') updates.x = obj.x - nudgeAmount;
        if (key === 'arrowright') updates.x = obj.x + nudgeAmount;

        updateObject(selectedId, updates);
        return;
      }

      // === COPY/PASTE ===
      
      // Copy (Ctrl+C)
      if (ctrl && key === 'c' && selectedId) {
        e.preventDefault();
        const obj = objects.find(o => o.id === selectedId);
        if (obj) {
          // Store in sessionStorage (simple clipboard)
          sessionStorage.setItem('deckforge_clipboard', JSON.stringify(obj));
          flashCopiedObject(selectedId);
          toastUtils.success('Copied to clipboard', 'Press Ctrl+V to paste');
        }
        return;
      }

      // Paste (Ctrl+V)
      if (ctrl && key === 'v') {
        e.preventDefault();
        const clipboardData = sessionStorage.getItem('deckforge_clipboard');
        if (clipboardData) {
          try {
            const obj = JSON.parse(clipboardData);
            const { id, ...objWithoutId } = obj;
            const previousLength = objects.length;
            addObject({
              ...objWithoutId,
              x: obj.x + 20,
              y: obj.y + 20,
            });
            // Flash the newly pasted object
            setTimeout(() => {
              const newObjects = useDeckForgeStore.getState().objects;
              if (newObjects.length > previousLength) {
                const newObj = newObjects[newObjects.length - 1];
                flashPastedObject(newObj.id);
              }
            }, 0);
            toastUtils.success('Pasted from clipboard');
          } catch (err) {
            toastUtils.error('Failed to paste', 'The clipboard data may be corrupted');
          }
        } else {
          toastUtils.error('Nothing to paste', 'Copy an object first with Ctrl+C');
        }
        return;
      }

      // === SELECT ALL ===
      
      // Select all (Ctrl+A) - select the last object as proxy for "all"
      if (ctrl && key === 'a') {
        e.preventDefault();
        if (objects.length > 0) {
          selectObject(objects[objects.length - 1].id);
          toast.success(`Selected top object (${objects.length} total)`);
        }
        return;
      }

      // === ZOOM CONTROLS ===
      
      // Reset zoom (Ctrl+0)
      if (ctrl && key === '0') {
        e.preventDefault();
        setStageScale(1);
        toast.success('Zoom reset to 100%');
        return;
      }

      // Zoom to fit (Ctrl+1)
      if (ctrl && key === '1') {
        e.preventDefault();
        // Simple zoom to fit - set to 0.8 to show full deck
        setStageScale(0.8);
        toast.success('Zoom to fit');
        return;
      }

      // Zoom in (Ctrl+=)
      if (ctrl && (key === '=' || key === '+')) {
        e.preventDefault();
        const newScale = Math.min(3, stageScale * 1.2);
        setStageScale(newScale);
        toast.success(`Zoom: ${Math.round(newScale * 100)}%`);
        return;
      }

      // Zoom out (Ctrl+-)
      if (ctrl && (key === '-' || key === '_')) {
        e.preventDefault();
        const newScale = Math.max(0.25, stageScale / 1.2);
        setStageScale(newScale);
        toast.success(`Zoom: ${Math.round(newScale * 100)}%`);
        return;
      }

      // === LAYER ORDERING ===
      
      if (selectedId) {
        const currentIndex = objects.findIndex(o => o.id === selectedId);
        if (currentIndex === -1) return;

        // Bring forward (Ctrl+])
        if (ctrl && !shift && key === ']') {
          e.preventDefault();
          if (currentIndex < objects.length - 1) {
            const newObjects = [...objects];
            [newObjects[currentIndex], newObjects[currentIndex + 1]] = [newObjects[currentIndex + 1], newObjects[currentIndex]];
            useDeckForgeStore.setState({ objects: newObjects });
            toast.success('Brought forward');
          }
          return;
        }

        // Send backward (Ctrl+[)
        if (ctrl && !shift && key === '[') {
          e.preventDefault();
          if (currentIndex > 0) {
            const newObjects = [...objects];
            [newObjects[currentIndex], newObjects[currentIndex - 1]] = [newObjects[currentIndex - 1], newObjects[currentIndex]];
            useDeckForgeStore.setState({ objects: newObjects });
            toast.success('Sent backward');
          }
          return;
        }

        // Bring to front (Ctrl+Shift+])
        if (ctrl && shift && key === ']') {
          e.preventDefault();
          const newObjects = objects.filter(o => o.id !== selectedId);
          newObjects.push(objects[currentIndex]);
          useDeckForgeStore.setState({ objects: newObjects });
          toast.success('Brought to front');
          return;
        }

        // Send to back (Ctrl+Shift+[)
        if (ctrl && shift && key === '[') {
          e.preventDefault();
          const newObjects = objects.filter(o => o.id !== selectedId);
          newObjects.unshift(objects[currentIndex]);
          useDeckForgeStore.setState({ objects: newObjects });
          toast.success('Sent to back');
          return;
        }
      }

      // === ALIGNMENT (Alt + key) ===
      
      if (selectedId && alt) {
        const obj = objects.find(o => o.id === selectedId);
        if (!obj) return;

        const centerX = (deckWidth - obj.width * obj.scaleX) / 2;
        const centerY = (deckHeight - obj.height * obj.scaleY) / 2;

        // Align left (Alt+L)
        if (key === 'l') {
          e.preventDefault();
          updateObject(selectedId, { x: 0 });
          toast.success('Aligned left');
          return;
        }

        // Align right (Alt+R)
        if (key === 'r') {
          e.preventDefault();
          updateObject(selectedId, { x: deckWidth - obj.width * obj.scaleX });
          toast.success('Aligned right');
          return;
        }

        // Align center (Alt+C)
        if (key === 'c') {
          e.preventDefault();
          updateObject(selectedId, { x: centerX });
          toast.success('Aligned center');
          return;
        }

        // Align top (Alt+T)
        if (key === 't') {
          e.preventDefault();
          updateObject(selectedId, { y: 0 });
          toast.success('Aligned top');
          return;
        }

        // Align bottom (Alt+B)
        if (key === 'b') {
          e.preventDefault();
          updateObject(selectedId, { y: deckHeight - obj.height * obj.scaleY });
          toast.success('Aligned bottom');
          return;
        }

        // Align middle (Alt+M)
        if (key === 'm') {
          e.preventDefault();
          updateObject(selectedId, { y: centerY });
          toast.success('Aligned middle');
          return;
        }
      }

      // Show keyboard shortcuts (?)
      if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedIds, deleteObject, undo, redo, objects, handleSave, handleExport, addObject, selectObject, setActiveTool, updateObject, stageScale, setStageScale]);

  // Show loading skeleton while initializing
  if (isInitializing) {
    return <EditorLoadingSkeleton />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Skip to content link for keyboard navigation */}
      <a href="#main-canvas" className="skip-to-content">
        Skip to canvas
      </a>

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Header */}
      <header className={cn(
        "border-b border-border flex items-center px-4 bg-card shrink-0",
        isMobile ? "h-14" : "h-20"
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

        <div className="ml-auto flex items-center gap-3 overflow-hidden pr-2 py-3 min-w-0 flex-shrink flex-wrap-reverse justify-end">
          {!isMobile && (
            <>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden md:block mr-4">
                Fingerboard Graphics Editor
              </span>
              
              {/* Auto-save indicator */}
              {saveStatus && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 animate-in fade-in-50 duration-300">
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  ) : saveStatus.includes('Saved') ? (
                    <svg className="w-3 h-3 text-primary animate-in zoom-in-50 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : saveStatus.includes('failed') ? (
                    <svg className="w-3 h-3 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : null}
                  <span className={cn(
                    "text-[11px] font-medium",
                    saveStatus.includes('failed') ? "text-destructive" : "text-primary"
                  )}>
                    {saveStatus}
                  </span>
                </div>
              )}

              {/* Undo/Redo with history indicator */}
              <div className="flex items-center gap-1 border border-border rounded">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={undo}
                      disabled={past.length === 0}
                      className="gap-1.5 rounded-r-none border-r border-border"
                    >
                      <Undo className="w-4 h-4" />
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {past.length}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <span>Undo</span>
                      <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded font-mono">Ctrl+Z</kbd>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {past.length} action{past.length !== 1 ? 's' : ''} available
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={redo}
                      disabled={future.length === 0}
                      className="gap-1.5 rounded-l-none"
                    >
                      <Redo className="w-4 h-4" />
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {future.length}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <span>Redo</span>
                      <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded font-mono">Ctrl+Shift+Z</kbd>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {future.length} action{future.length !== 1 ? 's' : ''} available
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Deck Size Selector */}
              <DeckSizeSelector />

              {/* Ruler Toggle - Always Visible */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={showRulers ? "default" : "ghost"}
                    onClick={() => {
                      toggleRulers();
                      toast.success(showRulers ? 'Rulers hidden' : 'Rulers visible');
                    }}
                    className="gap-2 border border-border"
                  >
                    <Ruler className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    <span>Toggle Rulers</span>
                    <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded font-mono">Ctrl+Shift+R</kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
              
              {/* Saved status indicator */}
              {(localSaveStatus === 'saved' || (saveStatus && saveStatus.includes('Saved'))) && (
                <div className="flex items-center gap-1.5 animate-in fade-in-50 duration-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-[11px] text-green-600 font-medium">Saved</span>
                </div>
              )}

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSave}
                      disabled={isSaving}
                      className={cn(
                        "gap-2",
                        hasUnsavedChanges && !isSaving && "border-primary/50"
                      )}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    {hasUnsavedChanges && !isSaving && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" title="Unsaved changes" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    <span>Save Design</span>
                    <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded font-mono">Ctrl+S</kbd>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {!isAuthenticated
                      ? 'Save locally (login to save to cloud)'
                      : hasUnsavedChanges
                        ? 'You have unsaved changes'
                        : 'Save to cloud storage'}
                  </p>
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isExporting}
                        className="gap-2"
                      >
                        {isExporting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {isExporting ? 'Exporting...' : 'Export'}
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <span>Export Design</span>
                      <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded font-mono">Ctrl+E</kbd>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Export as PNG, SVG, PDF, or quick export
                    </p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
                    <FileImage className="w-4 h-4 mr-2" />
                    Export PNG
                    <span className="ml-auto text-[10px] text-muted-foreground">300 DPI</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPNGScreen} disabled={isExporting}>
                    <Image className="w-4 h-4 mr-2" />
                    Export PNG (Screen)
                    <span className="ml-auto text-[10px] text-muted-foreground">72 DPI</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportSVG} disabled={isExporting}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Export SVG
                    <span className="ml-auto text-[10px] text-muted-foreground">Vector</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                    <span className="ml-auto text-[10px] text-muted-foreground">Print-ready</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleQuickExport} disabled={isExporting}>
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Export
                    <span className="ml-auto text-[10px] text-muted-foreground">1x PNG</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Collapsible toolbar items — responsive overflow */}
              {(() => {
                const collapsibleItems: OverflowItem[] = [
                  {
                    id: 'brandKit',
                    label: 'Brand Kits',
                    icon: <Palette className="w-4 h-4" />,
                    onClick: () => openModal('brandKit', setIsBrandKitModalOpen),
                    disabled: loadingModal === 'brandKit',
                    badge: 'PRO',
                    badgeColor: 'accent',
                  },
                  {
                    id: 'colorExtractor',
                    label: 'Extract Colors',
                    icon: <Palette className="w-4 h-4" />,
                    onClick: () => openModal('colorExtractor', setIsColorExtractorOpen),
                    disabled: loadingModal === 'colorExtractor',
                    shortcut: 'Ctrl+Shift+E',
                  },
                  {
                    id: 'fontUpload',
                    label: 'Custom Fonts',
                    icon: <Type className="w-4 h-4" />,
                    onClick: () => openModal('fontUpload', setIsFontUploadModalOpen),
                    disabled: loadingModal === 'fontUpload',
                  },
                  {
                    id: 'history',
                    label: 'History',
                    icon: <Clock className="w-4 h-4" />,
                    onClick: () => openModal('history', setIsVersionHistoryOpen),
                    disabled: loadingModal === 'history',
                    shortcut: 'Ctrl+H',
                  },
                  {
                    id: 'preview',
                    label: 'Preview',
                    icon: <Play className="w-4 h-4" />,
                    onClick: () => openModal('preview', setIsAnimationPreviewOpen),
                    disabled: loadingModal === 'preview',
                    shortcut: 'Ctrl+P',
                  },
                  {
                    id: '3dPrint',
                    label: '3D Print',
                    icon: <span className="text-sm">🖨️</span>,
                    onClick: () => openModal('3dPrint', setIs3DGeneratorOpen),
                    disabled: loadingModal === '3dPrint',
                    badge: 'NEW',
                    badgeColor: 'primary',
                    variant: 'gradient' as const,
                    gradientClass: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0',
                  },
                  {
                    id: 'templates',
                    label: 'Templates',
                    icon: <Sparkles className="w-4 h-4" />,
                    onClick: () => openModal('templates', setIsTemplateGalleryOpen),
                    disabled: loadingModal === 'templates',
                    badge: 'NEW',
                    badgeColor: 'primary',
                  },
                  {
                    id: 'marketplace',
                    label: 'Marketplace',
                    icon: <Sparkles className="w-4 h-4" />,
                    onClick: () => navigate('/marketplace'),
                    badge: 'NEW',
                    badgeColor: 'primary',
                  },
                  {
                    id: 'parkBuilder',
                    label: 'Park Builder',
                    icon: <Ruler className="w-4 h-4" />,
                    onClick: () => navigate('/fingerpark'),
                    badge: 'NEW',
                    badgeColor: 'primary',
                  },
                  {
                    id: 'gallery',
                    label: 'Gallery',
                    icon: <Sparkles className="w-4 h-4" />,
                    onClick: () => navigate('/gallery'),
                  },
                ];

                const visibleCount = collapsibleItems.length - toolbarOverflowCount;
                const visibleItems = collapsibleItems.slice(0, visibleCount);
                const overflowItems = collapsibleItems.slice(visibleCount);

                return (
                  <>
                    {visibleItems.map((item) => (
                      <Tooltip key={item.id} delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={item.onClick}
                            disabled={item.disabled}
                            className={cn("gap-2", item.gradientClass)}
                          >
                            {item.disabled ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              item.icon
                            )}
                            {item.label}
                            {item.badge && (
                              <span className={cn(
                                "ml-1 text-[9px]",
                                item.badgeColor === 'accent' ? "text-accent" :
                                item.badgeColor === 'primary' ? "text-primary" :
                                "text-muted-foreground",
                                item.gradientClass && "bg-white/20 px-1 rounded"
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.label}</span>
                            {item.shortcut && (
                              <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded font-mono">{item.shortcut}</kbd>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}

                    {currentDesignId && (
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openModal('share', setIsShareModalOpen)}
                            disabled={loadingModal === 'share'}
                            className="gap-2"
                          >
                            {loadingModal === 'share' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                            Share
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="font-semibold">Share Design</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            Get shareable link or embed code
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <ToolbarOverflowMenu items={overflowItems} />
                  </>
                );
              })()}

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(isAuthenticated ? '/designs' : '/auth')}
                    className="gap-2"
                  >
                    <User className="w-4 h-4" />
                    {isAuthenticated ? 'My Designs' : 'Login'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="font-semibold">{isAuthenticated ? 'My Designs' : 'Login'}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isAuthenticated ? 'View all your saved designs' : 'Sign in to save your work'}
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsShortcutsModalOpen(true)}
                    className="gap-2"
                  >
                    <Menu className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    <span>Keyboard Shortcuts</span>
                    <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded font-mono">?</kbd>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    View all keyboard shortcuts
                  </p>
                </TooltipContent>
              </Tooltip>

              <KeyboardShortcuts 
                open={isShortcutsModalOpen}
                onOpenChange={setIsShortcutsModalOpen}
              />
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

      {/* Quick Access Toolbar */}
      {!isMobile && <QuickAccessToolbar />}

      {/* Main content */}
      <div className={cn(
        "flex-1 flex overflow-hidden",
        isMobile && "pb-14" // Space for mobile toolbar
      )}>
        {/* Desktop layout */}
        {!isMobile && (
          <>
            <ToolRail />
            <ComponentErrorBoundary componentName="Tool Drawer">
              <ToolDrawer />
            </ComponentErrorBoundary>
            <ComponentErrorBoundary componentName="Canvas">
              <WorkbenchStage />
            </ComponentErrorBoundary>
            <ComponentErrorBoundary componentName="Inspector">
              <Inspector />
            </ComponentErrorBoundary>
          </>
        )}

        {/* Mobile layout */}
        {isMobile && (
          <>
            <ToolRail />
            <ComponentErrorBoundary componentName="Tool Drawer">
              <ToolDrawer />
            </ComponentErrorBoundary>
            <ComponentErrorBoundary componentName="Canvas">
              <WorkbenchStage />
            </ComponentErrorBoundary>
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
          localSaveStatus={localSaveStatus}
        />
      )}

      {/* Mobile drawers */}
      <MobileDrawer
        isOpen={mobileInspectorOpen}
        onClose={() => setMobileInspectorOpen(false)}
        title="Properties"
      >
        <ComponentErrorBoundary componentName="Inspector">
          <Inspector />
        </ComponentErrorBoundary>
      </MobileDrawer>

      <MobileDrawer
        isOpen={mobileLayersOpen}
        onClose={() => setMobileLayersOpen(false)}
        title="Layers"
      >
        <ComponentErrorBoundary componentName="Layers Panel">
          <LayerList />
        </ComponentErrorBoundary>
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
              navigate('/marketplace');
              setMobileMenuOpen(false);
            }}
            className="w-full btn-brutal text-left py-3 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Marketplace
            <span className="ml-auto text-[9px] text-primary">NEW</span>
          </button>
          <button
            onClick={() => {
              navigate('/fingerpark');
              setMobileMenuOpen(false);
            }}
            className="w-full btn-brutal text-left py-3 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Park Builder
            <span className="ml-auto text-[9px] text-primary">NEW</span>
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

      {/* Lazy-loaded modals with Suspense */}
      <Suspense fallback={null}>
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
        <ComponentErrorBoundary componentName="Custom Fonts" onReset={() => setIsFontUploadModalOpen(false)}>
          <FontUploadModal
            isOpen={isFontUploadModalOpen}
            onClose={() => setIsFontUploadModalOpen(false)}
            onFontUploaded={(font) => {
              toast.success(`${font.name} is now available!`, {
                description: 'You can now use this font in your text objects.',
              });
            }}
          />
        </ComponentErrorBoundary>

        {/* Array Duplicate Modal */}
        <ArrayDuplicateModal
          open={isArrayDuplicateOpen}
          onClose={() => setIsArrayDuplicateOpen(false)}
          onDuplicate={(rows, cols, gapX, gapY) => {
            if (selectedId) {
              arrayDuplicate(selectedId, rows, cols, gapX, gapY);
              const totalCopies = (rows * cols) - 1;
              toast.success(`Created ${totalCopies} ${totalCopies === 1 ? 'copy' : 'copies'} in ${rows}×${cols} grid`);
            }
          }}
        />
      </Suspense>

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

      {/* Export modals with Suspense */}
      <Suspense fallback={null}>
        <ExportPreview
          isOpen={isExportPreviewOpen}
          onClose={() => setIsExportPreviewOpen(false)}
          objects={objects}
          designName={designName}
          onConfirmExport={() => {
            toast.success('Design exported successfully');
          }}
        />

        <ExportPresetsModal
          open={isExportPresetsOpen}
          onClose={() => setIsExportPresetsOpen(false)}
        />

        <TemplateGalleryModal
          isOpen={isTemplateGalleryOpen}
          onClose={() => setIsTemplateGalleryOpen(false)}
        />

        {/* 3D Deck Generator */}
        {is3DGeneratorOpen && (
          <DeckGenerator3D
            objects={objects}
            onClose={() => setIs3DGeneratorOpen(false)}
          />
        )}

        {/* Color Palette Extractor */}
        <ColorExtractorModal
          isOpen={isColorExtractorOpen}
          onClose={() => setIsColorExtractorOpen(false)}
        />

        {/* Smart Duplicate */}
        <SmartDuplicateModal
          isOpen={isSmartDuplicateOpen}
          onClose={() => setIsSmartDuplicateOpen(false)}
        />
      </Suspense>

      {/* Autosave Recovery Dialog */}
      <AutosaveRecoveryDialog
        open={recoveryDialogOpen}
        autosaveData={recoveryData}
        onRecover={handleRecoverAutosave}
        onDiscard={handleDiscardAutosave}
      />

      {/* Batch Actions Toolbar (appears when multiple objects selected) */}
      <BatchActionsToolbar />
      
      {/* Alignment Tools (appears when multiple objects selected) */}
      <AlignmentTools />
    </div>
  );
}
