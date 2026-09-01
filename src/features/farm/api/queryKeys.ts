import type { PoultryListFilter } from '../types';

/**
 * Farm & poultry query keys (§27). Everything is organization-scoped so one
 * prefix invalidates a farm's whole poultry/join-code state.
 *
 *   farmKeys.joinCode(orgId)              → ['farm', orgId, 'join-code']
 *   poultryKeys.forOrg(orgId)             → ['poultry', orgId]
 *   poultryKeys.list(orgId, filter)       → ['poultry', orgId, 'list', { …filter }]
 *   poultryKeys.detail(orgId, flockId)    → ['poultry', orgId, 'detail', flockId]
 */
export const farmKeys = {
  all: ['farm'] as const,
  joinCode: (organizationId: string) => [...farmKeys.all, organizationId, 'join-code'] as const,
};

export const poultryKeys = {
  all: ['poultry'] as const,
  forOrg: (organizationId: string) => [...poultryKeys.all, organizationId] as const,
  list: (organizationId: string, filter: Omit<PoultryListFilter, 'page'>) =>
    [...poultryKeys.forOrg(organizationId), 'list', filter] as const,
  detail: (organizationId: string, flockId: string) =>
    [...poultryKeys.forOrg(organizationId), 'detail', flockId] as const,
};
