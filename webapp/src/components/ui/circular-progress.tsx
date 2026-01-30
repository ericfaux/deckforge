import { cn } from '@/lib/utils';

export interface CircularProgressProps {
  value: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

/**
 * Circular progress indicator
 * 
 * Usage:
 * <CircularProgress value={75} size={80} showValue />
 */
export function CircularProgress({
  value,
  size = 64,
  strokeWidth = 4,
  className,
  showValue = false,
  color = 'primary',
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const colorClasses = {
    primary: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    destructive: 'text-destructive',
  };

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-300 ease-in-out',
            colorClasses[color]
          )}
        />
      </svg>
      {showValue && (
        <span className="absolute text-sm font-medium">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}

/**
 * Indeterminate spinner (no value, just spins)
 */
export function CircularSpinner({
  size = 32,
  strokeWidth = 3,
  className,
  color = 'primary',
}: Omit<CircularProgressProps, 'value' | 'showValue'>) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const colorClasses = {
    primary: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    destructive: 'text-destructive',
  };

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="animate-spin"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.75}
          strokeLinecap="round"
          className={cn(
            'opacity-75',
            colorClasses[color]
          )}
        />
      </svg>
    </div>
  );
}
