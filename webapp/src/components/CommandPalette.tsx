import { useState, useEffect, useMemo } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Plus,
  Download,
  Upload,
  Trash2,
  Copy,
  Layers,
  Palette,
  Type,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Settings,
  Keyboard,
  FileText,
  ShoppingCart,
  Package,
  Ruler,
  Save,
  FolderOpen,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeckForgeStore } from '@/store/deckforge';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
  category: 'File' | 'Edit' | 'Add' | 'Navigate' | 'View' | 'Help';
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const {
    addObject,
    undo,
    redo,
    deleteObject,
    groupObjects,
    ungroupObject,
    past,
    future,
    selectedIds,
    objects,
  } = useDeckForgeStore();

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: Command[] = useMemo(
    () => [
      // File
      {
        id: 'new-design',
        label: 'New Design',
        icon: <Plus className="w-4 h-4" />,
        action: () => {
          navigate('/designs');
          setOpen(false);
        },
        keywords: ['create', 'blank', 'start'],
        shortcut: 'Ctrl+N',
        category: 'File',
      },
      {
        id: 'save',
        label: 'Save Design',
        icon: <Save className="w-4 h-4" />,
        action: () => {
          // Trigger save action
          setOpen(false);
        },
        keywords: ['save', 'store'],
        shortcut: 'Ctrl+S',
        category: 'File',
      },
      {
        id: 'open',
        label: 'Open Design',
        icon: <FolderOpen className="w-4 h-4" />,
        action: () => {
          navigate('/designs');
          setOpen(false);
        },
        keywords: ['load', 'browse'],
        shortcut: 'Ctrl+O',
        category: 'File',
      },
      {
        id: 'export',
        label: 'Export Design',
        icon: <Download className="w-4 h-4" />,
        action: () => {
          // Trigger export modal
          setOpen(false);
        },
        keywords: ['download', 'save', 'png'],
        shortcut: 'Ctrl+E',
        category: 'File',
      },

      // Edit
      {
        id: 'undo',
        label: 'Undo',
        icon: <Undo2 className="w-4 h-4" />,
        action: () => {
          if (canUndo) undo();
          setOpen(false);
        },
        keywords: ['revert', 'back'],
        shortcut: 'Ctrl+Z',
        category: 'Edit',
      },
      {
        id: 'redo',
        label: 'Redo',
        icon: <Redo2 className="w-4 h-4" />,
        action: () => {
          if (canRedo) redo();
          setOpen(false);
        },
        keywords: ['forward', 'again'],
        shortcut: 'Ctrl+Shift+Z',
        category: 'Edit',
      },
      {
        id: 'delete',
        label: 'Delete Selected',
        icon: <Trash2 className="w-4 h-4" />,
        action: () => {
          if (selectedIds.length > 0) {
            selectedIds.forEach(id => deleteObject(id));
          }
          setOpen(false);
        },
        keywords: ['remove', 'trash'],
        shortcut: 'Delete',
        category: 'Edit',
      },
      {
        id: 'duplicate',
        label: 'Duplicate Selected',
        icon: <Copy className="w-4 h-4" />,
        action: () => {
          if (selectedIds.length > 0) {
            selectedIds.forEach(id => {
              const obj = objects.find(o => o.id === id);
              if (obj) {
                const { id: _, ...objWithoutId } = obj;
                addObject({
                  ...objWithoutId,
                  x: obj.x + 20,
                  y: obj.y + 20,
                });
              }
            });
          }
          setOpen(false);
        },
        keywords: ['copy', 'clone'],
        shortcut: 'Ctrl+D',
        category: 'Edit',
      },
      {
        id: 'group',
        label: 'Group Selected',
        icon: <Layers className="w-4 h-4" />,
        action: () => {
          if (selectedIds.length > 1) groupObjects(selectedIds);
          setOpen(false);
        },
        keywords: ['combine'],
        shortcut: 'Ctrl+G',
        category: 'Edit',
      },
      {
        id: 'ungroup',
        label: 'Ungroup Selected',
        icon: <Layers className="w-4 h-4" />,
        action: () => {
          if (selectedIds.length === 1) {
            const selectedObj = objects.find(o => o.id === selectedIds[0]);
            if (selectedObj?.type === 'group') {
              ungroupObject(selectedIds[0]);
            }
          }
          setOpen(false);
        },
        keywords: ['separate', 'split'],
        shortcut: 'Ctrl+Shift+G',
        category: 'Edit',
      },

      // Add
      {
        id: 'add-rectangle',
        label: 'Add Rectangle',
        icon: <Palette className="w-4 h-4" />,
        action: () => {
          addObject({
            type: 'shape',
            shapeType: 'rect',
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            rotation: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            fill: '#3b82f6',
          });
          setOpen(false);
        },
        keywords: ['shape', 'box', 'square'],
        shortcut: 'R',
        category: 'Add',
      },
      {
        id: 'add-circle',
        label: 'Add Circle',
        icon: <Palette className="w-4 h-4" />,
        action: () => {
          addObject({
            type: 'shape',
            shapeType: 'circle',
            x: 100,
            y: 100,
            width: 150,
            height: 150,
            rotation: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            fill: '#10b981',
          });
          setOpen(false);
        },
        keywords: ['shape', 'ellipse', 'oval'],
        shortcut: 'C',
        category: 'Add',
      },
      {
        id: 'add-text',
        label: 'Add Text',
        icon: <Type className="w-4 h-4" />,
        action: () => {
          addObject({
            type: 'text',
            text: 'Double click to edit',
            x: 100,
            y: 100,
            width: 300,
            height: 100,
            rotation: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            fontSize: 48,
            fontFamily: 'Inter',
            fill: '#000000',
            align: 'left',
          });
          setOpen(false);
        },
        keywords: ['type', 'label', 'font'],
        shortcut: 'T',
        category: 'Add',
      },
      {
        id: 'add-image',
        label: 'Add Image',
        icon: <ImageIcon className="w-4 h-4" />,
        action: () => {
          // Open image upload dialog
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const src = event.target?.result as string;
                addObject({
                  type: 'image',
                  src,
                  x: 100,
                  y: 100,
                  width: 300,
                  height: 300,
                  rotation: 0,
                  opacity: 1,
                  scaleX: 1,
                  scaleY: 1,
                });
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
          setOpen(false);
        },
        keywords: ['photo', 'picture', 'upload'],
        shortcut: 'I',
        category: 'Add',
      },

      // Navigate
      {
        id: 'go-marketplace',
        label: 'Go to Marketplace',
        icon: <ShoppingCart className="w-4 h-4" />,
        action: () => {
          navigate('/marketplace');
          setOpen(false);
        },
        keywords: ['browse', 'buy', 'designs'],
        category: 'Navigate',
      },
      {
        id: 'go-designs',
        label: 'Go to My Designs',
        icon: <Package className="w-4 h-4" />,
        action: () => {
          navigate('/designs');
          setOpen(false);
        },
        keywords: ['library', 'saved'],
        category: 'Navigate',
      },
      {
        id: 'go-templates',
        label: 'Browse Templates',
        icon: <FileText className="w-4 h-4" />,
        action: () => {
          // Open template modal
          setOpen(false);
        },
        keywords: ['gallery', 'pre-built', 'starter'],
        category: 'Navigate',
      },
      {
        id: 'go-fingerpark',
        label: 'Go to Park Builder',
        icon: <Ruler className="w-4 h-4" />,
        action: () => {
          navigate('/fingerpark');
          setOpen(false);
        },
        keywords: ['obstacles', 'park', 'plan'],
        category: 'Navigate',
      },

      // Help
      {
        id: 'shortcuts',
        label: 'Keyboard Shortcuts',
        icon: <Keyboard className="w-4 h-4" />,
        action: () => {
          // Open shortcuts modal
          setOpen(false);
        },
        keywords: ['keys', 'hotkeys', 'help'],
        shortcut: '?',
        category: 'Help',
      },
      {
        id: 'search-help',
        label: 'Search Help',
        icon: <Search className="w-4 h-4" />,
        action: () => {
          setOpen(false);
        },
        keywords: ['docs', 'documentation', 'guide'],
        category: 'Help',
      },
    ],
    [
      navigate,
      addObject,
      undo,
      redo,
      canUndo,
      canRedo,
      deleteObject,
      groupObjects,
      ungroupObject,
      selectedIds,
      objects,
    ]
  );

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    commands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [commands]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedCommands).map(([category, cmds], index) => (
          <div key={category}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {cmds.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={`${cmd.label} ${cmd.keywords?.join(' ') || ''}`}
                  onSelect={() => cmd.action()}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {cmd.icon}
                      <span>{cmd.label}</span>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
