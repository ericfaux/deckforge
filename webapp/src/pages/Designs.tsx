import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useDeckForgeStore } from '@/store/deckforge';
import { designsAPI } from '@/lib/api';
import { batchExportDesigns, downloadBlob } from '@/lib/batch-export';
import { FoldersPanel } from '@/components/FoldersPanel';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Download, Eye, Loader2, CheckSquare, Square, Globe, Lock, FolderInput } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';
import { foldersAPI } from '@/lib/folders';

export default function Designs() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const { isAuthenticated, logout } = useAuthStore();
  const { loadDesign, resetCanvas } = useDeckForgeStore();
  const navigate = useNavigate();

  // Filter designs by folder
  const filteredDesigns = selectedFolder
    ? designs.filter((d) => d.folder_id === selectedFolder)
    : designs;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    loadDesigns();
  }, [isAuthenticated]);

  const loadDesigns = async () => {
    setIsLoading(true);
    try {
      const data = await designsAPI.list();
      setDesigns(data.designs || []);
    } catch (err) {
      console.error('Failed to load designs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openDesign = (design: any) => {
    loadDesign(design.canvas_data);
    navigate('/');
  };

  const deleteDesign = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this design? This cannot be undone.')) {
      return;
    }

    try {
      await designsAPI.delete(id);
      // Remove from selected if it was selected
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await loadDesigns();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete design');
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredDesigns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDesigns.map((d) => d.id)));
    }
  };

  const moveToFolder = async (designId: string, folderId: string | null, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (folderId) {
        await foldersAPI.moveDesign(folderId, designId);
      } else {
        // Remove from current folder
        const design = designs.find((d) => d.id === designId);
        if (design?.folder_id) {
          await foldersAPI.removeDesign(design.folder_id, designId);
        }
      }

      // Update local state
      setDesigns((prev) =>
        prev.map((d) =>
          d.id === designId ? { ...d, folder_id: folderId } : d
        )
      );

      toast({
        title: '✓ Design moved',
        description: folderId ? 'Design moved to folder' : 'Design moved to All Designs',
      });
    } catch (error) {
      console.error('Move to folder failed:', error);
      toast({
        title: 'Failed to move design',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const togglePublic = async (designId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');

    try {
      await axios.patch(
        `${API_BASE}/gallery/${designId}/visibility`,
        { is_public: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setDesigns((prev) =>
        prev.map((d) =>
          d.id === designId ? { ...d, is_public: !currentStatus } : d
        )
      );

      toast({
        title: !currentStatus ? '✓ Design published' : '✓ Design unpublished',
        description: !currentStatus
          ? 'Your design is now visible in the public gallery'
          : 'Your design has been removed from the gallery',
      });
    } catch (error) {
      console.error('Toggle public failed:', error);
      toast({
        title: 'Failed to update visibility',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleBatchExport = async () => {
    const selectedDesigns = designs.filter((d) => selectedIds.has(d.id));
    
    if (selectedDesigns.length === 0) {
      toast({
        title: 'No designs selected',
        description: 'Please select at least one design to export.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 0, total: selectedDesigns.length });

    try {
      const zipBlob = await batchExportDesigns(selectedDesigns, (current, total) => {
        setExportProgress({ current, total });
      });

      // Download the ZIP
      const timestamp = Date.now();
      const filename = `deckforge_designs_${timestamp}.zip`;
      downloadBlob(zipBlob, filename);

      toast({
        title: '✓ Batch export complete',
        description: `${selectedDesigns.length} design${selectedDesigns.length !== 1 ? 's' : ''} exported successfully.`,
      });

      // Clear selection
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Batch export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export designs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  const createNew = () => {
    resetCanvas();
    navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  if (!isAuthenticated) {
    return null;
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6 bg-card shrink-0">
        <h1 className="font-display text-xl uppercase tracking-widest">
          My <span className="text-primary">Designs</span>
        </h1>
        <div className="ml-auto flex items-center gap-4">
          {hasSelection && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchExport}
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting {exportProgress.current}/{exportProgress.total}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export Selected
                  </>
                )}
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={createNew} className="gap-2">
            <Plus className="w-4 h-4" />
            New Design
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folders sidebar */}
        <FoldersPanel
          selectedFolder={selectedFolder}
          onFolderSelect={setSelectedFolder}
        />

        {/* Designs area */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="text-center py-20 space-y-6">
            <div>
              <h2 className="text-2xl font-display uppercase tracking-widest mb-2">
                No Designs Yet
              </h2>
              <p className="text-muted-foreground">
                Create your first custom deck design!
              </p>
            </div>
            <Button onClick={createNew} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Design
            </Button>
          </div>
        ) : (
          <>
            {/* Select all toolbar */}
            <div className="mb-4 flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={selectAll}
                className="gap-2"
              >
                {selectedIds.size === filteredDesigns.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    Select All
                  </>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                {filteredDesigns.length} design{filteredDesigns.length !== 1 ? 's' : ''}
                {selectedFolder && ` in folder`}
              </span>
            </div>

            {/* Design grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDesigns.map((design) => {
                const isSelected = selectedIds.has(design.id);
                
                return (
                  <div
                    key={design.id}
                    className={`group border transition-colors bg-card overflow-hidden cursor-pointer relative ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary'
                    }`}
                    onClick={() => openDesign(design)}
                  >
                    {/* Selection checkbox */}
                    <div
                      className="absolute top-2 left-2 z-10"
                      onClick={(e) => toggleSelect(design.id, e)}
                    >
                      <div
                        className={`w-6 h-6 border-2 flex items-center justify-center transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-background border-border hover:border-primary'
                        }`}
                      >
                        {isSelected && <CheckSquare className="w-5 h-5 text-primary-foreground" />}
                      </div>
                    </div>

                    {/* Thumbnail */}
                    <div className="aspect-[32/98] bg-muted flex items-center justify-center overflow-hidden">
                      {design.thumbnail_url ? (
                        <img
                          src={design.thumbnail_url}
                          alt={design.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground text-sm uppercase tracking-widest">
                          {design.name}
                        </div>
                      )}
                    </div>

                    {/* Public badge */}
                    {design.is_public && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          Public
                        </div>
                      </div>
                    )}

                    {/* Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-display text-sm uppercase tracking-widest truncate">
                          {design.name}
                        </h3>
                        {design.description && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {design.description}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
                          {new Date(design.updated_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDesign(design);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant={design.is_public ? 'default' : 'outline'}
                            onClick={(e) => togglePublic(design.id, design.is_public, e)}
                            title={design.is_public ? 'Make Private' : 'Publish to Gallery'}
                          >
                            {design.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => deleteDesign(design.id, e)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
