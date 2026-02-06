import { useState, useRef, useEffect, ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

export interface OverflowItem {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  shortcut?: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
  variant?: 'default' | 'gradient';
  gradientClass?: string;
}

interface ToolbarOverflowMenuProps {
  items: OverflowItem[];
}

export function ToolbarOverflowMenu({ items }: ToolbarOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            ref={buttonRef}
            size="sm"
            variant={open ? "default" : "outline"}
            onClick={() => setOpen(!open)}
            className="gap-1.5 px-2"
            aria-label={`${items.length} more toolbar items`}
            aria-expanded={open}
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[10px] font-mono text-muted-foreground">{items.length}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>{items.length} more items</span>
        </TooltipContent>
      </Tooltip>

      {open && (
        <div
          ref={menuRef}
          className={cn(
            "absolute right-0 top-full mt-2 z-50",
            "w-64 rounded-lg border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
            "py-1"
          )}
          role="menu"
        >
          <div className="px-3 py-1.5 border-b border-border mb-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              More Tools
            </span>
          </div>
          {items.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm text-left",
                "hover:bg-accent/50 transition-colors",
                "disabled:opacity-50 disabled:pointer-events-none",
                "focus:outline-none focus:bg-accent/50"
              )}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0 text-muted-foreground">
                {item.icon}
              </span>
              <span className="flex-1 truncate font-medium">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded font-semibold",
                  item.badgeColor === 'accent' ? "text-accent bg-accent/10" :
                  item.badgeColor === 'primary' ? "text-primary bg-primary/10" :
                  "text-muted-foreground bg-muted"
                )}>
                  {item.badge}
                </span>
              )}
              {item.shortcut && (
                <kbd className="ml-auto text-[10px] px-1.5 py-0.5 bg-muted border border-border rounded font-mono text-muted-foreground shrink-0">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
