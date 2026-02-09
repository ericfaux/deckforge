/**
 * Performance monitoring and optimization utilities
 */

import { logger } from './logger';

/**
 * Debounce function - delays execution until after wait time has elapsed
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImage(img: HTMLImageElement) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement;
        const src = target.dataset.src;
        if (src) {
          target.src = src;
          target.removeAttribute('data-src');
          observer.unobserve(target);
        }
      }
    });
  });

  observer.observe(img);
  return () => observer.disconnect();
}

/**
 * Measure and log performance metrics
 */
export const perf = {
  /**
   * Measure time taken for a function
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    logger.log(`[Perf] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  },

  /**
   * Measure async function
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    logger.log(`[Perf] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  },

  /**
   * Mark a performance entry
   */
  mark(name: string) {
    performance.mark(name);
  },

  /**
   * Measure between two marks
   */
  measureBetween(measureName: string, startMark: string, endMark: string) {
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];
    logger.log(`[Perf] ${measureName}: ${measure.duration.toFixed(2)}ms`);
  },

  /**
   * Get navigation timing metrics
   */
  getNavigationTiming() {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!perfData) return null;

    return {
      dns: perfData.domainLookupEnd - perfData.domainLookupStart,
      tcp: perfData.connectEnd - perfData.connectStart,
      ttfb: perfData.responseStart - perfData.requestStart,
      download: perfData.responseEnd - perfData.responseStart,
      domInteractive: perfData.domInteractive - perfData.fetchStart,
      domComplete: perfData.domComplete - perfData.fetchStart,
      loadComplete: perfData.loadEventEnd - perfData.fetchStart,
    };
  },

  /**
   * Log all navigation metrics
   */
  logNavigationTiming() {
    const timing = this.getNavigationTiming();
    if (!timing) {
      logger.log('[Perf] Navigation timing not available');
      return;
    }

    if (import.meta.env.DEV) {
      console.group('[Perf] Navigation Timing');
      console.log(`DNS: ${timing.dns.toFixed(2)}ms`);
      console.log(`TCP: ${timing.tcp.toFixed(2)}ms`);
      console.log(`TTFB: ${timing.ttfb.toFixed(2)}ms`);
      console.log(`Download: ${timing.download.toFixed(2)}ms`);
      console.log(`DOM Interactive: ${timing.domInteractive.toFixed(2)}ms`);
      console.log(`DOM Complete: ${timing.domComplete.toFixed(2)}ms`);
      console.log(`Load Complete: ${timing.loadComplete.toFixed(2)}ms`);
      console.groupEnd();
    }
  },
};

/**
 * Request idle callback wrapper with fallback
 */
export function requestIdleCallback(callback: () => void, timeout = 1000) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  } else {
    // Fallback for Safari
    return setTimeout(callback, 1);
  }
}

/**
 * Cancel idle callback wrapper
 */
export function cancelIdleCallback(id: number) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Check if user has a slow connection
 */
export function isSlowConnection(): boolean {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (!connection) return false;

  // 2g or slow-2g
  return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
}

/**
 * Check if user prefers reduced data
 */
export function prefersReducedData(): boolean {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  return connection?.saveData === true;
}
