import { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { Input, InputProps } from './input';
import { cn } from '@/lib/utils';

export interface InputWithIconProps extends InputProps {
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

const InputWithIcon = forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ icon: Icon, iconPosition = 'left', className, ...props }, ref) => {
    if (!Icon) {
      return <Input ref={ref} className={className} {...props} />;
    }

    return (
      <div className="relative">
        {iconPosition === 'left' && Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <Input
          ref={ref}
          className={cn(
            Icon && iconPosition === 'left' && 'pl-9',
            Icon && iconPosition === 'right' && 'pr-9',
            className
          )}
          {...props}
        />
        {iconPosition === 'right' && Icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    );
  }
);

InputWithIcon.displayName = 'InputWithIcon';

export { InputWithIcon };
