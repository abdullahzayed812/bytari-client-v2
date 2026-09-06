import type {
  CreateFarmAppointmentInput,
  CreateFarmExpenseInput,
  FarmAppointment,
  FarmExpense,
  FarmExpenseSummary,
  FarmProfile,
  Paginated,
  UpdateFarmProfileInput,
} from '@/features/farm/types';
import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';


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

const farmBase = (orgId: string): string => `/organizations/${orgId}/farm`;

/**
 * Genuinely cross-farm-type "Farm Details" wrappers — profile header,
 * expenses, appointments. 1:1 with
 * `server/src/modules/farms/presentation/poultry-ops.routes.ts`'s generic
 * half (`/farm/profile*`, `/farm/expenses*`, `/farm/appointments*` — none of
 * these paths mention "poultry"). Every path is scoped to one FARM
 * organization regardless of species.
 */
export const farmOpsApi = {
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
  getExpense(orgId: string, expenseId: string): Promise<FarmExpense> {
    return apiClient.get<FarmExpense>(`${farmBase(orgId)}/expenses/${expenseId}`);
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
  createAppointment(orgId: string, body: CreateFarmAppointmentInput): Promise<FarmAppointment> {
    return apiClient.post<FarmAppointment>(`${farmBase(orgId)}/appointments`, body);
  },
  getAppointment(orgId: string, appointmentId: string): Promise<FarmAppointment> {
    return apiClient.get<FarmAppointment>(`${farmBase(orgId)}/appointments/${appointmentId}`);
  },
};

export type FarmOpsApi = typeof farmOpsApi;
