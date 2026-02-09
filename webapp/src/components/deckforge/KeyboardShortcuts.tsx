import { useState, useMemo, useRef } from 'react';
import { Keyboard, Search, ChevronDown, ChevronRight, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Selection
  { keys: ['Click'], description: 'Select object', category: 'Selection' },
  { keys: ['Shift', 'Click'], description: 'Multi-select', category: 'Selection' },
  { keys: ['Click', 'Drag'], description: 'Rubber-band select (on empty area)', category: 'Selection' },
  { keys: ['Esc'], description: 'Deselect all / exit group isolation', category: 'Selection' },
  { keys: ['Tab'], description: 'Select next object', category: 'Selection' },
  { keys: ['Shift', 'Tab'], description: 'Select previous object', category: 'Selection' },
  { keys: ['Ctrl', 'A'], description: 'Select all objects', category: 'Selection' },

  // Editing
  { keys: ['Delete'], description: 'Delete selected', category: 'Editing' },
  { keys: ['Backspace'], description: 'Delete selected', category: 'Editing' },
  { keys: ['Ctrl', 'Z'], description: 'Undo', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo', category: 'Editing' },
  { keys: ['Ctrl', 'D'], description: 'Duplicate', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'D'], description: 'Array duplicate (custom grid)', category: 'Editing' },
  { keys: ['Ctrl', 'C'], description: 'Copy to clipboard', category: 'Editing' },
  { keys: ['Ctrl', 'V'], description: 'Paste from clipboard', category: 'Editing' },
  { keys: ['Ctrl', 'L'], description: 'Lock/unlock object', category: 'Editing' },
  { keys: ['Ctrl', 'G'], description: 'Group selected objects', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'G'], description: 'Ungroup selected group', category: 'Editing' },
  { keys: ['Double-Click'], description: 'Enter group isolation mode', category: 'Editing' },
  { keys: ['Drag'], description: 'Move object', category: 'Editing' },
  { keys: ['Shift', 'Drag'], description: 'Move with snapping disabled', category: 'Editing' },
  { keys: ['Corner', 'Drag'], description: 'Scale object', category: 'Editing' },
  { keys: ['Shift', 'Scale'], description: 'Scale proportionally', category: 'Editing' },
  { keys: ['Alt', 'Scale'], description: 'Scale from center', category: 'Editing' },
  { keys: ['Rotate', 'Handle'], description: 'Rotate object', category: 'Editing' },
  { keys: ['Shift', 'Rotate'], description: 'Rotate in 15° increments', category: 'Editing' },
  { keys: ['Arrow Keys'], description: 'Nudge 1px (all selected objects)', category: 'Editing' },
  { keys: ['Shift', 'Arrow'], description: 'Nudge 10px', category: 'Editing' },
  { keys: ['Ctrl', ']'], description: 'Bring forward', category: 'Editing' },
  { keys: ['Ctrl', '['], description: 'Send backward', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', ']'], description: 'Bring to front', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', '['], description: 'Send to back', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'L'], description: 'Align left', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'R'], description: 'Align right', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'C'], description: 'Align center horizontally', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'T'], description: 'Align top', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'B'], description: 'Align bottom', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'M'], description: 'Align middle vertically', category: 'Editing' },
  { keys: ['Alt', 'L'], description: 'Align left (single object)', category: 'Editing' },
  { keys: ['Alt', 'C'], description: 'Center horizontally (single object)', category: 'Editing' },
  { keys: ['Alt', 'R'], description: 'Align right (single object)', category: 'Editing' },

  // Tools
  { keys: ['V'], description: 'Select move tool (default)', category: 'Tools' },
  { keys: ['T'], description: 'Select text tool', category: 'Tools' },
  { keys: ['R'], description: 'Select rectangle tool', category: 'Tools' },
  { keys: ['C'], description: 'Select circle tool', category: 'Tools' },
  { keys: ['L'], description: 'Select line tool', category: 'Tools' },

  // View / Zoom
  { keys: ['Space', 'Drag'], description: 'Pan canvas', category: 'View / Zoom' },
  { keys: ['Scroll'], description: 'Zoom in/out', category: 'View / Zoom' },
  { keys: ['Ctrl', '0'], description: 'Reset zoom to 100%', category: 'View / Zoom' },
  { keys: ['Ctrl', '1'], description: 'Zoom to fit', category: 'View / Zoom' },
  { keys: ['Ctrl', 'Shift', 'R'], description: 'Toggle rulers (mm)', category: 'View / Zoom' },
  { keys: ['H'], description: 'Toggle hardware guide (trucks, wheelbase, kicks)', category: 'View / Zoom' },
  { keys: ['Ctrl', 'Shift', 'B'], description: 'Toggle bleed & safe zone guides', category: 'View / Zoom' },

  // File Operations
  { keys: ['Ctrl', 'S'], description: 'Save design', category: 'File Operations' },
  { keys: ['Ctrl', 'E'], description: 'Export PNG', category: 'File Operations' },
  { keys: ['Ctrl', 'N'], description: 'New design', category: 'File Operations' },
  { keys: ['Ctrl', 'O'], description: 'Open design', category: 'File Operations' },
];

const SECTION_ORDER = ['Selection', 'Editing', 'Tools', 'View / Zoom', 'File Operations'];

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

export function KeyboardShortcuts({ open: controlledOpen, onOpenChange }: KeyboardShortcutsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return shortcuts;
    const q = searchQuery.toLowerCase();
    return shortcuts.filter(
      s =>
        s.description.toLowerCase().includes(q) ||
        s.keys.some(k => k.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, Shortcut[]> = {};
    for (const s of filteredShortcuts) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filteredShortcuts]);

  const visibleSections = SECTION_ORDER.filter(s => groupedShortcuts[s]?.length);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>DeckForge Keyboard Shortcuts</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
          h1 { font-size: 20px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; }
          h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; color: #666; margin-top: 20px; margin-bottom: 8px; }
          .shortcut-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid #eee; font-size: 13px; }
          .shortcut-row:last-child { border-bottom: none; }
          kbd { display: inline-block; padding: 2px 6px; font-family: monospace; font-size: 11px; background: #f4f4f4; border: 1px solid #ccc; border-radius: 3px; }
          .keys { display: flex; gap: 4px; align-items: center; }
          .plus { color: #999; font-size: 10px; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <h1>DeckForge Keyboard Shortcuts</h1>
        ${SECTION_ORDER.map(section => {
          const sectionShortcuts = shortcuts.filter(s => s.category === section);
          if (!sectionShortcuts.length) return '';
          return `
            <h2>${section}</h2>
            ${sectionShortcuts.map(s => `
              <div class="shortcut-row">
                <span>${s.description}</span>
                <div class="keys">
                  ${s.keys.map((k, i) => `<kbd>${k}</kbd>${i < s.keys.length - 1 ? '<span class="plus">+</span>' : ''}`).join('')}
                </div>
              </div>
            `).join('')}
          `;
        }).join('')}
        <div class="footer">Press <kbd>?</kbd> anytime to view shortcuts in DeckForge</div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearchQuery(''); }}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl uppercase tracking-widest flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription className="sr-only">
              Browse and search all keyboard shortcuts available in DeckForge
            </DialogDescription>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[55vh] pr-4" ref={printRef}>
          <div className="space-y-2">
            {visibleSections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No shortcuts found for "{searchQuery}"
              </div>
            )}
            {visibleSections.map(section => {
              const isCollapsed = collapsedSections.has(section);
              const sectionShortcuts = groupedShortcuts[section] || [];

              return (
                <Collapsible
                  key={section}
                  open={!isCollapsed}
                  onOpenChange={() => toggleSection(section)}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 hover:bg-muted/50 rounded px-2 transition-colors">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    <h3 className="font-display text-sm uppercase tracking-widest text-primary">
                      {section}
                    </h3>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {sectionShortcuts.length}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 pl-6 pb-2">
                      {sectionShortcuts.map((shortcut, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                        >
                          <span className="text-sm text-foreground">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-4">
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
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Press <KeyboardKey text="?" /> anytime to view shortcuts
        </div>
      </DialogContent>
    </Dialog>
  );
}
