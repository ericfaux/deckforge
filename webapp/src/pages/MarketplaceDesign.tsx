import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceAPI, MarketplaceDesign } from '@/lib/marketplace';
import { Heart, Download, DollarSign, ExternalLink, ShoppingCart, Loader2, Star, Eye, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

export default function MarketplaceDesignPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [design, setDesign] = useState<MarketplaceDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    loadDesign();
  }, [id]);

  const loadDesign = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await marketplaceAPI.getDesign(id);
      setDesign(data);
      setIsFavorited(data.is_favorited || false);
    } catch (error: any) {
      toast.error('Failed to load design');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to favorite designs');
      navigate('/auth');
      return;
    }

    try {
      const favorited = await marketplaceAPI.toggleFavorite(id!);
      setIsFavorited(favorited);
      toast.success(favorited ? 'Added to favorites' : 'Removed from favorites');
      
      // Update local state
      if (design) {
        setDesign({
          ...design,
          favorites: favorited ? design.favorites + 1 : design.favorites - 1,
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle favorite');
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to purchase');
      navigate('/auth');
      return;
    }

    if (!design) return;

    if (design.price === 0) {
      // Free download
      handleDownload();
      return;
    }

    setPurchasing(true);
    try {
      await marketplaceAPI.purchaseDesign(id!);
      toast.success('Purchase successful! Downloading now...');
      
      // Trigger download
      handleDownload();
      
      // Reload to show purchased state
      loadDesign();
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleDownload = () => {
    if (!design) return;
    
    // Download the .deckforge file
    const link = document.createElement('a');
    link.href = design.file_url;
    link.download = `${design.title}.deckforge`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Design downloaded!');
  };

  const handleOpenInEditor = () => {
    if (!design) return;
    
    // Load design in DeckForge editor
    // This would require implementing a way to load .deckforge files
    toast.info('Opening in editor...', {
      description: 'This feature is coming soon!',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: design?.title,
        text: design?.description || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Design not found</h2>
          <Button onClick={() => navigate('/marketplace')} className="mt-4">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/marketplace')}
            className="mb-4"
          >
            ← Back to Marketplace
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview Image */}
            <div className="aspect-[3/8] bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden relative">
              {design.thumbnail_url ? (
                <img
                  src={design.thumbnail_url}
                  alt={design.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  🎨
                </div>
              )}
              
              {design.featured_until && new Date(design.featured_until) > new Date() && (
                <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  Featured
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{design.title}</h1>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {design.views} views
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {design.downloads} downloads
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {design.favorites} favorites
                </span>
              </div>

              {design.description && (
                <p className="text-muted-foreground mt-4 whitespace-pre-wrap">
                  {design.description}
                </p>
              )}
            </div>

            {/* Tags */}
            {design.tags && design.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {design.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* License Info */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-semibold text-foreground mb-2">License</h3>
              <div className="text-sm text-muted-foreground">
                {design.license_type === 'personal' && (
                  <p>Personal use only. Cannot be used for commercial purposes.</p>
                )}
                {design.license_type === 'commercial' && (
                  <p>Commercial use allowed. Can be used for business purposes.</p>
                )}
                {design.license_type === 'unlimited' && (
                  <p>Unlimited use. Use however you want, including resale.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <div className="border border-border rounded-lg p-6 bg-card sticky top-4">
              {/* Price */}
              <div className="mb-6">
                {design.price === 0 ? (
                  <div className="text-3xl font-bold text-green-600">FREE</div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      ${design.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">USD</span>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  {design.license_type.charAt(0).toUpperCase() + design.license_type.slice(1)} License
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {design.is_purchased ? (
                  <>
                    <Button onClick={handleDownload} className="w-full gap-2" size="lg">
                      <Download className="w-4 h-4" />
                      Download Again
                    </Button>
                    <Button
                      onClick={handleOpenInEditor}
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in Editor
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handlePurchase}
                      className="w-full gap-2"
                      size="lg"
                      disabled={purchasing}
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {design.price === 0 ? (
                            <>
                              <Download className="w-4 h-4" />
                              Download Free
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              Purchase & Download
                            </>
                          )}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleFavorite}
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                    >
                      <Heart
                        className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      {isFavorited ? 'Favorited' : 'Add to Favorites'}
                    </Button>
                  </>
                )}

                <Button
                  onClick={handleShare}
                  variant="ghost"
                  className="w-full gap-2"
                  size="sm"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Designer Info */}
            {design.designer && (
              <div className="border border-border rounded-lg p-4 bg-card">
                <h3 className="text-sm font-semibold text-foreground mb-3">Designer</h3>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-xl font-bold text-primary-foreground">
                    {design.designer.email?.[0]?.toUpperCase() || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {design.designer.email}
                      </span>
                      {design.designer.verified && (
                        <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-medium">
                          Verified
                        </span>
                      )}
                    </div>
                    {design.designer.bio && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {design.designer.bio}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => navigate(`/marketplace/designer/${design.user_id}`)}
                  variant="outline"
                  className="w-full mt-4"
                  size="sm"
                >
                  View Profile
                </Button>
              </div>
            )}

            {/* Category Badge */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-semibold text-foreground mb-2">Category</h3>
              <span className="inline-block px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                {design.category.charAt(0).toUpperCase() + design.category.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
