import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceAPI, MarketplaceDesign, DesignerProfile } from '@/lib/marketplace';
import { DollarSign, Download, Eye, Heart, Edit, Trash2, Plus, TrendingUp, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

export default function DesignerDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [profile, setProfile] = useState<DesignerProfile | null>(null);
  const [designs, setDesigns] = useState<MarketplaceDesign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    loadDashboard();
  }, [isAuthenticated]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Load designer profile
      if (user?.id) {
        try {
          const profileData = await marketplaceAPI.getDesignerProfile(user.id);
          setProfile(profileData);
        } catch (error) {
          // Profile doesn't exist yet, create it
          const newProfile = await marketplaceAPI.updateDesignerProfile({
            bio: '',
            social_links: {},
          });
          setProfile(newProfile);
        }

        // Load designs
        const designsData = await marketplaceAPI.getDesignerDesigns(user.id);
        setDesigns(designsData);
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDesign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    try {
      // Delete design (would need to add this to API)
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/marketplace_designs?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${(await marketplaceAPI as any).supabase.auth.getSession()}`,
        },
      });

      toast.success('Design deleted');
      loadDashboard();
    } catch (error: any) {
      toast.error('Failed to delete design');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalEarnings = profile?.total_earnings || 0;
  const totalSales = profile?.total_sales || 0;
  const totalDesigns = designs.length;
  const totalDownloads = designs.reduce((sum, d) => sum + d.downloads, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Designer Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your designs and track your earnings
              </p>
            </div>
            <Button onClick={() => navigate('/marketplace/upload')} className="gap-2">
              <Plus className="w-4 h-4" />
              Upload New Design
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={DollarSign}
              label="Total Earnings"
              value={`$${totalEarnings.toFixed(2)}`}
              description="80% of sales"
              color="text-green-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Sales"
              value={totalSales.toString()}
              description="Completed purchases"
              color="text-blue-600"
            />
            <StatCard
              icon={Package}
              label="Designs"
              value={totalDesigns.toString()}
              description="Published designs"
              color="text-purple-600"
            />
            <StatCard
              icon={Download}
              label="Downloads"
              value={totalDownloads.toString()}
              description="All-time downloads"
              color="text-orange-600"
            />
          </div>
        </div>
      </div>

      {/* Designs List */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Your Designs</h2>
          <Button
            variant="outline"
            onClick={() => navigate('/marketplace')}
          >
            View Marketplace
          </Button>
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No designs yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Upload your first design to start earning
            </p>
            <Button onClick={() => navigate('/marketplace/upload')}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Design
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {designs.map((design) => (
              <DesignRow
                key={design.id}
                design={design}
                onDelete={() => handleDeleteDesign(design.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  description: string;
  color: string;
}) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function DesignRow({
  design,
  onDelete,
}: {
  design: MarketplaceDesign;
  onDelete: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div
          className="w-24 h-32 bg-gradient-to-br from-muted to-muted/50 rounded overflow-hidden flex-shrink-0 cursor-pointer"
          onClick={() => navigate(`/marketplace/design/${design.id}`)}
        >
          {design.thumbnail_url ? (
            <img
              src={design.thumbnail_url}
              alt={design.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              🎨
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3
                className="font-bold text-foreground truncate cursor-pointer hover:text-primary"
                onClick={() => navigate(`/marketplace/design/${design.id}`)}
              >
                {design.title}
              </h3>
              {design.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {design.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="ml-4 text-right">
              {design.price === 0 ? (
                <span className="text-sm font-bold text-green-600">FREE</span>
              ) : (
                <span className="text-sm font-bold text-foreground">
                  ${design.price.toFixed(2)}
                </span>
              )}
              <div className="text-xs text-muted-foreground">
                {design.license_type}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {design.views}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {design.downloads}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {design.favorites}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
              {design.category}
            </span>
            {!design.published && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 text-[10px] font-medium">
                Draft
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/marketplace/design/${design.id}`)}
              className="gap-1"
            >
              <Eye className="w-3 h-3" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Edit feature coming soon!')}
              className="gap-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="gap-1 text-red-600 hover:text-red-700 hover:border-red-600"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
