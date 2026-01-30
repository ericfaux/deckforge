import { useEffect, RefObject } from 'react';

/**
 * Detect clicks outside an element
 * 
 * Usage:
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setIsOpen(false));
 * 
 * return <div ref={ref}>Content</div>;
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      if (!element) return;

      // Do nothing if clicking ref's element or descendent elements
      if (element.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
}

/**
 * Detect clicks outside multiple elements
 * 
 * Usage:
 * const buttonRef = useRef(null);
 * const menuRef = useRef(null);
 * 
 * useClickOutsideMultiple([buttonRef, menuRef], () => setIsOpen(false));
 */
export function useClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
  refs: RefObject<T>[],
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      // Check if click is inside any of the refs
      const clickedInside = refs.some((ref) => {
        const element = ref.current;
        return element && element.contains(event.target as Node);
      });

      if (!clickedInside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, handler, enabled]);
}
