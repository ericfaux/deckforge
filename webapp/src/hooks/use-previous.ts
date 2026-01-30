import { useEffect, useRef } from 'react';

/**
 * Get the previous value of a variable
 * 
 * Usage:
 * const [count, setCount] = useState(0);
 * const previousCount = usePrevious(count);
 * 
 * // count = 5, previousCount = 4
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
