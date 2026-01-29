import { LayoutTemplate, ImageIcon, Type, Upload, Palette, Layers, Sticker, Grid3X3, Mountain, Minus, Pen } from 'lucide-react';
import { useDeckForgeStore, ToolType } from '@/store/deckforge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ToolItem {
  id: ToolType;
  icon: typeof LayoutTemplate;
  label: string;
}

const tools: ToolItem[] = [
  { id: 'pen', icon: Pen, label: 'Pen Tool' },
  { id: 'stickers', icon: Sticker, label: 'Stickers' },
  { id: 'lines', icon: Minus, label: 'Lines' },
  { id: 'patterns', icon: Grid3X3, label: 'Patterns' },
  { id: 'textures', icon: Mountain, label: 'Textures' },
  { id: 'graphics', icon: ImageIcon, label: 'Graphics' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'uploads', icon: Upload, label: 'Uploads' },
  { id: 'finishes', icon: Layers, label: 'Finishes' },
];

export function ToolRail() {
  const { activeTool, setActiveTool } = useDeckForgeStore();

  return (
    <>
      {/* Desktop: Vertical rail */}
      <div className="hidden md:flex flex-col w-14 bg-card border-r border-border h-full">
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
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(isActive ? null : tool.id)}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center border border-transparent',
                    'hover:border-border hover:bg-secondary transition-colors duration-75',
                    isActive && 'tool-active border-primary'
                  )}
                  title={tool.label}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </button>
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
                    'min-w-[56px] h-14 flex flex-col items-center justify-center gap-1 border border-transparent shrink-0',
                    'active:bg-secondary transition-colors duration-75',
                    isActive && 'tool-active border-primary bg-primary/10'
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-[9px] uppercase tracking-wider">
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
