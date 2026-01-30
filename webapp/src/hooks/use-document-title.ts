import { useEffect, useRef } from 'react';

/**
 * Custom hook to set the document title
 * Automatically restores the previous title on unmount
 * @param title - The title to set
 * @param options - Configuration options
 */
export function useDocumentTitle(
  title: string,
  options: {
    restoreOnUnmount?: boolean;
    suffix?: string;
    prefix?: string;
  } = {}
): void {
  const { restoreOnUnmount = false, suffix = '', prefix = '' } = options;
  const prevTitleRef = useRef<string>(document.title);

  useEffect(() => {
    const fullTitle = `${prefix}${title}${suffix}`;
    document.title = fullTitle;

    return () => {
      if (restoreOnUnmount) {
        document.title = prevTitleRef.current;
      }
    };
  }, [title, restoreOnUnmount, suffix, prefix]);
}
