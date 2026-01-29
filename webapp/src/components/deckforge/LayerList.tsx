import { GripVertical, Eye, Trash2, Type, ImageIcon, Square, Circle, Star, Sticker, Minus, Pen, Mountain, Layers as LayersIcon, Info } from 'lucide-react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function getObjectIcon(obj: CanvasObject) {
  if (obj.type === 'text') return Type;
  if (obj.type === 'image') return ImageIcon;
  if (obj.type === 'sticker') return Sticker;
  if (obj.type === 'line') return Minus;
  if (obj.type === 'path') return Pen;
  if (obj.type === 'texture') return Mountain;
  
  if (obj.type === 'shape') {
    if (obj.shapeType === 'circle') return Circle;
    if (obj.shapeType === 'star') return Star;
    return Square;
  }
  
  return Square;
}

function getObjectLabel(obj: CanvasObject): string {
  // Text: show the actual text
  if (obj.type === 'text' && obj.text) {
    return obj.text.length > 15 ? obj.text.slice(0, 15) + '...' : obj.text;
  }
  
  // Sticker: show icon name
  if (obj.type === 'sticker' && obj.iconName) {
    return `${obj.iconName} Sticker`;
  }
  
  // Shape: show shape type
  if (obj.type === 'shape' && obj.shapeType) {
    const shapeName = obj.shapeType.charAt(0).toUpperCase() + obj.shapeType.slice(1);
    return `${shapeName} Shape`;
  }
  
  // Line: show line type
  if (obj.type === 'line' && obj.lineType) {
    const lineType = obj.lineType.charAt(0).toUpperCase() + obj.lineType.slice(1);
    return `${lineType} Line`;
  }
  
  // Path: show if closed/open
  if (obj.type === 'path') {
    return obj.pathClosed ? 'Closed Path' : 'Open Path';
  }
  
  // Texture: show texture type if available
  if (obj.type === 'texture') {
    return 'Texture Overlay';
  }
  
  // Image: show filename if available, else "Image"
  if (obj.type === 'image') {
    return 'Image';
  }
  
  // Fallback
  return obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
}

interface LayerItemProps {
  obj: CanvasObject;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function LayerItem({
  obj,
  index,
  isSelected,
  onSelect,
  onDelete,
}: LayerItemProps) {
  const Icon = getObjectIcon(obj);

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 border-b border-border cursor-pointer group',
        'hover:bg-secondary transition-colors',
        isSelected && 'bg-primary/10 border-l-2 border-l-primary'
      )}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab" />
      <Icon className="w-4 h-4 text-foreground" />
      <span className="flex-1 text-xs truncate font-medium">
        {getObjectLabel(obj)}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const label = getObjectLabel(obj);
              onDelete();
              toast.success(`Deleted "${label}"`, {
                description: 'Use Layers panel to manage or remove items',
                duration: 2000,
              });
            }}
            className="w-6 h-6 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors rounded opacity-0 group-hover:opacity-100"
            title="Delete layer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs">Delete this layer</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function LayerList() {
  const { objects, selectedId, selectObject, deleteObject, moveLayer } = useDeckForgeStore();

  // Reverse order so topmost layer shows first
  const reversedObjects = [...objects].reverse();

  return (
    <div className="border-t border-border">
      <div className="py-2 px-3 border-b border-border bg-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-accent" />
            <span className="font-display text-xs uppercase tracking-widest text-foreground font-semibold">
              Layers {objects.length > 0 && `(${objects.length})`}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs font-semibold mb-1">Layers Panel</p>
              <p className="text-xs text-muted-foreground">
                Shows all elements on your deck. Click to select, hover to reveal delete button.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        {objects.length > 0 && (
          <p className="text-[9px] text-muted-foreground mt-1">
            Click layer to select • Hover to delete
          </p>
        )}
      </div>
      <ScrollArea className="h-48">
        {reversedObjects.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <LayersIcon className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                No layers yet
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Add text, shapes, or images to see them here
              </p>
            </div>
          </div>
        ) : (
          reversedObjects.map((obj, idx) => {
            const realIndex = objects.length - 1 - idx;
            return (
              <LayerItem
                key={obj.id}
                obj={obj}
                index={realIndex}
                isSelected={selectedId === obj.id}
                onSelect={() => selectObject(obj.id)}
                onDelete={() => deleteObject(obj.id)}
                onMoveUp={() => moveLayer(obj.id, 'up')}
                onMoveDown={() => moveLayer(obj.id, 'down')}
                isFirst={idx === 0}
                isLast={idx === reversedObjects.length - 1}
              />
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
