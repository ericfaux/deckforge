import toast from 'react-hot-toast';

/**
 * Enhanced toast utilities with consistent styling
 * Using react-hot-toast (simpler, more stable than Sonner)
 */

export const toastUtils = {
  /**
   * Success toast
   */
  success(message: string, description?: string) {
    const content = description ? `${message}\n${description}` : message;
    return toast.success(content, {
      duration: 3000,
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    });
  },

  /**
   * Error toast
   */
  error(message: string, description?: string) {
    const content = description ? `${message}\n${description}` : message;
    return toast.error(content, {
      duration: 5000,
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--destructive))',
      },
    });
  },

  /**
   * Warning toast (custom styling)
   */
  warning(message: string, description?: string) {
    const content = description ? `${message}\n${description}` : message;
    return toast(content, {
      icon: '⚠️',
      duration: 4000,
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(38 92% 50%)',
      },
    });
  },

  /**
   * Info toast
   */
  info(message: string, description?: string) {
    const content = description ? `${message}\n${description}` : message;
    return toast(content, {
      icon: 'ℹ️',
      duration: 3000,
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    });
  },

  /**
   * Loading toast that returns a dismiss function
   */
  loading(message: string, description?: string) {
    const content = description ? `${message}\n${description}` : message;
    const id = toast.loading(content, {
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    });
    
    return {
      id,
      dismiss: () => toast.dismiss(id),
      success: (successMessage: string, successDescription?: string) => {
        const successContent = successDescription 
          ? `${successMessage}\n${successDescription}` 
          : successMessage;
        toast.success(successContent, { id });
      },
      error: (errorMessage: string, errorDescription?: string) => {
        const errorContent = errorDescription 
          ? `${errorMessage}\n${errorDescription}` 
          : errorMessage;
        toast.error(errorContent, { id });
      },
    };
  },

  /**
   * Promise toast - automatically handles loading/success/error states
   */
  promise<T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  /**
   * Dismiss a specific toast
   */
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    toast.dismiss();
  },
};
