import { useState, useEffect, useCallback } from 'react';

export interface UseIdleOptions {
  /**
   * Idle timeout in milliseconds
   */
  timeout: number;
  
  /**
   * Events to listen for (default: mousemove, mousedown, keydown, touchstart, scroll)
   */
  events?: string[];
  
  /**
   * Initial idle state
   */
  initialState?: boolean;
}

/**
 * Detect user inactivity
 * 
 * Usage:
 * const isIdle = useIdle({ timeout: 5 * 60 * 1000 }); // 5 minutes
 * 
 * useEffect(() => {
 *   if (isIdle) {
 *     autoSave();
 *   }
 * }, [isIdle]);
 */
export function useIdle({
  timeout,
  events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'],
  initialState = false,
}: UseIdleOptions): boolean {
  const [isIdle, setIsIdle] = useState(initialState);

  const handleActivity = useCallback(() => {
    setIsIdle(false);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      setIsIdle(false);
      
      timeoutId = setTimeout(() => {
        setIsIdle(true);
      }, timeout);
    };

    // Set initial timer
    resetTimer();

    // Listen for activity
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [timeout, events]);

  return isIdle;
}
