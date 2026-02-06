import { useRef, useCallback, useState } from 'react';
import { Label } from '@/components/ui/label';

interface HueRotateDialProps {
  value: number;
  onChange: (value: number) => void;
}

export function HueRotateDial({ value, onChange }: HueRotateDialProps) {
  const dialRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getAngleFromEvent = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return value;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return Math.round(angle) % 360;
  }, [value]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsDragging(true);
    const angle = getAngleFromEvent(e.clientX, e.clientY);
    onChange(angle);
  }, [getAngleFromEvent, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const angle = getAngleFromEvent(e.clientX, e.clientY);
    onChange(angle);
  }, [isDragging, getAngleFromEvent, onChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Indicator position on the dial ring
  const indicatorAngleRad = ((value - 90) * Math.PI) / 180;
  const radius = 36;
  const cx = 44;
  const cy = 44;
  const ix = cx + radius * Math.cos(indicatorAngleRad);
  const iy = cy + radius * Math.sin(indicatorAngleRad);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Hue Rotate
        </Label>
        <span className="text-[11px] font-mono text-muted-foreground">{value}°</span>
      </div>
      <div className="flex justify-center">
        <svg
          ref={dialRef}
          width={88}
          height={88}
          viewBox="0 0 88 88"
          className="cursor-pointer select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          {/* Rainbow hue ring */}
          <defs>
            <linearGradient id="hue-seg-0" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(0,100%,50%)" />
              <stop offset="100%" stopColor="hsl(60,100%,50%)" />
            </linearGradient>
          </defs>
          {/* Conic gradient ring using multiple arc segments */}
          {Array.from({ length: 36 }).map((_, i) => {
            const startAngle = (i * 10 - 90) * (Math.PI / 180);
            const endAngle = ((i + 1) * 10 - 90) * (Math.PI / 180);
            const x1 = cx + radius * Math.cos(startAngle);
            const y1 = cy + radius * Math.sin(startAngle);
            const x2 = cx + radius * Math.cos(endAngle);
            const y2 = cy + radius * Math.sin(endAngle);
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke={`hsl(${i * 10}, 100%, 50%)`}
                strokeWidth={8}
                strokeLinecap="butt"
              />
            );
          })}

          {/* Inner circle (dark background) */}
          <circle cx={cx} cy={cy} r={28} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={1} />

          {/* Degree label in center */}
          <text
            x={cx}
            y={cy + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--foreground))"
            fontSize={14}
            fontFamily="monospace"
            fontWeight="bold"
          >
            {value}°
          </text>

          {/* Indicator dot */}
          <circle
            cx={ix}
            cy={iy}
            r={6}
            fill="white"
            stroke="hsl(var(--border))"
            strokeWidth={2}
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          />
        </svg>
      </div>
    </div>
  );
}
