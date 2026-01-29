import { useState } from 'react';
import { X, Clock, Save, Trash2, Edit2, RotateCcw, Check } from 'lucide-react';
import { useDeckForgeStore, DesignVersion } from '@/store/deckforge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionHistory({ isOpen, onClose }: VersionHistoryProps) {
  const { versions, currentVersionId, createVersion, restoreVersion, deleteVersion, renameVersion } = useDeckForgeStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSaveVersion = () => {
    createVersion();
  };

  const handleRestore = (versionId: string) => {
    if (confirm('Restore this version? Your current work will be saved as a new version first.')) {
      restoreVersion(versionId);
    }
  };

  const handleDelete = (versionId: string) => {
    if (confirm('Delete this version? This action cannot be undone.')) {
      deleteVersion(versionId);
    }
  };

  const startRename = (version: DesignVersion) => {
    setEditingId(version.id);
    setEditName(version.name);
  };

  const saveRename = (versionId: string) => {
    if (editName.trim()) {
      renameVersion(versionId, editName.trim());
    }
    setEditingId(null);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  // Sort versions by timestamp (newest first)
  const sortedVersions = [...versions].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border-2 border-border shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <h2 className="font-display text-lg uppercase tracking-wider">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Save current version button */}
          <div className="p-4 border-b border-border">
            <button
              onClick={handleSaveVersion}
              className="w-full bg-accent text-accent-foreground font-display text-sm uppercase tracking-wider py-2.5 px-4 border border-accent hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Current as New Version
            </button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {versions.length} version{versions.length !== 1 ? 's' : ''} saved
            </p>
          </div>

          {/* Version list */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {sortedVersions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No versions saved yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Save Current as New Version" to create your first checkpoint
                  </p>
                </div>
              ) : (
                sortedVersions.map((version, index) => {
                  const isCurrent = version.id === currentVersionId;
                  const isEditing = editingId === version.id;

                  return (
                    <div
                      key={version.id}
                      className={cn(
                        'group relative border border-border bg-secondary p-3 transition-all',
                        isCurrent && 'border-accent bg-accent/10'
                      )}
                    >
                      {/* Version header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveRename(version.id);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                                className="h-7 text-sm"
                                autoFocus
                              />
                              <button
                                onClick={() => saveRename(version.id)}
                                className="text-accent hover:text-accent/80"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm truncate">
                                {version.name}
                              </h3>
                              {isCurrent && (
                                <span className="text-[10px] uppercase tracking-wider bg-accent text-accent-foreground px-1.5 py-0.5 shrink-0">
                                  Current
                                </span>
                              )}
                              {version.autoSaved && (
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Auto
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(version.timestamp)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {version.objects.length} object{version.objects.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isCurrent && (
                            <button
                              onClick={() => handleRestore(version.id)}
                              className="p-1.5 text-accent hover:bg-accent/10 transition-colors"
                              title="Restore this version"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => startRename(version)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Rename version"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(version.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete version"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Version preview (optional - could add thumbnail) */}
                      {version.thumbnail && (
                        <div className="mt-2 border border-border overflow-hidden">
                          <img
                            src={version.thumbnail}
                            alt={version.name}
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Info footer */}
          <div className="border-t border-border p-3 bg-secondary/50">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Tip:</strong> Versions are saved locally. Use "Save Design" to persist to the cloud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
