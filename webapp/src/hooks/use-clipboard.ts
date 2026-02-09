import { useState } from 'react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface UseClipboardOptions {
  timeout?: number;
  successMessage?: string;
  errorMessage?: string;
}

interface UseClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Custom hook for copying text to clipboard with feedback
 * @param options Configuration options
 * @returns Object with copied state and copy function
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const {
    timeout = 2000,
    successMessage = 'Copied to clipboard',
    errorMessage = 'Failed to copy',
  } = options;

  const [copied, setCopied] = useState(false);

  const copy = async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      logger.warn('Clipboard API not available');
      toast.error(errorMessage);
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage);

      // Reset copied state after timeout
      setTimeout(() => {
        setCopied(false);
      }, timeout);

      return true;
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error(errorMessage);
      setCopied(false);
      return false;
    }
  };

  const reset = () => {
    setCopied(false);
  };

  return { copied, copy, reset };
}
