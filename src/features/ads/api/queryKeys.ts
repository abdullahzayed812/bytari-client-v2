import type { AdPlacement } from '../types';

export const adKeys = {
  all: ['ads'] as const,
  list: (placement: AdPlacement) => [...adKeys.all, 'list', placement] as const,
};
