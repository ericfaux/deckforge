import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';
import {
  Scissors,
  Copy,
  ClipboardPaste,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Group,
  Ungroup,
  MousePointerSquareDashed,
  Maximize,
} from 'lucide-react';
import { useDeckForgeStore } from '@/store/deckforge';
import toast from 'react-hot-toast';

interface CanvasContextMenuProps {
  targetObjectId: string | null;
}

export function CanvasContextMenu({ targetObjectId }: CanvasContextMenuProps) {
  const {
    objects,
    selectedIds,
    updateObject,
    deleteObject,
    saveToHistory,
    addObject,
    selectObject,
    setSelectedIds,
    groupObjects,
    ungroupObject,
    setStageScale,
  } = useDeckForgeStore();

  const obj = targetObjectId ? objects.find((o) => o.id === targetObjectId) : null;
  const hasClipboard = !!sessionStorage.getItem('deckforge_clipboard');
  const canGroup = selectedIds.length >= 2;
  const isGroup = obj?.type === 'group';

  // --- Action handlers ---

  const handleCopy = () => {
    if (!obj) return;
    sessionStorage.setItem('deckforge_clipboard', JSON.stringify(obj));
    toast.success('Copied to clipboard');
  };

  const handleCut = () => {
    if (!obj) return;
    sessionStorage.setItem('deckforge_clipboard', JSON.stringify(obj));
    saveToHistory();
    deleteObject(obj.id);
    toast.success('Cut to clipboard');
  };

  const handlePaste = () => {
    const clipboardData = sessionStorage.getItem('deckforge_clipboard');
    if (!clipboardData) return;
    try {
      const copiedObj = JSON.parse(clipboardData);
      const { id, ...rest } = copiedObj;
      saveToHistory();
      addObject({ ...rest, x: copiedObj.x + 20, y: copiedObj.y + 20 });
      toast.success('Pasted from clipboard');
    } catch {
      toast.error('Failed to paste');
    }
  };

  const handleDuplicate = () => {
    if (!obj) return;
    const { id, ...rest } = obj;
    saveToHistory();
    addObject({ ...rest, x: obj.x + 10, y: obj.y + 10 });
    toast.success('Object duplicated');
  };

  const handleDelete = () => {
    if (!obj) return;
    saveToHistory();
    deleteObject(obj.id);
    toast.success('Object deleted');
  };

  // Layer controls

  const handleBringForward = () => {
    if (!obj) return;
    const idx = objects.findIndex((o) => o.id === obj.id);
    if (idx < objects.length - 1) {
      saveToHistory();
      const next = [...objects];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      useDeckForgeStore.setState({ objects: next });
      toast.success('Brought forward');
    }
  };

  const handleSendBackward = () => {
    if (!obj) return;
    const idx = objects.findIndex((o) => o.id === obj.id);
    if (idx > 0) {
      saveToHistory();
      const next = [...objects];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      useDeckForgeStore.setState({ objects: next });
      toast.success('Sent backward');
    }
  };

  const handleBringToFront = () => {
    if (!obj) return;
    saveToHistory();
    const next = objects.filter((o) => o.id !== obj.id);
    next.push(obj);
    useDeckForgeStore.setState({ objects: next });
    toast.success('Brought to front');
  };

  const handleSendToBack = () => {
    if (!obj) return;
    saveToHistory();
    const next = objects.filter((o) => o.id !== obj.id);
    next.unshift(obj);
    useDeckForgeStore.setState({ objects: next });
    toast.success('Sent to back');
  };

  // Lock / Hide

  const handleLock = () => {
    if (!obj) return;
    updateObject(obj.id, { locked: !obj.locked });
    toast.success(obj.locked ? 'Object unlocked' : 'Object locked');
  };

  const handleVisibility = () => {
    if (!obj) return;
    updateObject(obj.id, { hidden: !obj.hidden });
    toast.success(obj.hidden ? 'Object visible' : 'Object hidden');
  };

  // Group / Ungroup

  const handleGroup = () => {
    if (selectedIds.length >= 2) {
      groupObjects(selectedIds);
      toast.success(`Grouped ${selectedIds.length} objects`);
    }
  };

  const handleUngroup = () => {
    if (obj && obj.type === 'group') {
      ungroupObject(obj.id);
      toast.success('Ungrouped objects');
    }
  };

  // Canvas-level actions

  const handleSelectAll = () => {
    const allIds = objects.filter((o) => !o.hidden).map((o) => o.id);
    if (allIds.length > 0) {
      selectObject(allIds[0]);
      setSelectedIds(allIds);
      toast.success(`Selected ${allIds.length} objects`);
    }
  };

  const handleZoomToFit = () => {
    setStageScale(0.8);
    toast.success('Zoom to fit');
  };

  // --- Empty canvas menu ---
  if (!obj) {
    return (
      <ContextMenuContent className="w-52 bg-popover border-border">
        <ContextMenuItem
          disabled={!hasClipboard}
          onSelect={handlePaste}
          className="gap-2"
        >
          <ClipboardPaste className="h-4 w-4 shrink-0" />
          Paste
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={handleSelectAll}
          disabled={objects.length === 0}
          className="gap-2"
        >
          <MousePointerSquareDashed className="h-4 w-4 shrink-0" />
          Select All
          <ContextMenuShortcut>Ctrl+A</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleZoomToFit} className="gap-2">
          <Maximize className="h-4 w-4 shrink-0" />
          Zoom to Fit
          <ContextMenuShortcut>Ctrl+1</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    );
  }

  // --- Object context menu ---
  return (
    <ContextMenuContent className="w-56 bg-popover border-border">
      {/* Clipboard actions */}
      <ContextMenuItem onSelect={handleCut} className="gap-2">
        <Scissors className="h-4 w-4 shrink-0" />
        Cut
        <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onSelect={handleCopy} className="gap-2">
        <Copy className="h-4 w-4 shrink-0" />
        Copy
        <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem
        disabled={!hasClipboard}
        onSelect={handlePaste}
        className="gap-2"
      >
        <ClipboardPaste className="h-4 w-4 shrink-0" />
        Paste
        <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onSelect={handleDuplicate} className="gap-2">
        <Copy className="h-4 w-4 shrink-0" />
        Duplicate
        <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={handleDelete}
        className="gap-2 text-destructive focus:text-destructive"
      >
        <Trash2 className="h-4 w-4 shrink-0" />
        Delete
        <ContextMenuShortcut>Del</ContextMenuShortcut>
      </ContextMenuItem>

      <ContextMenuSeparator />

      {/* Layer controls */}
      <ContextMenuItem onSelect={handleBringToFront} className="gap-2">
        <ChevronsUp className="h-4 w-4 shrink-0" />
        Bring to Front
        <ContextMenuShortcut>Ctrl+Shift+]</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onSelect={handleBringForward} className="gap-2">
        <ChevronUp className="h-4 w-4 shrink-0" />
        Bring Forward
        <ContextMenuShortcut>Ctrl+]</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onSelect={handleSendBackward} className="gap-2">
        <ChevronDown className="h-4 w-4 shrink-0" />
        Send Backward
        <ContextMenuShortcut>Ctrl+[</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onSelect={handleSendToBack} className="gap-2">
        <ChevronsDown className="h-4 w-4 shrink-0" />
        Send to Back
        <ContextMenuShortcut>Ctrl+Shift+[</ContextMenuShortcut>
      </ContextMenuItem>

      <ContextMenuSeparator />

      {/* Lock / Hide */}
      <ContextMenuItem onSelect={handleLock} className="gap-2">
        {obj.locked ? (
          <Unlock className="h-4 w-4 shrink-0" />
        ) : (
          <Lock className="h-4 w-4 shrink-0" />
        )}
        {obj.locked ? 'Unlock' : 'Lock'}
      </ContextMenuItem>
      <ContextMenuItem onSelect={handleVisibility} className="gap-2">
        {obj.hidden ? (
          <Eye className="h-4 w-4 shrink-0" />
        ) : (
          <EyeOff className="h-4 w-4 shrink-0" />
        )}
        {obj.hidden ? 'Show' : 'Hide'}
      </ContextMenuItem>

      {/* Group / Ungroup (conditional) */}
      {(canGroup || isGroup) && <ContextMenuSeparator />}
      {canGroup && !isGroup && (
        <ContextMenuItem onSelect={handleGroup} className="gap-2">
          <Group className="h-4 w-4 shrink-0" />
          Group
          <ContextMenuShortcut>Ctrl+G</ContextMenuShortcut>
        </ContextMenuItem>
      )}
      {isGroup && (
        <ContextMenuItem onSelect={handleUngroup} className="gap-2">
          <Ungroup className="h-4 w-4 shrink-0" />
          Ungroup
          <ContextMenuShortcut>Ctrl+Shift+G</ContextMenuShortcut>
        </ContextMenuItem>
      )}
    </ContextMenuContent>
  );
}
