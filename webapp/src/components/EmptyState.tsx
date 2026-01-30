import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in-50 duration-500", className)}>
      {Icon && (
        <div className="mb-6 relative group">
          {/* Animated background glow */}
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl group-hover:bg-primary/20 transition-all duration-500" />
          
          {/* Icon container with gradient border */}
          <div className="relative rounded-full bg-gradient-to-br from-muted to-muted/50 p-6 shadow-lg">
            <Icon className="w-12 h-12 text-muted-foreground/80 group-hover:text-primary transition-colors duration-300" />
          </div>
        </div>
      )}
      
      <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
          {description}
        </p>
      )}
      
      {action && (
        <Button 
          onClick={action.onClick} 
          size="lg"
          className="shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
