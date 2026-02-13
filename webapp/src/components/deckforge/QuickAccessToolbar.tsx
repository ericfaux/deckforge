import { memo, useState, useMemo } from 'react';
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
  MoveUp,
  MoveDown,
  Bold,
  Italic,
  FlipHorizontal2,
  FlipVertical2,
  Ungroup,
} from 'lucide-react';
import { toastUtils } from '@/lib/toast-utils';

/**
 * Quick Access Toolbar - Common actions for selected objects
 * Shows contextual actions based on selection type
 */
export const QuickAccessToolbar = memo(function QuickAccessToolbar() {
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
    ungroupObject,
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
  const { allLocked, allHidden } = useMemo(() => {
    return {
      allLocked: selectedObjects.length > 0 && selectedObjects.every((obj) => obj.locked),
      allHidden: selectedObjects.length > 0 && selectedObjects.every((obj) => obj.hidden),
    };
  }, [selectedObjects]);

  // Memoize selection type detection
  const { hasText, hasFlippable, hasGroup, singleTextObj } = useMemo(() => {
    const textObjs = selectedObjects.filter((obj) => obj.type === 'text');
    const flippableObjs = selectedObjects.filter((obj) =>
      ['shape', 'sticker', 'image', 'path'].includes(obj.type)
    );
    const groupObjs = selectedObjects.filter((obj) => obj.type === 'group');
    return {
      hasText: textObjs.length > 0,
      hasFlippable: flippableObjs.length > 0,
      hasGroup: groupObjs.length > 0,
      singleTextObj: textObjs.length === 1 && selectedObjects.length === 1 ? textObjs[0] : null,
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

  const handleUngroup = () => {
    const groupObjs = selectedObjects.filter((obj) => obj.type === 'group');
    if (groupObjs.length === 0) return;

    groupObjs.forEach((obj) => ungroupObject(obj.id));
    toastUtils.success('Ungrouped');
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

  const handleBringForward = () => {
    if (selectedIds.length === 0) return;
    saveToHistory();
    const newObjects = [...objects];
    // Process from end to start to avoid index shifting issues
    const indices = selectedIds
      .map((id) => newObjects.findIndex((o) => o.id === id))
      .filter((i) => i !== -1)
      .sort((a, b) => b - a);
    for (const idx of indices) {
      if (idx < newObjects.length - 1) {
        [newObjects[idx], newObjects[idx + 1]] = [newObjects[idx + 1], newObjects[idx]];
      }
    }
    useDeckForgeStore.setState({ objects: newObjects });
    toastUtils.success('Brought forward');
  };

  const handleSendBackward = () => {
    if (selectedIds.length === 0) return;
    saveToHistory();
    const newObjects = [...objects];
    // Process from start to end to avoid index shifting issues
    const indices = selectedIds
      .map((id) => newObjects.findIndex((o) => o.id === id))
      .filter((i) => i !== -1)
      .sort((a, b) => a - b);
    for (const idx of indices) {
      if (idx > 0) {
        [newObjects[idx], newObjects[idx - 1]] = [newObjects[idx - 1], newObjects[idx]];
      }
    }
    useDeckForgeStore.setState({ objects: newObjects });
    toastUtils.success('Sent backward');
  };

  const handleToggleBold = () => {
    if (!singleTextObj) return;
    saveToHistory();
    const newWeight = singleTextObj.fontWeight === '700' ? '400' : '700';
    updateObject(singleTextObj.id, { fontWeight: newWeight });
  };

  const handleToggleItalic = () => {
    if (!singleTextObj) return;
    saveToHistory();
    const newStyle = singleTextObj.fontStyle === 'italic' ? 'normal' : 'italic';
    updateObject(singleTextObj.id, { fontStyle: newStyle });
  };

  const handleTextAlign = (align: 'left' | 'center' | 'right') => {
    if (!singleTextObj) return;
    saveToHistory();
    updateObject(singleTextObj.id, { align });
  };

  const handleFlipHorizontal = () => {
    if (selectedIds.length === 0) return;
    saveToHistory();
    selectedObjects
      .filter((obj) => ['shape', 'sticker', 'image', 'path'].includes(obj.type))
      .forEach((obj) => {
        updateObject(obj.id, { flipH: !obj.flipH });
      });
    toastUtils.success('Flipped horizontally');
  };

  const handleFlipVertical = () => {
    if (selectedIds.length === 0) return;
    saveToHistory();
    selectedObjects
      .filter((obj) => ['shape', 'sticker', 'image', 'path'].includes(obj.type))
      .forEach((obj) => {
        updateObject(obj.id, { flipV: !obj.flipV });
      });
    toastUtils.success('Flipped vertically');
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
    <div className="flex items-center gap-1 px-2 py-1.5 bg-card border-b border-border overflow-x-auto toolbar-scroll w-full max-w-full shrink-0">
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
          {/* Common actions: Duplicate, Delete */}
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

          {/* Z-ordering: Bring Forward, Send Backward */}
          <div className="flex items-center gap-1 border-r border-border pr-2 shrink-0">
            <EnhancedTooltip content="Bring Forward" shortcut="Ctrl+]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleBringForward}
              >
                <MoveUp className="h-4 w-4" />
              </Button>
            </EnhancedTooltip>

            <EnhancedTooltip content="Send Backward" shortcut="Ctrl+[">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleSendBackward}
              >
                <MoveDown className="h-4 w-4" />
              </Button>
            </EnhancedTooltip>
          </div>

          {/* Lock/Unlock, Hide/Show */}
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

          {/* Group (2+ objects) / Ungroup (group selected) */}
          {(multipleSelected || hasGroup) && (
            <div className="flex items-center gap-1 border-r border-border pr-2 shrink-0">
              {multipleSelected && (
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
              )}
              {hasGroup && (
                <EnhancedTooltip content="Ungroup" shortcut="Ctrl+Shift+G">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleUngroup}
                  >
                    <Ungroup className="h-4 w-4" />
                  </Button>
                </EnhancedTooltip>
              )}
            </div>
          )}

          {/* Text formatting: Bold, Italic, Text Alignment */}
          {singleTextObj && (
            <div className="flex items-center gap-1 border-r border-border pr-2 shrink-0">
              <EnhancedTooltip content="Bold" shortcut="Ctrl+B">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${singleTextObj.fontWeight === '700' ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={handleToggleBold}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content="Italic" shortcut="Ctrl+I">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${singleTextObj.fontStyle === 'italic' ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={handleToggleItalic}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <div className="w-px h-5 bg-border mx-0.5" />

              <EnhancedTooltip content="Align text left">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${(!singleTextObj.align || singleTextObj.align === 'left') ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => handleTextAlign('left')}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content="Align text center">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${singleTextObj.align === 'center' ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => handleTextAlign('center')}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content="Align text right">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${singleTextObj.align === 'right' ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => handleTextAlign('right')}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>
            </div>
          )}

          {/* Flip: for shapes, stickers, images, paths */}
          {hasFlippable && (
            <div className="flex items-center gap-1 border-r border-border pr-2 shrink-0">
              <EnhancedTooltip content="Flip Horizontal">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleFlipHorizontal}
                >
                  <FlipHorizontal2 className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content="Flip Vertical">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleFlipVertical}
                >
                  <FlipVertical2 className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>
            </div>
          )}

          {/* Alignment - available for multiple selection */}
          {multipleSelected && (
            <div className="flex items-center gap-1 shrink-0">
              <EnhancedTooltip content="Align objects left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAlign('left')}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content="Align objects center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAlign('center')}
                >
                  <AlignHorizontalJustifyCenter className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content="Align objects right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAlign('right')}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content="Align objects top">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAlign('top')}
                >
                  <AlignLeft className="h-4 w-4 rotate-90" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content="Align objects middle">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAlign('middle')}
                >
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                </Button>
              </EnhancedTooltip>

              <EnhancedTooltip content="Align objects bottom">
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
});
