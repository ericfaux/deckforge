import { Check, Copy } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';

interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  value: string;
  successMessage?: string;
  errorMessage?: string;
}

export function CopyButton({
  value,
  successMessage,
  errorMessage,
  className,
  ...props
}: CopyButtonProps) {
  const { copied, copy } = useClipboard({ successMessage, errorMessage });

  return (
    <Button
      {...props}
      onClick={() => copy(value)}
      className={cn('gap-2', className)}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy
        </>
      )}
    </Button>
  );
}
