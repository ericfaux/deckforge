import { GripVertical, Eye, EyeOff, Lock, Unlock, Trash2, Type, ImageIcon, Square, Circle, Star, Sticker, Minus, Pen, Mountain, Layers as LayersIcon, Info, Search, X, Filter } from 'lucide-react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState } from 'react';
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
  const { updateObject } = useDeckForgeStore();

  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateObject(obj.id, { hidden: !obj.hidden });
    toast.success(obj.hidden ? 'Layer visible' : 'Layer hidden');
  };

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateObject(obj.id, { locked: !obj.locked });
    toast.success(obj.locked ? 'Layer unlocked' : 'Layer locked');
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 border-b border-border cursor-pointer group',
        'hover:bg-secondary hover:shadow-sm transition-all duration-200',
        isSelected && 'bg-primary/10 border-l-2 border-l-primary',
        obj.hidden && 'opacity-50'
      )}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab" />
      <Icon className="w-4 h-4 text-foreground" />
      <span className="flex-1 text-xs truncate font-medium">
        {getObjectLabel(obj)}
      </span>
      
      {/* Visibility Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleVisibility}
            className="w-6 h-6 flex items-center justify-center hover:bg-secondary hover:scale-110 active:scale-95 transition-all duration-200 rounded"
            title={obj.hidden ? "Show layer" : "Hide layer"}
          >
            {obj.hidden ? (
              <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs">{obj.hidden ? 'Show' : 'Hide'} layer</p>
        </TooltipContent>
      </Tooltip>

      {/* Lock Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleLock}
            className="w-6 h-6 flex items-center justify-center hover:bg-secondary hover:scale-110 active:scale-95 transition-all duration-200 rounded"
            title={obj.locked ? "Unlock layer" : "Lock layer"}
          >
            {obj.locked ? (
              <Lock className="w-3.5 h-3.5 text-orange-500" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs">{obj.locked ? 'Unlock' : 'Lock'} layer</p>
        </TooltipContent>
      </Tooltip>

      {/* Delete Button */}
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
            className="w-6 h-6 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground hover:scale-110 active:scale-95 transition-all duration-200 rounded opacity-0 group-hover:opacity-100"
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
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showVisibleOnly, setShowVisibleOnly] = useState(false);
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Filter objects based on search and filters
  const filteredObjects = objects.filter(obj => {
    // Search filter
    if (searchQuery) {
      const label = getObjectLabel(obj).toLowerCase();
      if (!label.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    
    // Visibility filter
    if (showVisibleOnly && obj.hidden) {
      return false;
    }
    
    // Locked filter
    if (showLockedOnly && !obj.locked) {
      return false;
    }
    
    // Selected filter
    if (showSelectedOnly && selectedId !== obj.id) {
      return false;
    }
    
    return true;
  });

  // Reverse order so topmost layer shows first
  const reversedObjects = [...filteredObjects].reverse();
  
  const hasActiveFilters = searchQuery || showVisibleOnly || showLockedOnly || showSelectedOnly;

  return (
    <div className="border-t border-border">
      <div className="py-2 px-3 border-b border-border bg-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-accent" />
            <span className="font-display text-xs uppercase tracking-widest text-foreground font-semibold">
              Layers {objects.length > 0 && `(${filteredObjects.length}/${objects.length})`}
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
                Search layers, filter by state, click to select
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {objects.length > 0 && (
          <div className="mt-2 space-y-2">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search layers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 pr-7 text-xs bg-background border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center hover:bg-secondary rounded transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
            
            {/* Filter buttons */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowVisibleOnly(!showVisibleOnly)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-[10px] rounded border transition-all duration-200",
                      showVisibleOnly 
                        ? "bg-primary/10 border-primary text-primary font-semibold" 
                        : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    <Eye className="w-3 h-3" />
                    <span className="uppercase tracking-wider">Visible</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Show visible layers only</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowLockedOnly(!showLockedOnly)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-[10px] rounded border transition-all duration-200",
                      showLockedOnly 
                        ? "bg-primary/10 border-primary text-primary font-semibold" 
                        : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    <Lock className="w-3 h-3" />
                    <span className="uppercase tracking-wider">Locked</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Show locked layers only</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-[10px] rounded border transition-all duration-200",
                      showSelectedOnly 
                        ? "bg-primary/10 border-primary text-primary font-semibold" 
                        : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    <Filter className="w-3 h-3" />
                    <span className="uppercase tracking-wider">Selected</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Show selected layer only</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {hasActiveFilters && filteredObjects.length === 0 && (
              <p className="text-[9px] text-muted-foreground italic">
                No layers match filters
              </p>
            )}
          </div>
        )}
      </div>
      <ScrollArea className="h-48">
        {objects.length === 0 ? (
          <div className="p-6 text-center space-y-3 animate-in fade-in-50 duration-500">
            <div className="relative group inline-block">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-all duration-500" />
              
              {/* Icon with gradient background */}
              <div className="relative rounded-full bg-gradient-to-br from-muted/80 to-muted/40 p-3">
                <LayersIcon className="w-8 h-8 text-muted-foreground/70 group-hover:text-primary/80 transition-colors duration-300" />
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                No layers yet
              </p>
              <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                Press <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-muted rounded border border-border">T</kbd> for text,{' '}
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-muted rounded border border-border">S</kbd> for stickers, or{' '}
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-muted rounded border border-border">U</kbd> to upload
              </p>
            </div>
          </div>
        ) : reversedObjects.length === 0 ? (
          <div className="p-6 text-center space-y-2 animate-in fade-in-50 duration-300">
            <Filter className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                No layers match filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowVisibleOnly(false);
                  setShowLockedOnly(false);
                  setShowSelectedOnly(false);
                }}
                className="text-[10px] text-primary hover:underline"
              >
                Clear all filters
              </button>
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
