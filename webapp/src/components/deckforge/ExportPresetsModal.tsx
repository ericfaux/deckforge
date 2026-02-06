import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Instagram, MessageCircle, Printer, FileImage, Loader2, Crown, Sparkles, FileText } from 'lucide-react';
import { exportToPNG, exportToPDF } from '@/lib/export';
import { useDeckForgeStore } from '@/store/deckforge';
import toast from 'react-hot-toast';

interface ExportPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  width: number;
  height: number;
  scale: number; // Multiplier for resolution
  format: 'png' | 'jpg' | 'pdf';
  isPro?: boolean; // Premium feature
}

const presets: ExportPreset[] = [
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    description: '1080×1080px (Square)',
    icon: <Instagram className="w-5 h-5" />,
    width: 1080,
    height: 1080,
    scale: 3,
    format: 'png',
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    description: '1080×1920px (9:16)',
    icon: <Instagram className="w-5 h-5" />,
    width: 1080,
    height: 1920,
    scale: 3,
    format: 'png',
  },
  {
    id: 'twitter-post',
    name: 'Twitter/X Post',
    description: '1200×675px (16:9)',
    icon: <MessageCircle className="w-5 h-5" />,
    width: 1200,
    height: 675,
    scale: 3,
    format: 'png',
  },
  {
    id: 'print-high',
    name: 'Print Quality',
    description: '300 DPI (High Res)',
    icon: <Printer className="w-5 h-5" />,
    width: 96,  // Native deck width
    height: 294, // Native deck height
    scale: 10, // 10x for print quality
    format: 'png',
  },
  {
    id: 'ultra-hd-6x',
    name: 'Ultra HD (6x)',
    description: 'Professional • 576×1764px',
    icon: <Crown className="w-5 h-5" />,
    width: 96,
    height: 294,
    scale: 6,
    format: 'png',
    isPro: true,
  },
  {
    id: 'ultra-hd-8x',
    name: 'Ultra HD (8x)',
    description: 'Gallery Quality • 768×2352px',
    icon: <Crown className="w-5 h-5" />,
    width: 96,
    height: 294,
    scale: 8,
    format: 'png',
    isPro: true,
  },
  {
    id: 'ultra-hd-12x',
    name: 'Ultra HD (12x)',
    description: 'Museum Grade • 1152×3528px',
    icon: <Sparkles className="w-5 h-5" />,
    width: 96,
    height: 294,
    scale: 12,
    format: 'png',
    isPro: true,
  },
  {
    id: 'pdf-print',
    name: 'PDF (Print Ready)',
    description: 'Industry Standard • 96×294mm',
    icon: <FileText className="w-5 h-5" />,
    width: 96,
    height: 294,
    scale: 6,
    format: 'pdf',
    isPro: true,
  },
  {
    id: 'pdf-high-res',
    name: 'PDF (Ultra HD)',
    description: 'Premium Quality • 96×294mm',
    icon: <FileText className="w-5 h-5" />,
    width: 96,
    height: 294,
    scale: 10,
    format: 'pdf',
    isPro: true,
  },
  {
    id: 'web-preview',
    name: 'Web Preview',
    description: '800×2450px (Web)',
    icon: <FileImage className="w-5 h-5" />,
    width: 800,
    height: 2450,
    scale: 3,
    format: 'jpg',
  },
  {
    id: 'thumbnail',
    name: 'Thumbnail',
    description: '400×1225px (Small)',
    icon: <FileImage className="w-5 h-5" />,
    width: 400,
    height: 1225,
    scale: 1,
    format: 'jpg',
  },
];

interface ExportPresetsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExportPresetsModal({ open, onClose }: ExportPresetsModalProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const { objects, designName, backgroundColor, backgroundFillType, backgroundGradient } = useDeckForgeStore();

  const bgOpts = { backgroundColor, backgroundFillType, backgroundGradient };

  const handleExport = async (preset: ExportPreset) => {
    setExporting(preset.id);

    try {
      toast.info(`Exporting ${preset.name}...`, {
        description: 'This may take a moment for high-resolution exports',
      });

      let blob: Blob;

      if (preset.format === 'pdf') {
        // PDF export
        blob = await exportToPDF(objects, {
          scale: preset.scale,
          includeBackground: true,
          title: designName || 'Fingerboard Design',
          ...bgOpts,
        });
      } else {
        // PNG/JPG export
        blob = await exportToPNG(objects, {
          scale: preset.scale,
          format: preset.format as 'png' | 'jpeg',
          includeBackground: true,
          ...bgOpts,
        });
      }

      // Download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${designName || 'deck'}_${preset.id}.${preset.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${preset.name} exported!`, {
        description: `${preset.description} • ${preset.format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed', {
        description: 'Please try again or contact support',
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Quick Export
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Export your design in popular formats and sizes
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleExport(preset)}
                disabled={exporting !== null}
                className={`
                  flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left
                  ${exporting === preset.id
                    ? 'border-primary bg-primary/10'
                    : exporting
                      ? 'border-border bg-muted/50 opacity-50'
                      : 'border-border hover:border-primary hover:bg-accent/50'
                  }
                `}
              >
                <div className={`
                  p-2 rounded bg-primary/10 text-primary shrink-0
                  ${exporting === preset.id ? 'animate-pulse' : ''}
                `}>
                  {exporting === preset.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    preset.icon
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium text-sm">{preset.name}</h3>
                    {preset.isPro && (
                      <span className="text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded">
                      {preset.format.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {preset.scale}x resolution
                    </span>
                    {preset.isPro && (
                      <span className="text-[10px] text-amber-500 font-medium">
                        ✨ Premium
                      </span>
                    )}
                  </div>
                </div>

                {exporting !== preset.id && (
                  <Download className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> PDF exports are industry-standard for professional printers. Ultra HD exports (6x-12x) provide gallery-quality resolution. Web Preview uses JPG for smaller file sizes.
            </p>
          </div>

          <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              📄 PDF exports embed high-resolution images in industry-standard format, perfect for sending to print shops and manufacturers.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
