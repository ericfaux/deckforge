import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shareAPI, SharedDesign } from '@/lib/share';
import { WorkbenchStage } from '@/components/deckforge/WorkbenchStage';
import { useDeckForgeStore } from '@/store/deckforge';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShareView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { loadDesign } = useDeckForgeStore();
  const [design, setDesign] = useState<SharedDesign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadSharedDesign();
    }
  }, [token]);

  const loadSharedDesign = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const sharedDesign = await shareAPI.getSharedDesign(token);
      setDesign(sharedDesign);
      
      // Load design into canvas store (read-only)
      loadDesign(sharedDesign.canvas_data);
    } catch (err: any) {
      console.error('Failed to load shared design:', err);
      setError(err.response?.data?.error || 'Failed to load shared design');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading shared design...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="font-display text-xl uppercase tracking-wider">Design Not Found</h2>
          <p className="text-sm text-muted-foreground">
            {error || 'This shared design link may have been revoked or does not exist.'}
          </p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go to DeckForge
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-border flex items-center px-4 bg-card shrink-0">
        <h1 className="font-display text-lg uppercase tracking-widest text-foreground">
          Deck<span className="text-primary">Forge</span>
        </h1>
        <div className="ml-4 flex items-center gap-2">
          <span className="tag-brutal">Shared</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <h2 className="text-sm font-medium">{design.name}</h2>
            <p className="text-xs text-muted-foreground">
              View only • Created {new Date(design.created_at).toLocaleDateString()}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            Create Your Own
          </Button>
        </div>
      </header>

      {/* Canvas - read-only view */}
      <div className="flex-1 flex overflow-hidden">
        <WorkbenchStage />
      </div>

      {/* Footer */}
      <footer className="h-10 border-t border-border flex items-center justify-center px-4 bg-card shrink-0">
        <p className="text-xs text-muted-foreground">
          Made with <span className="text-primary">DeckForge</span> • Fingerboard Graphics Editor
        </p>
      </footer>
    </div>
  );
}
