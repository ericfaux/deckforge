import { useEffect, useCallback } from 'react';

export interface KeyboardOptions {
  /**
   * Prevent default browser behavior
   */
  preventDefault?: boolean;
  
  /**
   * Only trigger when not typing in inputs
   */
  excludeInputs?: boolean;
  
  /**
   * Require Ctrl/Cmd key
   */
  ctrl?: boolean;
  
  /**
   * Require Shift key
   */
  shift?: boolean;
  
  /**
   * Require Alt key
   */
  alt?: boolean;
}

/**
 * Listen for keyboard shortcuts globally
 * 
 * Usage:
 * useKeyboard('/', () => focusSearch(), { excludeInputs: true });
 * useKeyboard('s', () => save(), { ctrl: true, preventDefault: true });
 */
export function useKeyboard(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardOptions = {}
) {
  const {
    preventDefault = false,
    excludeInputs = false,
    ctrl = false,
    shift = false,
    alt = false,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if typing in input
      if (excludeInputs) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Check modifier keys
      const ctrlPressed = event.ctrlKey || event.metaKey; // metaKey = Cmd on Mac
      if (ctrl && !ctrlPressed) return;
      if (!ctrl && ctrlPressed) return;

      if (shift && !event.shiftKey) return;
      if (!shift && event.shiftKey && key.length === 1) return; // Don't match shifted keys

      if (alt && !event.altKey) return;
      if (!alt && event.altKey) return;

      // Check key match (case-insensitive)
      if (event.key.toLowerCase() === key.toLowerCase()) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    },
    [key, callback, preventDefault, excludeInputs, ctrl, shift, alt]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Listen for multiple keyboard shortcuts
 * 
 * Usage:
 * useKeyboardShortcuts({
 *   's': { handler: save, ctrl: true },
 *   '/': { handler: focusSearch, excludeInputs: true },
 *   'Escape': { handler: closeModal }
 * });
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, { handler: (event: KeyboardEvent) => void } & KeyboardOptions>
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const [key, config] of Object.entries(shortcuts)) {
        const { handler, ...options } = config;
        
        // Check if typing in input
        if (options.excludeInputs) {
          const target = event.target as HTMLElement;
          if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable
          ) {
            continue;
          }
        }

        // Check modifier keys
        const ctrlPressed = event.ctrlKey || event.metaKey;
        if (options.ctrl && !ctrlPressed) continue;
        if (!options.ctrl && ctrlPressed) continue;

        if (options.shift && !event.shiftKey) continue;
        if (options.alt && !event.altKey) continue;

        // Check key match
        if (event.key.toLowerCase() === key.toLowerCase()) {
          if (options.preventDefault) {
            event.preventDefault();
          }
          handler(event);
          break; // Only trigger first match
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
