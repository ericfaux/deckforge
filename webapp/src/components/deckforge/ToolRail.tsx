import { useEffect } from 'react';
import { LayoutTemplate, ImageIcon, Type, Upload, Palette, Layers, Sticker, Grid3X3, Mountain, Minus, Pen, Paintbrush } from 'lucide-react';
import { useDeckForgeStore, ToolType } from '@/store/deckforge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolItem {
  id: ToolType;
  icon: typeof LayoutTemplate;
  label: string;
  shortcut?: string;
  description: string;
}

const tools: ToolItem[] = [
  {
    id: 'pen',
    icon: Pen,
    label: 'Pen Tool',
    shortcut: 'P',
    description: 'Draw custom shapes with click-to-point or free draw'
  },
  {
    id: 'brush',
    icon: Paintbrush,
    label: 'Brush',
    shortcut: 'B',
    description: 'Freehand drawing with pencil, marker, spray paint & calligraphy'
  },
  { 
    id: 'stickers', 
    icon: Sticker, 
    label: 'Stickers',
    shortcut: 'S',
    description: 'Add vector icons and decals from library'
  },
  { 
    id: 'lines', 
    icon: Minus, 
    label: 'Lines',
    shortcut: 'L',
    description: 'Draw straight, curved, and decorative lines'
  },
  { 
    id: 'patterns', 
    icon: Grid3X3, 
    label: 'Patterns',
    description: 'Apply procedural patterns (checkerboard, stripes, etc.)'
  },
  { 
    id: 'textures', 
    icon: Mountain, 
    label: 'Textures',
    description: 'Add realistic texture overlays (concrete, rust, graffiti)'
  },
  { 
    id: 'graphics', 
    icon: ImageIcon, 
    label: 'Graphics',
    shortcut: 'G',
    description: 'Basic shapes (circle, square, star)'
  },
  { 
    id: 'text', 
    icon: Type, 
    label: 'Text',
    shortcut: 'T',
    description: 'Add text with custom fonts and styling'
  },
  { 
    id: 'uploads', 
    icon: Upload, 
    label: 'Uploads',
    shortcut: 'U',
    description: 'Upload your own images, SVGs, and assets'
  },
  { 
    id: 'finishes', 
    icon: Layers, 
    label: 'Finishes',
    description: 'Apply print textures (scratched wood, grip tape, halftone)'
  },
];

export function ToolRail() {
  const { activeTool, setActiveTool } = useDeckForgeStore();

  // Keyboard shortcuts for tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger if modifiers are pressed (except shift for uppercase)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();
      const tool = tools.find(t => t.shortcut?.toLowerCase() === key);
      
      if (tool) {
        e.preventDefault();
        setActiveTool(activeTool === tool.id ? null : tool.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, setActiveTool]);

  return (
    <>
      {/* Desktop: Vertical rail */}
      <div className="hidden md:flex flex-col w-16 bg-card border-r border-border h-full">
        <div className="py-4 px-2 border-b border-border">
          <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground block text-center">
            Tools
          </span>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <Tooltip key={tool.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTool(isActive ? null : tool.id)}
                      className={cn(
                        'relative w-11 h-11 flex items-center justify-center rounded-md transition-all duration-200',
                        'border-2 border-transparent touch-target',
                        'hover:border-border hover:bg-secondary hover:scale-105 active:scale-95',
                        isActive 
                          ? 'tool-active border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20' 
                          : 'hover:shadow-md'
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full animate-in slide-in-from-left-2 duration-200" />
                      )}
                      <Icon 
                        className={cn(
                          'w-5 h-5 transition-colors duration-200',
                          isActive ? 'text-primary drop-shadow-sm' : 'text-muted-foreground'
                        )} 
                        strokeWidth={isActive ? 2 : 1.5} 
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{tool.label}</span>
                        {tool.shortcut && (
                          <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded font-mono">
                            {tool.shortcut}
                          </kbd>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tool.description}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Mobile: Horizontal scrollable rail */}
      <div className="md:hidden w-full bg-card border-b border-border">
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="flex gap-1 p-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(isActive ? null : tool.id)}
                  className={cn(
                    'relative min-w-[64px] h-16 flex flex-col items-center justify-center gap-1 shrink-0 rounded-md transition-all duration-200',
                    'border-2 border-transparent touch-manipulation',
                    'hover:bg-secondary/50 hover:border-border active:bg-secondary/80 active:scale-95',
                    isActive 
                      ? 'tool-active border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                      : 'hover:shadow-md'
                  )}
                >
                  {/* Active indicator bar (top for mobile) */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded-b-full animate-in slide-in-from-top-2 duration-200" />
                  )}
                  <Icon 
                    className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      isActive ? 'text-primary drop-shadow-sm' : 'text-muted-foreground'
                    )} 
                    strokeWidth={isActive ? 2 : 1.5} 
                  />
                  <span className={cn(
                    "text-[9px] uppercase tracking-wider transition-colors duration-200",
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>
                    {tool.label}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
