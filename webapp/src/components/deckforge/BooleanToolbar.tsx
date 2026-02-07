import { Merge, Minus, Maximize2, X } from 'lucide-react';

interface BooleanToolbarProps {
  selectedIds: string[];
  onBooleanOp: (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => void;
}

const operations = [
  { key: 'union' as const, icon: Merge, title: 'Union' },
  { key: 'subtract' as const, icon: Minus, title: 'Subtract' },
  { key: 'intersect' as const, icon: Maximize2, title: 'Intersect' },
  { key: 'exclude' as const, icon: X, title: 'Exclude' },
];

export function BooleanToolbar({ selectedIds, onBooleanOp }: BooleanToolbarProps) {
  if (selectedIds.length < 2) return null;

  return (
    <div className="bg-card border border-border rounded-lg shadow-xl p-2">
      <div className="text-xs text-muted-foreground mb-1 text-center">Boolean</div>
      <div className="flex items-center gap-1">
        {operations.map(({ key, icon: Icon, title }) => (
          <button
            key={key}
            title={title}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors active:scale-90"
            onClick={() => onBooleanOp(key)}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
