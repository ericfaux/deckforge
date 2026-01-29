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
  { keys: ['Esc'], description: 'Deselect all', category: 'Selection' },
  { keys: ['Tab'], description: 'Select next object', category: 'Selection' },
  { keys: ['Shift', 'Tab'], description: 'Select previous object', category: 'Selection' },
  
  // Editing
  { keys: ['Delete'], description: 'Delete selected', category: 'Editing' },
  { keys: ['Backspace'], description: 'Delete selected', category: 'Editing' },
  { keys: ['Ctrl', 'Z'], description: 'Undo', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo', category: 'Editing' },
  { keys: ['Ctrl', 'D'], description: 'Duplicate', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'D'], description: 'Array duplicate (3×3 grid)', category: 'Editing' },
  { keys: ['Ctrl', 'C'], description: 'Copy to clipboard', category: 'Editing' },
  { keys: ['Ctrl', 'V'], description: 'Paste from clipboard', category: 'Editing' },
  { keys: ['Ctrl', 'A'], description: 'Select all (top object)', category: 'Editing' },
  { keys: ['Ctrl', 'L'], description: 'Lock/unlock object', category: 'Editing' },
  
  // Transform
  { keys: ['Drag'], description: 'Move object', category: 'Transform' },
  { keys: ['Shift', 'Drag'], description: 'Move with snapping disabled', category: 'Transform' },
  { keys: ['Corner', 'Drag'], description: 'Scale object', category: 'Transform' },
  { keys: ['Shift', 'Scale'], description: 'Scale proportionally', category: 'Transform' },
  { keys: ['Alt', 'Scale'], description: 'Scale from center', category: 'Transform' },
  { keys: ['Rotate', 'Handle'], description: 'Rotate object', category: 'Transform' },
  { keys: ['Shift', 'Rotate'], description: 'Rotate in 15° increments', category: 'Transform' },
  
  // Layers
  { keys: ['Ctrl', ']'], description: 'Bring forward', category: 'Layers' },
  { keys: ['Ctrl', '['], description: 'Send backward', category: 'Layers' },
  { keys: ['Ctrl', 'Shift', ']'], description: 'Bring to front', category: 'Layers' },
  { keys: ['Ctrl', 'Shift', '['], description: 'Send to back', category: 'Layers' },
  
  // Alignment
  { keys: ['Alt', 'L'], description: 'Align left', category: 'Alignment' },
  { keys: ['Alt', 'R'], description: 'Align right', category: 'Alignment' },
  { keys: ['Alt', 'C'], description: 'Align center', category: 'Alignment' },
  { keys: ['Alt', 'T'], description: 'Align top', category: 'Alignment' },
  { keys: ['Alt', 'B'], description: 'Align bottom', category: 'Alignment' },
  { keys: ['Alt', 'M'], description: 'Align middle', category: 'Alignment' },
  
  // View
  { keys: ['Space', 'Drag'], description: 'Pan canvas', category: 'View' },
  { keys: ['Scroll'], description: 'Zoom in/out', category: 'View' },
  { keys: ['Ctrl', '0'], description: 'Reset zoom to 100%', category: 'View' },
  { keys: ['Ctrl', '1'], description: 'Zoom to fit', category: 'View' },
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

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

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
