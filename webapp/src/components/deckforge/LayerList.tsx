import { GripVertical, Eye, Trash2, Type, ImageIcon, Square } from 'lucide-react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

function getObjectIcon(type: CanvasObject['type']) {
  switch (type) {
    case 'text':
      return Type;
    case 'image':
      return ImageIcon;
    case 'shape':
      return Square;
    default:
      return Square;
  }
}

function getObjectLabel(obj: CanvasObject): string {
  if (obj.type === 'text' && obj.text) {
    return obj.text.length > 12 ? obj.text.slice(0, 12) + '...' : obj.text;
  }
  if (obj.type === 'shape' && obj.shapeType) {
    return obj.shapeType.charAt(0).toUpperCase() + obj.shapeType.slice(1);
  }
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
  const Icon = getObjectIcon(obj.type);

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 border-b border-border cursor-pointer',
        'hover:bg-secondary transition-colors',
        isSelected && 'bg-primary/10 border-l-2 border-l-primary'
      )}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab" />
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="flex-1 text-[11px] font-mono truncate">
        {getObjectLabel(obj)}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="w-5 h-5 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors"
        title="Delete"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export function LayerList() {
  const { objects, selectedId, selectObject, deleteObject, moveLayer } = useDeckForgeStore();

  // Reverse order so topmost layer shows first
  const reversedObjects = [...objects].reverse();

  return (
    <div className="border-t border-border">
      <div className="py-2 px-3 border-b border-border">
        <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
          Layers
        </span>
      </div>
      <ScrollArea className="h-48">
        {reversedObjects.length === 0 ? (
          <div className="p-4 text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              No layers yet
            </span>
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
