import { useEffect, useState } from 'react';
import { Copy, Scissors, Clipboard, Trash2, Lock, Unlock, Eye, EyeOff, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Group, Ungroup, Wand2, Palette, ImageIcon, RotateCcw } from 'lucide-react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import toast from 'react-hot-toast';
import { toastUtils } from '@/lib/toast-utils';

interface ContextMenuProps {
  x: number;
  y: number;
  objectId: string | null;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  divider?: boolean;
  destructive?: boolean;
}

export function ContextMenu({ x, y, objectId, onClose }: ContextMenuProps) {
  const { objects, selectedIds, updateObject, deleteObject, saveToHistory, addObject, selectObject, groupObjects, ungroupObject } = useDeckForgeStore();
  const [menuPosition, setMenuPosition] = useState({ x, y });

  const obj = objectId ? objects.find(o => o.id === objectId) : null;

  useEffect(() => {
    // Adjust position to keep menu in viewport
    const menuWidth = 220;
    const menuHeight = 400; // approximate max height

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - 10;
    }

    if (y + menuHeight > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight - 10;
    }

    setMenuPosition({ x: adjustedX, y: adjustedY });
  }, [x, y]);

  useEffect(() => {
    // Close on click outside
    const handleClick = () => onClose();
    const handleScroll = () => onClose();
    
    setTimeout(() => {
      document.addEventListener('click', handleClick);
      document.addEventListener('scroll', handleScroll, true);
    }, 0);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  if (!obj) return null;

  const handleCopy = () => {
    sessionStorage.setItem('deckforge_clipboard', JSON.stringify(obj));
    toast.success('Copied to clipboard');
    onClose();
  };

  const handleCut = () => {
    sessionStorage.setItem('deckforge_clipboard', JSON.stringify(obj));
    deleteObject(obj.id);
    toast.success('Cut to clipboard');
    onClose();
  };

  const handlePaste = () => {
    const clipboardData = sessionStorage.getItem('deckforge_clipboard');
    if (clipboardData) {
      try {
        const copiedObj = JSON.parse(clipboardData);
        const { id, ...objWithoutId } = copiedObj;
        addObject({
          ...objWithoutId,
          x: copiedObj.x + 20,
          y: copiedObj.y + 20,
        });
        toast.success('Pasted from clipboard');
      } catch (err) {
        toast.error('Failed to paste');
      }
    }
    onClose();
  };

  const handleDuplicate = () => {
    const { id, ...objWithoutId } = obj;
    saveToHistory();
    addObject({
      ...objWithoutId,
      x: obj.x + 10,
      y: obj.y + 10,
    });
    toast.success('Object duplicated');
    onClose();
  };

  const handleDelete = () => {
    deleteObject(obj.id);
    toast.success('Object deleted');
    onClose();
  };

  const handleLock = () => {
    updateObject(obj.id, { locked: !obj.locked });
    toast.success(obj.locked ? 'Object unlocked' : 'Object locked');
    onClose();
  };

  const handleVisibility = () => {
    updateObject(obj.id, { opacity: obj.opacity === 0 ? 1 : 0 });
    toast.success(obj.opacity === 0 ? 'Object visible' : 'Object hidden');
    onClose();
  };

  const handleBringForward = () => {
    const currentIndex = objects.findIndex(o => o.id === obj.id);
    if (currentIndex < objects.length - 1) {
      saveToHistory();
      const newObjects = [...objects];
      [newObjects[currentIndex], newObjects[currentIndex + 1]] = [newObjects[currentIndex + 1], newObjects[currentIndex]];
      useDeckForgeStore.setState({ objects: newObjects });
      toast.success('Brought forward');
    }
    onClose();
  };

  const handleSendBackward = () => {
    const currentIndex = objects.findIndex(o => o.id === obj.id);
    if (currentIndex > 0) {
      saveToHistory();
      const newObjects = [...objects];
      [newObjects[currentIndex], newObjects[currentIndex - 1]] = [newObjects[currentIndex - 1], newObjects[currentIndex]];
      useDeckForgeStore.setState({ objects: newObjects });
      toast.success('Sent backward');
    }
    onClose();
  };

  const handleBringToFront = () => {
    const currentIndex = objects.findIndex(o => o.id === obj.id);
    saveToHistory();
    const newObjects = objects.filter(o => o.id !== obj.id);
    newObjects.push(objects[currentIndex]);
    useDeckForgeStore.setState({ objects: newObjects });
    toast.success('Brought to front');
    onClose();
  };

  const handleSendToBack = () => {
    const currentIndex = objects.findIndex(o => o.id === obj.id);
    saveToHistory();
    const newObjects = objects.filter(o => o.id !== obj.id);
    newObjects.unshift(objects[currentIndex]);
    useDeckForgeStore.setState({ objects: newObjects });
    toast.success('Sent to back');
    onClose();
  };

  const handleGroup = () => {
    if (selectedIds.length >= 2) {
      groupObjects(selectedIds);
      toast.success(`Grouped ${selectedIds.length} objects`);
    }
    onClose();
  };

  const handleUngroup = () => {
    if (obj.type === 'group') {
      ungroupObject(obj.id);
      toast.success('Ungrouped objects');
    }
    onClose();
  };

  const handleHighContrast = () => {
    updateObject(obj.id, {
      contrast: 2,
      brightness: 1.2,
    });
    toastUtils.success('High Contrast applied', 'Punk zine effect');
    onClose();
  };

  const handleBlackAndWhite = () => {
    updateObject(obj.id, {
      grayscale: 100,
    });
    toastUtils.success('Black & White applied');
    onClose();
  };

  const handleInvert = () => {
    updateObject(obj.id, {
      invert: !(obj.invert || false),
    });
    toastUtils.success('Colors inverted');
    onClose();
  };

  const handleResetFilters = () => {
    updateObject(obj.id, {
      contrast: 1,
      brightness: 1,
      grayscale: 0,
      invert: false,
      blur: 0,
    });
    toastUtils.success('Filters reset');
    onClose();
  };

  const handleRemoveBackground = () => {
    toastUtils.info('Remove Background', 'This feature will use AI to remove backgrounds from images. Coming soon!');
    onClose();
  };

  const hasClipboard = !!sessionStorage.getItem('deckforge_clipboard');
  const isGroup = obj.type === 'group';
  const canGroup = selectedIds.length >= 2;
  const isImage = obj.type === 'image';
  const hasFilters = obj.contrast !== 1 || obj.brightness !== 1 || obj.grayscale !== 0 || obj.invert || obj.blur;

  const menuItems: MenuItem[] = [
    {
      label: 'Copy',
      icon: <Copy className="w-4 h-4" />,
      shortcut: 'Ctrl+C',
      action: handleCopy,
    },
    {
      label: 'Cut',
      icon: <Scissors className="w-4 h-4" />,
      shortcut: 'Ctrl+X',
      action: handleCut,
    },
    {
      label: 'Paste',
      icon: <Clipboard className="w-4 h-4" />,
      shortcut: 'Ctrl+V',
      action: handlePaste,
      disabled: !hasClipboard,
    },
    {
      label: 'Duplicate',
      icon: <Copy className="w-4 h-4" />,
      shortcut: 'Ctrl+D',
      action: handleDuplicate,
      divider: true,
    },
    {
      label: obj.locked ? 'Unlock' : 'Lock',
      icon: obj.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />,
      shortcut: 'Ctrl+L',
      action: handleLock,
    },
    {
      label: obj.opacity === 0 ? 'Show' : 'Hide',
      icon: obj.opacity === 0 ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />,
      action: handleVisibility,
      divider: true,
    },
    {
      label: 'Bring Forward',
      icon: <ChevronUp className="w-4 h-4" />,
      shortcut: 'Ctrl+]',
      action: handleBringForward,
    },
    {
      label: 'Send Backward',
      icon: <ChevronDown className="w-4 h-4" />,
      shortcut: 'Ctrl+[',
      action: handleSendBackward,
    },
    {
      label: 'Bring to Front',
      icon: <ChevronsUp className="w-4 h-4" />,
      shortcut: 'Ctrl+Shift+]',
      action: handleBringToFront,
    },
    {
      label: 'Send to Back',
      icon: <ChevronsDown className="w-4 h-4" />,
      shortcut: 'Ctrl+Shift+[',
      action: handleSendToBack,
      divider: true,
    },
  ];

  // Add group/ungroup
  if (canGroup && !isGroup) {
    menuItems.push({
      label: 'Group',
      icon: <Group className="w-4 h-4" />,
      shortcut: 'Ctrl+G',
      action: handleGroup,
    });
  }

  if (isGroup) {
    menuItems.push({
      label: 'Ungroup',
      icon: <Ungroup className="w-4 h-4" />,
      shortcut: 'Ctrl+Shift+G',
      action: handleUngroup,
    });
  }

  // Image-specific menu items
  if (isImage) {
    menuItems.push({
      label: 'High Contrast',
      icon: <Palette className="w-4 h-4" />,
      action: handleHighContrast,
      divider: false,
    });
    menuItems.push({
      label: 'Black & White',
      icon: <Palette className="w-4 h-4" />,
      action: handleBlackAndWhite,
    });
    menuItems.push({
      label: 'Invert Colors',
      icon: <Palette className="w-4 h-4" />,
      action: handleInvert,
    });
    if (hasFilters) {
      menuItems.push({
        label: 'Reset Filters',
        icon: <RotateCcw className="w-4 h-4" />,
        action: handleResetFilters,
      });
    }
    menuItems.push({
      label: 'Remove Background',
      icon: <Wand2 className="w-4 h-4" />,
      action: handleRemoveBackground,
      divider: true,
    });
  }

  // Delete at the end
  menuItems.push({
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    shortcut: 'Delete',
    action: handleDelete,
    destructive: true,
    divider: true,
  });

  return (
    <div
      className="fixed z-[9999] bg-card border border-border rounded-lg shadow-2xl py-1 min-w-[220px] animate-in fade-in-0 zoom-in-95 duration-100"
      style={{
        left: menuPosition.x,
        top: menuPosition.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => (
        <div key={index}>
          {item.divider && index > 0 && (
            <div className="h-px bg-border my-1" />
          )}
          <button
            onClick={item.action}
            disabled={item.disabled}
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-sm
              transition-colors text-left
              ${item.disabled
                ? 'opacity-50 cursor-not-allowed'
                : item.destructive
                  ? 'hover:bg-destructive/10 text-destructive'
                  : 'hover:bg-accent'
              }
            `}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-muted-foreground font-mono">
                {item.shortcut}
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
