import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from './button';
import { forwardRef } from 'react';

export interface ButtonLoadingProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

const ButtonLoading = forwardRef<HTMLButtonElement, ButtonLoadingProps>(
  ({ loading = false, loadingText, children, disabled, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {loading && loadingText ? loadingText : children}
      </Button>
    );
  }
);

ButtonLoading.displayName = 'ButtonLoading';

export { ButtonLoading };
