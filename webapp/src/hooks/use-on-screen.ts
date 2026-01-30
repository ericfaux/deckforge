import { useEffect, useState, RefObject } from 'react';

/**
 * Simple on-screen detection hook
 * 
 * Usage:
 * const ref = useRef<HTMLDivElement>(null);
 * const isOnScreen = useOnScreen(ref);
 * 
 * return (
 *   <div ref={ref} className={isOnScreen ? 'fade-in' : 'opacity-0'}>
 *     Content
 *   </div>
 * );
 */
export function useOnScreen(
  ref: RefObject<Element>,
  rootMargin: string = '0px'
): boolean {
  const [isOnScreen, setIsOnScreen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOnScreen(entry.isIntersecting);
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [ref, rootMargin]);

  return isOnScreen;
}
