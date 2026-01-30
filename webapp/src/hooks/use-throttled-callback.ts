import { useCallback, useRef } from 'react';

/**
 * Throttle a callback function (max once per interval)
 * 
 * Usage:
 * const handleScroll = useThrottledCallback((e: Event) => {
 *   updateScrollPosition();
 * }, 100);
 * 
 * window.addEventListener('scroll', handleScroll);
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const lastRan = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, delay - (now - lastRan.current));
      }
    }) as T,
    [callback, delay]
  );
}
