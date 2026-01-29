import { useEffect, useRef } from 'react';

interface TouchGesturesOptions {
  onPinch?: (scale: number, centerX: number, centerY: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onDoubleTap?: () => void;
}

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  options: TouchGesturesOptions
) {
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touch1: Touch, touch2: Touch) => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch gesture start
        const distance = getTouchDistance(e.touches[0], e.touches[1]);
        const center = getTouchCenter(e.touches[0], e.touches[1]);
        lastTouchDistance.current = distance;
        lastTouchCenter.current = center;
      } else if (e.touches.length === 1) {
        // Pan gesture start or tap
        const now = Date.now();
        const timeSinceLastTap = now - lastTap.current;
        
        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
          // Double tap
          options.onDoubleTap?.();
        }
        
        lastTap.current = now;
        lastTouchCenter.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        // Pinch gesture
        e.preventDefault();
        
        const newDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const newCenter = getTouchCenter(e.touches[0], e.touches[1]);
        const scale = newDistance / lastTouchDistance.current;
        
        options.onPinch?.(scale, newCenter.x, newCenter.y);
        
        lastTouchDistance.current = newDistance;
        lastTouchCenter.current = newCenter;
      } else if (e.touches.length === 1 && lastTouchCenter.current !== null) {
        // Pan gesture
        const deltaX = e.touches[0].clientX - lastTouchCenter.current.x;
        const deltaY = e.touches[0].clientY - lastTouchCenter.current.y;
        
        options.onPan?.(deltaX, deltaY);
        
        lastTouchCenter.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchEnd = () => {
      lastTouchDistance.current = null;
      lastTouchCenter.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [elementRef, options]);
}
