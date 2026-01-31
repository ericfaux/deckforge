import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface UseCopyToClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

export interface UseCopyToClipboardOptions {
  timeout?: number;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
}

/**
 * Copy text to clipboard with feedback
 * 
 * Usage:
 * const { copied, copy } = useCopyToClipboard();
 * 
 * <button onClick={() => copy('https://deckforge.com/design/123')}>
 *   {copied ? 'Copied!' : 'Copy Link'}
 * </button>
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const {
    timeout = 2000,
    successMessage = 'Copied to clipboard',
    errorMessage = 'Failed to copy',
    showToast = true,
  } = options;

  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        console.warn('Clipboard API not available');
        if (showToast) {
          toast.error(errorMessage);
        }
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        if (showToast) {
          toast.success(successMessage);
        }

        setTimeout(() => {
          setCopied(false);
        }, timeout);

        return true;
      } catch (error) {
        console.error('Failed to copy:', error);
        if (showToast) {
          toast.error(errorMessage);
        }
        setCopied(false);
        return false;
      }
    },
    [timeout, successMessage, errorMessage, showToast]
  );

  const reset = useCallback(() => {
    setCopied(false);
  }, []);

  return { copied, copy, reset };
}
