import { useState } from 'react';
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
  } = useDeckForgeStore();

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const hasSelection = selectedIds.length > 0;
  const multipleSelected = selectedIds.length > 1;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedObjects = objects.filter((obj) => selectedIds.includes(obj.id));
  const allLocked = selectedObjects.length > 0 && selectedObjects.every((obj) => obj.locked);
  const anyLocked = selectedObjects.some((obj) => obj.locked);
  const allHidden = selectedObjects.length > 0 && selectedObjects.every((obj) => obj.hidden);
  const anyHidden = selectedObjects.some((obj) => obj.hidden);

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
    if (selectedIds.length < 2) return;
    
    alignObjects(alignment);
    toastUtils.success(`Aligned ${alignment}`);
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-card border-b border-border">
      {/* Always visible: Undo/Redo */}
      <div className="flex items-center gap-1 border-r border-border pr-2">
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
          <div className="flex items-center gap-1 border-r border-border pr-2">
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

          <div className="flex items-center gap-1 border-r border-border pr-2">
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
            <>
              <div className="flex items-center gap-1 border-r border-border pr-2">
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

              <div className="flex items-center gap-1">
                <EnhancedTooltip content="Align Left">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAlign('left')}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                </EnhancedTooltip>

                <EnhancedTooltip content="Align Center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAlign('center')}
                  >
                    <AlignHorizontalJustifyCenter className="h-4 w-4" />
                  </Button>
                </EnhancedTooltip>

                <EnhancedTooltip content="Align Right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAlign('right')}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </EnhancedTooltip>

                <EnhancedTooltip content="Align Top">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAlign('top')}
                  >
                    <AlignLeft className="h-4 w-4 rotate-90" />
                  </Button>
                </EnhancedTooltip>

                <EnhancedTooltip content="Align Middle">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAlign('middle')}
                  >
                    <AlignVerticalJustifyCenter className="h-4 w-4" />
                  </Button>
                </EnhancedTooltip>

                <EnhancedTooltip content="Align Bottom">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAlign('bottom')}
                  >
                    <AlignRight className="h-4 w-4 rotate-90" />
                  </Button>
                </EnhancedTooltip>
              </div>
            </>
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
