import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceAPI, MarketplaceDesign } from '@/lib/marketplace';
import { Search, Heart, Download, DollarSign, Filter, TrendingUp, Clock, Sparkles, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { toast } from 'sonner';

export default function Marketplace() {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<MarketplaceDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('trending');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');

  useEffect(() => {
    loadDesigns();
  }, [category, sortBy, priceFilter]);

  const loadDesigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        category: category !== 'all' ? category : undefined,
        sortBy,
        limit: 50,
      };

      if (priceFilter === 'free') {
        params.priceMin = 0;
        params.priceMax = 0;
      } else if (priceFilter === 'paid') {
        params.priceMin = 0.01;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const data = await marketplaceAPI.browseDesigns(params);
      setDesigns(data);
    } catch (error: any) {
      console.error('Failed to load designs:', error);
      setError(error.message || 'Failed to load marketplace designs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDesigns();
  };

  const categories = [
    { value: 'all', label: 'All', icon: '🎨' },
    { value: 'street', label: 'Street', icon: '✍️' },
    { value: 'edgy', label: 'Edgy', icon: '💀' },
    { value: 'retro', label: 'Retro', icon: '📼' },
    { value: 'minimal', label: 'Minimal', icon: '⚪' },
    { value: 'pro', label: 'Pro', icon: '🔺' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Design Marketplace</h1>
              <p className="text-muted-foreground mt-1">
                Discover and download custom fingerboard graphics
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/marketplace/dashboard')}
                variant="outline"
                className="gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Dashboard
              </Button>
              <Button onClick={() => navigate('/marketplace/upload')} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Upload Design
              </Button>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    category === cat.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg text-sm bg-secondary border-border"
              >
                <option value="trending">🔥 Trending</option>
                <option value="newest">🆕 Newest</option>
                <option value="popular">⭐ Popular</option>
              </select>
            </div>

            {/* Price Filter */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg text-sm bg-secondary border-border"
            >
              <option value="all">All Prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Designs Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <Skeleton className="aspect-[3/8] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center gap-3 pt-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-6 w-16 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load designs"
            message={error}
            onRetry={loadDesigns}
          />
        ) : designs.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No designs found"
            description={searchQuery ? `No results for "${searchQuery}". Try adjusting your search or filters.` : 'No designs available yet. Check back soon!'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((design) => (
              <DesignCard key={design.id} design={design} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DesignCard({ design }: { design: MarketplaceDesign }) {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(design.is_favorited || false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const favorited = await marketplaceAPI.toggleFavorite(design.id);
      setIsFavorited(favorited);
      toast.success(favorited ? 'Added to favorites' : 'Removed from favorites');
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle favorite');
    }
  };

  return (
    <div
      onClick={() => navigate(`/marketplace/design/${design.id}`)}
      className="group border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-card"
    >
      {/* Thumbnail */}
      <div className="aspect-[3/8] bg-gradient-to-br from-muted to-muted/50 relative">
        {design.thumbnail_url ? (
          <img
            src={design.thumbnail_url}
            alt={design.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🎨
          </div>
        )}
        
        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-foreground'}`}
          />
        </button>

        {/* Featured badge */}
        {design.featured_until && new Date(design.featured_until) > new Date() && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
            <Sparkles className="w-3 h-3" />
            Featured
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
          {design.title}
        </h3>
        
        {design.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {design.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {design.downloads}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {design.favorites}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          {design.price === 0 ? (
            <span className="text-sm font-bold text-green-600">FREE</span>
          ) : (
            <span className="text-sm font-bold text-foreground flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {design.price.toFixed(2)}
            </span>
          )}
          
          {design.designer && design.designer.verified && (
            <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full font-medium">
              Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
