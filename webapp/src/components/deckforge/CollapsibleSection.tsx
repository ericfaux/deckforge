import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  storageKey?: string; // localStorage key for persistence
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  storageKey,
  children,
  className,
}: CollapsibleSectionProps) {
  // Load open state from localStorage if storageKey provided
  const [isOpen, setIsOpen] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`collapsible-${storageKey}`);
      return saved !== null ? saved === 'true' : defaultOpen;
    }
    return defaultOpen;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`collapsible-${storageKey}`, String(isOpen));
    }
  }, [isOpen, storageKey]);

  return (
    <div className={cn("border-b border-border", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/5 transition-colors text-left group"
      >
        <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
          {title}
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
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
