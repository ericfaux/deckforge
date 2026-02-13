import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, RotateCw, Sun, TreePine, Hammer, Moon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useDeckForgeStore } from '@/store/deckforge';
import { getDeckSize } from '@/lib/deck-sizes';
import { exportToPNG } from '@/lib/export';

interface DeckMockupPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

type MockupAngle = 'top-down' | 'three-quarter' | 'side' | 'hand-held' | 'on-surface';
type Environment = 'studio' | 'concrete' | 'wood' | 'dark';

const ANGLES: { id: MockupAngle; label: string; description: string }[] = [
  { id: 'top-down', label: 'Top Down', description: 'Print accuracy view' },
  { id: 'three-quarter', label: '3/4 Angle', description: 'Product presentation' },
  { id: 'side', label: 'Side Profile', description: 'Kick & concave shape' },
  { id: 'hand-held', label: 'Hand Held', description: 'Riding perspective' },
  { id: 'on-surface', label: 'On Surface', description: 'Display view' },
];

const ENVIRONMENTS: { id: Environment; label: string; icon: typeof Sun }[] = [
  { id: 'studio', label: 'Studio', icon: Sun },
  { id: 'concrete', label: 'Concrete', icon: TreePine },
  { id: 'wood', label: 'Wood Table', icon: Hammer },
  { id: 'dark', label: 'Dark', icon: Moon },
];

// Deck outline SVG path generator (matches WorkbenchStage getDeckPath)
function getDeckPathSvg(w: number, h: number): string {
  const r = w / 2;
  return `M 0 ${r} Q 0 0 ${w / 2} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w / 2} ${h} Q 0 ${h} 0 ${h - r} Z`;
}

export function DeckMockupPreview({ isOpen, onClose }: DeckMockupPreviewProps) {
  const [angle, setAngle] = useState<MockupAngle>('three-quarter');
  const [environment, setEnvironment] = useState<Environment>('studio');
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const objects = useDeckForgeStore(state => state.objects);
  const deckSizeId = useDeckForgeStore(state => state.deckSizeId);
  const backgroundColor = useDeckForgeStore(state => state.backgroundColor);
  const backgroundFillType = useDeckForgeStore(state => state.backgroundFillType);
  const backgroundGradient = useDeckForgeStore(state => state.backgroundGradient);
  const currentDeckSize = getDeckSize(deckSizeId);
  const deckW = currentDeckSize.canvasWidth;
  const deckH = currentDeckSize.canvasHeight;

  // Capture the canvas design as an image when opened
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const capture = async () => {
      try {
        const blob = await exportToPNG(objects, {
          scale: 4,
          width: deckW,
          height: deckH,
          backgroundColor,
          backgroundFillType,
          backgroundGradient: backgroundGradient as any,
          includeBackground: true,
        });
        const url = URL.createObjectURL(blob);
        setDesignImage(url);
      } catch {
        // Fallback: use a blank canvas
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
  }, [isOpen, objects, deckW, deckH, backgroundColor, backgroundFillType, backgroundGradient]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setAngle(prev => {
          const idx = ANGLES.findIndex(a => a.id === prev);
          return ANGLES[(idx + 1) % ANGLES.length].id;
        });
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setAngle(prev => {
          const idx = ANGLES.findIndex(a => a.id === prev);
          return ANGLES[(idx - 1 + ANGLES.length) % ANGLES.length].id;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const cycleAngle = useCallback((dir: 1 | -1) => {
    setAngle(prev => {
      const idx = ANGLES.findIndex(a => a.id === prev);
      return ANGLES[(idx + dir + ANGLES.length) % ANGLES.length].id;
    });
  }, []);

  if (!isOpen) return null;

  // CSS transforms for each angle
  const getTransform = (): string => {
    switch (angle) {
      case 'top-down':
        return 'perspective(1200px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
      case 'three-quarter':
        return 'perspective(900px) rotateX(18deg) rotateY(-28deg) rotateZ(2deg)';
      case 'side':
        return 'perspective(800px) rotateX(75deg) rotateY(0deg) rotateZ(0deg)';
      case 'hand-held':
        return 'perspective(700px) rotateX(30deg) rotateY(-15deg) rotateZ(-12deg)';
      case 'on-surface':
        return 'perspective(1000px) rotateX(55deg) rotateY(0deg) rotateZ(-5deg)';
      default:
        return 'none';
    }
  };

  // Shadow styling per angle
  const getShadow = (): string => {
    switch (angle) {
      case 'top-down':
        return '0 0 40px rgba(0,0,0,0.15), 0 0 80px rgba(0,0,0,0.08)';
      case 'three-quarter':
        return '20px 30px 60px rgba(0,0,0,0.4), 10px 15px 30px rgba(0,0,0,0.25), -5px -5px 20px rgba(0,0,0,0.1)';
      case 'side':
        return '0 50px 80px rgba(0,0,0,0.5), 0 25px 40px rgba(0,0,0,0.3)';
      case 'hand-held':
        return '15px 25px 50px rgba(0,0,0,0.4), 8px 12px 25px rgba(0,0,0,0.3)';
      case 'on-surface':
        return '0 40px 70px rgba(0,0,0,0.45), 0 20px 35px rgba(0,0,0,0.25)';
      default:
        return 'none';
    }
  };

  // Environment background
  const getEnvBackground = (): string => {
    switch (environment) {
      case 'studio':
        return 'radial-gradient(ellipse at 50% 30%, #ffffff 0%, #f0f0f0 30%, #e0e0e0 60%, #d0d0d0 100%)';
      case 'concrete':
        return 'linear-gradient(180deg, #8a8a8a 0%, #6b6b6b 40%, #555555 100%)';
      case 'wood':
        return 'linear-gradient(180deg, #8B6914 0%, #A0783C 30%, #C4A265 60%, #8B6914 100%)';
      case 'dark':
        return 'radial-gradient(ellipse at 50% 40%, #2a2a3e 0%, #1a1a2e 40%, #0d0d1a 100%)';
      default:
        return '#f0f0f0';
    }
  };

  // Environment surface texture overlay
  const getEnvTextureStyle = (): React.CSSProperties => {
    switch (environment) {
      case 'studio':
        return {
          background: 'radial-gradient(ellipse at 50% 70%, rgba(255,255,255,0.3) 0%, transparent 60%)',
        };
      case 'concrete':
        return {
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(0,0,0,0.05) 1px, transparent 1px),
            radial-gradient(circle at 80% 30%, rgba(0,0,0,0.04) 1px, transparent 1px),
            radial-gradient(circle at 50% 80%, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '4px 4px, 6px 6px, 3px 3px',
        };
      case 'wood':
        return {
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 8px,
              rgba(0,0,0,0.03) 8px,
              rgba(0,0,0,0.03) 9px
            ),
            repeating-linear-gradient(
              85deg,
              transparent,
              transparent 20px,
              rgba(0,0,0,0.02) 20px,
              rgba(0,0,0,0.02) 21px
            )
          `,
        };
      case 'dark':
        return {
          background: 'radial-gradient(ellipse at 50% 40%, rgba(100,100,180,0.08) 0%, transparent 60%)',
        };
      default:
        return {};
    }
  };

  // Lighting overlay gradient stops for SVG (simulates light from top-left)
  // CSS linear-gradient strings are NOT valid for SVG fill attributes, so we
  // define proper SVG <linearGradient> stops instead.
  const getLightingGradientStops = (): Array<{ offset: string; color: string; opacity: number }> => {
    switch (environment) {
      case 'studio':
        return [
          { offset: '0%', color: '#ffffff', opacity: 0.25 },
          { offset: '30%', color: '#ffffff', opacity: 0.08 },
          { offset: '50%', color: '#000000', opacity: 0 },
          { offset: '100%', color: '#000000', opacity: 0.05 },
        ];
      case 'concrete':
        return [
          { offset: '0%', color: '#ffffff', opacity: 0.15 },
          { offset: '25%', color: '#ffffff', opacity: 0.05 },
          { offset: '50%', color: '#000000', opacity: 0 },
          { offset: '100%', color: '#000000', opacity: 0.08 },
        ];
      case 'wood':
        return [
          { offset: '0%', color: '#ffffff', opacity: 0.18 },
          { offset: '30%', color: '#ffffff', opacity: 0.06 },
          { offset: '50%', color: '#000000', opacity: 0 },
          { offset: '100%', color: '#000000', opacity: 0.06 },
        ];
      case 'dark':
        return [
          { offset: '0%', color: '#c8c8ff', opacity: 0.12 },
          { offset: '30%', color: '#6464c8', opacity: 0.04 },
          { offset: '50%', color: '#000000', opacity: 0 },
          { offset: '100%', color: '#000000', opacity: 0.15 },
        ];
      default:
        return [];
    }
  };

  // The deck rendering dimensions: scale so the deck is ~350px tall on screen
  const displayH = 380;
  const displayW = displayH * (deckW / deckH);

  // Wood edge thickness for the side rendering
  const edgeThickness = angle === 'side' ? 8 : angle === 'on-surface' ? 5 : 3;

  const currentAngleInfo = ANGLES.find(a => a.id === angle)!;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: getEnvBackground() }}>
      {/* Environment texture overlay */}
      <div className="absolute inset-0 pointer-events-none" style={getEnvTextureStyle()} />

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 h-14 flex items-center px-4 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <h2 className="font-display text-sm uppercase tracking-wider text-white">
            Deck Mockup
          </h2>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Environment picker */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            {ENVIRONMENTS.map(env => {
              const Icon = env.icon;
              return (
                <button
                  key={env.id}
                  onClick={() => setEnvironment(env.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    environment === env.id
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }`}
                  title={env.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{env.label}</span>
                </button>
              );
            })}
          </div>

          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* Close */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded-lg"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main viewport */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Arrow navigation */}
        <button
          onClick={() => cycleAngle(-1)}
          className="absolute left-4 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all text-white/70 hover:text-white"
          title="Previous angle"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => cycleAngle(1)}
          className="absolute right-4 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all text-white/70 hover:text-white"
          title="Next angle"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Rendering mockup...</span>
          </div>
        ) : (
          <div
            className="relative"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: getTransform(),
            }}
          >
            {/* Ground shadow (for on-surface and 3/4 angle) */}
            {(angle === 'on-surface' || angle === 'three-quarter' || angle === 'hand-held') && (
              <div
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                style={{
                  bottom: angle === 'on-surface' ? '-30px' : '-20px',
                  width: `${displayW * 1.2}px`,
                  height: '40px',
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)',
                  filter: 'blur(12px)',
                  transform: 'rotateX(-90deg) translateZ(-20px)',
                }}
              />
            )}

            {/* Deck body */}
            <div
              style={{
                width: `${displayW}px`,
                height: `${displayH}px`,
                position: 'relative',
                filter: `drop-shadow(${getShadow().split(',')[0]})`,
              }}
            >
              {/* Wood edge layer (visible on angled views) */}
              {angle !== 'top-down' && (
                <svg
                  width={displayW + edgeThickness * 2}
                  height={displayH + edgeThickness * 2}
                  viewBox={`-${edgeThickness} -${edgeThickness} ${displayW + edgeThickness * 2} ${displayH + edgeThickness * 2}`}
                  className="absolute pointer-events-none"
                  style={{
                    top: `${-edgeThickness}px`,
                    left: `${-edgeThickness}px`,
                    zIndex: 0,
                    transform: `translateZ(-${edgeThickness}px)`,
                  }}
                >
                  <defs>
                    <linearGradient id="wood-edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#d4a057" />
                      <stop offset="15%" stopColor="#e8c47a" />
                      <stop offset="30%" stopColor="#c9953e" />
                      <stop offset="50%" stopColor="#ddb668" />
                      <stop offset="70%" stopColor="#c9953e" />
                      <stop offset="85%" stopColor="#e8c47a" />
                      <stop offset="100%" stopColor="#d4a057" />
                    </linearGradient>
                    {/* Wood grain lines */}
                    <pattern id="wood-grain-edge" patternUnits="userSpaceOnUse" width="6" height="200">
                      <rect width="6" height="200" fill="url(#wood-edge-gradient)" />
                      <line x1="0" y1="0" x2="0" y2="200" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
                      <line x1="3" y1="0" x2="3" y2="200" stroke="rgba(0,0,0,0.04)" strokeWidth="0.3" />
                    </pattern>
                  </defs>
                  <path
                    d={getDeckPathSvg(displayW + edgeThickness * 2, displayH + edgeThickness * 2)}
                    fill="url(#wood-grain-edge)"
                    transform={`translate(${edgeThickness - edgeThickness}, ${edgeThickness - edgeThickness})`}
                  />
                </svg>
              )}

              {/* Main deck face - design image clipped to deck shape */}
              <svg
                width={displayW}
                height={displayH}
                viewBox={`0 0 ${displayW} ${displayH}`}
                className="absolute inset-0"
                style={{ zIndex: 1 }}
              >
                <defs>
                  <clipPath id="mockup-deck-clip">
                    <path d={getDeckPathSvg(displayW, displayH)} />
                  </clipPath>
                  {/* Glossy highlight */}
                  <linearGradient id="deck-gloss" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                    <stop offset="30%" stopColor="rgba(255,255,255,0.08)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="70%" stopColor="rgba(0,0,0,0.02)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.06)" />
                  </linearGradient>
                  {/* Edge highlight (bevel effect) */}
                  <linearGradient id="deck-edge-light" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                    <stop offset="5%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="95%" stopColor="rgba(0,0,0,0)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
                  </linearGradient>
                  {/* Lighting overlay gradient (135deg = top-left to bottom-right) */}
                  <linearGradient id="deck-lighting" x1="0%" y1="0%" x2="100%" y2="100%">
                    {getLightingGradientStops().map((stop, i) => (
                      <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
                    ))}
                  </linearGradient>
                </defs>

                {/* Design image, clipped to deck shape */}
                <g clipPath="url(#mockup-deck-clip)">
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

                  {/* Lighting overlay */}
                  <rect
                    x={0}
                    y={0}
                    width={displayW}
                    height={displayH}
                    fill="url(#deck-lighting)"
                  />

                  {/* Gloss overlay */}
                  <rect
                    x={0}
                    y={0}
                    width={displayW}
                    height={displayH}
                    fill="url(#deck-gloss)"
                  />

                  {/* Edge bevel lighting */}
                  <rect
                    x={0}
                    y={0}
                    width={displayW}
                    height={displayH}
                    fill="url(#deck-edge-light)"
                  />
                </g>

                {/* Deck outline (thin border simulating edge) */}
                <path
                  d={getDeckPathSvg(displayW, displayH)}
                  fill="none"
                  stroke="rgba(0,0,0,0.12)"
                  strokeWidth="1.5"
                />

                {/* Inner highlight line */}
                <path
                  d={getDeckPathSvg(displayW - 3, displayH - 3)}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.5"
                  transform="translate(1.5, 1.5)"
                />
              </svg>

              {/* Side profile extras - show deck thickness line */}
              {angle === 'side' && (
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    bottom: '-8px',
                    height: '8px',
                    zIndex: 2,
                  }}
                >
                  <svg width={displayW} height="8" viewBox={`0 0 ${displayW} 8`}>
                    <defs>
                      <linearGradient id="side-wood" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#c4934a" />
                        <stop offset="20%" stopColor="#dbb06c" />
                        <stop offset="50%" stopColor="#c9953e" />
                        <stop offset="80%" stopColor="#dbb06c" />
                        <stop offset="100%" stopColor="#c4934a" />
                      </linearGradient>
                    </defs>
                    {/* Wood ply layers */}
                    <rect x="2" y="0" width={displayW - 4} height="2" fill="#dbb06c" rx="0.5" />
                    <rect x="2" y="2.5" width={displayW - 4} height="1.5" fill="#c4934a" rx="0.5" />
                    <rect x="2" y="4.5" width={displayW - 4} height="1.5" fill="#dbb06c" rx="0.5" />
                    <rect x="2" y="6.5" width={displayW - 4} height="1.5" fill="#c4934a" rx="0.5" />
                  </svg>
                </div>
              )}
            </div>

            {/* Hand silhouette for hand-held view */}
            {angle === 'hand-held' && (
              <div
                className="absolute pointer-events-none"
                style={{
                  bottom: '-60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 3,
                  opacity: 0.12,
                }}
              >
                <svg width="120" height="80" viewBox="0 0 120 80">
                  <ellipse cx="60" cy="20" rx="50" ry="18" fill="currentColor" className="text-white" />
                  {/* Fingers */}
                  <rect x="15" y="0" width="12" height="30" rx="6" fill="currentColor" className="text-white" />
                  <rect x="32" y="-5" width="12" height="35" rx="6" fill="currentColor" className="text-white" />
                  <rect x="54" y="-3" width="12" height="33" rx="6" fill="currentColor" className="text-white" />
                  <rect x="75" y="0" width="11" height="28" rx="5.5" fill="currentColor" className="text-white" />
                  <rect x="90" y="5" width="10" height="22" rx="5" fill="currentColor" className="text-white" />
                </svg>
              </div>
            )}

            {/* Surface reflection for on-surface view */}
            {angle === 'on-surface' && environment === 'studio' && (
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: `${displayH + 5}px`,
                  height: `${displayH * 0.3}px`,
                  transform: 'scaleY(-1)',
                  opacity: 0.08,
                  filter: 'blur(2px)',
                  zIndex: 0,
                }}
              >
                <svg
                  width={displayW}
                  height={displayH * 0.3}
                  viewBox={`0 0 ${displayW} ${displayH * 0.3}`}
                >
                  <defs>
                    <clipPath id="reflection-clip">
                      <path d={getDeckPathSvg(displayW, displayH * 0.3)} />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#reflection-clip)">
                    {designImage && (
                      <image
                        href={designImage}
                        x={0}
                        y={0}
                        width={displayW}
                        height={displayH * 0.3}
                        preserveAspectRatio="none"
                      />
                    )}
                  </g>
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls - Angle selector */}
      <div className="relative z-10 bg-black/40 backdrop-blur-md border-t border-white/10">
        <div className="px-4 py-3 flex items-center justify-center gap-2">
          {ANGLES.map(a => (
            <button
              key={a.id}
              onClick={() => setAngle(a.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                angle === a.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
              }`}
              title={a.description}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="text-center pb-2">
          <p className="text-[11px] text-white/40">
            {currentAngleInfo.description} &middot; Use arrow keys to switch
          </p>
        </div>
      </div>
    </div>
  );
}
