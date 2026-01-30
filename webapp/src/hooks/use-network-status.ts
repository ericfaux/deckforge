import { useState, useEffect } from 'react';

export interface NetworkStatus {
  online: boolean;
  downlink?: number; // Mbps
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  saveData?: boolean;
}

/**
 * Monitor network connection status
 * 
 * Usage:
 * const { online, downlink, effectiveType, saveData } = useNetworkStatus();
 * 
 * {!online && <Banner>You're offline. Changes will sync when reconnected.</Banner>}
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  }));

  useEffect(() => {
    const updateStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

      setStatus({
        online: navigator.onLine,
        downlink: connection?.downlink,
        effectiveType: connection?.effectiveType,
        saveData: connection?.saveData,
      });
    };

    // Initial update
    updateStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return status;
}

/**
 * Simple online/offline hook
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
