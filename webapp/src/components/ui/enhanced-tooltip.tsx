import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export interface EnhancedTooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  shortcut?: string | string[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  disabled?: boolean;
}

/**
 * Enhanced tooltip with keyboard shortcut support
 * 
 * Usage:
 * <EnhancedTooltip content="Save design" shortcut="Ctrl+S">
 *   <Button>Save</Button>
 * </EnhancedTooltip>
 * 
 * Or with multiple shortcuts:
 * <EnhancedTooltip content="Delete" shortcut={['Delete', 'Backspace']}>
 *   <Button>Delete</Button>
 * </EnhancedTooltip>
 */
export function EnhancedTooltip({
  children,
  content,
  shortcut,
  side = 'top',
  align = 'center',
  delayDuration = 200,
  disabled = false,
}: EnhancedTooltipProps) {
  if (disabled) {
    return children;
  }

  const shortcuts = Array.isArray(shortcut) ? shortcut : shortcut ? [shortcut] : [];

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            className={cn(
              'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2',
              'data-[side=top]:slide-in-from-bottom-2'
            )}
            sideOffset={5}
          >
            <div className="flex items-center gap-2">
              <span>{content}</span>
              {shortcuts.length > 0 && (
                <span className="flex items-center gap-1">
                  {shortcuts.map((key, index) => (
                    <React.Fragment key={key}>
                      {index > 0 && <span className="text-primary-foreground/50">or</span>}
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-primary-foreground/20 bg-primary-foreground/10 px-1.5 font-mono text-[10px] font-medium text-primary-foreground">
                        {key}
                      </kbd>
                    </React.Fragment>
                  ))}
                </span>
              )}
            </div>
            <TooltipPrimitive.Arrow className="fill-primary" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

/**
 * Simple tooltip wrapper (no shortcuts)
 */
export function SimpleTooltip({
  children,
  content,
  ...props
}: Omit<EnhancedTooltipProps, 'shortcut'>) {
  return (
    <EnhancedTooltip content={content} {...props}>
      {children}
    </EnhancedTooltip>
  );
}
