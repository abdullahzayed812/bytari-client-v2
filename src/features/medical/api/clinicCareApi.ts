import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  AnimalReminder,
  ClinicReminderFilter,
  ClinicReminderItem,
  ClinicVaccinationFilter,
  ClinicVaccinationItem,
  MedicalAttachmentPresign,
  Paginated,
  QuickReviewTemplate,
  QuickReviewTemplateInput,
  ReminderInput,
} from '../types';

function page<T>(data: T[], meta: unknown, p: number, pageSize: number): Paginated<T> {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    items: data,
    meta: {
      page: m.page ?? p,
      pageSize: m.pageSize ?? pageSize,
      total: m.total ?? data.length,
      totalPages: m.totalPages ?? 1,
    },
  };
}

const animalBase = (orgId: string, animalId: string) =>
  `/organizations/${orgId}/animals/${animalId}`;

/**
 * Legacy-parity clinic care endpoints
 * (`server/src/modules/veterinary-care/presentation/clinic-care.routes.ts`).
 * Every clinic call is gated server-side on org permission + the clinic's
 * ACTIVE grant for the animal; owner calls on current ownership.
 */
export const clinicCareApi = {
  // --- medical attachments ----------------------------------------------
  requestAttachmentUpload(
    orgId: string,
    animalId: string,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<MedicalAttachmentPresign> {
    return apiClient.post<MedicalAttachmentPresign>(
      `${animalBase(orgId, animalId)}/medical-records/attachments/upload-url`,
      input,
    );
  },

  // --- reminders (clinic) -----------------------------------------------
  async listReminders(
    orgId: string,
    animalId: string,
    p: number,
    pageSize: number,
  ): Promise<Paginated<AnimalReminder>> {
    const env = await apiClient.requestEnvelope<AnimalReminder[]>({
      method: 'GET',
      url: `${animalBase(orgId, animalId)}/reminders`,
      params: { page: p, pageSize },
    });
    return page(env.data, env.meta, p, pageSize);
  },
  getReminder(orgId: string, animalId: string, reminderId: string): Promise<AnimalReminder> {
    return apiClient.get<AnimalReminder>(`${animalBase(orgId, animalId)}/reminders/${reminderId}`);
  },
  createReminder(orgId: string, animalId: string, body: ReminderInput): Promise<AnimalReminder> {
    return apiClient.post<AnimalReminder>(`${animalBase(orgId, animalId)}/reminders`, body);
  },
  updateReminder(
    orgId: string,
    animalId: string,
    reminderId: string,
    body: ReminderInput,
  ): Promise<AnimalReminder> {
    return apiClient.patch<AnimalReminder>(
      `${animalBase(orgId, animalId)}/reminders/${reminderId}`,
      body,
    );
  },
  deleteReminder(
    orgId: string,
    animalId: string,
    reminderId: string,
  ): Promise<{ deleted: boolean }> {
    return apiClient.delete<{ deleted: boolean }>(
      `${animalBase(orgId, animalId)}/reminders/${reminderId}`,
    );
  },
  notifyReminder(
    orgId: string,
    animalId: string,
    reminderId: string,
  ): Promise<{ notified: boolean }> {
    return apiClient.post<{ notified: boolean }>(
      `${animalBase(orgId, animalId)}/reminders/${reminderId}/notify`,
    );
  },
  async listClinicReminders(
    orgId: string,
    status: ClinicReminderFilter,
    p: number,
    pageSize: number,
  ): Promise<Paginated<ClinicReminderItem>> {
    const env = await apiClient.requestEnvelope<ClinicReminderItem[]>({
      method: 'GET',
      url: `/organizations/${orgId}/clinic-reminders`,
      params: { status, page: p, pageSize },
    });
    return page(env.data, env.meta, p, pageSize);
  },
  notifyTodayReminders(orgId: string): Promise<{ sent: number }> {
    return apiClient.post<{ sent: number }>(
      `/organizations/${orgId}/clinic-reminders/notify-today`,
    );
  },

  // --- reminders (owner) ------------------------------------------------
  async listOwnerReminders(
    animalId: string,
    p: number,
    pageSize: number,
  ): Promise<Paginated<AnimalReminder>> {
    const env = await apiClient.requestEnvelope<AnimalReminder[]>({
      method: 'GET',
      url: `/animals/${animalId}/reminders`,
      params: { page: p, pageSize },
    });
    return page(env.data, env.meta, p, pageSize);
  },

  // --- vaccinations (clinic-wide + notify) ------------------------------
  async listClinicVaccinations(
    orgId: string,
    status: ClinicVaccinationFilter,
    p: number,
    pageSize: number,
  ): Promise<Paginated<ClinicVaccinationItem>> {
    const env = await apiClient.requestEnvelope<ClinicVaccinationItem[]>({
      method: 'GET',
      url: `/organizations/${orgId}/clinic-vaccinations`,
      params: { status, page: p, pageSize },
    });
    return page(env.data, env.meta, p, pageSize);
  },
  notifyVaccination(
    orgId: string,
    animalId: string,
    vaccinationId: string,
  ): Promise<{ notified: boolean }> {
    return apiClient.post<{ notified: boolean }>(
      `${animalBase(orgId, animalId)}/vaccinations/${vaccinationId}/notify`,
    );
  },

  // --- quick-review templates -------------------------------------------
  listTemplates(orgId: string): Promise<QuickReviewTemplate[]> {
    return apiClient.get<QuickReviewTemplate[]>(`/organizations/${orgId}/quick-review-templates`);
  },
  createTemplate(orgId: string, body: QuickReviewTemplateInput): Promise<QuickReviewTemplate> {
    return apiClient.post<QuickReviewTemplate>(
      `/organizations/${orgId}/quick-review-templates`,
      body,
    );
  },
  updateTemplate(
    orgId: string,
    templateId: string,
    body: QuickReviewTemplateInput,
  ): Promise<QuickReviewTemplate> {
    return apiClient.patch<QuickReviewTemplate>(
      `/organizations/${orgId}/quick-review-templates/${templateId}`,
      body,
    );
  },
  deleteTemplate(orgId: string, templateId: string): Promise<{ deleted: boolean }> {
    return apiClient.delete<{ deleted: boolean }>(
      `/organizations/${orgId}/quick-review-templates/${templateId}`,
    );
  },
};

export type ClinicCareApi = typeof clinicCareApi;
