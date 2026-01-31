import { useEffect, useCallback, useRef } from 'react';

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minFingers?: number;
  maxFingers?: number;
  minDistance?: number;
  maxDuration?: number;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Hook for detecting multi-finger swipe gestures on mobile
 * 
 * Usage:
 * ```tsx
 * const elementRef = useSwipeGesture({
 *   onSwipeRight: () => undo(),
 *   onSwipeLeft: () => redo(),
 *   minFingers: 3, // Require 3 fingers to avoid conflicts with pan/zoom
 *   minDistance: 50,
 * });
 * 
 * <div ref={elementRef}>...</div>
 * ```
 */
export function useSwipeGesture<T extends HTMLElement = HTMLDivElement>(
  options: SwipeGestureOptions
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minFingers = 3, // Default to 3 fingers to avoid conflicts with pan/zoom
    maxFingers = 5,
    minDistance = 50, // Minimum swipe distance in pixels
    maxDuration = 500, // Maximum swipe duration in ms
  } = options;

  const elementRef = useRef<T>(null);
  const touchStartRef = useRef<TouchPoint[]>([]);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touches = Array.from(e.touches);
    const fingerCount = touches.length;

    // Only track if finger count is in valid range
    if (fingerCount >= minFingers && fingerCount <= maxFingers) {
      isSwiping.current = true;
      touchStartRef.current = touches.map(t => ({
        x: t.clientX,
        y: t.clientY,
        timestamp: Date.now(),
      }));
    }
  }, [minFingers, maxFingers]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isSwiping.current || touchStartRef.current.length === 0) return;

    const changedTouches = Array.from(e.changedTouches);
    if (changedTouches.length === 0) return;

    const touchEnd = changedTouches[0];
    const touchStart = touchStartRef.current[0];
    
    const deltaX = touchEnd.clientX - touchStart.x;
    const deltaY = touchEnd.clientY - touchStart.y;
    const duration = Date.now() - touchStart.timestamp;

    // Check if swipe meets criteria
    if (duration > maxDuration) {
      isSwiping.current = false;
      touchStartRef.current = [];
      return;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine swipe direction (must meet minimum distance)
    if (absX > absY && absX > minDistance) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absY > absX && absY > minDistance) {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    isSwiping.current = false;
    touchStartRef.current = [];
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minDistance, maxDuration]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Prevent default to avoid scrolling during swipe
    if (isSwiping.current && e.touches.length >= minFingers) {
      e.preventDefault();
    }
  }, [minFingers]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleTouchStart, handleTouchEnd, handleTouchMove]);

  return elementRef;
}
