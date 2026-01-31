import { cn } from '@/lib/utils';
import { parseShortcut, formatShortcut } from '@/lib/shortcuts';

interface ShortcutBadgeProps {
  shortcut: string | string[];
  className?: string;
}

/**
 * Display keyboard shortcut as styled badge
 * Supports single shortcuts ("Ctrl+Z") and alternatives (["Delete", "Backspace"])
 */
export function ShortcutBadge({ shortcut, className }: ShortcutBadgeProps) {
  if (!shortcut) return null;

  // Handle array of alternatives
  if (Array.isArray(shortcut)) {
    return (
      <div className={cn("inline-flex items-center gap-1", className)}>
        {shortcut.map((s, idx) => (
          <span key={idx} className="inline-flex items-center">
            {idx > 0 && <span className="text-muted-foreground mx-1 text-xs">or</span>}
            <ShortcutKeys keys={parseShortcut(s)} />
          </span>
        ))}
      </div>
    );
  }

  // Single shortcut
  const keys = parseShortcut(shortcut);
  return <ShortcutKeys keys={keys} className={className} />;
}

/**
 * Display individual keys with + separators
 */
function ShortcutKeys({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.map((key, idx) => (
        <span key={idx} className="inline-flex items-center">
          {idx > 0 && <span className="text-muted-foreground mx-0.5">+</span>}
          <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded font-mono">
            {key}
          </kbd>
        </span>
      ))}
    </span>
  );
}
