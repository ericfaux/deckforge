import { useEffect, useRef } from 'react';

/**
 * Custom hook to get the previous value of a variable
 * Useful for comparing with current value in useEffect
 * @param value - The current value
 * @returns The previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
