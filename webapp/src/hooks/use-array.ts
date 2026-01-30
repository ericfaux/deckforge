import { useState, useCallback } from 'react';

/**
 * Array state management with helper functions
 * 
 * Usage:
 * const { value, push, remove, clear, filter, update } = useArray<string>([]);
 * 
 * push('item');
 * remove(0);
 * filter(item => item !== 'item');
 */
export function useArray<T>(initialValue: T[] = []) {
  const [value, setValue] = useState(initialValue);

  const push = useCallback((item: T) => {
    setValue((arr) => [...arr, item]);
  }, []);

  const remove = useCallback((index: number) => {
    setValue((arr) => arr.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => {
    setValue([]);
  }, []);

  const filter = useCallback((callback: (item: T, index: number) => boolean) => {
    setValue((arr) => arr.filter(callback));
  }, []);

  const update = useCallback((index: number, item: T) => {
    setValue((arr) => arr.map((v, i) => (i === index ? item : v)));
  }, []);

  const set = useCallback((newValue: T[]) => {
    setValue(newValue);
  }, []);

  return { value, set, push, remove, clear, filter, update };
}
