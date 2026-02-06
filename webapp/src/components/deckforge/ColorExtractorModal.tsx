import { useState, useMemo } from 'react';
import { useDeckForgeStore } from '@/store/deckforge';
import type { CanvasObject } from '@/store/deckforge';
import { Button } from '@/components/ui/button';
import { X, Copy, Check, Palette, Save, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

interface ColorExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAsBrandKit?: (colors: string[]) => void;
}

function extractCanvasColors(objects: CanvasObject[]): string[] {
  const colors = new Set<string>();

  function processObject(obj: CanvasObject) {
    if (obj.fill && obj.fill !== 'transparent' && obj.fill !== 'none') {
      colors.add(obj.fill);
    }
    if (obj.stroke && obj.stroke !== 'transparent' && obj.stroke !== 'none') {
      colors.add(obj.stroke);
    }
    if (obj.colorize) {
      colors.add(obj.colorize);
    }
    if (obj.patternPrimaryColor) {
      colors.add(obj.patternPrimaryColor);
    }
    if (obj.patternSecondaryColor) {
      colors.add(obj.patternSecondaryColor);
    }
    if (obj.outlineStroke?.enabled && obj.outlineStroke.color) {
      colors.add(obj.outlineStroke.color);
    }
    if (obj.textShadow?.enabled && obj.textShadow.color) {
      colors.add(obj.textShadow.color);
    }
    if (obj.dropShadow?.enabled && obj.dropShadow.color) {
      colors.add(obj.dropShadow.color);
    }
    if (obj.glow?.enabled && obj.glow.color) {
      colors.add(obj.glow.color);
    }
    if (obj.gradientStops) {
      obj.gradientStops.forEach(stop => {
        if (stop.color) colors.add(stop.color);
      });
    }
    if (obj.duotone?.enabled) {
      if (obj.duotone.color1) colors.add(obj.duotone.color1);
      if (obj.duotone.color2) colors.add(obj.duotone.color2);
    }
    // Recurse into group children
    if (obj.children) {
      obj.children.forEach(processObject);
    }
  }

  objects.forEach(processObject);
  return Array.from(colors);
}

function getContrastColor(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return '#ffffff';
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function ColorExtractorModal({ isOpen, onClose, onSaveAsBrandKit }: ColorExtractorModalProps) {
  const { objects, selectedId, updateObject } = useDeckForgeStore();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const extractedColors = useMemo(() => extractCanvasColors(objects), [objects]);

  if (!isOpen) return null;

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
    toast.success(`Copied ${color}`);
  };

  const copyAllColors = () => {
    const text = extractedColors.join(', ');
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${extractedColors.length} colors to clipboard`);
  };

  const applyColorToSelected = (color: string) => {
    if (selectedId) {
      updateObject(selectedId, { fill: color });
      toast.success(`Applied ${color} to selected object`);
    } else {
      copyColor(color);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md border border-gray-700 modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">Extract Colors</h2>
            <p className="text-xs text-gray-400 mt-1">
              Colors extracted from your canvas objects
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {extractedColors.length === 0 ? (
            /* Empty state */
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                <Palette className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-white font-medium mb-2">No colors found</h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                Add some design elements first to extract their colors
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Color count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Layers className="w-4 h-4" />
                  <span>{extractedColors.length} unique color{extractedColors.length !== 1 ? 's' : ''} found</span>
                </div>
              </div>

              {/* Color swatches */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {extractedColors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors group cursor-pointer"
                    onClick={() => applyColorToSelected(color)}
                  >
                    {/* Color swatch */}
                    <div
                      className="w-10 h-10 rounded-lg border border-gray-600 flex-shrink-0 shadow-inner"
                      style={{ backgroundColor: color }}
                    />

                    {/* Hex value */}
                    <span className="text-sm font-mono text-gray-200 flex-1">
                      {color}
                    </span>

                    {/* Copy button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyColor(color);
                      }}
                      className="p-2 rounded-md hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy color"
                    >
                      {copiedColor === color ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Color strip preview */}
              <div className="flex rounded-lg overflow-hidden h-8 border border-gray-700">
                {extractedColors.map((color) => (
                  <div
                    key={color}
                    className="flex-1 cursor-pointer hover:opacity-80 transition-opacity relative group"
                    style={{ backgroundColor: color }}
                    onClick={() => copyColor(color)}
                    title={color}
                  >
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: getContrastColor(color) }}
                    >
                      {color}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyAllColors}
                  className="flex-1"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (onSaveAsBrandKit) {
                      onSaveAsBrandKit(extractedColors);
                    }
                  }}
                  className="flex-1"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save as Brand Kit
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          {extractedColors.length > 0 && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <ul className="text-xs text-gray-400 space-y-1">
                <li>Click a color to {selectedId ? 'apply it to your selection' : 'copy it'}</li>
                <li>Use "Copy All" to grab the entire palette</li>
                <li>Save colors as a Brand Kit for reuse</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
