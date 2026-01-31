import { useDeckForgeStore } from '@/store/deckforge';
import { Button } from '@/components/ui/button';
import { Group, Ungroup } from 'lucide-react';
import toast from 'react-hot-toast';

export function GroupManager() {
  const { selectedIds, objects, groupObjects, ungroupObject } = useDeckForgeStore();

  // Check if selection contains any groups
  const hasGroups = selectedIds.some(id => {
    const obj = objects.find(o => o.id === id);
    return obj?.type === 'group';
  });

  // Can group if 2+ objects selected (and not all groups)
  const canGroup = selectedIds.length >= 2;

  // Can ungroup if exactly 1 group selected
  const canUngroup = selectedIds.length === 1 && hasGroups;

  if (selectedIds.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {canGroup && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            groupObjects(selectedIds);
            toast.success(`Grouped ${selectedIds.length} objects`, {
              description: 'Use Ctrl+Shift+G to ungroup',
            });
          }}
          className="gap-2"
          title="Group selected objects (Ctrl+G)"
        >
          <Group className="w-4 h-4" />
          <span className="hidden sm:inline">Group</span>
        </Button>
      )}

      {canUngroup && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            ungroupObject(selectedIds[0]);
            toast.success('Ungrouped objects', {
              description: 'Objects can now be edited individually',
            });
          }}
          className="gap-2"
          title="Ungroup selected group (Ctrl+Shift+G)"
        >
          <Ungroup className="w-4 h-4" />
          <span className="hidden sm:inline">Ungroup</span>
        </Button>
      )}
    </div>
  );
}
