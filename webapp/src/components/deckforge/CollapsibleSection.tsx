import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  storageKey?: string; // localStorage key for persistence
  isOpen?: boolean; // controlled mode
  onToggle?: (open: boolean) => void; // controlled mode callback
  activeCount?: number; // count of active properties to show in header
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  storageKey,
  isOpen: controlledIsOpen,
  onToggle,
  activeCount,
  children,
  className,
}: CollapsibleSectionProps) {
  const isControlled = controlledIsOpen !== undefined;

  // Uncontrolled: load from localStorage if storageKey provided
  const [internalIsOpen, setInternalIsOpen] = useState(() => {
    if (isControlled) return controlledIsOpen;
    if (storageKey) {
      const saved = localStorage.getItem(`collapsible-${storageKey}`);
      return saved !== null ? saved === 'true' : defaultOpen;
    }
    return defaultOpen;
  });

  // Sync internal state when controlled value changes
  useEffect(() => {
    if (isControlled) {
      setInternalIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen, isControlled]);

  // Save to localStorage when state changes (uncontrolled mode)
  useEffect(() => {
    if (!isControlled && storageKey) {
      localStorage.setItem(`collapsible-${storageKey}`, String(internalIsOpen));
    }
  }, [internalIsOpen, storageKey, isControlled]);

  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (onToggle) {
      onToggle(next);
    }
    if (!isControlled) {
      setInternalIsOpen(next);
    }
  };

  return (
    <div className={cn("border-b border-border", className)}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/5 transition-colors text-left group"
      >
        <span className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
          {title}
          {activeCount !== undefined && activeCount > 0 && (
            <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
