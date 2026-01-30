import { useState, useEffect, RefObject } from 'react';

export interface ResizeObserverSize {
  width: number;
  height: number;
}

/**
 * Observe element size changes with ResizeObserver
 * 
 * Usage:
 * const ref = useRef<HTMLDivElement>(null);
 * const size = useResizeObserver(ref);
 * 
 * <div ref={ref}>
 *   Current size: {size.width}x{size.height}
 * </div>
 */
export function useResizeObserver<T extends HTMLElement>(
  ref: RefObject<T>
): ResizeObserverSize {
  const [size, setSize] = useState<ResizeObserverSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(element);

    // Set initial size
    const rect = element.getBoundingClientRect();
    setSize({
      width: rect.width,
      height: rect.height,
    });

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return size;
}

/**
 * Observe element size with callback
 * 
 * Usage:
 * const ref = useRef(null);
 * useResizeObserverCallback(ref, (size) => {
 *   console.log('Element resized:', size);
 * });
 */
export function useResizeObserverCallback<T extends HTMLElement>(
  ref: RefObject<T>,
  callback: (size: ResizeObserverSize) => void
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        callback({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, callback]);
}
