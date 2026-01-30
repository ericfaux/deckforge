import { useState } from 'react';
import { useDeckForgeStore } from '@/store/deckforge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Copy, Grid3x3 } from 'lucide-react';
import { toast } from 'sonner';

interface SmartDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmartDuplicateModal({ isOpen, onClose }: SmartDuplicateModalProps) {
  const { selectedId, objects, addObject, saveToHistory } = useDeckForgeStore();
  const [count, setCount] = useState(3);
  const [direction, setDirection] = useState<'right' | 'down' | 'diagonal'>('right');
  const [spacing, setSpacing] = useState(10);

  if (!isOpen || !selectedId) return null;

  const selectedObject = objects.find(o => o.id === selectedId);
  if (!selectedObject) return null;

  const handleDuplicate = () => {
    saveToHistory();
    
    for (let i = 1; i <= count; i++) {
      const { id, ...objWithoutId } = selectedObject;
      
      let offsetX = 0;
      let offsetY = 0;
      
      switch (direction) {
        case 'right':
          offsetX = (selectedObject.width + spacing) * i;
          break;
        case 'down':
          offsetY = (selectedObject.height + spacing) * i;
          break;
        case 'diagonal':
          offsetX = (selectedObject.width + spacing) * i;
          offsetY = (selectedObject.height + spacing) * i;
          break;
      }
      
      addObject({
        ...objWithoutId,
        x: selectedObject.x + offsetX,
        y: selectedObject.y + offsetY,
      });
    }
    
    toast.success(`Created ${count} ${count === 1 ? 'copy' : 'copies'}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Smart Duplicate</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Count */}
          <div className="space-y-2">
            <Label htmlFor="count" className="text-white">Number of Copies</Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Direction */}
          <div className="space-y-2">
            <Label className="text-white">Direction</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setDirection('right')}
                className={`px-4 py-3 rounded-lg border transition-all ${
                  direction === 'right'
                    ? 'bg-primary border-primary text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="text-lg">→</div>
                  <span className="text-xs">Right</span>
                </div>
              </button>
              <button
                onClick={() => setDirection('down')}
                className={`px-4 py-3 rounded-lg border transition-all ${
                  direction === 'down'
                    ? 'bg-primary border-primary text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="text-lg">↓</div>
                  <span className="text-xs">Down</span>
                </div>
              </button>
              <button
                onClick={() => setDirection('diagonal')}
                className={`px-4 py-3 rounded-lg border transition-all ${
                  direction === 'diagonal'
                    ? 'bg-primary border-primary text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="text-lg">↘</div>
                  <span className="text-xs">Diagonal</span>
                </div>
              </button>
            </div>
          </div>

          {/* Spacing */}
          <div className="space-y-2">
            <Label htmlFor="spacing" className="text-white">
              Spacing: {spacing}px
            </Label>
            <input
              id="spacing"
              type="range"
              min="0"
              max="100"
              step="5"
              value={spacing}
              onChange={(e) => setSpacing(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0px</span>
              <span>50px</span>
              <span>100px</span>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Grid3x3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-white">Preview</span>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>Total objects: <span className="text-white">{count + 1}</span> (original + {count} {count === 1 ? 'copy' : 'copies'})</div>
              <div>Direction: <span className="text-white capitalize">{direction}</span></div>
              <div>Spacing: <span className="text-white">{spacing}px</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
        </div>
      </div>
    </div>
  );
}
