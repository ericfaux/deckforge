import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  loading: boolean;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  timestamp: number | null;
  error: GeolocationPositionError | null;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
  watch?: boolean; // Continuous tracking
}

/**
 * Get user's current location
 * 
 * Usage:
 * const { latitude, longitude, error, loading } = useGeolocation();
 * 
 * {latitude && longitude && (
 *   <Map center={[latitude, longitude]} />
 * )}
 */
export function useGeolocation(options: UseGeolocationOptions = {}): GeolocationState {
  const {
    enableHighAccuracy = false,
    maximumAge = 0,
    timeout = Infinity,
    watch = false,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    loading: true,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: null,
    longitude: null,
    speed: null,
    timestamp: null,
    error: null,
  });

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      loading: false,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: position.coords.speed,
      timestamp: position.timestamp,
      error: null,
    });
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      loading: false,
      error,
    }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: {
          code: 0,
          message: 'Geolocation not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
      }));
      return;
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      maximumAge,
      timeout,
    };

    if (watch) {
      const watchId = navigator.geolocation.watchPosition(onSuccess, onError, geoOptions);
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions);
    }
  }, [enableHighAccuracy, maximumAge, timeout, watch, onSuccess, onError]);

  return state;
}

/**
 * Request location permission and get coordinates
 */
export function useGeolocationOnce() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, []);

  return { coords, error, loading, requestLocation };
}
