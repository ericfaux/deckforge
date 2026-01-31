import React from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

/**
 * Enhanced toast utilities with consistent styling and icons
 */

export const toastUtils = {
  /**
   * Success toast with checkmark icon
   */
  success(message: string, description?: string) {
    return toast.success(message, {
      description,
      icon: <CheckCircle2 className="w-4 h-4" />,
      duration: 3000,
    });
  },

  /**
   * Error toast with X icon
   */
  error(message: string, description?: string) {
    return toast.error(message, {
      description,
      icon: <XCircle className="w-4 h-4" />,
      duration: 5000, // Longer for errors
    });
  },

  /**
   * Warning toast
   */
  warning(message: string, description?: string) {
    return toast.warning(message, {
      description,
      icon: <AlertTriangle className="w-4 h-4" />,
      duration: 4000,
    });
  },

  /**
   * Info toast
   */
  info(message: string, description?: string) {
    return toast.info(message, {
      description,
      icon: <Info className="w-4 h-4" />,
      duration: 3000,
    });
  },

  /**
   * Loading toast that returns a dismiss function
   */
  loading(message: string, description?: string) {
    const id = toast.loading(message, {
      description,
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
    });
    
    return {
      id,
      dismiss: () => toast.dismiss(id),
      success: (successMessage: string, successDescription?: string) => {
        toast.success(successMessage, {
          id,
          description: successDescription,
          icon: <CheckCircle2 className="w-4 h-4" />,
        });
      },
      error: (errorMessage: string, errorDescription?: string) => {
        toast.error(errorMessage, {
          id,
          description: errorDescription,
          icon: <XCircle className="w-4 h-4" />,
        });
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
