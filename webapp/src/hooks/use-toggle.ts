import { useState, useCallback } from 'react';

/**
 * Boolean toggle hook with helper functions
 * 
 * Usage:
 * const [isOpen, toggle, setTrue, setFalse] = useToggle(false);
 * 
 * <button onClick={toggle}>Toggle</button>
 * <button onClick={setTrue}>Open</button>
 * <button onClick={setFalse}>Close</button>
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, () => void, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse];
}
