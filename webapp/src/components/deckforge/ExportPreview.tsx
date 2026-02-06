import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CanvasObject, useDeckForgeStore } from '@/store/deckforge';
import { exportToPNG, downloadBlob } from '@/lib/export';

interface ExportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  objects: CanvasObject[];
  designName: string;
  onConfirmExport?: () => void;
}

export function ExportPreview({ isOpen, onClose, objects, designName, onConfirmExport }: ExportPreviewProps) {
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { backgroundColor, backgroundFillType, backgroundGradient } = useDeckForgeStore();

  const bgOpts = { backgroundColor, backgroundFillType, backgroundGradient };

  const handleGeneratePreview = async () => {
    try {
      // Generate preview at 2x for quality
      const blob = await exportToPNG(objects, {
        scale: 2,
        format: 'png',
        includeBackground: true,
        ...bgOpts,
      });

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Preview generation failed:', err);
    }
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      // Export at 3x for final download
      const blob = await exportToPNG(objects, {
        scale: 3,
        format: 'png',
        includeBackground: true,
        ...bgOpts,
      });

      const filename = `${designName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
      downloadBlob(blob, filename);
      
      onConfirmExport?.();
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate preview when modal opens
  useEffect(() => {
    if (isOpen && !previewUrl) {
      handleGeneratePreview();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-card border-2 border-border w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-display text-lg uppercase tracking-widest">Export Preview</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Review your design before downloading
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary transition-colors rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-secondary/20 p-8 flex items-center justify-center">
          {previewUrl ? (
            <div 
              className="relative"
              style={{ 
                transform: `scale(${previewZoom})`,
                transition: 'transform 0.2s',
              }}
            >
              <img
                src={previewUrl}
                alt="Export preview"
                className="max-w-full max-h-full shadow-2xl border-2 border-border"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Generating preview...</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="border-t border-border p-4 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">
              Preview Zoom:
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.25))}
              disabled={previewZoom <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-mono w-12 text-center">
              {Math.round(previewZoom * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreviewZoom(Math.min(2, previewZoom + 0.25))}
              disabled={previewZoom >= 2}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreviewZoom(1)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-2">
              <p className="text-xs text-muted-foreground">Final Export Quality</p>
              <p className="text-sm font-mono text-primary">3x Resolution (Print Ready)</p>
            </div>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isExporting || !previewUrl}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PNG
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
