import { useState, useEffect } from 'react';
import { X, Save, Trash2, Star, Palette, Type, Loader2 } from 'lucide-react';
import { brandKitsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface BrandKit {
  id: string;
  name: string;
  description: string | null;
  colors: string[];
  fonts: any[];
  is_default: boolean;
  created_at: string;
}

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyKit?: (kit: BrandKit) => void;
  currentColors?: string[];
  currentFonts?: any[];
}

export function BrandKitModal({ 
  isOpen, 
  onClose, 
  onApplyKit,
  currentColors = [],
  currentFonts = []
}: BrandKitModalProps) {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKitName, setNewKitName] = useState('');
  const [newKitDescription, setNewKitDescription] = useState('');
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadKits();
    }
  }, [isOpen, isAuthenticated]);

  const loadKits = async () => {
    setIsLoading(true);
    try {
      const data = await brandKitsAPI.list();
      setKits(data.kits || []);
    } catch (err) {
      console.error('Failed to load brand kits:', err);
      toast.error('Failed to load brand kits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKit = async () => {
    if (!newKitName.trim()) {
      toast.error('Please enter a name for your brand kit');
      return;
    }

    if (currentColors.length === 0) {
      toast.error('Please add some colors to your canvas first');
      return;
    }

    setIsSaving(true);
    try {
      await brandKitsAPI.create({
        name: newKitName.trim(),
        description: newKitDescription.trim() || undefined,
        colors: currentColors,
        fonts: currentFonts,
      });

      toast.success('Brand kit saved!');
      setNewKitName('');
      setNewKitDescription('');
      setIsCreating(false);
      await loadKits();
    } catch (err) {
      console.error('Failed to create brand kit:', err);
      toast.error('Failed to save brand kit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await brandKitsAPI.update(id, { is_default: true });
      toast.success('Default kit updated');
      await loadKits();
    } catch (err) {
      console.error('Failed to set default:', err);
      toast.error('Failed to set default');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand kit?')) return;

    try {
      await brandKitsAPI.delete(id);
      toast.success('Brand kit deleted');
      await loadKits();
    } catch (err) {
      console.error('Failed to delete brand kit:', err);
      toast.error('Failed to delete brand kit');
    }
  };

  const handleApplyKit = (kit: BrandKit) => {
    if (onApplyKit) {
      onApplyKit(kit);
      toast.success(`Applied "${kit.name}" brand kit`);
      onClose();
    }
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-card border border-border w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg uppercase tracking-widest">Brand Kits</h2>
            <button onClick={onClose} className="p-1 hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Login to save and manage brand kits
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg uppercase tracking-widest">Brand Kits</h2>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 font-mono">PRO</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Create New Kit */}
          {!isCreating ? (
            <Button
              onClick={() => setIsCreating(true)}
              variant="outline"
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Current Colors as Brand Kit
            </Button>
          ) : (
            <div className="border border-border p-4 space-y-3">
              <h3 className="font-mono text-sm uppercase tracking-wider">Create New Brand Kit</h3>
              <Input
                placeholder="Kit name (e.g., Sunset Vibes)"
                value={newKitName}
                onChange={(e) => setNewKitName(e.target.value)}
                className="font-mono"
              />
              <Textarea
                placeholder="Description (optional)"
                value={newKitDescription}
                onChange={(e) => setNewKitDescription(e.target.value)}
                className="font-mono text-xs"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateKit}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Kit
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false);
                    setNewKitName('');
                    setNewKitDescription('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Saved Kits */}
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : kits.length === 0 ? (
            <div className="text-center py-12 animate-in fade-in-50 duration-500">
              <div className="relative group inline-block mb-4">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-all duration-500" />
                
                {/* Icon with gradient background */}
                <div className="relative rounded-full bg-gradient-to-br from-muted/80 to-muted/40 p-4">
                  <Palette className="w-8 h-8 text-muted-foreground/70 group-hover:text-primary/80 transition-colors duration-300" />
                </div>
              </div>
              
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                No Brand Kits Yet
              </p>
              <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
                Save your colors and fonts as a brand kit. Create your first one by clicking "Save as Brand Kit" above!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-mono text-sm uppercase tracking-wider">Your Brand Kits</h3>
              {kits.map((kit) => (
                <div
                  key={kit.id}
                  className="border border-border p-4 space-y-3 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-mono font-semibold">{kit.name}</h4>
                        {kit.is_default && (
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        )}
                      </div>
                      {kit.description && (
                        <p className="text-xs text-muted-foreground mt-1">{kit.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!kit.is_default && (
                        <button
                          onClick={() => handleSetDefault(kit.id)}
                          className="p-1.5 hover:bg-secondary transition-colors"
                          title="Set as default"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(kit.id)}
                        className="p-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        title="Delete kit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Color Palette */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Palette className="w-3 h-3" />
                      <span>{kit.colors.length} colors</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {kit.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 border border-border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Fonts (if any) */}
                  {kit.fonts && kit.fonts.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Type className="w-3 h-3" />
                        <span>{kit.fonts.length} fonts</span>
                      </div>
                    </div>
                  )}

                  {/* Apply Button */}
                  <Button
                    onClick={() => handleApplyKit(kit)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Apply to Canvas
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
