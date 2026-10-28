import type {
  CreateFarmAppointmentInput,
  FarmBatchKind,
  CreateFarmExpenseInput,
  FarmAppointment,
  FarmExpense,
  FarmExpenseSummary,
  FarmPersonName,
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

/** Where each batch kind is listed (`?status=ACTIVE` is supported by all three). */
const BATCH_LIST_PATH: Record<FarmBatchKind, string> = {
  POULTRY: 'poultry/flocks',
  SHEEP: 'sheep/batches',
  CATTLE: 'cattle/batches',
};

/** A batch an expense / appointment can be linked to. */
export interface FarmBatchOption {
  id: string;
  name: string;
  batchNumber: number | null;
}

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

  // --- batches (for the optional "الدفعة" link) -------------
  /** The farm's ACTIVE batches of one kind — only these accept new linked rows. */
  async listActiveBatches(orgId: string, kind: FarmBatchKind): Promise<FarmBatchOption[]> {
    const items = await apiClient.get<FarmBatchOption[]>(
      `/organizations/${orgId}/${BATCH_LIST_PATH[kind]}`,
      { status: 'ACTIVE', page: 1, pageSize: 100 },
    );
    return items.map((b) => ({ id: b.id, name: b.name, batchNumber: b.batchNumber ?? null }));
  },

  // --- expenses ------------------------------------------
  async listExpenses(
    orgId: string,
    query: PageQuery & { category?: string },
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
  /** The farm's ACTIVE veterinarians — the "الطبيب المسؤول" picker. */
  listAssignableVeterinarians(orgId: string): Promise<FarmPersonName[]> {
    return apiClient.get<FarmPersonName[]>(
      `${farmBase(orgId)}/appointments/assignable-veterinarians`,
    );
  },
  assignAppointment(
    orgId: string,
    appointmentId: string,
    assignedVeterinarianUserId: string | null,
  ): Promise<FarmAppointment> {
    return apiClient.patch<FarmAppointment>(`${farmBase(orgId)}/appointments/${appointmentId}`, {
      assignedVeterinarianUserId,
    });
  },
};

export type FarmOpsApi = typeof farmOpsApi;
