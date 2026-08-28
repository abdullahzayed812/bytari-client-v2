import { useEffect, useState } from 'react';

import { AppConfig } from '@/constants/config';

/** Debounce a rapidly-changing value (search inputs, filters). */
export function useDebouncedValue<T>(value: T, delayMs: number = AppConfig.searchDebounceMs): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
