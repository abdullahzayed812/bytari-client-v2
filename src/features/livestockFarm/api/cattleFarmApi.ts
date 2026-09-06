import type { OrganizationWithDetails } from '@/features/organizations/types';
import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  CattleBatch,
  CattleBatchSummary,
  CattleCase,
  CattleCaseSummary,
  CattleDailyRecord,
  CattleHealthEvent,
  CattleWeeklySummary,
  CreateCattleBatchInput,
  CreateCattleCaseInput,
  CreateCattleDailyRecordInput,
  CreateCattleFarmInput,
  CreateCattleHealthEventInput,
  ListCattleBatchesFilter,
  Paginated,
  UpdateCattleBatchInput,
} from '../types';

function readMeta(meta: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? count,
    totalPages: m.totalPages ?? 1,
  };
}

const batchBase = (orgId: string, batchId: string): string =>
  `/organizations/${orgId}/cattle/batches/${batchId}`;

/** Cattle Farms wrappers — 1:1 with `server/src/modules/livestock`'s cattle routes. */
export const cattleFarmApi = {
  /** `POST /organizations/cattle-farms` — creates the FARM org + profile (species=CATTLE), PENDING. */
  createFarm(input: CreateCattleFarmInput): Promise<OrganizationWithDetails> {
    return apiClient.post<OrganizationWithDetails>('/organizations/cattle-farms', input);
  },

  async list(orgId: string, filter: ListCattleBatchesFilter): Promise<Paginated<CattleBatch>> {
    const envelope = await apiClient.requestEnvelope<CattleBatch[]>({
      method: 'GET',
      url: `/organizations/${orgId}/cattle/batches`,
      params: filter,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
    };
  },
  get(orgId: string, batchId: string): Promise<CattleBatch> {
    return apiClient.get<CattleBatch>(`/organizations/${orgId}/cattle/batches/${batchId}`);
  },
  create(orgId: string, body: CreateCattleBatchInput): Promise<CattleBatch> {
    return apiClient.post<CattleBatch>(`/organizations/${orgId}/cattle/batches`, body);
  },
  update(orgId: string, batchId: string, body: UpdateCattleBatchInput): Promise<CattleBatch> {
    return apiClient.patch<CattleBatch>(`/organizations/${orgId}/cattle/batches/${batchId}`, body);
  },
  remove(orgId: string, batchId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/organizations/${orgId}/cattle/batches/${batchId}`);
  },

  batchSummary(orgId: string, batchId: string): Promise<CattleBatchSummary> {
    return apiClient.get<CattleBatchSummary>(`${batchBase(orgId, batchId)}/summary`);
  },
  weeklySummary(orgId: string, batchId: string, weekOf?: string): Promise<CattleWeeklySummary> {
    return apiClient.get<CattleWeeklySummary>(
      `${batchBase(orgId, batchId)}/weekly-summary`,
      weekOf ? { weekOf } : undefined,
    );
  },

  async listDailyRecords(
    orgId: string,
    batchId: string,
    query: { page: number; pageSize: number },
  ): Promise<Paginated<CattleDailyRecord>> {
    const envelope = await apiClient.requestEnvelope<CattleDailyRecord[]>({
      method: 'GET',
      url: `${batchBase(orgId, batchId)}/daily-records`,
      params: query,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, query.page, query.pageSize, envelope.data.length),
    };
  },
  createDailyRecord(
    orgId: string,
    batchId: string,
    body: CreateCattleDailyRecordInput,
  ): Promise<CattleDailyRecord> {
    return apiClient.post<CattleDailyRecord>(`${batchBase(orgId, batchId)}/daily-records`, body);
  },

  async listHealthEvents(
    orgId: string,
    batchId: string,
    query: { page: number; pageSize: number; kind?: string },
  ): Promise<Paginated<CattleHealthEvent>> {
    const envelope = await apiClient.requestEnvelope<CattleHealthEvent[]>({
      method: 'GET',
      url: `${batchBase(orgId, batchId)}/health-events`,
      params: query,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, query.page, query.pageSize, envelope.data.length),
    };
  },
  createHealthEvent(
    orgId: string,
    batchId: string,
    body: CreateCattleHealthEventInput,
  ): Promise<CattleHealthEvent> {
    return apiClient.post<CattleHealthEvent>(`${batchBase(orgId, batchId)}/health-events`, body);
  },
  getHealthEvent(orgId: string, batchId: string, eventId: string): Promise<CattleHealthEvent> {
    return apiClient.get<CattleHealthEvent>(`${batchBase(orgId, batchId)}/health-events/${eventId}`);
  },

  async listCases(
    orgId: string,
    batchId: string,
    query: { page: number; pageSize: number; status?: string },
  ): Promise<Paginated<CattleCase>> {
    const envelope = await apiClient.requestEnvelope<CattleCase[]>({
      method: 'GET',
      url: `${batchBase(orgId, batchId)}/cases`,
      params: query,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, query.page, query.pageSize, envelope.data.length),
    };
  },
  caseSummary(orgId: string, batchId: string): Promise<CattleCaseSummary> {
    return apiClient.get<CattleCaseSummary>(`${batchBase(orgId, batchId)}/cases/summary`);
  },
  createCase(orgId: string, batchId: string, body: CreateCattleCaseInput): Promise<CattleCase> {
    return apiClient.post<CattleCase>(`${batchBase(orgId, batchId)}/cases`, body);
  },
  getCase(orgId: string, batchId: string, caseId: string): Promise<CattleCase> {
    return apiClient.get<CattleCase>(`${batchBase(orgId, batchId)}/cases/${caseId}`);
  },
};

export type CattleFarmApi = typeof cattleFarmApi;
