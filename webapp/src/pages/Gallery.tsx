import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useDeckForgeStore } from '@/store/deckforge';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Heart, Eye, Download, Copy, Loader2, TrendingUp, Clock, ThumbsUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PublicDesign {
  id: string;
  name: string;
  description?: string;
  canvas_data: any;
  thumbnail_url?: string;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export default function Gallery() {
  const [designs, setDesigns] = useState<PublicDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<'recent' | 'popular' | 'liked'>('recent');
  const [likedDesigns, setLikedDesigns] = useState<Set<string>>(new Set());
  const { isAuthenticated } = useAuthStore();
  const { loadDesign } = useDeckForgeStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadGallery();
  }, [sort]);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/gallery?sort=${sort}&limit=50`);
      setDesigns(response.data.designs || []);
      
      // Load liked status for authenticated users
      if (isAuthenticated) {
        const liked = new Set<string>();
        for (const design of response.data.designs || []) {
          try {
            const token = localStorage.getItem('token');
            const likedResponse = await axios.get(
              `${API_BASE}/gallery/${design.id}/liked`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (likedResponse.data.liked) {
              liked.add(design.id);
            }
          } catch (err) {
            // Ignore errors
          }
        }
        setLikedDesigns(liked);
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (designId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please login to like designs',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    const token = localStorage.getItem('token');
    const isLiked = likedDesigns.has(designId);

    try {
      if (isLiked) {
        await axios.delete(`${API_BASE}/gallery/${designId}/like`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLikedDesigns((prev) => {
          const next = new Set(prev);
          next.delete(designId);
          return next;
        });
        // Update local count
        setDesigns((prev) =>
          prev.map((d) =>
            d.id === designId ? { ...d, like_count: d.like_count - 1 } : d
          )
        );
      } else {
        await axios.post(`${API_BASE}/gallery/${designId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLikedDesigns((prev) => new Set(prev).add(designId));
        // Update local count
        setDesigns((prev) =>
          prev.map((d) =>
            d.id === designId ? { ...d, like_count: d.like_count + 1 } : d
          )
        );
      }
    } catch (err: any) {
      console.error('Like failed:', err);
      toast({
        title: 'Action failed',
        description: err.response?.data?.error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleRemix = (design: PublicDesign, e: React.MouseEvent) => {
    e.stopPropagation();
    loadDesign(design.canvas_data);
    navigate('/');
    toast({
      title: '✓ Design loaded',
      description: 'Remix and make it your own!',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6 bg-card">
        <h1 className="font-display text-xl uppercase tracking-widest">
          Design <span className="text-primary">Gallery</span>
        </h1>
        <div className="ml-auto flex items-center gap-4">
          {/* Sort buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={sort === 'recent' ? 'default' : 'outline'}
              onClick={() => setSort('recent')}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              Recent
            </Button>
            <Button
              size="sm"
              variant={sort === 'popular' ? 'default' : 'outline'}
              onClick={() => setSort('popular')}
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Popular
            </Button>
            <Button
              size="sm"
              variant={sort === 'liked' ? 'default' : 'outline'}
              onClick={() => setSort('liked')}
              className="gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              Most Liked
            </Button>
          </div>
          
          <Button size="sm" variant="outline" onClick={() => navigate('/')}>
            Create Design
          </Button>
          {!isAuthenticated && (
            <Button size="sm" variant="ghost" onClick={() => navigate('/auth')}>
              Login
            </Button>
          )}
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
                No Public Designs Yet
              </h2>
              <p className="text-muted-foreground">
                Be the first to share a design with the community!
              </p>
            </div>
            <Button onClick={() => navigate('/')} size="lg">
              Create & Share
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {designs.length} design{designs.length !== 1 ? 's' : ''} • Community creations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {designs.map((design) => {
                const isLiked = likedDesigns.has(design.id);
                
                return (
                  <div
                    key={design.id}
                    className="group border border-border hover:border-primary transition-colors bg-card overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[32/98] bg-muted flex items-center justify-center overflow-hidden relative">
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
                      
                      {/* Stats overlay */}
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {design.view_count}
                        </div>
                        <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {design.like_count}
                        </div>
                      </div>
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
                          {new Date(design.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={(e) => handleRemix(design, e)}
                        >
                          <Copy className="w-3 h-3" />
                          Remix
                        </Button>
                        <Button
                          size="sm"
                          variant={isLiked ? 'default' : 'outline'}
                          onClick={(e) => handleLike(design.id, e)}
                          className={isLiked ? 'text-red-500' : ''}
                        >
                          <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                        </Button>
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
  );
}
