import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import type { ApiError } from '@/services/api';
import type { PresignProvider } from '@/services/files/types';

import { clinicCareApi, medicalKeys, medicalScopeTag } from '../api';
import type {
  AnimalReminder,
  ClinicReminderFilter,
  ClinicReminderItem,
  ClinicVaccinationFilter,
  ClinicVaccinationItem,
  MedicalScope,
  Paginated,
  QuickReviewTemplate,
  QuickReviewTemplateInput,
  ReminderInput,
} from '../types';

const PAGE_SIZE = 50;
const LIST_PAGE_SIZE = 20;

/**
 * After any clinic medical write: the animal's medical state, the clinic-wide
 * lists, the clinic's animal profile (stats) and the dashboard counts. String
 * prefixes for the latter two keep this feature free of animals / dashboard imports.
 */
export function invalidateClinicMedical(
  qc: QueryClient,
  organizationId: string | undefined,
  animalId: string,
): void {
  void qc.invalidateQueries({ queryKey: medicalKeys.forAnimal(animalId) });
  if (organizationId) {
    void qc.invalidateQueries({ queryKey: medicalKeys.clinic(organizationId) });
    void qc.invalidateQueries({ queryKey: ['organization-animals', organizationId] });
    void qc.invalidateQueries({ queryKey: ['clinic-dashboard', 'summary', organizationId] });
  }
}

// --- reminders --------------------------------------------------------

/** An animal's reminders — clinic context when `organizationId` is set, else the owner's. */
export function useAnimalReminders(scope: MedicalScope, options: { enabled?: boolean } = {}) {
  const { animalId, organizationId } = scope;
  return useQuery<Paginated<AnimalReminder>, ApiError>({
    queryKey: medicalKeys.reminderList(animalId, medicalScopeTag(organizationId)),
    queryFn: () =>
      organizationId
        ? clinicCareApi.listReminders(organizationId, animalId, 1, PAGE_SIZE)
        : clinicCareApi.listOwnerReminders(animalId, 1, PAGE_SIZE),
    enabled: Boolean(animalId) && (options.enabled ?? true),
    staleTime: 15_000,
  });
}

export function useReminder(
  organizationId: string | undefined,
  animalId: string,
  reminderId: string | undefined,
) {
  return useQuery<AnimalReminder, ApiError>({
    queryKey: medicalKeys.reminder(animalId, reminderId ?? 'unknown'),
    queryFn: () =>
      clinicCareApi.getReminder(organizationId as string, animalId, reminderId as string),
    enabled: Boolean(organizationId && animalId && reminderId),
  });
}

export function useSaveReminder(organizationId: string, animalId: string) {
  const qc = useQueryClient();
  return useMutation<AnimalReminder, ApiError, { reminderId?: string; body: ReminderInput }>({
    mutationKey: ['medical', 'reminders', 'save', organizationId, animalId],
    mutationFn: ({ reminderId, body }) =>
      reminderId
        ? clinicCareApi.updateReminder(organizationId, animalId, reminderId, body)
        : clinicCareApi.createReminder(organizationId, animalId, body),
    onSuccess: () => invalidateClinicMedical(qc, organizationId, animalId),
  });
}

export function useDeleteReminder(organizationId: string | undefined, animalId: string) {
  const qc = useQueryClient();
  return useMutation<{ deleted: boolean }, ApiError, { reminderId: string }>({
    mutationKey: ['medical', 'reminders', 'delete', organizationId ?? 'owner', animalId],
    mutationFn: ({ reminderId }) =>
      organizationId
        ? clinicCareApi.deleteReminder(organizationId, animalId, reminderId)
        : clinicCareApi.deleteOwnerReminder(animalId, reminderId),
    onSuccess: () => invalidateClinicMedical(qc, organizationId, animalId),
  });
}

export function useNotifyReminder(organizationId: string) {
  return useMutation<{ notified: boolean }, ApiError, { animalId: string; reminderId: string }>({
    mutationKey: ['medical', 'reminders', 'notify', organizationId],
    mutationFn: ({ animalId, reminderId }) =>
      clinicCareApi.notifyReminder(organizationId, animalId, reminderId),
  });
}

export function useNotifyTodayReminders(organizationId: string) {
  return useMutation<{ sent: number }, ApiError, void>({
    mutationKey: ['medical', 'reminders', 'notify-today', organizationId],
    mutationFn: () => clinicCareApi.notifyTodayReminders(organizationId),
  });
}

function useClinicList<T>(
  key: readonly unknown[],
  fetchPage: (p: number) => Promise<Paginated<T>>,
  enabled: boolean,
) {
  const query = useInfiniteQuery<
    Paginated<T>,
    ApiError,
    InfiniteData<Paginated<T>>,
    readonly unknown[],
    number
  >({
    queryKey: key,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled,
    staleTime: 10_000,
  });
  const items = useMemo<T[]>(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, items };
}

/** Clinic-wide reminders ("التذكيرات"). */
export function useClinicReminders(organizationId: string, status: ClinicReminderFilter) {
  return useClinicList<ClinicReminderItem>(
    medicalKeys.clinicReminders(organizationId, status),
    (p) => clinicCareApi.listClinicReminders(organizationId, status, p, LIST_PAGE_SIZE),
    Boolean(organizationId),
  );
}

// --- vaccinations ------------------------------------------------------

/** Clinic-wide vaccinations ("التطعيمات"). */
export function useClinicVaccinations(organizationId: string, status: ClinicVaccinationFilter) {
  return useClinicList<ClinicVaccinationItem>(
    medicalKeys.clinicVaccinations(organizationId, status),
    (p) => clinicCareApi.listClinicVaccinations(organizationId, status, p, LIST_PAGE_SIZE),
    Boolean(organizationId),
  );
}

export function useNotifyVaccination(organizationId: string) {
  return useMutation<{ notified: boolean }, ApiError, { animalId: string; vaccinationId: string }>({
    mutationKey: ['medical', 'vaccinations', 'notify', organizationId],
    mutationFn: ({ animalId, vaccinationId }) =>
      clinicCareApi.notifyVaccination(organizationId, animalId, vaccinationId),
  });
}

// --- quick-review templates -------------------------------------------

export function useQuickReviewTemplates(organizationId: string | undefined) {
  return useQuery<QuickReviewTemplate[], ApiError>({
    queryKey: medicalKeys.templates(organizationId ?? 'unknown'),
    queryFn: () => clinicCareApi.listTemplates(organizationId as string),
    enabled: Boolean(organizationId),
    staleTime: 30_000,
  });
}

export function useSaveQuickReviewTemplate(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<
    QuickReviewTemplate,
    ApiError,
    { templateId?: string; body: QuickReviewTemplateInput }
  >({
    mutationKey: ['medical', 'templates', 'save', organizationId],
    mutationFn: ({ templateId, body }) =>
      templateId
        ? clinicCareApi.updateTemplate(organizationId, templateId, body)
        : clinicCareApi.createTemplate(organizationId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: medicalKeys.templates(organizationId) }),
  });
}

export function useDeleteQuickReviewTemplate(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<{ deleted: boolean }, ApiError, { templateId: string }>({
    mutationKey: ['medical', 'templates', 'delete', organizationId],
    mutationFn: ({ templateId }) => clinicCareApi.deleteTemplate(organizationId, templateId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: medicalKeys.templates(organizationId) }),
  });
}

// --- attachments --------------------------------------------------------

/**
 * `PresignProvider` for a medical-record attachment (prescription photo /
 * image / PDF). No finalize step: the returned `storageKey` is referenced by
 * the record's create / update body, where the backend validates it.
 */
export function useMedicalAttachmentPresignProvider(
  organizationId: string,
  animalId: string,
): PresignProvider {
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) =>
        clinicCareApi.requestAttachmentUpload(organizationId, animalId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
    }),
    [organizationId, animalId],
  );
}
