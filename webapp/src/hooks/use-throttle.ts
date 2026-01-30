import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to throttle a callback function
 * Ensures the callback is called at most once per specified interval
 * @param callback - The function to throttle
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Throttled callback function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const lastRun = useRef<number>(Date.now());
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        // Enough time has passed, call immediately
        callback(...args);
        lastRun.current = now;
      } else {
        // Not enough time, schedule for later
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }

        timeoutId.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  );
}
