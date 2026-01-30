import { cn } from '@/lib/utils';

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100',
        className
      )}
    >
      {children}
    </kbd>
  );
}

interface ShortcutProps {
  keys: string[];
  className?: string;
}

export function Shortcut({ keys, className }: ShortcutProps) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {keys.map((key, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground">+</span>}
          <Kbd>{key}</Kbd>
        </span>
      ))}
    </span>
  );
}
