import type { ListCattleBatchesFilter, ListSheepBatchesFilter } from '../types';

/** Sheep batch + operational query keys. Mirrors `poultryKeys`/`poultryOpsKeys` exactly. */
export const sheepKeys = {
  all: ['sheep'] as const,
  forOrg: (organizationId: string) => [...sheepKeys.all, organizationId] as const,
  list: (organizationId: string, filter: Omit<ListSheepBatchesFilter, 'page'>) =>
    [...sheepKeys.forOrg(organizationId), 'list', filter] as const,
  detail: (organizationId: string, batchId: string) =>
    [...sheepKeys.forOrg(organizationId), 'detail', batchId] as const,
  forBatch: (orgId: string, batchId: string) =>
    [...sheepKeys.forOrg(orgId), 'batch', batchId] as const,
  batchSummary: (orgId: string, batchId: string) =>
    [...sheepKeys.forBatch(orgId, batchId), 'summary'] as const,
  weeklySummary: (orgId: string, batchId: string, weekOf: string | undefined) =>
    [...sheepKeys.forBatch(orgId, batchId), 'weekly', weekOf ?? 'current'] as const,
  dailyRecords: (orgId: string, batchId: string, filter: Record<string, unknown>) =>
    [...sheepKeys.forBatch(orgId, batchId), 'daily', filter] as const,
  healthEvents: (orgId: string, batchId: string, filter: Record<string, unknown>) =>
    [...sheepKeys.forBatch(orgId, batchId), 'health', filter] as const,
  healthEventDetail: (orgId: string, batchId: string, eventId: string) =>
    [...sheepKeys.forBatch(orgId, batchId), 'health', 'detail', eventId] as const,
  cases: (orgId: string, batchId: string, filter: Record<string, unknown>) =>
    [...sheepKeys.forBatch(orgId, batchId), 'cases', filter] as const,
  caseSummary: (orgId: string, batchId: string) =>
    [...sheepKeys.forBatch(orgId, batchId), 'cases', 'summary'] as const,
  caseDetail: (orgId: string, batchId: string, caseId: string) =>
    [...sheepKeys.forBatch(orgId, batchId), 'cases', 'detail', caseId] as const,
};

/** Cattle batch + operational query keys. Mirrors `sheepKeys` exactly. */
export const cattleKeys = {
  all: ['cattle'] as const,
  forOrg: (organizationId: string) => [...cattleKeys.all, organizationId] as const,
  list: (organizationId: string, filter: Omit<ListCattleBatchesFilter, 'page'>) =>
    [...cattleKeys.forOrg(organizationId), 'list', filter] as const,
  detail: (organizationId: string, batchId: string) =>
    [...cattleKeys.forOrg(organizationId), 'detail', batchId] as const,
  forBatch: (orgId: string, batchId: string) =>
    [...cattleKeys.forOrg(orgId), 'batch', batchId] as const,
  batchSummary: (orgId: string, batchId: string) =>
    [...cattleKeys.forBatch(orgId, batchId), 'summary'] as const,
  weeklySummary: (orgId: string, batchId: string, weekOf: string | undefined) =>
    [...cattleKeys.forBatch(orgId, batchId), 'weekly', weekOf ?? 'current'] as const,
  dailyRecords: (orgId: string, batchId: string, filter: Record<string, unknown>) =>
    [...cattleKeys.forBatch(orgId, batchId), 'daily', filter] as const,
  healthEvents: (orgId: string, batchId: string, filter: Record<string, unknown>) =>
    [...cattleKeys.forBatch(orgId, batchId), 'health', filter] as const,
  healthEventDetail: (orgId: string, batchId: string, eventId: string) =>
    [...cattleKeys.forBatch(orgId, batchId), 'health', 'detail', eventId] as const,
  cases: (orgId: string, batchId: string, filter: Record<string, unknown>) =>
    [...cattleKeys.forBatch(orgId, batchId), 'cases', filter] as const,
  caseSummary: (orgId: string, batchId: string) =>
    [...cattleKeys.forBatch(orgId, batchId), 'cases', 'summary'] as const,
  caseDetail: (orgId: string, batchId: string, caseId: string) =>
    [...cattleKeys.forBatch(orgId, batchId), 'cases', 'detail', caseId] as const,
};
