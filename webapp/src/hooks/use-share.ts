import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export interface UseShareReturn {
  share: (data: ShareData) => Promise<boolean>;
  isSupported: boolean;
  isSharing: boolean;
}

/**
 * Web Share API hook with fallback to copy link
 * 
 * Usage:
 * const { share, isSupported } = useShare();
 * 
 * <button onClick={() => share({
 *   title: 'My Design',
 *   url: 'https://deckforge.com/design/123'
 * })}>
 *   Share
 * </button>
 */
export function useShare(): UseShareReturn {
  const [isSharing, setIsSharing] = useState(false);

  const isSupported = typeof navigator !== 'undefined' && !!navigator.share;

  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    setIsSharing(true);

    try {
      if (isSupported) {
        // Use native share dialog
        await navigator.share(data);
        setIsSharing(false);
        return true;
      } else {
        // Fallback: copy URL to clipboard
        if (data.url) {
          await navigator.clipboard.writeText(data.url);
          toast.success('Link copied to clipboard');
          setIsSharing(false);
          return true;
        } else {
          toast.error('No URL to share');
          setIsSharing(false);
          return false;
        }
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        toast.error('Failed to share');
      }
      setIsSharing(false);
      return false;
    }
  }, [isSupported]);

  return { share, isSupported, isSharing };
}
