import { useState, useMemo } from 'react';
import { useDeckForgeStore } from '@/store/deckforge';
import { Button } from '@/components/ui/button';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  ArrowRightLeft,
  ArrowUpDown,
} from 'lucide-react';
import { toastUtils } from '@/lib/toast-utils';

/**
 * Quick Access Toolbar - Common actions for selected objects
 * Shows only when objects are selected
 */
export function QuickAccessToolbar() {
  const {
    selectedIds,
    objects,
    undo,
    redo,
    past,
    future,
    deleteObject,
    updateObject,
    saveToHistory,
    groupObjects,
    alignObjects,
    distributeObjects,
  } = useDeckForgeStore();

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const hasSelection = selectedIds.length > 0;
  const multipleSelected = selectedIds.length > 1;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Memoize selected objects to avoid filtering on every render
  const selectedObjects = useMemo(() => {
    return objects.filter((obj) => selectedIds.includes(obj.id));
  }, [objects, selectedIds]);

  // Memoize computed properties
  const { allLocked, anyLocked, allHidden, anyHidden } = useMemo(() => {
    return {
      allLocked: selectedObjects.length > 0 && selectedObjects.every((obj) => obj.locked),
      anyLocked: selectedObjects.some((obj) => obj.locked),
      allHidden: selectedObjects.length > 0 && selectedObjects.every((obj) => obj.hidden),
      anyHidden: selectedObjects.some((obj) => obj.hidden),
    };
  }, [selectedObjects]);

  const handleDuplicate = () => {
    if (selectedIds.length === 0) return;
    
    saveToHistory();
    selectedIds.forEach((id) => {
      const obj = objects.find((o) => o.id === id);
      if (obj) {
        const { id: _, ...objWithoutId } = obj;
        const newObj = {
          ...objWithoutId,
          x: obj.x + 20,
          y: obj.y + 20,
        };
        // Add via store action
        useDeckForgeStore.getState().addObject(newObj);
      }
    });
    toastUtils.success(`Duplicated ${selectedIds.length} object(s)`);
  };

  const confirmDelete = () => {
    if (selectedIds.length === 0) return;
    saveToHistory();
    selectedIds.forEach((id) => deleteObject(id));
    toastUtils.success(`Deleted ${selectedIds.length} object(s)`);
    setShowDeleteConfirm(false);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const handleGroup = () => {
    if (selectedIds.length < 2) return;
    
    groupObjects(selectedIds);
    toastUtils.success('Objects grouped');
  };

  const handleToggleLock = () => {
    if (selectedIds.length === 0) return;
    
    saveToHistory();
    const newLockState = !allLocked;
    selectedIds.forEach((id) => {
      updateObject(id, { locked: newLockState });
    });
    toastUtils.success(newLockState ? 'Locked' : 'Unlocked');
  };

  const handleToggleVisibility = () => {
    if (selectedIds.length === 0) return;
    
    saveToHistory();
    const newHiddenState = !allHidden;
    selectedIds.forEach((id) => {
      updateObject(id, { hidden: newHiddenState });
    });
    toastUtils.success(newHiddenState ? 'Hidden' : 'Visible');
  };

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedIds.length === 0) return;

    alignObjects(alignment);

    // Better toast messages
    const isSingle = selectedIds.length === 1;
    const messages = {
      left: isSingle ? 'Aligned to left edge' : 'Aligned left',
      center: isSingle ? 'Centered horizontally' : 'Aligned center',
      right: isSingle ? 'Aligned to right edge' : 'Aligned right',
      top: isSingle ? 'Aligned to top edge' : 'Aligned top',
      middle: isSingle ? 'Centered vertically' : 'Aligned middle',
      bottom: isSingle ? 'Aligned to bottom edge' : 'Aligned bottom',
    };
    toastUtils.success(messages[alignment]);
  };

  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    if (selectedIds.length < 3) return;
    distributeObjects(direction);
    toastUtils.success(direction === 'horizontal' ? 'Distributed horizontally' : 'Distributed vertically');
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-card border-b border-border overflow-x-auto toolbar-scroll">
      {/* Always visible: Undo/Redo */}
      <div className="flex items-center gap-1 border-r border-border pr-2 shrink-0">
        <EnhancedTooltip content="Undo" shortcut="Ctrl+Z">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={undo}
            disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </EnhancedTooltip>
        
        <EnhancedTooltip content="Redo" shortcut="Ctrl+Shift+Z">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={redo}
            disabled={!canRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </EnhancedTooltip>
      </div>

      {/* Selection-dependent actions */}
      {hasSelection && (
        <>
          <div className="flex items-center gap-1 border-r border-border pr-2 shrink-0">
            <EnhancedTooltip content="Duplicate" shortcut="Ctrl+D">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </EnhancedTooltip>

            <EnhancedTooltip content="Delete" shortcut={['Delete', 'Backspace']}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </EnhancedTooltip>
          </div>

          <div className="flex items-center gap-1 border-r border-border pr-2 shrink-0">
            <EnhancedTooltip content={allLocked ? 'Unlock' : 'Lock'}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleToggleLock}
              >
                {allLocked ? (
                  <Unlock className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </Button>
            </EnhancedTooltip>

            <EnhancedTooltip content={allHidden ? 'Show' : 'Hide'}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleToggleVisibility}
              >
                {allHidden ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </EnhancedTooltip>
          </div>

          {multipleSelected && (
            <div className="flex items-center gap-1 border-r border-border pr-2 shrink-0">
              <EnhancedTooltip content="Group" shortcut="Ctrl+G">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleGroup}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>
            </div>
          )}

          {/* Alignment - available for single or multiple selection */}
          {hasSelection && (
            <div className="flex items-center gap-1 shrink-0">
              <EnhancedTooltip content={multipleSelected ? "Align objects left" : "Align to left edge"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAlign('left')}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content={multipleSelected ? "Align objects center" : "Center horizontally"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAlign('center')}
                >
                  <AlignHorizontalJustifyCenter className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content={multipleSelected ? "Align objects right" : "Align to right edge"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAlign('right')}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content={multipleSelected ? "Align objects top" : "Align to top edge"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAlign('top')}
                >
                  <AlignLeft className="h-4 w-4 rotate-90" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content={multipleSelected ? "Align objects middle" : "Center vertically"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAlign('middle')}
                >
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content={multipleSelected ? "Align objects bottom" : "Align to bottom edge"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAlign('bottom')}
                >
                  <AlignRight className="h-4 w-4 rotate-90" />
                </Button>
              </EnhancedTooltip>

              {/* Distribute - only for 3+ objects */}
              {selectedIds.length >= 3 && (
                <>
                  <div className="w-px h-5 bg-border mx-1" />
                  <EnhancedTooltip content="Distribute horizontally">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDistribute('horizontal')}
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                  </EnhancedTooltip>
                  <EnhancedTooltip content="Distribute vertically">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDistribute('vertical')}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </EnhancedTooltip>
                </>
              )}
            </div>
          )}
        </>
      )}

      {!hasSelection && (
        <p className="text-xs text-muted-foreground px-2">
          Select objects to see quick actions
        </p>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDelete}
        title={`Delete ${selectedIds.length} object(s)?`}
        description="This action cannot be undone. The objects will be permanently removed from your design."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
