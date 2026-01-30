import { useState } from 'react';
import { Upload, X, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { fontsApi, Font, loadFont } from '@/lib/fonts';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface FontUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFontUploaded?: (font: Font) => void;
}

export function FontUploadModal({ isOpen, onClose, onFontUploaded }: FontUploadModalProps) {
  const [fontName, setFontName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userFonts, setUserFonts] = useState<Font[]>([]);
  const [isLoadingFonts, setIsLoadingFonts] = useState(false);

  // Load user's fonts when modal opens
  useState(() => {
    if (isOpen) {
      loadUserFonts();
    }
  });

  const loadUserFonts = async () => {
    setIsLoadingFonts(true);
    try {
      const fonts = await fontsApi.list();
      setUserFonts(fonts);
    } catch (error) {
      console.error('Failed to load fonts:', error);
    } finally {
      setIsLoadingFonts(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      toast({
        title: 'Invalid file type',
        description: 'Only .ttf, .otf, .woff, and .woff2 files are supported.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    
    // Auto-fill font name from filename
    if (!fontName) {
      const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setFontName(name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fontName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a file and enter a font name.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (in reality, we'd track actual upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const font = await fontsApi.uploadFont(selectedFile, fontName);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Load the font immediately
      await loadFont(font);

      toast({
        title: '✓ Font uploaded',
        description: `${fontName} is now available in your font library.`,
      });

      // Reset form
      setFontName('');
      setSelectedFile(null);
      setUploadProgress(0);

      // Refresh font list
      await loadUserFonts();

      // Notify parent
      onFontUploaded?.(font);

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error('Font upload failed:', error);
      toast({
        title: 'Upload failed',
        description: error.response?.data?.error || 'Failed to upload font. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fontId: string) => {
    if (!confirm('Delete this font? This action cannot be undone.')) return;

    try {
      await fontsApi.delete(fontId);
      toast({
        title: '✓ Font deleted',
        description: 'Font has been removed from your library.',
      });
      await loadUserFonts();
    } catch (error) {
      console.error('Font deletion failed:', error);
      toast({
        title: 'Deletion failed',
        description: 'Failed to delete font. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border-2 border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto modal-content">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-display text-lg uppercase tracking-wider">Custom Fonts</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="py-2 border-b border-border">
              <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                Upload New Font
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Font Name
                </Label>
                <Input
                  type="text"
                  value={fontName}
                  onChange={(e) => setFontName(e.target.value)}
                  placeholder="e.g., Helvetica Bold"
                  className="h-9 text-sm bg-secondary border-border"
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Font File (.ttf, .otf, .woff, .woff2)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={handleFileSelect}
                    className="h-9 text-sm bg-secondary border-border flex-1"
                    disabled={isUploading}
                  />
                  {selectedFile && (
                    <span className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="w-full h-2 bg-secondary border border-border overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || !fontName.trim() || isUploading}
                className="w-full bg-accent text-accent-foreground font-display text-sm uppercase tracking-wider py-2.5 px-4 border border-accent hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : uploadProgress === 100 ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Uploaded!
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Font
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Font Library */}
          <div className="space-y-4">
            <div className="py-2 border-b border-border">
              <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                Your Fonts ({userFonts.length})
              </span>
            </div>

            {isLoadingFonts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : userFonts.length === 0 ? (
              <div className="text-center py-12 animate-in fade-in-50 duration-500">
                <div className="relative group inline-block mb-4">
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-all duration-500" />
                  
                  {/* Icon with gradient background */}
                  <div className="relative rounded-full bg-gradient-to-br from-muted/80 to-muted/40 p-4">
                    <Type className="w-8 h-8 text-muted-foreground/70 group-hover:text-primary/80 transition-colors duration-300" />
                  </div>
                </div>
                
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  No Custom Fonts Yet
                </p>
                <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
                  Upload your own fonts to use in your designs. Click "Upload Font" above to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {userFonts.map((font) => (
                  <div
                    key={font.id}
                    className="flex items-center justify-between p-3 bg-secondary border border-border hover:bg-secondary/80 transition-colors"
                  >
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium"
                        style={{ fontFamily: font.font_family }}
                      >
                        {font.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {font.file_type} • {font.file_size ? (font.file_size / 1024).toFixed(1) : '?'} KB
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(font.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2"
                      title="Delete font"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
