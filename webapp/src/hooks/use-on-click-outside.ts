import { useEffect, RefObject } from 'react';

/**
 * Custom hook to detect clicks outside of a specified element
 * Useful for dropdowns, modals, popovers, etc.
 * @param ref - React ref of the element
 * @param handler - Callback function to execute on outside click
 * @param enabled - Whether the listener is enabled (default: true)
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      
      // Do nothing if clicking ref's element or descendent elements
      if (!element || element.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    // Add event listeners
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
}
