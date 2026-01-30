import { cn } from '@/lib/utils';
import { Badge, BadgeProps } from '@/components/ui/badge';

export interface AnimatedBadgeProps extends BadgeProps {
  pulse?: boolean;
  bounce?: boolean;
  glow?: boolean;
}

/**
 * Animated badge variants
 * 
 * Usage:
 * <AnimatedBadge pulse>NEW</AnimatedBadge>
 * <AnimatedBadge bounce variant="destructive">3</AnimatedBadge>
 * <AnimatedBadge glow variant="default">PRO</AnimatedBadge>
 */
export function AnimatedBadge({
  pulse = false,
  bounce = false,
  glow = false,
  className,
  children,
  ...props
}: AnimatedBadgeProps) {
  return (
    <Badge
      className={cn(
        pulse && 'animate-pulse',
        bounce && 'animate-bounce',
        glow && 'shadow-lg shadow-primary/50',
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
}

/**
 * Notification badge (small circle with count)
 */
export interface NotificationBadgeProps {
  count: number;
  max?: number;
  variant?: 'default' | 'destructive' | 'success';
  className?: string;
  pulse?: boolean;
}

export function NotificationBadge({
  count,
  max = 99,
  variant = 'destructive',
  className,
  pulse = false,
}: NotificationBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    success: 'bg-green-500 text-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full text-xs font-medium min-w-[1.25rem] h-5 px-1.5',
        variantClasses[variant],
        pulse && 'animate-pulse',
        className
      )}
    >
      {displayCount}
    </span>
  );
}

/**
 * Status indicator dot
 */
export interface StatusDotProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusDot({
  status,
  pulse = false,
  size = 'md',
  className,
}: StatusDotProps) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  };

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <span className={cn('relative inline-flex', className)}>
      <span
        className={cn(
          'rounded-full',
          statusColors[status],
          sizes[size]
        )}
      />
      {pulse && (
        <span
          className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-75',
            statusColors[status],
            sizes[size]
          )}
        />
      )}
    </span>
  );
}

/**
 * "NEW" badge with gradient and pulse
 */
export function NewBadge({ className }: { className?: string }) {
  return (
    <AnimatedBadge
      pulse
      className={cn(
        'bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-[10px] px-2',
        className
      )}
    >
      NEW
    </AnimatedBadge>
  );
}

/**
 * "PRO" badge with gold gradient
 */
export function ProBadge({ className }: { className?: string }) {
  return (
    <AnimatedBadge
      glow
      className={cn(
        'bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-[10px] px-2',
        className
      )}
    >
      PRO
    </AnimatedBadge>
  );
}

/**
 * "BETA" badge
 */
export function BetaBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn('text-[10px] px-2 font-medium', className)}
    >
      BETA
    </Badge>
  );
}
