import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useDeckForgeStore } from '@/store/deckforge';
import { designsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Download, Eye, Loader2 } from 'lucide-react';

export default function Designs() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, logout } = useAuthStore();
  const { loadDesign, resetCanvas } = useDeckForgeStore();
  const navigate = useNavigate();

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
      await loadDesigns();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete design');
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6 bg-card">
        <h1 className="font-display text-xl uppercase tracking-widest">
          My <span className="text-primary">Designs</span>
        </h1>
        <div className="ml-auto flex items-center gap-4">
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
      <div className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : designs.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((design) => (
              <div
                key={design.id}
                className="group border border-border hover:border-primary transition-colors bg-card overflow-hidden cursor-pointer"
                onClick={() => openDesign(design)}
              >
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
                      variant="destructive"
                      onClick={(e) => deleteDesign(design.id, e)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
