import { ColorPaletteExtractor } from './ColorPaletteExtractor';
import { useDeckForgeStore } from '@/store/deckforge';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface ColorExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ColorExtractorModal({ isOpen, onClose }: ColorExtractorModalProps) {
  const { updateObject, selectedId, objects } = useDeckForgeStore();

  if (!isOpen) return null;

  const handleColorSelect = (color: string) => {
    if (selectedId) {
      const obj = objects.find(o => o.id === selectedId);
      if (obj) {
        updateObject(selectedId, { fill: color });
        toast.success(`Applied ${color} to selected object`);
      }
    } else {
      // Copy to clipboard if no selection
      navigator.clipboard.writeText(color);
      toast.success(`Copied ${color} to clipboard`);
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
            <h2 className="text-lg font-bold text-white">Color Palette Extractor</h2>
            <p className="text-xs text-gray-400 mt-1">
              Upload an image to extract its dominant colors
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
          <ColorPaletteExtractor
            onColorSelect={handleColorSelect}
            onPaletteExtracted={(colors) => {
              console.log('Extracted palette:', colors);
            }}
          />

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-2">💡 How to use:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Upload any image (photo, logo, artwork)</li>
              <li>• Click a color to {selectedId ? 'apply it to your selection' : 'copy it'}</li>
              <li>• Use "Copy All" to save the entire palette</li>
              <li>• Extract colors from inspiration or reference images</li>
            </ul>
          </div>
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
