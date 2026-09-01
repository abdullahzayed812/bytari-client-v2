import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import { createLogger } from '@/lib/logger';

const log = createLogger('location');

export type LocationErrorReason = 'permission_denied' | 'unavailable' | 'error';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UseCurrentLocationResult {
  isLoading: boolean;
  error: LocationErrorReason | null;
  /** Resolves the device's current coordinates, or `null` if unavailable/denied. */
  request: () => Promise<Coordinates | null>;
}

/**
 * One-shot device location — permission request → services check → fix.
 * Never estimates or caches a stale position across calls; every `request()`
 * asks the OS fresh. Used for "nearest" sorting (e.g. `DiscoverClinicsScreen`)
 * — the coordinates are sent to the backend, which computes real distance;
 * this hook never computes distance itself.
 */
export function useCurrentLocation(): UseCurrentLocationResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LocationErrorReason | null>(null);

  const request = useCallback(async (): Promise<Coordinates | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('permission_denied');
        return null;
      }
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError('unavailable');
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch (err) {
      log.warn('failed to resolve current location', {
        message: err instanceof Error ? err.message : String(err),
      });
      setError('error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, request };
}
