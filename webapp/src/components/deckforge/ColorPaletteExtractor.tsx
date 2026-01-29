import { useState } from 'react';
import { extractColorsFromImage } from '@/lib/colorExtractor';
import { Button } from '@/components/ui/button';
import { Upload, Palette, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ColorPaletteExtractorProps {
  onColorSelect?: (color: string) => void;
  onPaletteExtracted?: (colors: string[]) => void;
}

export function ColorPaletteExtractor({ onColorSelect, onPaletteExtracted }: ColorPaletteExtractorProps) {
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsExtracting(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setImagePreview(dataUrl);
        
        // Extract colors
        try {
          const colors = await extractColorsFromImage(dataUrl, 6);
          setExtractedColors(colors);
          onPaletteExtracted?.(colors);
          toast.success(`Extracted ${colors.length} colors from image`);
        } catch (err) {
          console.error('Color extraction failed:', err);
          toast.error('Failed to extract colors');
        } finally {
          setIsExtracting(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Failed to process image');
      setIsExtracting(false);
    }
  };

  const copyColorToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
    toast.success(`Copied ${color} to clipboard`);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="color-extract-upload"
        />
        <label htmlFor="color-extract-upload" className="cursor-pointer block">
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-300">
              Upload an image to extract colors
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, or GIF
            </p>
          </div>
        </label>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative rounded-lg overflow-hidden">
          <img 
            src={imagePreview} 
            alt="Color extraction source" 
            className="w-full h-40 object-cover"
          />
          {isExtracting && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white flex items-center gap-2">
                <Palette className="w-5 h-5 animate-spin" />
                <span className="text-sm">Extracting colors...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extracted Colors */}
      {extractedColors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Extracted Palette</h4>
            <span className="text-xs text-gray-400">{extractedColors.length} colors</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {extractedColors.map((color, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onColorSelect?.(color);
                  toast.success(`Selected ${color}`);
                }}
                className="group relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-white transition-all"
                style={{ backgroundColor: color }}
                title={color}
              >
                {/* Color info overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {color}
                  </span>
                </div>
                
                {/* Copy button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyColorToClipboard(color);
                  }}
                  className="absolute top-1 right-1 bg-black/50 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copiedColor === color ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-white" />
                  )}
                </button>
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 text-xs">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const paletteText = extractedColors.join(', ');
                navigator.clipboard.writeText(paletteText);
                toast.success('Copied all colors to clipboard');
              }}
              className="flex-1"
            >
              Copy All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setExtractedColors([]);
                setImagePreview(null);
              }}
              className="flex-1"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
