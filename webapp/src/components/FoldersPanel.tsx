import { useState, useEffect } from 'react';
import { Folder, FolderPlus, Edit2, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import { foldersAPI, Folder as FolderType } from '@/lib/folders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FoldersPanelProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

const FOLDER_COLORS = [
  '#ccff00', '#00ffff', '#ff00ff', '#ff6600', '#00ff00', '#ff0000', '#0000ff', '#ffff00'
];

export function FoldersPanel({ selectedFolder, onFolderSelect }: FoldersPanelProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setIsLoading(true);
    try {
      const data = await foldersAPI.list();
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;

    try {
      const randomColor = FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)];
      const folder = await foldersAPI.create(newFolderName.trim(), randomColor);
      setFolders([...folders, folder]);
      setNewFolderName('');
      setIsCreating(false);
      toast({
        title: '✓ Folder created',
        description: `${folder.name} is ready`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to create folder',
        description: error.response?.data?.error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;

    try {
      const updated = await foldersAPI.update(id, { name: editName.trim() });
      setFolders(folders.map((f) => (f.id === id ? updated : f)));
      setEditingId(null);
      toast({
        title: '✓ Folder renamed',
      });
    } catch (error) {
      toast({
        title: 'Failed to rename',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete folder "${name}"? Designs will be moved to "All Designs".`)) return;

    try {
      await foldersAPI.delete(id);
      setFolders(folders.filter((f) => f.id !== id));
      if (selectedFolder === id) {
        onFolderSelect(null);
      }
      toast({
        title: '✓ Folder deleted',
      });
    } catch (error) {
      toast({
        title: 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-display text-xs uppercase tracking-wider mb-3">
          Folders
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsCreating(!isCreating)}
          className="w-full gap-2"
        >
          <FolderPlus className="w-4 h-4" />
          New Folder
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {/* All Designs */}
          <button
            onClick={() => onFolderSelect(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              selectedFolder === null
                ? 'bg-primary/10 text-primary border border-primary'
                : 'hover:bg-secondary border border-transparent'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="flex-1 text-left">All Designs</span>
          </button>

          {/* Create new folder form */}
          {isCreating && (
            <div className="py-2 space-y-2">
              <Input
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
                autoFocus
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newFolderName.trim()}
                  className="flex-1"
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Folders list */}
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`group flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                selectedFolder === folder.id
                  ? 'bg-primary/10 text-primary border border-primary'
                  : 'hover:bg-secondary border border-transparent'
              }`}
            >
              {editingId === folder.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(folder.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="h-7 text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdate(folder.id)}
                    className="h-7 px-2"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onFolderSelect(folder.id)}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Folder
                      className="w-4 h-4"
                      style={{ color: folder.color }}
                    />
                    <span className="truncate">{folder.name}</span>
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(folder.id);
                        setEditName(folder.name);
                      }}
                      className="p-1 hover:bg-secondary"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(folder.id, folder.name)}
                      className="p-1 hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
