import { X, Skull, Flame, Zap, Sword, Radio, Disc3, Music2, Triangle, Hexagon, Circle, Square, Star, Heart, Crown, Anchor, Target, Eye, Hand, Rocket, Ghost, Bug, Cat, Dog, Fish, Bird, Leaf, Sun, Moon, Cloud, Sparkles, Upload, Trash2, Loader2, FileImage } from 'lucide-react';
import { useState, useRef } from 'react';
import { useDeckForgeStore, ToolType, CanvasObject, TextureType } from '@/store/deckforge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DECK_WIDTH, DECK_HEIGHT } from './WorkbenchStage';
import { Slider } from '@/components/ui/slider';
import { assetsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { importSVG, validateSVGFile } from '@/lib/svg-import';

// ============ STICKER SYSTEM ============
const stickerCategories = {
  edgy: [
    { name: 'Skull', icon: Skull },
    { name: 'Flame', icon: Flame },
    { name: 'Zap', icon: Zap },
    { name: 'Sword', icon: Sword },
    { name: 'Ghost', icon: Ghost },
    { name: 'Bug', icon: Bug },
    { name: 'Eye', icon: Eye },
    { name: 'Target', icon: Target },
  ],
  retro: [
    { name: 'Radio', icon: Radio },
    { name: 'Disc', icon: Disc3 },
    { name: 'Music', icon: Music2 },
    { name: 'Rocket', icon: Rocket },
    { name: 'Crown', icon: Crown },
    { name: 'Anchor', icon: Anchor },
    { name: 'Sun', icon: Sun },
    { name: 'Moon', icon: Moon },
  ],
  shapes: [
    { name: 'Triangle', icon: Triangle },
    { name: 'Hexagon', icon: Hexagon },
    { name: 'Circle', icon: Circle },
    { name: 'Square', icon: Square },
    { name: 'Star', icon: Star },
    { name: 'Heart', icon: Heart },
    { name: 'Sparkles', icon: Sparkles },
    { name: 'Hand', icon: Hand },
  ],
  nature: [
    { name: 'Cat', icon: Cat },
    { name: 'Dog', icon: Dog },
    { name: 'Fish', icon: Fish },
    { name: 'Bird', icon: Bird },
    { name: 'Leaf', icon: Leaf },
    { name: 'Cloud', icon: Cloud },
  ],
};

// ============ PATTERN PRESETS ============
const patternPresets = [
  { id: 'checkerboard', name: 'Checkerboard', description: 'Vans style' },
  { id: 'speed-lines', name: 'Speed Lines', description: 'Racing stripes' },
  { id: 'halftone', name: 'Halftone', description: 'Comic book dots' },
  { id: 'noise', name: 'Noise', description: 'Grainy texture' },
  { id: 'tie-dye', name: 'Tie-Dye', description: 'Psychedelic swirl' },
];

// ============ TEXTURE QUERIES ============
const textureQueries = [
  { id: 'concrete', name: 'Concrete', query: 'concrete texture' },
  { id: 'rust', name: 'Rust', query: 'rust metal texture' },
  { id: 'graffiti', name: 'Graffiti', query: 'graffiti wall' },
  { id: 'wood', name: 'Wood Grain', query: 'wood grain texture' },
  { id: 'sticker-bomb', name: 'Sticker Bomb', query: 'sticker collage' },
];

// Legacy assets
const graphicAssets = [
  { id: 'g1', label: 'Circle', shapeType: 'circle' as const },
  { id: 'g2', label: 'Square', shapeType: 'rect' as const },
  { id: 'g4', label: 'Star', shapeType: 'star' as const },
];

// Texture preview thumbnails for finishes
const texturePreviewPatterns: Record<TextureType, string> = {
  'scratched-wood': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect fill='%23222'/%3E%3Cpath d='M5 10 L55 8 M10 25 L50 27 M8 40 L52 38 M15 52 L45 55' stroke='%23444' stroke-width='0.5' fill='none'/%3E%3Cpath d='M20 5 L22 55 M35 8 L37 52 M48 3 L50 57' stroke='%23333' stroke-width='0.3' fill='none'/%3E%3C/svg%3E`,
  'grip-tape-dust': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect fill='%23222'/%3E%3Ccircle cx='10' cy='15' r='1' fill='%23555'/%3E%3Ccircle cx='25' cy='8' r='0.5' fill='%23444'/%3E%3Ccircle cx='45' cy='20' r='1.5' fill='%23555'/%3E%3Ccircle cx='15' cy='35' r='0.8' fill='%23444'/%3E%3Ccircle cx='50' cy='45' r='1' fill='%23555'/%3E%3Ccircle cx='30' cy='50' r='0.6' fill='%23444'/%3E%3Ccircle cx='8' cy='55' r='1.2' fill='%23555'/%3E%3Ccircle cx='40' cy='30' r='0.7' fill='%23444'/%3E%3C/svg%3E`,
  'halftone-dots': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect fill='%23222'/%3E%3Ccircle cx='10' cy='10' r='3' fill='%23444'/%3E%3Ccircle cx='30' cy='10' r='2' fill='%23444'/%3E%3Ccircle cx='50' cy='10' r='3' fill='%23444'/%3E%3Ccircle cx='20' cy='30' r='2.5' fill='%23444'/%3E%3Ccircle cx='40' cy='30' r='2' fill='%23444'/%3E%3Ccircle cx='10' cy='50' r='2' fill='%23444'/%3E%3Ccircle cx='30' cy='50' r='3' fill='%23444'/%3E%3Ccircle cx='50' cy='50' r='2.5' fill='%23444'/%3E%3C/svg%3E`,
};

// ============ STICKERS CONTENT ============
function StickersContent({ onAddObject, deckCenterX, deckCenterY }: {
  onAddObject: (obj: Omit<CanvasObject, 'id'>) => void;
  deckCenterX: number;
  deckCenterY: number;
}) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof stickerCategories>('edgy');

  const addSticker = (iconName: string) => {
    onAddObject({
      type: 'sticker',
      x: deckCenterX - 20,
      y: deckCenterY - 20,
      width: 40,
      height: 40,
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      iconName,
      strokeWidth: 3,
      stroke: '#ffffff',
      solidFill: false,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-muted-foreground">
        Vector stickers from Lucide icons. Click to add as large decals.
      </p>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {(Object.keys(stickerCategories) as Array<keyof typeof stickerCategories>).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-2 py-1 text-[9px] uppercase tracking-wider border transition-colors',
              activeCategory === cat
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div className="grid grid-cols-4 gap-2">
        {stickerCategories[activeCategory].map((sticker) => {
          const Icon = sticker.icon;
          return (
            <button
              key={sticker.name}
              onClick={() => addSticker(sticker.name)}
              className="aspect-square border border-border bg-secondary hover:border-primary transition-colors flex items-center justify-center"
              title={sticker.name}
            >
              <Icon className="w-6 h-6" strokeWidth={3} />
            </button>
          );
        })}
      </div>

      <p className="text-[9px] text-muted-foreground">
        Tip: Use the Inspector to toggle "Solid Fill" and adjust stroke width.
      </p>
    </div>
  );
}

// ============ PATTERNS CONTENT ============
function PatternsContent({ onAddObject, deckCenterX, deckCenterY }: {
  onAddObject: (obj: Omit<CanvasObject, 'id'>) => void;
  deckCenterX: number;
  deckCenterY: number;
}) {
  const [primaryColor, setPrimaryColor] = useState('#ccff00');
  const [secondaryColor, setSecondaryColor] = useState('#000000');
  const [scale, setScale] = useState(20);

  const generatePatternCSS = (patternId: string): string => {
    switch (patternId) {
      case 'checkerboard':
        return `conic-gradient(from 90deg at 1px 1px, ${secondaryColor} 90deg, ${primaryColor} 0) 0 0/${scale}px ${scale}px`;
      case 'speed-lines':
        return `repeating-linear-gradient(90deg, ${primaryColor} 0px, ${primaryColor} ${scale/4}px, ${secondaryColor} ${scale/4}px, ${secondaryColor} ${scale/2}px)`;
      case 'halftone':
        return `radial-gradient(${primaryColor} ${scale/6}px, ${secondaryColor} ${scale/6}px)`;
      case 'noise':
        return secondaryColor;
      case 'tie-dye':
        return `radial-gradient(ellipse at 30% 30%, ${primaryColor}, transparent 50%), radial-gradient(ellipse at 70% 70%, ${secondaryColor}, transparent 50%), ${primaryColor}`;
      default:
        return primaryColor;
    }
  };

  const addPattern = (patternId: string) => {
    // Add as a full-deck background shape
    onAddObject({
      type: 'shape',
      x: 0,
      y: 0,
      width: DECK_WIDTH,
      height: DECK_HEIGHT,
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      shapeType: 'rect',
      fill: primaryColor,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-muted-foreground">
        Procedural patterns using CSS gradients. Infinite color combinations.
      </p>

      {/* Color pickers */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Primary</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-8 h-8 border border-border cursor-pointer bg-transparent"
            />
            <span className="text-[9px] font-mono">{primaryColor}</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Secondary</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-8 h-8 border border-border cursor-pointer bg-transparent"
            />
            <span className="text-[9px] font-mono">{secondaryColor}</span>
          </div>
        </div>
      </div>

      {/* Scale slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Scale</span>
          <span className="text-[10px] font-mono">{scale}px</span>
        </div>
        <Slider
          value={[scale]}
          onValueChange={([v]) => setScale(v)}
          min={5}
          max={50}
          step={5}
        />
      </div>

      {/* Pattern presets */}
      <div className="space-y-2">
        {patternPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => addPattern(preset.id)}
            className="w-full border border-border hover:border-primary transition-colors p-2 flex items-center gap-3"
          >
            <div
              className="w-10 h-10 border border-border flex-shrink-0"
              style={{ background: generatePatternCSS(preset.id), backgroundSize: `${scale}px ${scale}px` }}
            />
            <div className="text-left">
              <span className="text-xs font-mono block">{preset.name}</span>
              <span className="text-[9px] text-muted-foreground">{preset.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ TEXTURES CONTENT ============
function TexturesContent({ onAddObject, deckCenterX, deckCenterY }: {
  onAddObject: (obj: Omit<CanvasObject, 'id'>) => void;
  deckCenterX: number;
  deckCenterY: number;
}) {
  const addTexture = (query: string, index: number) => {
    // Use picsum for placeholder images
    const imageUrl = `https://picsum.photos/seed/${query.replace(/\s/g, '')}-${index}/200/300`;

    onAddObject({
      type: 'texture',
      x: 0,
      y: 0,
      width: DECK_WIDTH,
      height: DECK_HEIGHT,
      rotation: 0,
      opacity: 0.6,
      scaleX: 1,
      scaleY: 1,
      textureUrl: imageUrl,
      blendMode: 'multiply',
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-muted-foreground">
        Realistic textures applied with blend modes. Click to add as overlay.
      </p>

      {textureQueries.map((category) => (
        <div key={category.id} className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {category.name}
          </span>
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => addTexture(category.query, i)}
                className="aspect-square border border-border hover:border-primary transition-colors overflow-hidden bg-secondary"
              >
                <img
                  src={`https://picsum.photos/seed/${category.query.replace(/\s/g, '')}-${i}/100/100`}
                  alt={category.name}
                  className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      ))}

      <p className="text-[9px] text-muted-foreground">
        Textures use multiply blend by default. Change in Inspector.
      </p>
    </div>
  );
}

// ============ LINES CONTENT ============
const linePresets = [
  { id: 'straight', name: 'Straight', description: 'Clean straight line', icon: '─' },
  { id: 'curved', name: 'Curved', description: 'Smooth bezier curve', icon: '⌒' },
  { id: 'zigzag', name: 'Zigzag', description: 'Sharp angles', icon: '⚡' },
  { id: 'dashed', name: 'Dashed', description: 'Dotted line', icon: '┄' },
];

function LinesContent({ onAddObject, deckCenterX, deckCenterY }: {
  onAddObject: (obj: Omit<CanvasObject, 'id'>) => void;
  deckCenterX: number;
  deckCenterY: number;
}) {
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(3);

  const addLine = (lineType: 'straight' | 'curved' | 'zigzag' | 'dashed') => {
    onAddObject({
      type: 'line',
      x: deckCenterX - 30,
      y: deckCenterY,
      width: 60,
      height: 60,
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      lineType,
      lineEndX: 60,
      lineEndY: lineType === 'curved' ? -30 : 0,
      lineCurve: lineType === 'curved' ? 50 : 0,
      strokeWidth,
      stroke: strokeColor,
      lineCapStyle: 'round',
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-muted-foreground">
        Draw lines and curves. Click to add, then drag endpoints in canvas.
      </p>

      {/* Stroke Color */}
      <div className="space-y-2">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Stroke Color</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-8 h-8 border border-border cursor-pointer bg-transparent"
          />
          <div className="flex gap-1">
            {['#ffffff', '#ccff00', '#ff6600', '#00ffff', '#ff00ff', '#000000'].map((color) => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                className={`w-5 h-5 border ${
                  strokeColor === color ? 'border-primary' : 'border-border'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Stroke Width</span>
          <span className="text-[10px] font-mono">{strokeWidth}px</span>
        </div>
        <Slider
          value={[strokeWidth]}
          onValueChange={([v]) => setStrokeWidth(v)}
          min={1}
          max={12}
          step={1}
        />
      </div>

      {/* Line Types */}
      <div className="space-y-2">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Line Types</span>
        <div className="grid grid-cols-2 gap-2">
          {linePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => addLine(preset.id as 'straight' | 'curved' | 'zigzag' | 'dashed')}
              className="border border-border hover:border-primary transition-colors p-3 flex flex-col items-center gap-1"
            >
              <span className="text-2xl leading-none" style={{ color: strokeColor }}>{preset.icon}</span>
              <span className="text-[9px] font-mono">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground">
        Tip: Use Inspector to adjust curve amount and endpoints.
      </p>
    </div>
  );
}

// ============ UPLOADS CONTENT ============
function UploadsContent({ onAddObject, deckCenterX, deckCenterY }: {
  onAddObject: (obj: Omit<CanvasObject, 'id'>) => void;
  deckCenterX: number;
  deckCenterY: number;
}) {
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuthStore();

  // Load user assets on mount
  useState(() => {
    if (isAuthenticated) {
      loadAssets();
    }
  });

  const loadAssets = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const data = await assetsAPI.list();
      setAssets(data.assets || []);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Check if it's an SVG file
        if (validateSVGFile(file)) {
          // Import SVG and add objects directly to canvas
          const objects = await importSVG(file);
          objects.forEach(obj => onAddObject(obj));
        } else {
          // Regular image upload
          const { url, width, height } = await assetsAPI.upload(file);
          // Add to assets list
          await loadAssets();
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addAssetToCanvas = (asset: any) => {
    const maxDim = 120;
    const scale = Math.min(maxDim / asset.width, maxDim / asset.height);
    const width = asset.width * scale;
    const height = asset.height * scale;

    onAddObject({
      type: 'image',
      x: deckCenterX - width / 2,
      y: deckCenterY - height / 2,
      width: asset.width,
      height: asset.height,
      rotation: 0,
      opacity: 1,
      scaleX: scale,
      scaleY: scale,
      src: asset.file_url,
    });
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    
    try {
      await assetsAPI.delete(id);
      await loadAssets();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-xs text-muted-foreground">
          Login to upload custom images
        </p>
        <Button size="sm" onClick={() => window.location.href = '/auth'}>
          Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.svg"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border p-6 text-center hover:border-primary transition-colors cursor-pointer"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Uploading...
            </span>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
              Upload Images
            </span>
            <span className="text-xs text-muted-foreground">
              PNG, JPG, SVG
            </span>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground" />
        </div>
      ) : assets.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="relative group border border-border hover:border-primary transition-colors overflow-hidden aspect-square cursor-pointer"
              onClick={() => addAssetToCanvas(asset)}
            >
              <img
                src={asset.file_url}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAsset(asset.id);
                }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground py-4">
          No uploads yet. Click above to upload!
        </p>
      )}
    </div>
  );
}

// ============ FINISHES CONTENT ============
function FinishesContent() {
  const { textureOverlays, toggleTexture, updateTexture } = useDeckForgeStore();

  return (
    <div className="space-y-4">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
        Texture Overlays
      </span>
      <p className="text-[10px] text-muted-foreground">
        Add realistic print textures that blend over your design.
      </p>

      {textureOverlays.map((texture) => (
        <div
          key={texture.id}
          className={cn(
            'border p-3 space-y-3 transition-colors',
            texture.enabled ? 'border-primary bg-secondary/50' : 'border-border'
          )}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleTexture(texture.id)}
              className={cn(
                'w-12 h-12 border flex-shrink-0 bg-cover bg-center',
                texture.enabled ? 'border-primary' : 'border-border'
              )}
              style={{ backgroundImage: `url("${texturePreviewPatterns[texture.id]}")` }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">{texture.name}</span>
                <button
                  onClick={() => toggleTexture(texture.id)}
                  className={cn(
                    'w-8 h-4 rounded-full transition-colors relative',
                    texture.enabled ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                      texture.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                {texture.blendMode}
              </span>
            </div>
          </div>

          {texture.enabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  Opacity
                </span>
                <span className="font-mono text-[10px]">
                  {Math.round(texture.opacity * 100)}%
                </span>
              </div>
              <Slider
                value={[texture.opacity * 100]}
                onValueChange={([val]) => updateTexture(texture.id, { opacity: val / 100 })}
                min={5}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============ DRAWER CONTENT ============
interface DrawerContentProps {
  tool: ToolType;
  onAddObject: (obj: Omit<CanvasObject, 'id'>) => void;
  deckCenterX: number;
  deckCenterY: number;
}

function DrawerContent({ tool, onAddObject, deckCenterX, deckCenterY }: DrawerContentProps) {
  const handleDragStart = (e: React.DragEvent, data: Record<string, unknown>) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const addText = () => {
    onAddObject({
      type: 'text',
      x: deckCenterX - 25,
      y: deckCenterY,
      width: 50,
      height: 24,
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      text: 'SKATE',
      fontSize: 18,
      fontFamily: 'Oswald',
      fill: '#ffffff',
    });
  };

  const addShape = (shapeType: 'rect' | 'circle' | 'star') => {
    onAddObject({
      type: 'shape',
      x: deckCenterX - 15,
      y: deckCenterY - 15,
      width: 30,
      height: 30,
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      shapeType,
      fill: '#ffffff',
    });
  };

  // New tools
  if (tool === 'stickers') {
    return <StickersContent onAddObject={onAddObject} deckCenterX={deckCenterX} deckCenterY={deckCenterY} />;
  }

  if (tool === 'patterns') {
    return <PatternsContent onAddObject={onAddObject} deckCenterX={deckCenterX} deckCenterY={deckCenterY} />;
  }

  if (tool === 'textures') {
    return <TexturesContent onAddObject={onAddObject} deckCenterX={deckCenterX} deckCenterY={deckCenterY} />;
  }

  if (tool === 'lines') {
    return <LinesContent onAddObject={onAddObject} deckCenterX={deckCenterX} deckCenterY={deckCenterY} />;
  }

  if (tool === 'graphics') {
    return (
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Click to add or drag to canvas
        </span>
        <div className="grid grid-cols-3 gap-2">
          {graphicAssets.map((asset) => (
            <button
              key={asset.id}
              draggable
              onDragStart={(e) => handleDragStart(e, {
                type: 'shape',
                shapeType: asset.shapeType,
                width: 30,
                height: 30,
                fill: '#ffffff',
              })}
              onClick={() => addShape(asset.shapeType)}
              className="aspect-square border border-border bg-secondary hover:border-primary transition-colors flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
              {asset.shapeType === 'circle' && <div className="w-8 h-8 rounded-full bg-white" />}
              {asset.shapeType === 'rect' && <div className="w-8 h-8 bg-white" />}
              {asset.shapeType === 'star' && <span className="text-white text-2xl">★</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (tool === 'pen') {
    const addPath = () => {
      // Start with a simple curved path
      onAddObject({
        type: 'path',
        x: deckCenterX - 30,
        y: deckCenterY - 30,
        width: 60,
        height: 60,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        stroke: '#ffffff',
        strokeWidth: 3,
        solidFill: false,
        pathPoints: [
          { x: 0, y: 30 },
          { x: 30, y: 0, cp1x: 10, cp1y: 30, cp2x: 20, cp2y: 0 },
          { x: 60, y: 30, cp1x: 40, cp1y: 0, cp2x: 50, cp2y: 30 },
        ],
        pathClosed: false,
      });
    };

    const addClosedPath = () => {
      // Triangle-ish closed path
      onAddObject({
        type: 'path',
        x: deckCenterX - 25,
        y: deckCenterY - 25,
        width: 50,
        height: 50,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        fill: '#ccff00',
        stroke: '#ffffff',
        strokeWidth: 2,
        solidFill: true,
        pathPoints: [
          { x: 25, y: 0 },
          { x: 50, y: 43, cp1x: 50, cp1y: 15, cp2x: 50, cp2y: 28 },
          { x: 0, y: 43, cp1x: 0, cp1y: 28, cp2x: 0, cp2y: 15 },
        ],
        pathClosed: true,
      });
    };

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Quick Start
          </span>
          <button
            onClick={addPath}
            className="w-full btn-brutal text-left"
          >
            + Curved Path
          </button>
          <button
            onClick={addClosedPath}
            className="w-full btn-brutal text-left"
          >
            + Closed Shape
          </button>
        </div>

        <div className="space-y-2 pt-3 border-t border-border">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Instructions
          </span>
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Select a path</strong> to see anchor points (blue) and control handles (orange).</p>
            <p><strong>Drag</strong> the path to move it around the canvas.</p>
            <p><strong>Edit points</strong> in the Inspector panel to add/remove anchors or adjust curves.</p>
            <p>Use <strong>Transform tools</strong> to scale and rotate paths.</p>
          </div>
        </div>
      </div>
    );
  }

  if (tool === 'text') {
    return (
      <div className="space-y-3">
        <button
          onClick={addText}
          className="w-full btn-brutal text-left"
        >
          + Add Text
        </button>
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Font Styles
          </span>
          {['BOLD', 'ITALIC', 'REGULAR'].map((style) => (
            <button
              key={style}
              onClick={addText}
              className="w-full border border-border bg-secondary px-3 py-2 text-left hover:border-primary transition-colors"
            >
              <span className={cn(
                'font-display text-lg',
                style === 'BOLD' && 'font-bold',
                style === 'ITALIC' && 'italic'
              )}>
                {style}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (tool === 'uploads') {
    return <UploadsContent onAddObject={onAddObject} deckCenterX={deckCenterX} deckCenterY={deckCenterY} />;
  }

  if (tool === 'finishes') {
    return <FinishesContent />;
  }

  // Fallback for templates/background (now hidden)
  return (
    <div className="text-center py-8">
      <span className="text-[10px] text-muted-foreground">
        Use Stickers, Patterns, or Textures for assets.
      </span>
    </div>
  );
}

const toolLabels: Record<ToolType, string> = {
  templates: 'Templates',
  graphics: 'Graphics',
  text: 'Text',
  uploads: 'Uploads',
  background: 'Background',
  finishes: 'Finishes',
  stickers: 'Stickers',
  patterns: 'Patterns',
  textures: 'Textures',
  lines: 'Lines',
  pen: 'Pen Tool',
};

export function ToolDrawer() {
  const { activeTool, drawerOpen, toggleDrawer, addObject } = useDeckForgeStore();

  // Hide drawer for pen tool (uses overlay interface instead)
  if (!drawerOpen || !activeTool || activeTool === 'pen') return null;

  const deckCenterX = DECK_WIDTH / 2;
  const deckCenterY = DECK_HEIGHT / 2;

  return (
    <div className="w-56 bg-card border-r border-border h-full flex flex-col">
      <div className="flex items-center justify-between py-3 px-3 border-b border-border">
        <span className="font-display text-xs uppercase tracking-widest">
          {toolLabels[activeTool]}
        </span>
        <button
          onClick={() => toggleDrawer(false)}
          className="w-6 h-6 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <ScrollArea className="flex-1 p-3">
        <DrawerContent
          tool={activeTool}
          onAddObject={addObject}
          deckCenterX={deckCenterX}
          deckCenterY={deckCenterY}
        />
      </ScrollArea>
    </div>
  );
}
