import { Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  message?: string;
}

export function ProgressIndicator({ current, total, message = 'Processing...' }: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <div className="flex items-center gap-2">
          <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {current}/{total}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{percentage}% complete</p>
      </div>
    </div>
  );
}
