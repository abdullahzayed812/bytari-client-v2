import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { MedicalTimelineEntry, MedicalTimelineType, Paginated } from '../types';

function readMeta(meta: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? count,
    totalPages: m.totalPages ?? 1,
  };
}

/**
 * `medical-history` — one chronological view over an animal's medical records +
 * vaccinations (backend-composed, newest first). Same DTO on both paths:
 *
 *   CLINIC:  GET /organizations/:orgId/animals/:animalId/medical-history?page&pageSize&type
 *   OWNER:   GET /animals/:animalId/medical-history?page&pageSize&type
 *
 * `type` (`MEDICAL_RECORD` / `VACCINATION`) is an optional backend filter.
 * Ordering is the backend's — never re-sorted client-side (§13, §23).
 */
export const medicalHistoryApi = {
  async listForClinic(
    organizationId: string,
    animalId: string,
    page: number,
    pageSize: number,
    type?: MedicalTimelineType,
  ): Promise<Paginated<MedicalTimelineEntry>> {
    const envelope = await apiClient.requestEnvelope<MedicalTimelineEntry[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/animals/${animalId}/medical-history`,
      params: { page, pageSize, type },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },

  async listForOwner(
    animalId: string,
    page: number,
    pageSize: number,
    type?: MedicalTimelineType,
  ): Promise<Paginated<MedicalTimelineEntry>> {
    const envelope = await apiClient.requestEnvelope<MedicalTimelineEntry[]>({
      method: 'GET',
      url: `/animals/${animalId}/medical-history`,
      params: { page, pageSize, type },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },
};

export type MedicalHistoryApi = typeof medicalHistoryApi;
