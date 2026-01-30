import { useEffect } from 'react';

/**
 * Lock body scroll when component mounts (for modals/overlays)
 * 
 * Usage:
 * function Modal() {
 *   useScrollLock();
 *   
 *   return <div>Modal content</div>;
 * }
 * 
 * // Scroll is locked while Modal is mounted
 * // Auto-restores when Modal unmounts
 */
export function useScrollLock(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    // Get current scroll position
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const scrollY = window.scrollY;

    // Lock scroll
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`; // Prevent layout shift
    document.body.style.top = `-${scrollY}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    return () => {
      // Restore scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.style.top = '';
      document.body.style.position = '';
      document.body.style.width = '';
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [enabled]);
}

/**
 * Toggle scroll lock with a boolean state
 * 
 * Usage:
 * const [locked, setLocked] = useState(false);
 * useScrollLockToggle(locked);
 * 
 * <button onClick={() => setLocked(!locked)}>
 *   {locked ? 'Unlock' : 'Lock'} Scroll
 * </button>
 */
export function useScrollLockToggle(locked: boolean) {
  useScrollLock(locked);
}
