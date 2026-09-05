import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  BatchSummary,
  CreateDailyRecordInput,
  CreateFarmExpenseInput,
  FarmAppointment,
  FarmExpense,
  FarmExpenseSummary,
  FarmProfile,
  Paginated,
  PoultryCase,
  PoultryCaseSummary,
  PoultryDailyRecord,
  PoultryHealthEvent,
  UpdateFarmProfileInput,
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
const farmBase = (orgId: string): string => `/organizations/${orgId}/farm`;

/**
 * Poultry Farm operations wrappers — 1:1 with
 * `server/src/modules/farms/presentation/poultry-ops.routes.ts`. Every path is
 * scoped to one FARM organization; batch / weekly summaries and every list are
 * derived from real backend data — no client-side estimation.
 */
export const poultryOpsApi = {
  // --- farm profile (Farm Details header) --------------------
  getFarmProfile(orgId: string): Promise<FarmProfile> {
    return apiClient.get<FarmProfile>(`${farmBase(orgId)}/profile`);
  },
  updateFarmProfile(orgId: string, body: UpdateFarmProfileInput): Promise<FarmProfile> {
    return apiClient.patch<FarmProfile>(`${farmBase(orgId)}/profile`, body);
  },
  requestFarmImageUploadUrl(
    orgId: string,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(`${farmBase(orgId)}/profile/image/upload-url`, input);
  },
  registerFarmImage(
    orgId: string,
    input: { storageKey: string; mimeType: string },
  ): Promise<FarmProfile> {
    return apiClient.post<FarmProfile>(`${farmBase(orgId)}/profile/image`, input);
  },

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

  // --- expenses ------------------------------------------
  async listExpenses(
    orgId: string,
    query: PageQuery & { category?: string; poultryFlockId?: string },
  ): Promise<Paginated<FarmExpense>> {
    const envelope = await apiClient.requestEnvelope<FarmExpense[]>({
      method: 'GET',
      url: `${farmBase(orgId)}/expenses`,
      params: query,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, query.page, query.pageSize, envelope.data.length),
    };
  },
  expenseSummary(orgId: string): Promise<FarmExpenseSummary> {
    return apiClient.get<FarmExpenseSummary>(`${farmBase(orgId)}/expenses/summary`);
  },
  createExpense(orgId: string, body: CreateFarmExpenseInput): Promise<FarmExpense> {
    return apiClient.post<FarmExpense>(`${farmBase(orgId)}/expenses`, body);
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

  // --- appointments -----------------------------------
  async listAppointments(
    orgId: string,
    query: PageQuery & { category?: string; status?: string },
  ): Promise<Paginated<FarmAppointment>> {
    const envelope = await apiClient.requestEnvelope<FarmAppointment[]>({
      method: 'GET',
      url: `${farmBase(orgId)}/appointments`,
      params: query,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, query.page, query.pageSize, envelope.data.length),
    };
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
};

export type PoultryOpsApi = typeof poultryOpsApi;
