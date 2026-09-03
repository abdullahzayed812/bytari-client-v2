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

/**
 * Poultry Farm operations query keys — the Farm Details screen. Everything is
 * organization-scoped so one prefix invalidates a farm's whole operational
 * state; flock-scoped reads nest under the flock id.
 */
export const poultryOpsKeys = {
  all: ['poultry-ops'] as const,
  forOrg: (orgId: string) => [...poultryOpsKeys.all, orgId] as const,
  farmProfile: (orgId: string) => [...poultryOpsKeys.forOrg(orgId), 'profile'] as const,
  expenses: (orgId: string) => [...poultryOpsKeys.forOrg(orgId), 'expenses'] as const,
  expenseList: (orgId: string, filter: Record<string, unknown>) =>
    [...poultryOpsKeys.expenses(orgId), 'list', filter] as const,
  expenseSummary: (orgId: string) => [...poultryOpsKeys.expenses(orgId), 'summary'] as const,
  appointments: (orgId: string, filter: Record<string, unknown>) =>
    [...poultryOpsKeys.forOrg(orgId), 'appointments', filter] as const,
  forFlock: (orgId: string, flockId: string) =>
    [...poultryOpsKeys.forOrg(orgId), 'flock', flockId] as const,
  batchSummary: (orgId: string, flockId: string) =>
    [...poultryOpsKeys.forFlock(orgId, flockId), 'summary'] as const,
  weeklySummary: (orgId: string, flockId: string, weekOf: string | undefined) =>
    [...poultryOpsKeys.forFlock(orgId, flockId), 'weekly', weekOf ?? 'current'] as const,
  dailyRecords: (orgId: string, flockId: string, filter: Record<string, unknown>) =>
    [...poultryOpsKeys.forFlock(orgId, flockId), 'daily', filter] as const,
  healthEvents: (orgId: string, flockId: string, filter: Record<string, unknown>) =>
    [...poultryOpsKeys.forFlock(orgId, flockId), 'health', filter] as const,
  cases: (orgId: string, flockId: string, filter: Record<string, unknown>) =>
    [...poultryOpsKeys.forFlock(orgId, flockId), 'cases', filter] as const,
  caseSummary: (orgId: string, flockId: string) =>
    [...poultryOpsKeys.forFlock(orgId, flockId), 'cases', 'summary'] as const,
};
