import { useColorHistory } from '@/store/colorHistory';

export function RecentColors({ onSelect, currentColor }: { onSelect: (color: string) => void; currentColor?: string }) {
  const { recentColors } = useColorHistory();
  if (recentColors.length === 0) return null;
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-zinc-500">
        Recent
      </label>
      <div className="flex flex-wrap gap-1">
        {recentColors.map(color => (
          <button
            key={color}
            onClick={(e) => { e.stopPropagation(); onSelect(color); }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
              currentColor?.toLowerCase() === color.toLowerCase()
                ? 'border-accent ring-1 ring-accent/30'
                : 'border-zinc-600'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}
