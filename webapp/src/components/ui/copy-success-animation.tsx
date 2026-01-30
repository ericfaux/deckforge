import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopySuccessAnimationProps {
  show: boolean;
  x: number;
  y: number;
}

/**
 * Brief floating animation that appears when copying an object
 * Shows a checkmark that fades out and floats up
 */
export function CopySuccessAnimation({ show, x, y }: CopySuccessAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed z-50 pointer-events-none",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        "animate-out fade-out-0 slide-out-to-top-4 fill-mode-forwards"
      )}
      style={{
        left: x,
        top: y,
        animationDuration: '1000ms',
      }}
    >
      <div className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg">
        <Copy className="w-4 h-4" />
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">Copied</span>
      </div>
    </div>
  );
}
