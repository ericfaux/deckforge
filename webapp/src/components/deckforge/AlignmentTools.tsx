import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { useDeckDimensions } from '@/components/deckforge/WorkbenchStage';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignRight, AlignCenterHorizontal, AlignVerticalJustifyStart, AlignVerticalJustifyEnd, AlignCenterVertical, ArrowRightLeft, ArrowUpDown, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function AlignmentTools() {
  const { selectedIds, objects, alignObjects, distributeObjects, updateObject, saveToHistory } = useDeckForgeStore();
  const { width: deckWidth, height: deckHeight } = useDeckDimensions();

  const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
  const isSingle = selectedIds.length === 1;
  const isMultiple = selectedIds.length >= 2;

  if (selectedIds.length < 1) {
    return null;
  }

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    alignObjects(alignment);
    const messages: Record<string, string> = {
      left: isSingle ? 'Aligned to left edge' : 'Aligned to left edge',
      right: isSingle ? 'Aligned to right edge' : 'Aligned to right edge',
      center: isSingle ? 'Centered horizontally' : 'Aligned horizontally',
      top: isSingle ? 'Aligned to top edge' : 'Aligned to top edge',
      bottom: isSingle ? 'Aligned to bottom edge' : 'Aligned to bottom edge',
      middle: isSingle ? 'Centered vertically' : 'Aligned vertically',
    };
    toast.success(messages[alignment]);
  };

  const handleDistributeH = () => {
    if (selectedIds.length < 3) return;
    distributeObjects('horizontal');
    toast.success('Distributed horizontally');
  };

  const handleDistributeV = () => {
    if (selectedIds.length < 3) return;
    distributeObjects('vertical');
    toast.success('Distributed vertically');
  };

  const matchWidth = () => {
    saveToHistory();
    const refWidth = selectedObjects[0].width;
    selectedObjects.slice(1).forEach(obj => {
      updateObject(obj.id, { width: refWidth });
    });
    toast.success('Matched widths');
  };

  const matchHeight = () => {
    saveToHistory();
    const refHeight = selectedObjects[0].height;
    selectedObjects.slice(1).forEach(obj => {
      updateObject(obj.id, { height: refHeight });
    });
    toast.success('Matched heights');
  };

  const matchSize = () => {
    saveToHistory();
    const refWidth = selectedObjects[0].width;
    const refHeight = selectedObjects[0].height;
    selectedObjects.slice(1).forEach(obj => {
      updateObject(obj.id, { width: refWidth, height: refHeight });
    });
    toast.success('Matched sizes');
  };

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-3 z-40">
      <div className="flex flex-col gap-2">
        <div className="text-xs text-gray-400 font-semibold mb-1 text-center">
          {isSingle ? 'Align to deck' : `Align (${selectedIds.length} selected)`}
        </div>

        {/* Horizontal Alignment */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAlign('left')}
            className="flex-1 h-8"
            title="Align Left (Ctrl+Shift+L)"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAlign('center')}
            className="flex-1 h-8"
            title="Align Center Horizontal (Ctrl+Shift+C)"
          >
            <AlignCenterHorizontal className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAlign('right')}
            className="flex-1 h-8"
            title="Align Right (Ctrl+Shift+R)"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Vertical Alignment */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAlign('top')}
            className="flex-1 h-8"
            title="Align Top (Ctrl+Shift+T)"
          >
            <AlignVerticalJustifyStart className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAlign('middle')}
            className="flex-1 h-8"
            title="Align Center Vertical (Ctrl+Shift+M)"
          >
            <AlignCenterVertical className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAlign('bottom')}
            className="flex-1 h-8"
            title="Align Bottom (Ctrl+Shift+B)"
          >
            <AlignVerticalJustifyEnd className="w-4 h-4" />
          </Button>
        </div>

        {/* Distribution - only for 3+ objects */}
        {selectedIds.length >= 3 && (
          <>
            <div className="border-t border-gray-700 my-1"></div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDistributeH}
                className="flex-1 h-8"
                title="Distribute Horizontally"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDistributeV}
                className="flex-1 h-8"
                title="Distribute Vertically"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* Size Matching - only for 2+ objects */}
        {isMultiple && (
          <>
            <div className="border-t border-gray-700 my-1"></div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={matchWidth}
                className="flex-1 h-8 text-xs"
                title="Match Width"
              >
                W
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={matchHeight}
                className="flex-1 h-8 text-xs"
                title="Match Height"
              >
                H
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={matchSize}
                className="flex-1 h-8"
                title="Match Size"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
