import { useEffect } from 'react';
import { LayoutTemplate, ImageIcon, Type, Upload, Layers, Sticker, Grid3X3, Mountain, Minus, Pen, Paintbrush } from 'lucide-react';
import { useDeckForgeStore, ToolType } from '@/store/deckforge';
import { cn } from '@/lib/utils';
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
    <div className={cn(
      "bg-card shrink-0",
      // Mobile: horizontal strip with border-bottom
      "w-full border-b",
      // Desktop: vertical sidebar, narrow icon-only
      "md:w-16 md:border-b-0 md:border-r md:h-full",
      // Large desktop: wider to fit inline labels
      "lg:w-44"
    )}>
      {/* "Tools" header — desktop only */}
      <div className="hidden md:block py-4 px-2 border-b border-border">
        <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground block text-center lg:text-left lg:px-1">
          Tools
        </span>
      </div>

      {/* Single list of tool buttons — responsive layout */}
      <div className={cn(
        "flex gap-1 p-2",
        // Mobile: horizontal scrollable row
        "flex-row overflow-x-auto",
        // Desktop: vertical column
        "md:flex-col md:overflow-x-hidden md:overflow-y-auto"
      )}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <Tooltip key={tool.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTool(isActive ? null : tool.id)}
                  aria-label={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
                  className={cn(
                    'relative flex items-center rounded-md transition-all duration-200',
                    'border-2 border-transparent touch-manipulation',
                    'hover:border-border hover:bg-secondary hover:scale-105 active:scale-95',
                    // Mobile: compact column with small label below icon
                    'min-w-[64px] h-16 flex-col gap-1 shrink-0 justify-center',
                    // Desktop md: icon-only square button
                    'md:min-w-0 md:w-11 md:h-11 md:flex-row md:gap-2 md:justify-center',
                    // Desktop lg: full-width row with inline label
                    'lg:w-full lg:h-auto lg:justify-start lg:px-3 lg:py-2',
                    isActive
                      ? 'tool-active border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20'
                      : 'hover:shadow-md'
                  )}
                >
                  {/* Active indicator — left bar on desktop */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full animate-in slide-in-from-left-2 duration-200 hidden md:block" />
                  )}
                  {/* Active indicator — top bar on mobile */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded-b-full animate-in slide-in-from-top-2 duration-200 md:hidden" />
                  )}
                  <Icon
                    className={cn(
                      'w-5 h-5 shrink-0 transition-colors duration-200',
                      isActive ? 'text-primary drop-shadow-sm' : 'text-muted-foreground'
                    )}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {/* Label: visible on mobile (below icon) and lg+ desktop (inline) */}
                  <span className={cn(
                    "transition-colors duration-200",
                    "text-[9px] uppercase tracking-wider",
                    "md:hidden lg:inline lg:text-xs lg:normal-case lg:tracking-normal",
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>
                    {tool.label}
                  </span>
                  {/* Keyboard shortcut badge — lg+ only */}
                  {tool.shortcut && (
                    <kbd className="hidden lg:inline text-[10px] opacity-50 ml-auto">
                      {tool.shortcut}
                    </kbd>
                  )}
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
    </div>
  );
}
