import { AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, Group, Ungroup } from 'lucide-react';
import { useDeckForgeStore } from '@/store/deckforge';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export function BatchActionsToolbar() {
  const { selectedIds, objects, alignObjects, distributeObjects, groupObjects, ungroupObject } = useDeckForgeStore();

  if (selectedIds.length < 2) return null;

  // Check if selection is a single group
  const isSingleGroup = selectedIds.length === 1 && objects.find(o => o.id === selectedIds[0])?.type === 'group';

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    alignObjects(alignment);
    const alignmentNames = {
      left: 'Left',
      center: 'Center',
      right: 'Right',
      top: 'Top',
      middle: 'Middle',
      bottom: 'Bottom',
    };
    toast.success(`Aligned ${selectedIds.length} objects`, {
      description: alignmentNames[alignment],
    });
  };

  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    if (selectedIds.length < 3) {
      toast.error('Need at least 3 objects to distribute');
      return;
    }
    distributeObjects(direction);
    toast.success(`Distributed ${selectedIds.length} objects`, {
      description: direction === 'horizontal' ? 'Horizontally' : 'Vertically',
    });
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border-2 border-primary shadow-2xl rounded-lg p-3 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3">
        {/* Selection count */}
        <div className="px-3 py-1.5 bg-primary/10 rounded border border-primary/20">
          <span className="text-sm font-medium text-primary">
            {selectedIds.length} selected
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border" />

        {/* Horizontal alignment */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Align:</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAlign('left')}
            className="h-8 w-8 p-0"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAlign('center')}
            className="h-8 w-8 p-0"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAlign('right')}
            className="h-8 w-8 p-0"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border" />

        {/* Vertical alignment */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAlign('top')}
            className="h-8 w-8 p-0"
            title="Align Top"
          >
            <AlignVerticalJustifyStart className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAlign('middle')}
            className="h-8 w-8 p-0"
            title="Align Middle"
          >
            <AlignVerticalJustifyCenter className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAlign('bottom')}
            className="h-8 w-8 p-0"
            title="Align Bottom"
          >
            <AlignVerticalJustifyEnd className="w-4 h-4" />
          </Button>
        </div>

        {/* Distribute (only show if 3+ objects) */}
        {selectedIds.length >= 3 && (
          <>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Distribute:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDistribute('horizontal')}
                className="h-8 w-8 p-0"
                title="Distribute Horizontally"
              >
                <AlignHorizontalDistributeCenter className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDistribute('vertical')}
                className="h-8 w-8 p-0"
                title="Distribute Vertically"
              >
                <AlignVerticalDistributeCenter className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* Group/Ungroup */}
        <div className="w-px h-8 bg-border" />
        {isSingleGroup ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              ungroupObject(selectedIds[0]);
              toast.success('Ungrouped objects');
            }}
            className="gap-2"
            title="Ungroup (Ctrl+Shift+G)"
          >
            <Ungroup className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Ungroup</span>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              groupObjects(selectedIds);
              toast.success(`Grouped ${selectedIds.length} objects`);
            }}
            className="gap-2"
            title="Group (Ctrl+G)"
          >
            <Group className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Group</span>
          </Button>
        )}
      </div>
    </div>
  );
}
