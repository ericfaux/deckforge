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
    // TEMPORARY: Disabled all toasts to test
    console.log('[toastUtils.success]', message, description);
    return;
    // return toast.success(message, {
    //   description,
    //   icon: <CheckCircle2 className="w-4 h-4" />,
    //   duration: 3000,
    // });
  },

  /**
   * Error toast with X icon
   */
  error(message: string, description?: string) {
    // TEMPORARY: Disabled all toasts to test
    console.log('[toastUtils.error]', message, description);
    return;
    // return toast.error(message, {
    //   description,
    //   icon: <XCircle className="w-4 h-4" />,
    //   duration: 5000, // Longer for errors
    // });
  },

  /**
   * Warning toast
   */
  warning(message: string, description?: string) {
    console.log('[toastUtils.warning]', message, description);
    return;
  },

  /**
   * Info toast
   */
  info(message: string, description?: string) {
    console.log('[toastUtils.info]', message, description);
    return;
  },

  /**
   * Loading toast that returns a dismiss function
   */
  loading(message: string, description?: string) {
    console.log('[toastUtils.loading]', message, description);
    return {
      id: 'disabled',
      dismiss: () => {},
      success: (successMessage: string, successDescription?: string) => {},
      error: (errorMessage: string, errorDescription?: string) => {},
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
