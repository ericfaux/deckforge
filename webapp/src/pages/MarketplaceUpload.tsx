import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '@/lib/marketplace';
import { Upload, Image as ImageIcon, DollarSign, Tag, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';

export default function MarketplaceUpload() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [licenseType, setLicenseType] = useState<'personal' | 'commercial' | 'unlimited'>('personal');
  const [category, setCategory] = useState<'street' | 'retro' | 'minimal' | 'edgy' | 'pro'>('street');
  const [tags, setTags] = useState('');
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const handleDesignFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.deckforge')) {
        toast.error('Please upload a .deckforge file');
        return;
      }
      setDesignFile(file);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setThumbnailFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in to upload designs');
      navigate('/auth');
      return;
    }

    // Validation
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!designFile) {
      toast.error('Please upload a design file');
      return;
    }

    if (!thumbnailFile) {
      toast.error('Please upload a thumbnail image');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (priceNum > 100) {
      toast.error('Maximum price is $100');
      return;
    }

    setUploading(true);

    try {
      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await marketplaceAPI.uploadDesign({
        title: title.trim(),
        description: description.trim(),
        file: designFile,
        thumbnail: thumbnailFile,
        price: priceNum,
        license_type: licenseType,
        tags: tagArray,
        category,
      });

      toast.success('Design uploaded successfully!');
      navigate('/marketplace');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload design');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/marketplace')}
            className="mb-4"
          >
            ← Back to Marketplace
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Upload Design</h1>
          <p className="text-muted-foreground mt-1">
            Share your design with the community
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="My Awesome Deck Design"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell people about your design..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {/* Design File Upload */}
          <div className="space-y-2">
            <Label htmlFor="design-file">Design File (.deckforge) *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors">
              <input
                type="file"
                id="design-file"
                accept=".deckforge"
                onChange={handleDesignFileChange}
                className="hidden"
              />
              <label
                htmlFor="design-file"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                {designFile ? (
                  <p className="text-sm text-foreground font-medium">
                    {designFile.name}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-foreground font-medium">
                      Click to upload design file
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      .deckforge file from DeckForge editor
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Preview Image *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors">
              <input
                type="file"
                id="thumbnail"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleThumbnailChange}
                className="hidden"
              />
              <label
                htmlFor="thumbnail"
                className="flex flex-col items-center cursor-pointer"
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                {thumbnailFile ? (
                  <>
                    <p className="text-sm text-foreground font-medium">
                      {thumbnailFile.name}
                    </p>
                    <img
                      src={URL.createObjectURL(thumbnailFile)}
                      alt="Preview"
                      className="mt-4 max-h-48 rounded-lg"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-sm text-foreground font-medium">
                      Click to upload preview image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG or JPG, recommended 750x2450px
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-10 px-3 rounded-md border border-border bg-background"
            >
              <option value="street">Street</option>
              <option value="edgy">Edgy</option>
              <option value="retro">Retro</option>
              <option value="minimal">Minimal</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="graffiti, urban, colorful (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas. Max 10 tags.
            </p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Set to $0.00 for free. You'll receive 80% of paid sales.
            </p>
          </div>

          {/* License Type */}
          <div className="space-y-2">
            <Label>License Type *</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="license"
                  value="personal"
                  checked={licenseType === 'personal'}
                  onChange={(e) => setLicenseType(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">Personal Use</div>
                  <div className="text-sm text-muted-foreground">
                    Buyer can use for personal projects only
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="license"
                  value="commercial"
                  checked={licenseType === 'commercial'}
                  onChange={(e) => setLicenseType(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">Commercial Use</div>
                  <div className="text-sm text-muted-foreground">
                    Buyer can use for commercial projects
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="license"
                  value="unlimited"
                  checked={licenseType === 'unlimited'}
                  onChange={(e) => setLicenseType(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">Unlimited</div>
                  <div className="text-sm text-muted-foreground">
                    Buyer can use however they want, including resale
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="border border-blue-500/20 bg-blue-500/10 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Before uploading:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Ensure your design is original or you have rights to sell it</li>
                <li>No copyrighted logos or trademarks without permission</li>
                <li>Create a high-quality preview image</li>
                <li>Choose appropriate tags for discoverability</li>
              </ul>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={uploading}
              className="flex-1"
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Design
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/marketplace')}
              disabled={uploading}
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
