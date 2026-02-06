import { useMemo } from 'react';

// Deck shape path for SVG clip - rounded skateboard/fingerboard shape
function getDeckPath(w: number, h: number): string {
  const r = w * 0.42; // radius for rounded ends
  return `
    M 0 ${r}
    Q 0 0 ${w / 2} 0
    Q ${w} 0 ${w} ${r}
    L ${w} ${h - r}
    Q ${w} ${h} ${w / 2} ${h}
    Q 0 ${h} 0 ${h - r}
    Z
  `;
}

// Category-based color themes
const categoryThemes: Record<string, { bg: string; accent: string; secondary: string; pattern: string }> = {
  edgy: { bg: '#0a0a0a', accent: '#ff2222', secondary: '#ff6600', pattern: '#1a1a1a' },
  street: { bg: '#111111', accent: '#00ff66', secondary: '#ffff00', pattern: '#1c1c1c' },
  minimal: { bg: '#f5f0eb', accent: '#2a2a2a', secondary: '#888888', pattern: '#ede8e3' },
  retro: { bg: '#1a0a2e', accent: '#ff6ec7', secondary: '#7b68ee', pattern: '#2a1a3e' },
  pro: { bg: '#1a1a2e', accent: '#ffd700', secondary: '#4169e1', pattern: '#2a2a3e' },
};

// Unique seed design visuals keyed by design ID
const seedVisuals: Record<string, (w: number, h: number, clipId: string) => React.ReactNode> = {
  'seed-001': (w, h) => {
    // Midnight Bloom - dark floral with neon petals
    return (
      <>
        <rect width={w} height={h} fill="#0a0a1a" />
        {/* Neon petal shapes */}
        {[0.2, 0.45, 0.75].map((yp, i) => (
          <g key={i} opacity={0.8 - i * 0.15}>
            <ellipse cx={w * 0.3 + i * 15} cy={h * yp} rx={w * 0.22} ry={w * 0.12} fill="none" stroke="#ff44aa" strokeWidth={2} transform={`rotate(${-20 + i * 25}, ${w * 0.3 + i * 15}, ${h * yp})`} />
            <ellipse cx={w * 0.6 - i * 10} cy={h * yp + 30} rx={w * 0.18} ry={w * 0.1} fill="none" stroke="#aa22ff" strokeWidth={1.5} transform={`rotate(${30 - i * 15}, ${w * 0.6 - i * 10}, ${h * yp + 30})`} />
            <circle cx={w * 0.45} cy={h * yp + 10} r={4} fill="#ff66cc" opacity={0.9} />
          </g>
        ))}
        {/* Stem lines */}
        <line x1={w * 0.45} y1={h * 0.15} x2={w * 0.45} y2={h * 0.85} stroke="#22ff44" strokeWidth={1} opacity={0.3} />
        <line x1={w * 0.3} y1={h * 0.3} x2={w * 0.6} y2={h * 0.7} stroke="#22ff44" strokeWidth={0.5} opacity={0.2} />
      </>
    );
  },
  'seed-002': (w, h) => {
    // Tokyo Drift - Japanese speed lines + rising sun
    return (
      <>
        <rect width={w} height={h} fill="#ffffff" />
        {/* Rising sun rays */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={w / 2} y1={h * 0.35} x2={w / 2 + Math.cos(i * Math.PI / 6) * w} y2={h * 0.35 + Math.sin(i * Math.PI / 6) * h} stroke="#ff0000" strokeWidth={w * 0.06} opacity={0.15} />
        ))}
        <circle cx={w / 2} cy={h * 0.35} r={w * 0.2} fill="#ff0000" />
        {/* Speed lines at bottom */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`sl-${i}`} x1={0} y1={h * 0.65 + i * 12} x2={w} y2={h * 0.65 + i * 12 + (Math.random() - 0.5) * 4} stroke="#222" strokeWidth={1} opacity={0.4} />
        ))}
        {/* Bold text placeholder */}
        <rect x={w * 0.1} y={h * 0.55} width={w * 0.8} height={h * 0.08} rx={2} fill="#000000" opacity={0.85} />
      </>
    );
  },
  'seed-003': (w, h) => {
    // Pastel Waves - soft gradients
    const waveId = `wave-grad-${Math.random().toString(36).slice(2, 6)}`;
    return (
      <>
        <defs>
          <linearGradient id={waveId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd4e8" />
            <stop offset="33%" stopColor="#d4e8ff" />
            <stop offset="66%" stopColor="#d4ffd4" />
            <stop offset="100%" stopColor="#fff4d4" />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${waveId})`} />
        {/* Smooth wave curves */}
        {[0.25, 0.4, 0.55, 0.7, 0.85].map((yp, i) => (
          <path key={i} d={`M 0 ${h * yp} Q ${w * 0.25} ${h * yp - 15 + i * 3} ${w * 0.5} ${h * yp} Q ${w * 0.75} ${h * yp + 15 - i * 3} ${w} ${h * yp}`} fill="none" stroke={['#ffaacc', '#aaccff', '#aaffaa', '#ffddaa', '#ccaaff'][i]} strokeWidth={2} opacity={0.5} />
        ))}
      </>
    );
  },
  'seed-004': (w, h) => {
    // Retro Cassette - cassette tape design
    return (
      <>
        <rect width={w} height={h} fill="#1a1a2e" />
        {/* Cassette body */}
        <rect x={w * 0.08} y={h * 0.3} width={w * 0.84} height={h * 0.35} rx={4} fill="#333355" stroke="#555577" strokeWidth={1.5} />
        {/* Label area */}
        <rect x={w * 0.15} y={h * 0.33} width={w * 0.7} height={h * 0.12} rx={2} fill="#eeddcc" />
        {/* Label lines */}
        {[0, 1, 2].map(i => (
          <line key={i} x1={w * 0.2} y1={h * 0.35 + i * 10} x2={w * 0.8} y2={h * 0.35 + i * 10} stroke="#999" strokeWidth={0.5} opacity={0.4} />
        ))}
        {/* Tape reels */}
        <circle cx={w * 0.32} cy={h * 0.53} r={w * 0.1} fill="#222" stroke="#444" strokeWidth={1} />
        <circle cx={w * 0.68} cy={h * 0.53} r={w * 0.1} fill="#222" stroke="#444" strokeWidth={1} />
        <circle cx={w * 0.32} cy={h * 0.53} r={w * 0.04} fill="#555" />
        <circle cx={w * 0.68} cy={h * 0.53} r={w * 0.04} fill="#555" />
        {/* Tape window */}
        <rect x={w * 0.25} y={h * 0.56} width={w * 0.5} height={h * 0.04} rx={2} fill="#111" opacity={0.6} />
        {/* Title bar */}
        <rect x={w * 0.15} y={h * 0.15} width={w * 0.7} height={h * 0.04} rx={2} fill="#ff6600" opacity={0.8} />
      </>
    );
  },
  'seed-005': (w, h) => {
    // Carbon Fiber Pro - woven carbon pattern
    const cfId = `cf-pat-${Math.random().toString(36).slice(2, 6)}`;
    return (
      <>
        <defs>
          <pattern id={cfId} width={8} height={8} patternUnits="userSpaceOnUse">
            <rect width={8} height={8} fill="#1a1a1a" />
            <rect x={0} y={0} width={4} height={4} fill="#222222" />
            <rect x={4} y={4} width={4} height={4} fill="#222222" />
          </pattern>
        </defs>
        <rect width={w} height={h} fill={`url(#${cfId})`} />
        {/* Accent lines */}
        <line x1={w * 0.15} y1={0} x2={w * 0.15} y2={h} stroke="#ffd700" strokeWidth={1.5} opacity={0.6} />
        <line x1={w * 0.85} y1={0} x2={w * 0.85} y2={h} stroke="#ffd700" strokeWidth={1.5} opacity={0.6} />
        {/* Center badge */}
        <rect x={w * 0.2} y={h * 0.42} width={w * 0.6} height={h * 0.06} rx={3} fill="#000" stroke="#ffd700" strokeWidth={1} opacity={0.9} />
        {/* Top/bottom bars */}
        <rect x={w * 0.25} y={h * 0.08} width={w * 0.5} height={2} fill="#ffd700" opacity={0.5} />
        <rect x={w * 0.25} y={h * 0.92} width={w * 0.5} height={2} fill="#ffd700" opacity={0.5} />
      </>
    );
  },
  'seed-006': (w, h) => {
    // Glitch Matrix - digital corruption
    return (
      <>
        <rect width={w} height={h} fill="#0a0a0a" />
        {/* Matrix-style vertical lines */}
        {Array.from({ length: 10 }).map((_, i) => (
          <g key={i}>
            <rect x={w * (i / 10) + 2} y={0} width={1} height={h} fill="#00ff00" opacity={0.1 + Math.random() * 0.15} />
            {/* Random "code" dots */}
            {Array.from({ length: 6 }).map((_, j) => (
              <rect key={j} x={w * (i / 10)} y={h * (j / 6) + Math.random() * 30} width={w * 0.08} height={2} fill="#00ff00" opacity={0.3 + Math.random() * 0.4} />
            ))}
          </g>
        ))}
        {/* Glitch offset bars */}
        <rect x={w * 0.05} y={h * 0.38} width={w * 0.5} height={h * 0.02} fill="#ff0000" opacity={0.5} />
        <rect x={w * 0.3} y={h * 0.4} width={w * 0.65} height={h * 0.015} fill="#0000ff" opacity={0.5} />
        <rect x={w * 0.1} y={h * 0.42} width={w * 0.7} height={h * 0.025} fill="#00ffff" opacity={0.6} />
        {/* Scan lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`sc-${i}`} x1={0} y1={i * (h / 20)} x2={w} y2={i * (h / 20)} stroke="#ffffff" strokeWidth={0.3} opacity={0.05} />
        ))}
      </>
    );
  },
  'seed-007': (w, h) => {
    // Botanical Line Art - delicate plant illustrations
    return (
      <>
        <rect width={w} height={h} fill="#faf8f5" />
        {/* Main stem */}
        <path d={`M ${w * 0.5} ${h * 0.85} Q ${w * 0.48} ${h * 0.6} ${w * 0.5} ${h * 0.15}`} fill="none" stroke="#2a5a2a" strokeWidth={1.5} opacity={0.6} />
        {/* Leaves */}
        {[0.25, 0.4, 0.55, 0.7].map((yp, i) => (
          <g key={i}>
            <path d={`M ${w * 0.5} ${h * yp} Q ${w * (0.2 + (i % 2) * 0.6)} ${h * (yp - 0.04)} ${w * (0.15 + (i % 2) * 0.7)} ${h * (yp - 0.02)}`} fill="none" stroke="#3a6a3a" strokeWidth={1} opacity={0.5} />
            <path d={`M ${w * 0.5} ${h * (yp + 0.03)} Q ${w * (0.75 - (i % 2) * 0.5)} ${h * (yp + 0.01)} ${w * (0.8 - (i % 2) * 0.6)} ${h * (yp + 0.02)}`} fill="none" stroke="#3a6a3a" strokeWidth={1} opacity={0.4} />
          </g>
        ))}
        {/* Small circles for flower buds */}
        <circle cx={w * 0.5} cy={h * 0.15} r={6} fill="none" stroke="#cc7788" strokeWidth={1} />
        <circle cx={w * 0.5} cy={h * 0.15} r={3} fill="#cc7788" opacity={0.3} />
        <circle cx={w * 0.3} cy={h * 0.35} r={4} fill="none" stroke="#cc7788" strokeWidth={0.8} opacity={0.6} />
      </>
    );
  },
  'seed-008': (w, h) => {
    // Acid Drip - psychedelic dripping colors
    const acidId = `acid-grad-${Math.random().toString(36).slice(2, 6)}`;
    return (
      <>
        <defs>
          <linearGradient id={acidId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff00ff" />
            <stop offset="25%" stopColor="#ffff00" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="75%" stopColor="#ff6600" />
            <stop offset="100%" stopColor="#ff00ff" />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${acidId})`} />
        {/* Drip shapes */}
        {[0.15, 0.35, 0.55, 0.75].map((xp, i) => {
          const dropH = h * (0.2 + i * 0.05);
          return (
            <path key={i} d={`M ${w * xp} 0 L ${w * xp} ${dropH} Q ${w * xp} ${dropH + 20} ${w * xp - 8} ${dropH + 15} Q ${w * xp - 12} ${dropH + 20} ${w * xp} ${dropH + 30}`} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={w * 0.08} strokeLinecap="round" />
          );
        })}
        {/* Warped circles */}
        <circle cx={w * 0.5} cy={h * 0.45} r={w * 0.15} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
        <circle cx={w * 0.3} cy={h * 0.65} r={w * 0.1} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
      </>
    );
  },
};

// Generate a category-themed fallback visual when no specific seed visual exists
function CategoryVisual({ w, h, category, title }: { w: number; h: number; category: string; title: string }) {
  const theme = categoryThemes[category] || categoryThemes.street;

  return (
    <>
      <rect width={w} height={h} fill={theme.bg} />
      {/* Pattern overlay */}
      {category === 'edgy' && (
        <>
          <line x1={0} y1={h * 0.3} x2={w} y2={h * 0.3} stroke={theme.accent} strokeWidth={2} opacity={0.5} />
          <line x1={0} y1={h * 0.7} x2={w} y2={h * 0.7} stroke={theme.accent} strokeWidth={2} opacity={0.5} />
          <polygon points={`${w / 2},${h * 0.35} ${w * 0.3},${h * 0.55} ${w * 0.7},${h * 0.55}`} fill="none" stroke={theme.accent} strokeWidth={1.5} opacity={0.6} />
        </>
      )}
      {category === 'street' && (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i} x1={0} y1={h * (0.2 + i * 0.15)} x2={w} y2={h * (0.2 + i * 0.15) + (i % 2 ? 10 : -10)} stroke={theme.accent} strokeWidth={1} opacity={0.3} />
          ))}
          <rect x={w * 0.1} y={h * 0.42} width={w * 0.8} height={h * 0.06} rx={2} fill={theme.accent} opacity={0.7} />
        </>
      )}
      {category === 'minimal' && (
        <>
          <circle cx={w * 0.5} cy={h * 0.45} r={w * 0.2} fill="none" stroke={theme.accent} strokeWidth={1} opacity={0.3} />
          <line x1={w * 0.3} y1={h * 0.6} x2={w * 0.7} y2={h * 0.6} stroke={theme.accent} strokeWidth={0.8} opacity={0.4} />
        </>
      )}
      {category === 'retro' && (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <circle key={i} cx={w / 2} cy={h * 0.45} r={w * (0.05 + i * 0.06)} fill="none" stroke={i % 2 ? theme.accent : theme.secondary} strokeWidth={1} opacity={0.3} />
          ))}
        </>
      )}
      {category === 'pro' && (
        <>
          <line x1={w * 0.15} y1={0} x2={w * 0.15} y2={h} stroke={theme.accent} strokeWidth={1} opacity={0.4} />
          <line x1={w * 0.85} y1={0} x2={w * 0.85} y2={h} stroke={theme.accent} strokeWidth={1} opacity={0.4} />
          <rect x={w * 0.2} y={h * 0.44} width={w * 0.6} height={h * 0.04} rx={2} fill={theme.accent} opacity={0.5} />
        </>
      )}
      {/* Title initial as subtle watermark */}
      <text x={w / 2} y={h * 0.48} textAnchor="middle" dominantBaseline="central" fontSize={w * 0.35} fontWeight="bold" fontFamily="Impact, Arial, sans-serif" fill={theme.accent} opacity={0.12}>
        {title.charAt(0).toUpperCase()}
      </text>
    </>
  );
}

interface DeckThumbnailProps {
  /** Unique identifier to namespace SVG clip paths */
  designId: string;
  /** Category for theme selection */
  category: string;
  /** Design title for fallback visual */
  title: string;
  /** Optional thumbnail URL - if provided, renders as image inside deck shape */
  thumbnailUrl?: string | null;
  /** Optional className */
  className?: string;
}

export function DeckThumbnail({ designId, category, title, thumbnailUrl, className = '' }: DeckThumbnailProps) {
  const W = 100;
  const H = 308;
  const clipId = useMemo(() => `deck-clip-${designId}-${Math.random().toString(36).slice(2, 6)}`, [designId]);
  const deckPath = getDeckPath(W, H);

  const seedVisual = seedVisuals[designId];

  return (
    <div className={`relative w-full h-full ${className}`}>
      <svg
        viewBox={`-2 -2 ${W + 4} ${H + 4}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Preview of ${title}`}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={deckPath} />
          </clipPath>
        </defs>

        {/* Clipped deck content */}
        <g clipPath={`url(#${clipId})`}>
          {thumbnailUrl ? (
            <>
              <rect width={W} height={H} fill="#1a1a1a" />
              <image
                href={thumbnailUrl}
                x={0}
                y={0}
                width={W}
                height={H}
                preserveAspectRatio="xMidYMid slice"
              />
            </>
          ) : seedVisual ? (
            seedVisual(W, H, clipId)
          ) : (
            <CategoryVisual w={W} h={H} category={category} title={title} />
          )}
        </g>

        {/* Deck outline */}
        <path d={deckPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/**
 * Renders a template preview as an SVG inside a deck shape.
 * Re-uses the PreviewObject rendering from TemplateGalleryModal concepts.
 */
interface TemplateDeckThumbnailProps {
  template: {
    id: string;
    name: string;
    category: string;
    objects: any[];
    thumbnail?: string;
  };
  className?: string;
}

export function TemplateDeckThumbnail({ template, className = '' }: TemplateDeckThumbnailProps) {
  // Canvas objects use 96x294 (legacy dimensions from templates.ts)
  const CANVAS_W = 96;
  const CANVAS_H = 294;
  const clipId = useMemo(() => `tpl-clip-${template.id}-${Math.random().toString(36).slice(2, 6)}`, [template.id]);

  const deckPath = getDeckPath(CANVAS_W, CANVAS_H);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <svg
        viewBox={`-2 -2 ${CANVAS_W + 4} ${CANVAS_H + 4}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Preview of ${template.name}`}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={deckPath} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {/* Default background */}
          <rect width={CANVAS_W} height={CANVAS_H} fill="#1a1a1a" />
          {/* Render template objects */}
          {template.objects.map((obj, i) => (
            <TemplateObject key={obj.id || i} obj={obj} templateId={template.id} index={i} />
          ))}
        </g>

        <path d={deckPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      </svg>
    </div>
  );
}

// Simplified SVG object renderer for template objects
function TemplateObject({ obj, templateId, index }: { obj: any; templateId: string; index: number }) {
  const gradientId = `tobj-grad-${templateId}-${index}`;
  const scaleX = obj.scaleX || 1;
  const scaleY = obj.scaleY || 1;
  const cx = obj.x + (obj.width * scaleX) / 2;
  const cy = obj.y + (obj.height * scaleY) / 2;
  const transform = `rotate(${obj.rotation || 0}, ${cx}, ${cy})`;

  if (obj.type === 'shape') {
    const hasGradient = obj.gradientStops && obj.gradientStops.length > 0;
    const fillValue = hasGradient ? `url(#${gradientId})` : (obj.patternPrimaryColor || obj.fill || '#333');

    if (obj.shapeType === 'circle') {
      return (
        <g transform={transform} opacity={obj.opacity}>
          {hasGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform={`rotate(${(obj.gradientAngle || 0) - 90})`}>
                {obj.gradientStops.map((stop: any, i: number) => (
                  <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
          )}
          <circle cx={obj.x + obj.width / 2} cy={obj.y + obj.height / 2} r={Math.min(obj.width, obj.height) / 2 * scaleX} fill={fillValue} stroke={obj.stroke} strokeWidth={obj.strokeWidth || 0} />
        </g>
      );
    }

    if (obj.shapeType === 'star') {
      const outerR = obj.width / 2 * scaleX;
      const innerR = outerR * 0.4;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
      }
      return (
        <g transform={transform} opacity={obj.opacity}>
          {hasGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                {obj.gradientStops.map((stop: any, i: number) => (
                  <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
          )}
          <polygon points={pts.join(' ')} fill={fillValue} stroke={obj.stroke} strokeWidth={obj.strokeWidth || 0} />
        </g>
      );
    }

    // Default: rect
    return (
      <g transform={transform} opacity={obj.opacity}>
        {hasGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform={`rotate(${(obj.gradientAngle || 0) - 90})`}>
              {obj.gradientStops.map((stop: any, i: number) => (
                <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
        )}
        <rect x={obj.x} y={obj.y} width={obj.width * scaleX} height={obj.height * scaleY} fill={fillValue} />
      </g>
    );
  }

  if (obj.type === 'text') {
    const hasGradient = obj.gradientStops && obj.gradientStops.length > 0;
    const fillValue = hasGradient ? `url(#${gradientId})` : (obj.colorize || obj.fill || '#ffffff');
    let displayText = obj.text || '';
    if (obj.textTransform === 'uppercase') displayText = displayText.toUpperCase();
    else if (obj.textTransform === 'lowercase') displayText = displayText.toLowerCase();

    return (
      <g opacity={obj.opacity}>
        {hasGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {obj.gradientStops.map((stop: any, i: number) => (
                <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
        )}
        <text
          x={obj.x}
          y={obj.y + (obj.fontSize || 14)}
          transform={transform}
          fill={fillValue}
          fontSize={obj.fontSize || 14}
          fontFamily={obj.fontFamily || 'Impact, sans-serif'}
          fontWeight={obj.fontWeight || 'normal'}
          fontStyle={obj.fontStyle || 'normal'}
          stroke={obj.stroke}
          strokeWidth={obj.strokeWidth || 0}
          letterSpacing={obj.letterSpacing || 0}
        >
          {displayText}
        </text>
      </g>
    );
  }

  if (obj.type === 'sticker') {
    const emoji = obj.emoji || obj.icon || '';
    const size = obj.width * scaleX;
    return (
      <text
        x={obj.x + size / 2}
        y={obj.y + (obj.height * scaleY) / 2}
        fontSize={size * 0.7}
        textAnchor="middle"
        dominantBaseline="central"
        opacity={obj.opacity}
        transform={`rotate(${obj.rotation || 0}, ${obj.x + size / 2}, ${obj.y + (obj.height * scaleY) / 2})`}
      >
        {emoji}
      </text>
    );
  }

  if (obj.type === 'line') {
    return (
      <line
        x1={obj.x}
        y1={obj.y}
        x2={obj.x + (obj.lineEndX || obj.width) * scaleX}
        y2={obj.y + (obj.lineEndY || 0) * scaleY}
        stroke={obj.stroke || obj.fill || '#ffffff'}
        strokeWidth={obj.strokeWidth || 1}
        opacity={obj.opacity}
        transform={transform}
        strokeLinecap={obj.lineCapStyle || 'round'}
      />
    );
  }

  return null;
}
