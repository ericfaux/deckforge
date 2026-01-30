import { useState, useEffect } from 'react';

/**
 * Track if page is visible or hidden (tab switching)
 * 
 * Usage:
 * const isVisible = usePageVisibility();
 * 
 * useEffect(() => {
 *   if (isVisible) {
 *     resumeAnimations();
 *   } else {
 *     pauseAnimations();
 *   }
 * }, [isVisible]);
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return !document.hidden;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

/**
 * Run callback when page becomes visible/hidden
 * 
 * Usage:
 * usePageVisibilityCallback({
 *   onVisible: () => console.log('Tab became visible'),
 *   onHidden: () => console.log('Tab hidden')
 * });
 */
export function usePageVisibilityCallback({
  onVisible,
  onHidden,
}: {
  onVisible?: () => void;
  onHidden?: () => void;
}) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onHidden?.();
      } else {
        onVisible?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onVisible, onHidden]);
}
