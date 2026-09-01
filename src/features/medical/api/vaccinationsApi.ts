import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { Paginated, Vaccination, VaccinationInput } from '../types';

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
 * `vaccinations` wrappers — same authorization model as {@link medicalRecordsApi}
 * (`vaccination.{read,create,update,delete}`). `nextDueOn` must be on/after
 * `administeredOn` (backend 400 otherwise).
 */
export const vaccinationsApi = {
  async listForClinic(
    organizationId: string,
    animalId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<Vaccination>> {
    const envelope = await apiClient.requestEnvelope<Vaccination[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/animals/${animalId}/vaccinations`,
      params: { page, pageSize },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },

  getForClinic(
    organizationId: string,
    animalId: string,
    vaccinationId: string,
  ): Promise<Vaccination> {
    return apiClient.get<Vaccination>(
      `/organizations/${organizationId}/animals/${animalId}/vaccinations/${vaccinationId}`,
    );
  },

  create(organizationId: string, animalId: string, body: VaccinationInput): Promise<Vaccination> {
    return apiClient.post<Vaccination>(
      `/organizations/${organizationId}/animals/${animalId}/vaccinations`,
      body,
    );
  },

  update(
    organizationId: string,
    animalId: string,
    vaccinationId: string,
    body: VaccinationInput,
  ): Promise<Vaccination> {
    return apiClient.patch<Vaccination>(
      `/organizations/${organizationId}/animals/${animalId}/vaccinations/${vaccinationId}`,
      body,
    );
  },

  remove(
    organizationId: string,
    animalId: string,
    vaccinationId: string,
  ): Promise<{ deleted: boolean }> {
    return apiClient.delete<{ deleted: boolean }>(
      `/organizations/${organizationId}/animals/${animalId}/vaccinations/${vaccinationId}`,
    );
  },

  async listForOwner(
    animalId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<Vaccination>> {
    const envelope = await apiClient.requestEnvelope<Vaccination[]>({
      method: 'GET',
      url: `/animals/${animalId}/vaccinations`,
      params: { page, pageSize },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },

  getForOwner(animalId: string, vaccinationId: string): Promise<Vaccination> {
    return apiClient.get<Vaccination>(`/animals/${animalId}/vaccinations/${vaccinationId}`);
  },
};

export type VaccinationsApi = typeof vaccinationsApi;
