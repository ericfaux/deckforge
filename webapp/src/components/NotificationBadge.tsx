import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count?: number;
  dot?: boolean;
  max?: number;
  className?: string;
  children?: React.ReactNode;
}

export function NotificationBadge({
  count = 0,
  dot = false,
  max = 99,
  className,
  children,
}: NotificationBadgeProps) {
  const showBadge = dot || count > 0;
  const displayCount = count > max ? `${max}+` : count;

  return (
    <div className="relative inline-block">
      {children}
      {showBadge && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground font-semibold',
            dot ? 'w-2 h-2' : 'min-w-[18px] h-[18px] px-1 text-[10px]',
            'animate-in fade-in zoom-in-50 duration-200',
            className
          )}
        >
          {!dot && displayCount}
        </span>
      )}
    </div>
  );
}
