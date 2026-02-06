import { useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Selection & Navigation
  { keys: ['Click'], description: 'Select object', category: 'Selection' },
  { keys: ['Shift', 'Click'], description: 'Multi-select', category: 'Selection' },
  { keys: ['Click', 'Drag'], description: 'Rubber-band select (on empty area)', category: 'Selection' },
  { keys: ['Esc'], description: 'Deselect all / exit group isolation', category: 'Selection' },
  { keys: ['Tab'], description: 'Select next object', category: 'Selection' },
  { keys: ['Shift', 'Tab'], description: 'Select previous object', category: 'Selection' },
  
  // Editing
  { keys: ['Delete'], description: 'Delete selected', category: 'Editing' },
  { keys: ['Backspace'], description: 'Delete selected', category: 'Editing' },
  { keys: ['Ctrl', 'Z'], description: 'Undo', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo', category: 'Editing' },
  { keys: ['Ctrl', 'D'], description: 'Duplicate', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'D'], description: 'Array duplicate (custom grid)', category: 'Editing' },
  { keys: ['Ctrl', 'C'], description: 'Copy to clipboard', category: 'Editing' },
  { keys: ['Ctrl', 'V'], description: 'Paste from clipboard', category: 'Editing' },
  { keys: ['Ctrl', 'A'], description: 'Select all objects', category: 'Editing' },
  { keys: ['Ctrl', 'L'], description: 'Lock/unlock object', category: 'Editing' },
  { keys: ['Ctrl', 'G'], description: 'Group selected objects', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'G'], description: 'Ungroup selected group', category: 'Editing' },
  { keys: ['Double-Click'], description: 'Enter group isolation mode', category: 'Editing' },
  
  // Transform
  { keys: ['Drag'], description: 'Move object', category: 'Transform' },
  { keys: ['Shift', 'Drag'], description: 'Move with snapping disabled', category: 'Transform' },
  { keys: ['Corner', 'Drag'], description: 'Scale object', category: 'Transform' },
  { keys: ['Shift', 'Scale'], description: 'Scale proportionally', category: 'Transform' },
  { keys: ['Alt', 'Scale'], description: 'Scale from center', category: 'Transform' },
  { keys: ['Rotate', 'Handle'], description: 'Rotate object', category: 'Transform' },
  { keys: ['Shift', 'Rotate'], description: 'Rotate in 15° increments', category: 'Transform' },
  { keys: ['Arrow Keys'], description: 'Nudge 1px (all selected objects)', category: 'Transform' },
  { keys: ['Shift', 'Arrow'], description: 'Nudge 10px', category: 'Transform' },
  
  // Layers
  { keys: ['Ctrl', ']'], description: 'Bring forward', category: 'Layers' },
  { keys: ['Ctrl', '['], description: 'Send backward', category: 'Layers' },
  { keys: ['Ctrl', 'Shift', ']'], description: 'Bring to front', category: 'Layers' },
  { keys: ['Ctrl', 'Shift', '['], description: 'Send to back', category: 'Layers' },
  
  // Alignment
  { keys: ['Ctrl', 'Shift', 'L'], description: 'Align left', category: 'Alignment' },
  { keys: ['Ctrl', 'Shift', 'R'], description: 'Align right', category: 'Alignment' },
  { keys: ['Ctrl', 'Shift', 'C'], description: 'Align center horizontally', category: 'Alignment' },
  { keys: ['Ctrl', 'Shift', 'T'], description: 'Align top', category: 'Alignment' },
  { keys: ['Ctrl', 'Shift', 'B'], description: 'Align bottom', category: 'Alignment' },
  { keys: ['Ctrl', 'Shift', 'M'], description: 'Align middle vertically', category: 'Alignment' },
  { keys: ['Alt', 'L'], description: 'Align left (single object)', category: 'Alignment' },
  { keys: ['Alt', 'C'], description: 'Center horizontally (single object)', category: 'Alignment' },
  { keys: ['Alt', 'R'], description: 'Align right (single object)', category: 'Alignment' },
  
  // View
  { keys: ['Space', 'Drag'], description: 'Pan canvas', category: 'View' },
  { keys: ['Scroll'], description: 'Zoom in/out', category: 'View' },
  { keys: ['Ctrl', '0'], description: 'Reset zoom to 100%', category: 'View' },
  { keys: ['Ctrl', '1'], description: 'Zoom to fit', category: 'View' },
  { keys: ['Ctrl', 'Shift', 'R'], description: 'Toggle rulers', category: 'View' },
  { keys: ['H'], description: 'Toggle hardware guide', category: 'View' },
  
  // Tools
  { keys: ['T'], description: 'Select text tool', category: 'Tools' },
  { keys: ['R'], description: 'Select rectangle tool', category: 'Tools' },
  { keys: ['C'], description: 'Select circle tool', category: 'Tools' },
  { keys: ['L'], description: 'Select line tool', category: 'Tools' },
  { keys: ['V'], description: 'Select move tool (default)', category: 'Tools' },
  
  // File
  { keys: ['Ctrl', 'S'], description: 'Save design', category: 'File' },
  { keys: ['Ctrl', 'E'], description: 'Export PNG', category: 'File' },
  { keys: ['Ctrl', 'N'], description: 'New design', category: 'File' },
  { keys: ['Ctrl', 'O'], description: 'Open design', category: 'File' },
];

const categories = [...new Set(shortcuts.map(s => s.category))];

function KeyboardKey({ text }: { text: string }) {
  return (
    <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded">
      {text}
    </kbd>
  );
}

interface KeyboardShortcutsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcuts({ open: controlledOpen, onOpenChange }: KeyboardShortcutsProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-2">
          <Keyboard className="w-4 h-4" />
          <span className="hidden md:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-widest flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category}>
                <h3 className="font-display text-sm uppercase tracking-widest text-primary mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter(s => s.category === category)
                    .map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <span className="text-sm text-foreground">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <KeyboardKey text={key} />
                              {i < shortcut.keys.length - 1 && (
                                <span className="text-xs text-muted-foreground">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Press <KeyboardKey text="?" /> anytime to view shortcuts
        </div>
      </DialogContent>
    </Dialog>
  );
}
