import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { MedicalRecord, MedicalRecordInput, Paginated } from '../types';

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
 * `medical-records` wrappers — 1:1 with the backend routes. Neither
 * `organizationId`, `animalId` nor `recordedByUserId` is ever in a body; they
 * come from the path / JWT.
 *
 *   CLINIC (full CRUD, `medical_record.{read,create,update,delete}` + veterinary access):
 *     GET/POST   /organizations/:orgId/animals/:animalId/medical-records
 *     GET/PATCH/DELETE  .../medical-records/:recordId
 *   OWNER (read-only, current owner or ADMIN):
 *     GET  /animals/:animalId/medical-records
 *     GET  /animals/:animalId/medical-records/:recordId
 */
export const medicalRecordsApi = {
  async listForClinic(
    organizationId: string,
    animalId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<MedicalRecord>> {
    const envelope = await apiClient.requestEnvelope<MedicalRecord[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/animals/${animalId}/medical-records`,
      params: { page, pageSize },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },

  getForClinic(organizationId: string, animalId: string, recordId: string): Promise<MedicalRecord> {
    return apiClient.get<MedicalRecord>(
      `/organizations/${organizationId}/animals/${animalId}/medical-records/${recordId}`,
    );
  },

  create(
    organizationId: string,
    animalId: string,
    body: MedicalRecordInput,
  ): Promise<MedicalRecord> {
    return apiClient.post<MedicalRecord>(
      `/organizations/${organizationId}/animals/${animalId}/medical-records`,
      body,
    );
  },

  update(
    organizationId: string,
    animalId: string,
    recordId: string,
    body: MedicalRecordInput,
  ): Promise<MedicalRecord> {
    return apiClient.patch<MedicalRecord>(
      `/organizations/${organizationId}/animals/${animalId}/medical-records/${recordId}`,
      body,
    );
  },

  remove(
    organizationId: string,
    animalId: string,
    recordId: string,
  ): Promise<{ deleted: boolean }> {
    return apiClient.delete<{ deleted: boolean }>(
      `/organizations/${organizationId}/animals/${animalId}/medical-records/${recordId}`,
    );
  },

  async listForOwner(
    animalId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<MedicalRecord>> {
    const envelope = await apiClient.requestEnvelope<MedicalRecord[]>({
      method: 'GET',
      url: `/animals/${animalId}/medical-records`,
      params: { page, pageSize },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },

  getForOwner(animalId: string, recordId: string): Promise<MedicalRecord> {
    return apiClient.get<MedicalRecord>(`/animals/${animalId}/medical-records/${recordId}`);
  },
};

export type MedicalRecordsApi = typeof medicalRecordsApi;
