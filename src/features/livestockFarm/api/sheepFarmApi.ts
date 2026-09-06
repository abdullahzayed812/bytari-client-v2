import type { OrganizationWithDetails } from '@/features/organizations/types';
import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  CreateSheepBatchInput,
  CreateSheepCaseInput,
  CreateSheepDailyRecordInput,
  CreateSheepFarmInput,
  CreateSheepHealthEventInput,
  ListSheepBatchesFilter,
  Paginated,
  SheepBatch,
  SheepBatchSummary,
  SheepCase,
  SheepCaseSummary,
  SheepDailyRecord,
  SheepHealthEvent,
  SheepWeeklySummary,
  UpdateSheepBatchInput,
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
  `/organizations/${orgId}/sheep/batches/${batchId}`;

/** Sheep Farms wrappers — 1:1 with `server/src/modules/livestock`'s sheep routes. */
export const sheepFarmApi = {
  /** `POST /organizations/sheep-farms` — creates the FARM org + profile (species=SHEEP), PENDING. */
  createFarm(input: CreateSheepFarmInput): Promise<OrganizationWithDetails> {
    return apiClient.post<OrganizationWithDetails>('/organizations/sheep-farms', input);
  },

  async list(orgId: string, filter: ListSheepBatchesFilter): Promise<Paginated<SheepBatch>> {
    const envelope = await apiClient.requestEnvelope<SheepBatch[]>({
      method: 'GET',
      url: `/organizations/${orgId}/sheep/batches`,
      params: filter,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
    };
  },
  get(orgId: string, batchId: string): Promise<SheepBatch> {
    return apiClient.get<SheepBatch>(`/organizations/${orgId}/sheep/batches/${batchId}`);
  },
  create(orgId: string, body: CreateSheepBatchInput): Promise<SheepBatch> {
    return apiClient.post<SheepBatch>(`/organizations/${orgId}/sheep/batches`, body);
  },
  update(orgId: string, batchId: string, body: UpdateSheepBatchInput): Promise<SheepBatch> {
    return apiClient.patch<SheepBatch>(`/organizations/${orgId}/sheep/batches/${batchId}`, body);
  },
  remove(orgId: string, batchId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/organizations/${orgId}/sheep/batches/${batchId}`);
  },

  batchSummary(orgId: string, batchId: string): Promise<SheepBatchSummary> {
    return apiClient.get<SheepBatchSummary>(`${batchBase(orgId, batchId)}/summary`);
  },
  weeklySummary(orgId: string, batchId: string, weekOf?: string): Promise<SheepWeeklySummary> {
    return apiClient.get<SheepWeeklySummary>(
      `${batchBase(orgId, batchId)}/weekly-summary`,
      weekOf ? { weekOf } : undefined,
    );
  },

  async listDailyRecords(
    orgId: string,
    batchId: string,
    query: { page: number; pageSize: number },
  ): Promise<Paginated<SheepDailyRecord>> {
    const envelope = await apiClient.requestEnvelope<SheepDailyRecord[]>({
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
    body: CreateSheepDailyRecordInput,
  ): Promise<SheepDailyRecord> {
    return apiClient.post<SheepDailyRecord>(`${batchBase(orgId, batchId)}/daily-records`, body);
  },

  async listHealthEvents(
    orgId: string,
    batchId: string,
    query: { page: number; pageSize: number; kind?: string },
  ): Promise<Paginated<SheepHealthEvent>> {
    const envelope = await apiClient.requestEnvelope<SheepHealthEvent[]>({
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
    body: CreateSheepHealthEventInput,
  ): Promise<SheepHealthEvent> {
    return apiClient.post<SheepHealthEvent>(`${batchBase(orgId, batchId)}/health-events`, body);
  },
  getHealthEvent(orgId: string, batchId: string, eventId: string): Promise<SheepHealthEvent> {
    return apiClient.get<SheepHealthEvent>(`${batchBase(orgId, batchId)}/health-events/${eventId}`);
  },

  async listCases(
    orgId: string,
    batchId: string,
    query: { page: number; pageSize: number; status?: string },
  ): Promise<Paginated<SheepCase>> {
    const envelope = await apiClient.requestEnvelope<SheepCase[]>({
      method: 'GET',
      url: `${batchBase(orgId, batchId)}/cases`,
      params: query,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, query.page, query.pageSize, envelope.data.length),
    };
  },
  caseSummary(orgId: string, batchId: string): Promise<SheepCaseSummary> {
    return apiClient.get<SheepCaseSummary>(`${batchBase(orgId, batchId)}/cases/summary`);
  },
  createCase(orgId: string, batchId: string, body: CreateSheepCaseInput): Promise<SheepCase> {
    return apiClient.post<SheepCase>(`${batchBase(orgId, batchId)}/cases`, body);
  },
  getCase(orgId: string, batchId: string, caseId: string): Promise<SheepCase> {
    return apiClient.get<SheepCase>(`${batchBase(orgId, batchId)}/cases/${caseId}`);
  },
};

export type SheepFarmApi = typeof sheepFarmApi;
