import { useState, useMemo } from 'react';
import { Search, X, Eye, EyeOff, Lock, Unlock, Trash2 } from 'lucide-react';
import { useDeckForgeStore, CanvasObject } from '@/store/deckforge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Get friendly name for object
function getObjectName(obj: CanvasObject): string {
  if (obj.type === 'text') return obj.text || 'Text';
  if (obj.type === 'image') return 'Image';
  if (obj.type === 'sticker') return obj.iconName || 'Sticker';
  if (obj.type === 'shape') return `${obj.shapeType || 'Shape'}`;
  if (obj.type === 'line') return 'Line';
  if (obj.type === 'path') return 'Pen Drawing';
  if (obj.type === 'group') return `Group (${obj.children?.length || 0} items)`;
  if (obj.type === 'texture') return 'Texture';
  return obj.type;
}

// Get icon emoji for object type
function getObjectIcon(type: CanvasObject['type']): string {
  const icons: Record<CanvasObject['type'], string> = {
    text: '📝',
    image: '🖼️',
    sticker: '✨',
    shape: '⬛',
    line: '📏',
    path: '✏️',
    group: '📦',
    texture: '🎨',
  };
  return icons[type] || '📄';
}

export function LayerSearch() {
  const { objects, selectedIds, selectObject, updateObject, deleteObject, toggleSelectObject } = useDeckForgeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CanvasObject['type'] | 'all'>('all');

  // Filter and search objects
  const filteredObjects = useMemo(() => {
    let filtered = objects;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(obj => obj.type === filterType);
    }

    // Search by name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(obj => {
        const name = getObjectName(obj).toLowerCase();
        return name.includes(query) || obj.id.includes(query);
      });
    }

    // Sort by z-index (reverse to show top first)
    return [...filtered].reverse();
  }, [objects, filterType, searchQuery]);

  const handleObjectClick = (objId: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      toggleSelectObject(objId);
    } else {
      selectObject(objId);
    }
  };

  const handleVisibilityToggle = (objId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const obj = objects.find(o => o.id === objId);
    if (obj) {
      updateObject(objId, { opacity: obj.opacity === 0 ? 1 : 0 });
      toast.success(obj.opacity === 0 ? 'Object visible' : 'Object hidden');
    }
  };

  const handleLockToggle = (objId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const obj = objects.find(o => o.id === objId);
    if (obj) {
      updateObject(objId, { locked: !obj.locked });
      toast.success(obj.locked ? 'Object unlocked' : 'Object locked');
    }
  };

  const handleDelete = (objId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteObject(objId);
    toast.success('Object deleted');
  };

  // Get unique object types for filter
  const objectTypes = useMemo(() => {
    const types = new Set(objects.map(obj => obj.type));
    return Array.from(types).sort();
  }, [objects]);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Layers</h3>
          <span className="text-xs text-muted-foreground">
            {filteredObjects.length} of {objects.length}
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <Select value={filterType} onValueChange={(val) => setFilterType(val as typeof filterType)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {objectTypes.map(type => (
              <SelectItem key={type} value={type}>
                {getObjectIcon(type)} {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Layer list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredObjects.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery || filterType !== 'all' 
                ? 'No matching layers found' 
                : 'No layers yet'}
            </div>
          ) : (
            filteredObjects.map((obj) => {
              const isSelected = selectedIds.includes(obj.id);
              const isHidden = obj.opacity === 0;
              const isLocked = obj.locked;

              return (
                <div
                  key={obj.id}
                  onClick={(e) => handleObjectClick(obj.id, e)}
                  className={`
                    group flex items-center gap-2 p-2 rounded cursor-pointer
                    transition-colors hover:bg-accent/50
                    ${isSelected ? 'bg-accent' : ''}
                  `}
                >
                  {/* Icon */}
                  <span className="text-base flex-shrink-0">
                    {getObjectIcon(obj.type)}
                  </span>

                  {/* Name */}
                  <span className={`
                    flex-1 text-sm truncate
                    ${isHidden ? 'opacity-50' : ''}
                  `}>
                    {getObjectName(obj)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleVisibilityToggle(obj.id, e)}
                      className="p-1 hover:bg-secondary rounded"
                      title={isHidden ? 'Show' : 'Hide'}
                    >
                      {isHidden ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={(e) => handleLockToggle(obj.id, e)}
                      className="p-1 hover:bg-secondary rounded"
                      title={isLocked ? 'Unlock' : 'Lock'}
                    >
                      {isLocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={(e) => handleDelete(obj.id, e)}
                      className="p-1 hover:bg-destructive/10 text-destructive rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status indicators */}
                  <div className="flex items-center gap-1">
                    {isLocked && (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    )}
                    {isHidden && (
                      <EyeOff className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      {objects.length > 0 && (
        <div className="p-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              {selectedIds.length > 0 && `${selectedIds.length} selected`}
            </span>
            <span>
              Hold Shift to multi-select
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
