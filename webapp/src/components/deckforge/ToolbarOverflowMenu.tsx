import { ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 px-2 data-[state=open]:bg-accent"
              aria-label={`${items.length} more toolbar items`}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="text-[10px] font-mono text-muted-foreground">{items.length}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <span>{items.length} more items</span>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold py-1.5">
          More Tools
        </DropdownMenuLabel>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            disabled={item.disabled}
            onClick={item.onClick}
            className="gap-3 py-2"
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
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
