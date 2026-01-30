import { useState } from 'react';

interface UseConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

/**
 * Hook for programmatic confirmation dialogs
 * 
 * Usage:
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirm({
 *   title: 'Delete design?',
 *   description: 'This action cannot be undone.',
 *   confirmText: 'Delete',
 *   variant: 'destructive',
 * });
 * 
 * const handleDelete = async () => {
 *   if (await confirm()) {
 *     // User confirmed
 *     deleteDesign();
 *   }
 * };
 * 
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog />
 *   </>
 * );
 * ```
 */
export function useConfirm(options: UseConfirmOptions) {
  const [open, setOpen] = useState(false);
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

  const confirm = (): Promise<boolean> => {
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveCallback(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolveCallback) {
      resolveCallback(true);
      setResolveCallback(null);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    if (resolveCallback) {
      resolveCallback(false);
      setResolveCallback(null);
    }
    setOpen(false);
  };

  const ConfirmDialogComponent = () => {
    const { ConfirmDialog } = require('@/components/ui/confirm-dialog');
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={(newOpen: boolean) => {
          if (!newOpen) handleCancel();
        }}
        onConfirm={handleConfirm}
        {...options}
      />
    );
  };

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
}
