import type { PetListFilter } from '../types';

/**
 * Centralised pet query keys (§14). Nothing else builds a raw pet key array.
 *
 *   petKeys.all                → ['pets']
 *   petKeys.lists()            → ['pets', 'list']
 *   petKeys.list(filter)       → ['pets', 'list', { …filter }]
 *   petKeys.details()          → ['pets', 'detail']
 *   petKeys.detail(petId)      → ['pets', 'detail', petId]
 *
 * Invalidate by the narrowest prefix that covers the change:
 *   - after create           → petKeys.lists()
 *   - after update/deactivate → petKeys.detail(id) + petKeys.lists()
 */
export const petKeys = {
  all: ['pets'] as const,
  lists: () => [...petKeys.all, 'list'] as const,
  list: (filter: PetListFilter) => [...petKeys.lists(), filter] as const,
  details: () => [...petKeys.all, 'detail'] as const,
  detail: (petId: string) => [...petKeys.details(), petId] as const,
  /** Ownership history for one pet (Phase 12). */
  ownership: (petId: string) => [...petKeys.detail(petId), 'ownership'] as const,
};

/** Ownership transfer requests — "sent" and "received" are always separate lists. */
export const transferRequestKeys = {
  all: ['transfer-requests'] as const,
  sent: (page: number, pageSize: number) =>
    [...transferRequestKeys.all, 'sent', page, pageSize] as const,
  received: (page: number, pageSize: number) =>
    [...transferRequestKeys.all, 'received', page, pageSize] as const,
  detail: (requestId: string) => [...transferRequestKeys.all, 'detail', requestId] as const,
};
