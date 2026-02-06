import { GripVertical, Eye, EyeOff, Lock, Unlock, Trash2, Type, ImageIcon, Square, Circle, Star, Sticker, Minus, Pen, Mountain, Layers as LayersIcon, Info, Search, X, Filter, Scissors, Link, ChevronRight, ChevronDown, FolderOpen, Folder } from 'lucide-react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
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
  if (obj.type === 'group') return Folder;

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
  
  // Group
  if (obj.type === 'group') {
    const childCount = obj.children?.length || 0;
    return `Group (${childCount})`;
  }

  // Fallback
  return obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
}

interface LayerItemProps {
  obj: CanvasObject;
  index: number;
  isSelected: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  canMask?: boolean;
  onToggleMask?: () => void;
  indent?: number; // indentation level for group children
  isGroupExpanded?: boolean;
  onToggleExpand?: () => void;
}

// Check which effects/filters are active on an object
function getActiveEffects(obj: CanvasObject): string[] {
  const active: string[] = [];
  // Filters
  if (obj.contrast !== undefined && obj.contrast !== 100) active.push('contrast');
  if (obj.brightness !== undefined && obj.brightness !== 100) active.push('brightness');
  if (obj.grayscale !== undefined && obj.grayscale > 0) active.push('grayscale');
  if (obj.threshold) active.push('threshold');
  if (obj.blur !== undefined && obj.blur > 0) active.push('blur');
  if (obj.saturate !== undefined && obj.saturate !== 100) active.push('saturate');
  if (obj.sepia !== undefined && obj.sepia > 0) active.push('sepia');
  if (obj.hueRotate !== undefined && obj.hueRotate > 0) active.push('hue');
  if (obj.posterize !== undefined && obj.posterize < 32) active.push('posterize');
  if (obj.invert) active.push('invert');
  if (obj.pixelate) active.push('pixelate');
  if (obj.colorize) active.push('colorize');
  if (obj.duotone?.enabled) active.push('duotone');
  // Effects
  if (obj.dropShadow?.enabled) active.push('shadow');
  if (obj.glow?.enabled) active.push('glow');
  if (obj.outlineStroke?.enabled) active.push('outline');
  return active;
}

function LayerItem({
  obj,
  index,
  isSelected,
  onSelect,
  onDelete,
  canMask,
  onToggleMask,
  indent = 0,
  isGroupExpanded,
  onToggleExpand,
}: LayerItemProps) {
  const Icon = getObjectIcon(obj);
  const { updateObject } = useDeckForgeStore();
  const activeEffects = getActiveEffects(obj);

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

  const isGroup = obj.type === 'group';

  return (
    <div
      onClick={(e) => onSelect(e)}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 border-b border-border cursor-pointer group',
        'hover:bg-secondary hover:shadow-sm transition-all duration-200',
        isSelected && 'bg-primary/10 border-l-2 border-l-primary',
        obj.hidden && 'opacity-50'
      )}
      style={{ paddingLeft: `${8 + indent * 16}px` }}
    >
      {isGroup ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {isGroupExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      ) : (
        <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab shrink-0" />
      )}
      <Icon className="w-4 h-4 text-foreground shrink-0" />
      <span className="flex-1 text-xs truncate font-medium">
        {getObjectLabel(obj)}
      </span>
      {/* Active effects indicator */}
      {activeEffects.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {activeEffects.length > 1 && (
                <span className="text-[8px] text-primary font-mono">{activeEffects.length}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-[10px]">{activeEffects.join(', ')}</p>
          </TooltipContent>
        </Tooltip>
      )}
      
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

      {/* Use as Mask Button (for shapes with image above) */}
      {canMask && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMask?.();
              }}
              className={cn(
                "w-6 h-6 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 rounded",
                obj.isMask
                  ? "bg-primary/20 text-primary"
                  : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-secondary"
              )}
              title={obj.isMask ? "Remove mask" : "Use as Mask"}
            >
              <Scissors className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">{obj.isMask ? 'Remove mask' : 'Use as Mask'}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Mask indicator for masked images */}
      {obj.maskTargetId && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-6 h-6 flex items-center justify-center">
              <Scissors className="w-3 h-3 text-primary" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">Masked by shape below</p>
          </TooltipContent>
        </Tooltip>
      )}

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
  const { objects, selectedId, selectedIds, selectObject, toggleSelectObject, deleteObject, moveLayer, updateObject, saveToHistory, enterIsolationMode } = useDeckForgeStore();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showVisibleOnly, setShowVisibleOnly] = useState(false);
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
      {/* Attach Text to Path button - shown when both text and path are selected */}
      {(() => {
        const selIds = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
        const selectedObjs = objects.filter(o => selIds.includes(o.id));
        const textObj = selectedObjs.find(o => o.type === 'text');
        const pathObj = selectedObjs.find(o => o.type === 'path' && !o.brushType);

        if (textObj && pathObj) {
          const isAttached = textObj.textPathId === pathObj.id;
          return (
            <div className="px-3 py-2 border-b border-border bg-primary/5">
              <button
                onClick={() => {
                  saveToHistory();
                  if (isAttached) {
                    updateObject(textObj.id, { textPathId: undefined });
                    toast.success('Text detached from path');
                  } else {
                    updateObject(textObj.id, { textPathId: pathObj.id, warpType: 'none' });
                    toast.success('Text attached to path');
                  }
                }}
                className={cn(
                  "w-full h-8 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider transition-colors rounded",
                  isAttached
                    ? "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Link className="w-3.5 h-3.5" />
                {isAttached ? 'Detach Text from Path' : 'Attach Text to Path'}
              </button>
            </div>
          );
        }
        return null;
      })()}

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

            // Check if this shape can act as a mask:
            // It must be a shape, and the layer directly above it (realIndex + 1) must be an image
            const canMask = obj.type === 'shape' && realIndex < objects.length - 1 && objects[realIndex + 1]?.type === 'image';

            const handleToggleMask = () => {
              const { updateObject, saveToHistory } = useDeckForgeStore.getState();
              saveToHistory();

              if (obj.isMask) {
                // Remove mask
                const imageAbove = objects[realIndex + 1];
                if (imageAbove) {
                  updateObject(imageAbove.id, { maskTargetId: undefined });
                }
                updateObject(obj.id, { isMask: false });
                toast.success('Mask removed');
              } else {
                // Set as mask
                const imageAbove = objects[realIndex + 1];
                if (imageAbove) {
                  updateObject(obj.id, { isMask: true });
                  updateObject(imageAbove.id, { maskTargetId: obj.id });
                  toast.success('Shape set as mask for image above');
                }
              }
            };

            const isSelected = selectedId === obj.id || selectedIds.includes(obj.id);
            const isGroup = obj.type === 'group';
            const isExpanded = expandedGroups.has(obj.id);

            const handleSelect = (e?: React.MouseEvent) => {
              if (e?.shiftKey) {
                toggleSelectObject(obj.id);
              } else {
                selectObject(obj.id);
              }
            };

            return (
              <div key={obj.id}>
                <LayerItem
                  obj={obj}
                  index={realIndex}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onDelete={() => deleteObject(obj.id)}
                  onMoveUp={() => moveLayer(obj.id, 'up')}
                  onMoveDown={() => moveLayer(obj.id, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === reversedObjects.length - 1}
                  canMask={canMask}
                  onToggleMask={handleToggleMask}
                  isGroupExpanded={isGroup ? isExpanded : undefined}
                  onToggleExpand={isGroup ? () => {
                    setExpandedGroups(prev => {
                      const next = new Set(prev);
                      if (next.has(obj.id)) {
                        next.delete(obj.id);
                      } else {
                        next.add(obj.id);
                      }
                      return next;
                    });
                  } : undefined}
                />
                {/* Render group children when expanded */}
                {isGroup && isExpanded && obj.children && obj.children.length > 0 && (
                  <div className="bg-muted/20">
                    {[...obj.children].reverse().map((child, childIdx) => (
                      <LayerItem
                        key={child.id}
                        obj={child}
                        index={childIdx}
                        isSelected={false}
                        onSelect={() => {
                          // Double-click on child enters isolation mode
                          enterIsolationMode(obj.id);
                        }}
                        onDelete={() => {
                          // Remove child from group
                          saveToHistory();
                          const newChildren = obj.children!.filter(c => c.id !== child.id);
                          updateObject(obj.id, { children: newChildren });
                          toast.success('Removed from group');
                        }}
                        onMoveUp={() => {}}
                        onMoveDown={() => {}}
                        isFirst={childIdx === 0}
                        isLast={childIdx === obj.children!.length - 1}
                        indent={1}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
