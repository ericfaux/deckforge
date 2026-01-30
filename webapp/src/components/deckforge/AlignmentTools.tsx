import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignRight, AlignCenterHorizontal, AlignVerticalJustifyStart, AlignVerticalJustifyEnd, AlignCenterVertical, ArrowRightLeft, ArrowUpDown, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

export function AlignmentTools() {
  const { selectedIds, objects, updateObject, saveToHistory } = useDeckForgeStore();

  const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));

  if (selectedIds.length < 2) {
    return null;
  }

  const alignLeft = () => {
    saveToHistory();
    const minX = Math.min(...selectedObjects.map(obj => obj.x));
    selectedObjects.forEach(obj => {
      updateObject(obj.id, { x: minX });
    });
    toast.success('Aligned to left edge');
  };

  const alignRight = () => {
    saveToHistory();
    const maxX = Math.max(...selectedObjects.map(obj => obj.x + obj.width));
    selectedObjects.forEach(obj => {
      updateObject(obj.id, { x: maxX - obj.width });
    });
    toast.success('Aligned to right edge');
  };

  const alignCenterHorizontal = () => {
    saveToHistory();
    const minX = Math.min(...selectedObjects.map(obj => obj.x));
    const maxX = Math.max(...selectedObjects.map(obj => obj.x + obj.width));
    const centerX = (minX + maxX) / 2;
    selectedObjects.forEach(obj => {
      updateObject(obj.id, { x: centerX - obj.width / 2 });
    });
    toast.success('Aligned horizontally');
  };

  const alignTop = () => {
    saveToHistory();
    const minY = Math.min(...selectedObjects.map(obj => obj.y));
    selectedObjects.forEach(obj => {
      updateObject(obj.id, { y: minY });
    });
    toast.success('Aligned to top edge');
  };

  const alignBottom = () => {
    saveToHistory();
    const maxY = Math.max(...selectedObjects.map(obj => obj.y + obj.height));
    selectedObjects.forEach(obj => {
      updateObject(obj.id, { y: maxY - obj.height });
    });
    toast.success('Aligned to bottom edge');
  };

  const alignCenterVertical = () => {
    saveToHistory();
    const minY = Math.min(...selectedObjects.map(obj => obj.y));
    const maxY = Math.max(...selectedObjects.map(obj => obj.y + obj.height));
    const centerY = (minY + maxY) / 2;
    selectedObjects.forEach(obj => {
      updateObject(obj.id, { y: centerY - obj.height / 2 });
    });
    toast.success('Aligned vertically');
  };

  const distributeHorizontal = () => {
    saveToHistory();
    const sorted = [...selectedObjects].sort((a, b) => a.x - b.x);
    const minX = sorted[0].x;
    const maxX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
    const totalWidth = sorted.reduce((sum, obj) => sum + obj.width, 0);
    const spacing = (maxX - minX - totalWidth) / (sorted.length - 1);
    
    let currentX = minX;
    sorted.forEach((obj, i) => {
      if (i > 0) {
        currentX += sorted[i - 1].width + spacing;
        updateObject(obj.id, { x: currentX });
      }
    });
    toast.success('Distributed horizontally');
  };

  const distributeVertical = () => {
    saveToHistory();
    const sorted = [...selectedObjects].sort((a, b) => a.y - b.y);
    const minY = sorted[0].y;
    const maxY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
    const totalHeight = sorted.reduce((sum, obj) => sum + obj.height, 0);
    const spacing = (maxY - minY - totalHeight) / (sorted.length - 1);
    
    let currentY = minY;
    sorted.forEach((obj, i) => {
      if (i > 0) {
        currentY += sorted[i - 1].height + spacing;
        updateObject(obj.id, { y: currentY });
      }
    });
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
          Align ({selectedIds.length} selected)
        </div>
        
        {/* Horizontal Alignment */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={alignLeft}
            className="flex-1 h-8"
            title="Align Left (Ctrl+Shift+L)"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={alignCenterHorizontal}
            className="flex-1 h-8"
            title="Align Center Horizontal (Ctrl+Shift+C)"
          >
            <AlignCenterHorizontal className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={alignRight}
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
            onClick={alignTop}
            className="flex-1 h-8"
            title="Align Top (Ctrl+Shift+T)"
          >
            <AlignVerticalJustifyStart className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={alignCenterVertical}
            className="flex-1 h-8"
            title="Align Center Vertical (Ctrl+Shift+M)"
          >
            <AlignCenterVertical className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={alignBottom}
            className="flex-1 h-8"
            title="Align Bottom (Ctrl+Shift+B)"
          >
            <AlignVerticalJustifyEnd className="w-4 h-4" />
          </Button>
        </div>

        <div className="border-t border-gray-700 my-1"></div>

        {/* Distribution */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={distributeHorizontal}
            className="flex-1 h-8"
            title="Distribute Horizontally"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={distributeVertical}
            className="flex-1 h-8"
            title="Distribute Vertically"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>

        <div className="border-t border-gray-700 my-1"></div>

        {/* Size Matching */}
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
      </div>
    </div>
  );
}
