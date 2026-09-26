import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  BatchSummary,
  CreateDailyRecordInput,
  UpdateDailyRecordInput,
  CreateHealthEventInput,
  CreatePoultryCaseInput,
  Paginated,
  PoultryCase,
  PoultryCaseSummary,
  PoultryDailyRecord,
  PoultryHealthEvent,
  WeeklySummary,
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

interface PageQuery {
  page: number;
  pageSize: number;
}

const flockBase = (orgId: string, flockId: string): string =>
  `/organizations/${orgId}/poultry/flocks/${flockId}`;

/**
 * Poultry Farm operations wrappers — 1:1 with
 * `server/src/modules/farms/presentation/poultry-flock.routes.ts`. Every
 * path is scoped to one FARM organization's poultry flock; batch / weekly
 * summaries and every list are derived from real backend data — no
 * client-side estimation. The generic (species-agnostic) farm-profile /
 * expense / appointment wrappers live in `@/features/farmShared`'s `farmOpsApi`.
 */
export const poultryOpsApi = {
  // --- batch + weekly summary -------------------------------
  batchSummary(orgId: string, flockId: string): Promise<BatchSummary> {
    return apiClient.get<BatchSummary>(`${flockBase(orgId, flockId)}/summary`);
  },
  weeklySummary(orgId: string, flockId: string, weekOf?: string): Promise<WeeklySummary> {
    return apiClient.get<WeeklySummary>(
      `${flockBase(orgId, flockId)}/weekly-summary`,
      weekOf ? { weekOf } : undefined,
    );
  },

  // --- daily records --------------------------------------
  async listDailyRecords(
    orgId: string,
    flockId: string,
    query: PageQuery & { from?: string; to?: string },
  ): Promise<Paginated<PoultryDailyRecord>> {
    const envelope = await apiClient.requestEnvelope<PoultryDailyRecord[]>({
      method: 'GET',
      url: `${flockBase(orgId, flockId)}/daily-records`,
      params: query,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, query.page, query.pageSize, envelope.data.length),
    };
  },
  createDailyRecord(
    orgId: string,
    flockId: string,
    body: CreateDailyRecordInput,
  ): Promise<PoultryDailyRecord> {
    return apiClient.post<PoultryDailyRecord>(`${flockBase(orgId, flockId)}/daily-records`, body);
  },
  updateDailyRecord(
    orgId: string,
    flockId: string,
    recordId: string,
    body: UpdateDailyRecordInput,
  ): Promise<PoultryDailyRecord> {
    return apiClient.patch<PoultryDailyRecord>(`${flockBase(orgId, flockId)}/daily-records/${recordId}`, body);
  },
  deleteDailyRecord(orgId: string, flockId: string, recordId: string): Promise<unknown> {
    return apiClient.delete(`${flockBase(orgId, flockId)}/daily-records/${recordId}`);
  },

  // --- health events (treatments & vaccinations) -----------
  async listHealthEvents(
    orgId: string,
    flockId: string,
    query: PageQuery & { kind?: string },
  ): Promise<Paginated<PoultryHealthEvent>> {
    const envelope = await apiClient.requestEnvelope<PoultryHealthEvent[]>({
      method: 'GET',
      url: `${flockBase(orgId, flockId)}/health-events`,
      params: query,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, query.page, query.pageSize, envelope.data.length),
    };
  },

  createHealthEvent(
    orgId: string,
    flockId: string,
    body: CreateHealthEventInput,
  ): Promise<PoultryHealthEvent> {
    return apiClient.post<PoultryHealthEvent>(`${flockBase(orgId, flockId)}/health-events`, body);
  },
  getHealthEvent(orgId: string, flockId: string, eventId: string): Promise<PoultryHealthEvent> {
    return apiClient.get<PoultryHealthEvent>(
      `${flockBase(orgId, flockId)}/health-events/${eventId}`,
    );
  },

  // --- individual cases ------------------------------
  async listCases(
    orgId: string,
    flockId: string,
    query: PageQuery & { status?: string },
  ): Promise<Paginated<PoultryCase>> {
    const envelope = await apiClient.requestEnvelope<PoultryCase[]>({
      method: 'GET',
      url: `${flockBase(orgId, flockId)}/cases`,
      params: query,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, query.page, query.pageSize, envelope.data.length),
    };
  },
  caseSummary(orgId: string, flockId: string): Promise<PoultryCaseSummary> {
    return apiClient.get<PoultryCaseSummary>(`${flockBase(orgId, flockId)}/cases/summary`);
  },
  createCase(
    orgId: string,
    flockId: string,
    body: CreatePoultryCaseInput,
  ): Promise<PoultryCase> {
    return apiClient.post<PoultryCase>(`${flockBase(orgId, flockId)}/cases`, body);
  },
  getCase(orgId: string, flockId: string, caseId: string): Promise<PoultryCase> {
    return apiClient.get<PoultryCase>(`${flockBase(orgId, flockId)}/cases/${caseId}`);
  },
};

export type PoultryOpsApi = typeof poultryOpsApi;
