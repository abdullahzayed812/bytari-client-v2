import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, type ApiError } from '@/services/api';

/**
 * Farm operational records shared by the poultry, sheep and cattle farm types:
 * individual cases, treatments / vaccinations (health events), and the
 * farm-level expenses + appointments. The three species expose the SAME shapes
 * on the server under a species-specific batch path, so one detail / edit /
 * delete layer serves all of them. Every mutation is authorized server-side
 * (`farm.case.*`, `farm.health_event.*`, `farm.expense.*`,
 * `farm.appointment.*`); the UI only mirrors it.
 */

export type FarmRecordScope = 'poultry' | 'sheep' | 'cattle';

export const FARM_CASE_STATUSES = ['UNDER_TREATMENT', 'RECOVERED', 'DECEASED'] as const;
export type FarmCaseStatus = (typeof FARM_CASE_STATUSES)[number];

export const FARM_HEALTH_EVENT_STATUSES = ['SCHEDULED', 'ONGOING', 'DONE', 'RECOVERED'] as const;
export type FarmHealthEventStatus = (typeof FARM_HEALTH_EVENT_STATUSES)[number];

/** Who added a record — name only (server-resolved from the authenticated creator). */
export interface FarmRecordCreator {
  id: string;
  firstName: string;
  lastName: string;
}

export interface FarmCaseRecord {
  id: string;
  organizationId: string;
  caseNumber: number | null;
  /** How many animals this case covers ("عدد الحالات"). */
  caseCount: number;
  animalTag: string | null;
  sex: 'MALE' | 'FEMALE' | 'UNKNOWN';
  diagnosis: string | null;
  treatment: string | null;
  status: FarmCaseStatus;
  startedOn: string;
  nextFollowupOn: string | null;
  imageUrl: string | null;
  createdByUserId: string | null;
  createdBy?: FarmRecordCreator | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFarmCaseInput {
  caseCount?: number;
  diagnosis?: string | null;
  treatment?: string | null;
  status?: FarmCaseStatus;
  nextFollowupOn?: string | null;
}

export interface FarmHealthEventRecord {
  id: string;
  organizationId: string;
  kind: 'TREATMENT' | 'VACCINATION';
  name: string;
  medication: string | null;
  dose: string | null;
  eventDate: string;
  casesCount: number | null;
  coverageCount: number | null;
  nextDueDate: string | null;
  status: FarmHealthEventStatus;
  notes: string | null;
  createdByUserId: string | null;
  createdBy?: FarmRecordCreator | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFarmHealthEventInput {
  name?: string;
  medication?: string | null;
  dose?: string | null;
  status?: FarmHealthEventStatus;
  notes?: string | null;
}

function batchBase(scope: FarmRecordScope, orgId: string, batchId: string): string {
  return scope === 'poultry'
    ? `/organizations/${orgId}/poultry/flocks/${batchId}`
    : `/organizations/${orgId}/${scope}/batches/${batchId}`;
}

export const farmRecordsApi = {
  getCase(scope: FarmRecordScope, orgId: string, batchId: string, id: string) {
    return apiClient.get<FarmCaseRecord>(`${batchBase(scope, orgId, batchId)}/cases/${id}`);
  },
  updateCase(
    scope: FarmRecordScope,
    orgId: string,
    batchId: string,
    id: string,
    body: UpdateFarmCaseInput,
  ) {
    return apiClient.patch<FarmCaseRecord>(`${batchBase(scope, orgId, batchId)}/cases/${id}`, body);
  },
  deleteCase(scope: FarmRecordScope, orgId: string, batchId: string, id: string) {
    return apiClient.delete(`${batchBase(scope, orgId, batchId)}/cases/${id}`);
  },
  getHealthEvent(scope: FarmRecordScope, orgId: string, batchId: string, id: string) {
    return apiClient.get<FarmHealthEventRecord>(
      `${batchBase(scope, orgId, batchId)}/health-events/${id}`,
    );
  },
  updateHealthEvent(
    scope: FarmRecordScope,
    orgId: string,
    batchId: string,
    id: string,
    body: UpdateFarmHealthEventInput,
  ) {
    return apiClient.patch<FarmHealthEventRecord>(
      `${batchBase(scope, orgId, batchId)}/health-events/${id}`,
      body,
    );
  },
  deleteHealthEvent(scope: FarmRecordScope, orgId: string, batchId: string, id: string) {
    return apiClient.delete(`${batchBase(scope, orgId, batchId)}/health-events/${id}`);
  },
  deleteExpense(orgId: string, id: string) {
    return apiClient.delete(`/organizations/${orgId}/farm/expenses/${id}`);
  },
  deleteAppointment(orgId: string, id: string) {
    return apiClient.delete(`/organizations/${orgId}/farm/appointments/${id}`);
  },
  updateAppointmentStatus(orgId: string, id: string, status: 'UPCOMING' | 'DONE' | 'CANCELLED') {
    return apiClient.patch(`/organizations/${orgId}/farm/appointments/${id}`, { status });
  },
};

const recordKey = (kind: string, scope: string, orgId: string, id: string) =>
  ['farm-records', kind, scope, orgId, id] as const;

/** Every species' list / summary caches (records appear in several of them). */
function useInvalidateFarmData() {
  const qc = useQueryClient();
  return () => {
    for (const prefix of ['poultry-ops', 'poultry', 'sheep', 'cattle', 'farm', 'farm-records']) {
      void qc.invalidateQueries({ queryKey: [prefix] });
    }
  };
}

export function useFarmCaseRecord(
  scope: FarmRecordScope,
  orgId: string | undefined,
  batchId: string | undefined,
  id: string | undefined,
) {
  return useQuery<FarmCaseRecord, ApiError>({
    queryKey: recordKey('case', scope, orgId ?? '_', id ?? '_'),
    queryFn: () => farmRecordsApi.getCase(scope, orgId as string, batchId as string, id as string),
    enabled: Boolean(orgId && batchId && id),
  });
}

export function useUpdateFarmCase(scope: FarmRecordScope, orgId: string, batchId: string) {
  const invalidate = useInvalidateFarmData();
  return useMutation<FarmCaseRecord, ApiError, { id: string; body: UpdateFarmCaseInput }>({
    mutationFn: ({ id, body }) => farmRecordsApi.updateCase(scope, orgId, batchId, id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteFarmCase(scope: FarmRecordScope, orgId: string, batchId: string) {
  const invalidate = useInvalidateFarmData();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => farmRecordsApi.deleteCase(scope, orgId, batchId, id),
    onSuccess: invalidate,
  });
}

export function useFarmHealthEventRecord(
  scope: FarmRecordScope,
  orgId: string | undefined,
  batchId: string | undefined,
  id: string | undefined,
) {
  return useQuery<FarmHealthEventRecord, ApiError>({
    queryKey: recordKey('health', scope, orgId ?? '_', id ?? '_'),
    queryFn: () =>
      farmRecordsApi.getHealthEvent(scope, orgId as string, batchId as string, id as string),
    enabled: Boolean(orgId && batchId && id),
  });
}

export function useUpdateFarmHealthEvent(scope: FarmRecordScope, orgId: string, batchId: string) {
  const invalidate = useInvalidateFarmData();
  return useMutation<
    FarmHealthEventRecord,
    ApiError,
    { id: string; body: UpdateFarmHealthEventInput }
  >({
    mutationFn: ({ id, body }) => farmRecordsApi.updateHealthEvent(scope, orgId, batchId, id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteFarmHealthEvent(scope: FarmRecordScope, orgId: string, batchId: string) {
  const invalidate = useInvalidateFarmData();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => farmRecordsApi.deleteHealthEvent(scope, orgId, batchId, id),
    onSuccess: invalidate,
  });
}

export function useDeleteFarmExpense(orgId: string) {
  const invalidate = useInvalidateFarmData();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => farmRecordsApi.deleteExpense(orgId, id),
    onSuccess: invalidate,
  });
}

export function useDeleteFarmAppointment(orgId: string) {
  const invalidate = useInvalidateFarmData();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => farmRecordsApi.deleteAppointment(orgId, id),
    onSuccess: invalidate,
  });
}

export function useUpdateFarmAppointmentStatus(orgId: string) {
  const invalidate = useInvalidateFarmData();
  return useMutation<unknown, ApiError, { id: string; status: 'UPCOMING' | 'DONE' | 'CANCELLED' }>({
    mutationFn: ({ id, status }) => farmRecordsApi.updateAppointmentStatus(orgId, id, status),
    onSuccess: invalidate,
  });
}
