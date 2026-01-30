import { useState, useEffect } from 'react';

export interface BatteryStatus {
  supported: boolean;
  loading: boolean;
  level: number | null; // 0-1 (e.g., 0.5 = 50%)
  charging: boolean | null;
  chargingTime: number | null; // seconds until fully charged
  dischargingTime: number | null; // seconds until empty
}

/**
 * Monitor device battery status (PWA/mobile)
 * 
 * Usage:
 * const battery = useBattery();
 * 
 * {battery.level && battery.level < 0.2 && !battery.charging && (
 *   <Notice>Low battery - consider reducing animations</Notice>
 * )}
 */
export function useBattery(): BatteryStatus {
  const [status, setStatus] = useState<BatteryStatus>({
    supported: false,
    loading: true,
    level: null,
    charging: null,
    chargingTime: null,
    dischargingTime: null,
  });

  useEffect(() => {
    // Check if Battery API is supported
    if (!('getBattery' in navigator)) {
      setStatus((prev) => ({ ...prev, supported: false, loading: false }));
      return;
    }

    let battery: any;

    const updateBatteryStatus = (batteryManager: any) => {
      setStatus({
        supported: true,
        loading: false,
        level: batteryManager.level,
        charging: batteryManager.charging,
        chargingTime: batteryManager.chargingTime === Infinity ? null : batteryManager.chargingTime,
        dischargingTime: batteryManager.dischargingTime === Infinity ? null : batteryManager.dischargingTime,
      });
    };

    (navigator as any).getBattery().then((batteryManager: any) => {
      battery = batteryManager;
      updateBatteryStatus(battery);

      // Listen for battery changes
      battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
      battery.addEventListener('chargingchange', () => updateBatteryStatus(battery));
      battery.addEventListener('chargingtimechange', () => updateBatteryStatus(battery));
      battery.addEventListener('dischargingtimechange', () => updateBatteryStatus(battery));
    }).catch(() => {
      setStatus((prev) => ({ ...prev, supported: false, loading: false }));
    });

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', () => updateBatteryStatus(battery));
        battery.removeEventListener('chargingchange', () => updateBatteryStatus(battery));
        battery.removeEventListener('chargingtimechange', () => updateBatteryStatus(battery));
        battery.removeEventListener('dischargingtimechange', () => updateBatteryStatus(battery));
      }
    };
  }, []);

  return status;
}

/**
 * Helper to check if device is in power-saving mode
 */
export function useLowPowerMode(): boolean {
  const battery = useBattery();
  
  if (!battery.supported || battery.loading) {
    return false;
  }

  // Consider low power if:
  // - Battery < 20% and not charging
  // - Battery < 10% regardless of charging
  const lowBattery = battery.level !== null && battery.level < 0.2 && !battery.charging;
  const criticalBattery = battery.level !== null && battery.level < 0.1;

  return lowBattery || criticalBattery;
}
