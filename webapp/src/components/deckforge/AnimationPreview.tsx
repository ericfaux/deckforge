import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, RotateCw, Settings, Loader2 } from 'lucide-react';
import { useDeckForgeStore } from '@/store/deckforge';
import { exportToPNG } from '@/lib/export';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { getDeckSize } from '@/lib/deck-sizes';

// Deck outline SVG path generator (matches WorkbenchStage getDeckPath)
function getDeckPathSvg(w: number, h: number): string {
  const r = w / 2;
  return `M 0 ${r} Q 0 0 ${w / 2} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w / 2} ${h} Q 0 ${h} 0 ${h - r} Z`;
}

interface AnimationPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnimationPreview({ isOpen, onClose }: AnimationPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(2); // degrees per frame
  const [currentRotation, setCurrentRotation] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const animationRef = useRef<number>();

  const objects = useDeckForgeStore(state => state.objects);
  const backgroundColor = useDeckForgeStore(state => state.backgroundColor);
  const backgroundFillType = useDeckForgeStore(state => state.backgroundFillType);
  const backgroundGradient = useDeckForgeStore(state => state.backgroundGradient);
  const deckSizeId = useDeckForgeStore(state => state.deckSizeId);
  const currentDeckSize = getDeckSize(deckSizeId);
  const deckWidth = currentDeckSize.canvasWidth;
  const deckHeight = currentDeckSize.canvasHeight;

  // Display dimensions: scale so the deck is ~350px tall on screen
  const displayH = 380;
  const displayW = displayH * (deckWidth / deckHeight);

  // Determine if the deck background is dark to choose contrasting preview bg
  const bgLuminance = (() => {
    const hex = backgroundColor.replace('#', '');
    if (hex.length < 6) return 0.5;
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  })();
  const isDarkDeck = bgLuminance < 0.4;

  // Capture the canvas design as an image when opened
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const capture = async () => {
      try {
        const blob = await exportToPNG(objects, {
          scale: 4,
          width: deckWidth,
          height: deckHeight,
          backgroundColor,
          backgroundFillType,
          backgroundGradient: backgroundGradient as any,
          includeBackground: true,
        });
        const url = URL.createObjectURL(blob);
        setDesignImage(url);
      } catch {
        setDesignImage(null);
      } finally {
        setLoading(false);
      }
    };
    capture();

    return () => {
      if (designImage) {
        URL.revokeObjectURL(designImage);
      }
    };
  }, [isOpen, objects, deckWidth, deckHeight, backgroundColor, backgroundFillType, backgroundGradient]);

  useEffect(() => {
    if (isOpen && isPlaying) {
      const animate = () => {
        setCurrentRotation((prev) => (prev + rotationSpeed) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, isPlaying, rotationSpeed]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-sm border-b border-white/10 flex items-center px-4 z-10">
        <div className="flex items-center gap-2">
          <RotateCw className="w-5 h-5 text-primary" />
          <h2 className="font-display text-sm uppercase tracking-wider text-white">
            Animation Preview
          </h2>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded ${
              showSettings ? 'bg-white/10' : ''
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded"
            title="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-14 right-4 w-64 bg-card border border-border shadow-xl z-10 p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Rotation Speed</Label>
            <Slider
              value={[rotationSpeed]}
              onValueChange={([val]) => setRotationSpeed(val)}
              min={0.5}
              max={10}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slow</span>
              <span>{rotationSpeed}°/frame</span>
              <span>Fast</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Current Angle</Label>
            <div className="text-lg font-mono text-center">
              {Math.round(currentRotation)}°
            </div>
          </div>

          <button
            onClick={() => setCurrentRotation(0)}
            className="w-full btn-brutal text-xs py-2"
          >
            Reset Rotation
          </button>
        </div>
      )}

      {/* Preview container - contrasting gradient background */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: isDarkDeck
            ? 'linear-gradient(135deg, #2a2a3e 0%, #3d3d5c 30%, #4a4a6a 50%, #3d3d5c 70%, #2a2a3e 100%)'
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 50%, #16213e 70%, #1a1a2e 100%)',
        }}
      >
        {/* Subtle checkerboard pattern overlay for contrast */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%),
              linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%)
            `,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
          }}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Rendering preview...</span>
          </div>
        ) : (
          /* Perspective container - perspective on parent for proper 3D */
          <div style={{ perspective: '1200px', perspectiveOrigin: '50% 50%' }}>
            {/* Rotating element */}
            <div
              style={{
                transform: `rotateY(${currentRotation}deg)`,
                transformStyle: 'preserve-3d',
                transition: isPlaying ? 'none' : 'transform 0.3s ease',
              }}
            >
              {/* Shadow under deck */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  bottom: '-20px',
                  width: `${displayW * 0.8}px`,
                  height: '20px',
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 70%)',
                  filter: 'blur(10px)',
                }}
              />

              {/* Deck preview - captured design image clipped to deck shape */}
              <div
                style={{
                  width: `${displayW}px`,
                  height: `${displayH}px`,
                  position: 'relative',
                  filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.4)) drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                <svg
                  width={displayW}
                  height={displayH}
                  viewBox={`0 0 ${displayW} ${displayH}`}
                >
                  <defs>
                    <clipPath id="anim-deck-clip">
                      <path d={getDeckPathSvg(displayW, displayH)} />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#anim-deck-clip)">
                    {designImage ? (
                      <image
                        href={designImage}
                        x={0}
                        y={0}
                        width={displayW}
                        height={displayH}
                        preserveAspectRatio="none"
                      />
                    ) : (
                      <rect x={0} y={0} width={displayW} height={displayH} fill={backgroundColor} />
                    )}
                  </g>
                  {/* Deck outline */}
                  <path
                    d={getDeckPathSvg(displayW, displayH)}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center space-y-2">
        <p className="text-sm text-white/60 uppercase tracking-wider">
          {isPlaying ? 'Rotating...' : 'Paused'}
        </p>
        <p className="text-xs text-white/40">
          Use settings to adjust speed
        </p>
      </div>
    </div>
  );
}
