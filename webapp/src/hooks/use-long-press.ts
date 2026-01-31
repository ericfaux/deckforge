import { useCallback, useRef, useEffect } from 'react';

export interface LongPressOptions {
  onLongPress: (e: TouchEvent | MouseEvent) => void;
  onClick?: (e: TouchEvent | MouseEvent) => void;
  delay?: number; // milliseconds to hold before triggering
  moveThreshold?: number; // pixels of movement allowed before canceling
}

/**
 * Hook for detecting long-press gestures (mobile and desktop)
 * 
 * Usage:
 * ```tsx
 * const elementRef = useLongPress({
 *   onLongPress: () => showContextMenu(),
 *   onClick: () => selectObject(),
 *   delay: 500, // 500ms hold time
 *   moveThreshold: 10, // Cancel if finger moves >10px
 * });
 * 
 * <div ref={elementRef}>...</div>
 * ```
 */
export function useLongPress<T extends HTMLElement = HTMLElement>(
  options: LongPressOptions
) {
  const {
    onLongPress,
    onClick,
    delay = 500,
    moveThreshold = 10,
  } = options;

  const elementRef = useRef<T>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const isLongPressRef = useRef(false);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    startPos.current = null;
    isLongPressRef.current = false;
  }, []);

  const handleStart = useCallback((e: TouchEvent | MouseEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    startPos.current = { x, y };
    isLongPressRef.current = false;

    // Haptic feedback on touch start (subtle)
    if ('vibrate' in navigator && 'touches' in e) {
      navigator.vibrate(5);
    }

    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress(e);
      
      // Haptic feedback on long press trigger (stronger)
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]); // Double vibration
      }
    }, delay);
  }, [delay, onLongPress]);

  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!startPos.current) return;

    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const distance = Math.hypot(x - startPos.current.x, y - startPos.current.y);

    // Cancel long press if finger/mouse moved too much
    if (distance > moveThreshold) {
      clear();
    }
  }, [moveThreshold, clear]);

  const handleEnd = useCallback((e: TouchEvent | MouseEvent) => {
    // If long press was triggered, don't call onClick
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
    } else if (onClick && timeoutRef.current) {
      // Normal click/tap
      onClick(e);
    }
    
    clear();
  }, [onClick, clear]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleStart as EventListener, { passive: false });
    element.addEventListener('touchmove', handleMove as EventListener, { passive: false });
    element.addEventListener('touchend', handleEnd as EventListener, { passive: false });
    element.addEventListener('touchcancel', clear, { passive: false });

    // Mouse events (for desktop testing)
    element.addEventListener('mousedown', handleStart as EventListener);
    element.addEventListener('mousemove', handleMove as EventListener);
    element.addEventListener('mouseup', handleEnd as EventListener);
    element.addEventListener('mouseleave', clear);

    return () => {
      element.removeEventListener('touchstart', handleStart as EventListener);
      element.removeEventListener('touchmove', handleMove as EventListener);
      element.removeEventListener('touchend', handleEnd as EventListener);
      element.removeEventListener('touchcancel', clear);
      
      element.removeEventListener('mousedown', handleStart as EventListener);
      element.removeEventListener('mousemove', handleMove as EventListener);
      element.removeEventListener('mouseup', handleEnd as EventListener);
      element.removeEventListener('mouseleave', clear);
      
      clear();
    };
  }, [handleStart, handleMove, handleEnd, clear]);

  return elementRef;
}
