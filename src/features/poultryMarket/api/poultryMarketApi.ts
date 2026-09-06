import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  CreateEggOfferInput,
  CreatePoultryOfferInput,
  EggOffer,
  EggRateEntry,
  EggRateEntryInput,
  ListEggOffersFilter,
  ListPoultryOffersFilter,
  MarketStatisticsSummary,
  Paginated,
  PoultryOffer,
  PoultryRateEntry,
  PoultryRateEntryInput,
  RegisterTraderInput,
  TraderApplicationSummary,
  TraderProfile,
  TraderStatus,
  TraderStatusResult,
  UploadUrlResult,
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

/**
 * Poultry Markets wrappers — 1:1 with the backend routes. Trader status is a
 * per-USER concept, so none of these carry an `organizationId`.
 */
export const poultryMarketApi = {
  traders: {
    register(input: RegisterTraderInput): Promise<TraderProfile> {
      return apiClient.post<TraderProfile>('/traders/register', input);
    },
    me(): Promise<TraderStatusResult> {
      return apiClient.get<TraderStatusResult>('/traders/me');
    },
    async adminList(
      status: TraderStatus | undefined,
      page: number,
      pageSize: number,
    ): Promise<Paginated<TraderApplicationSummary>> {
      const envelope = await apiClient.requestEnvelope<TraderApplicationSummary[]>({
        method: 'GET',
        url: '/admin/traders',
        params: { status, page, pageSize },
      });
      return { items: envelope.data, meta: readMeta(envelope.meta, page, pageSize, envelope.data.length) };
    },
    adminGet(userId: string): Promise<TraderApplicationSummary> {
      return apiClient.get<TraderApplicationSummary>(`/admin/traders/${userId}`);
    },
    approve(userId: string): Promise<TraderProfile> {
      return apiClient.post<TraderProfile>(`/admin/traders/${userId}/approve`);
    },
    reject(userId: string, reason: string): Promise<TraderProfile> {
      return apiClient.post<TraderProfile>(`/admin/traders/${userId}/reject`, { reason });
    },
    suspend(userId: string, reason?: string): Promise<TraderProfile> {
      return apiClient.post<TraderProfile>(`/admin/traders/${userId}/suspend`, reason ? { reason } : {});
    },
    reactivate(userId: string): Promise<TraderProfile> {
      return apiClient.post<TraderProfile>(`/admin/traders/${userId}/reactivate`);
    },
  },

  poultryOffers: {
    requestUploadUrl(input: {
      filename: string;
      mimeType: string;
      size: number;
    }): Promise<UploadUrlResult> {
      return apiClient.post<UploadUrlResult>('/poultry-offers/upload-url', input);
    },
    async list(filter: ListPoultryOffersFilter): Promise<Paginated<PoultryOffer>> {
      const envelope = await apiClient.requestEnvelope<PoultryOffer[]>({
        method: 'GET',
        url: '/poultry-offers',
        params: {
          page: filter.page,
          pageSize: filter.pageSize,
          birdType: filter.birdType,
          governorate: filter.governorate,
        },
      });
      return {
        items: envelope.data,
        meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
      };
    },
    async listMine(page: number, pageSize: number): Promise<Paginated<PoultryOffer>> {
      const envelope = await apiClient.requestEnvelope<PoultryOffer[]>({
        method: 'GET',
        url: '/poultry-offers/mine',
        params: { page, pageSize },
      });
      return { items: envelope.data, meta: readMeta(envelope.meta, page, pageSize, envelope.data.length) };
    },
    get(offerId: string): Promise<PoultryOffer> {
      return apiClient.get<PoultryOffer>(`/poultry-offers/${offerId}`);
    },
    create(input: CreatePoultryOfferInput): Promise<PoultryOffer> {
      return apiClient.post<PoultryOffer>('/poultry-offers', input);
    },
    remove(offerId: string): Promise<{ success: boolean }> {
      return apiClient.delete<{ success: boolean }>(`/poultry-offers/${offerId}`);
    },
    async adminList(filter: ListPoultryOffersFilter): Promise<Paginated<PoultryOffer>> {
      const envelope = await apiClient.requestEnvelope<PoultryOffer[]>({
        method: 'GET',
        url: '/admin/poultry-offers',
        params: {
          page: filter.page,
          pageSize: filter.pageSize,
          birdType: filter.birdType,
          governorate: filter.governorate,
          status: filter.status,
        },
      });
      return {
        items: envelope.data,
        meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
      };
    },
    adminRemove(offerId: string): Promise<{ success: boolean }> {
      return apiClient.delete<{ success: boolean }>(`/admin/poultry-offers/${offerId}`);
    },
  },

  eggOffers: {
    requestUploadUrl(input: {
      filename: string;
      mimeType: string;
      size: number;
    }): Promise<UploadUrlResult> {
      return apiClient.post<UploadUrlResult>('/egg-offers/upload-url', input);
    },
    async list(filter: ListEggOffersFilter): Promise<Paginated<EggOffer>> {
      const envelope = await apiClient.requestEnvelope<EggOffer[]>({
        method: 'GET',
        url: '/egg-offers',
        params: {
          page: filter.page,
          pageSize: filter.pageSize,
          eggType: filter.eggType,
          governorate: filter.governorate,
        },
      });
      return {
        items: envelope.data,
        meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
      };
    },
    async listMine(page: number, pageSize: number): Promise<Paginated<EggOffer>> {
      const envelope = await apiClient.requestEnvelope<EggOffer[]>({
        method: 'GET',
        url: '/egg-offers/mine',
        params: { page, pageSize },
      });
      return { items: envelope.data, meta: readMeta(envelope.meta, page, pageSize, envelope.data.length) };
    },
    get(offerId: string): Promise<EggOffer> {
      return apiClient.get<EggOffer>(`/egg-offers/${offerId}`);
    },
    create(input: CreateEggOfferInput): Promise<EggOffer> {
      return apiClient.post<EggOffer>('/egg-offers', input);
    },
    remove(offerId: string): Promise<{ success: boolean }> {
      return apiClient.delete<{ success: boolean }>(`/egg-offers/${offerId}`);
    },
    async adminList(filter: ListEggOffersFilter): Promise<Paginated<EggOffer>> {
      const envelope = await apiClient.requestEnvelope<EggOffer[]>({
        method: 'GET',
        url: '/admin/egg-offers',
        params: {
          page: filter.page,
          pageSize: filter.pageSize,
          eggType: filter.eggType,
          governorate: filter.governorate,
          status: filter.status,
        },
      });
      return {
        items: envelope.data,
        meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
      };
    },
    adminRemove(offerId: string): Promise<{ success: boolean }> {
      return apiClient.delete<{ success: boolean }>(`/admin/egg-offers/${offerId}`);
    },
  },

  exchangeRates: {
    getPoultry(date: string): Promise<PoultryRateEntry[]> {
      return apiClient
        .requestEnvelope<PoultryRateEntry[]>({
          method: 'GET',
          url: '/poultry-market/exchange-rates/poultry',
          params: { date },
        })
        .then((e) => e.data);
    },
    savePoultry(date: string, entries: PoultryRateEntryInput[]): Promise<{ success: boolean }> {
      return apiClient.post<{ success: boolean }>('/poultry-market/exchange-rates/poultry', { date, entries });
    },
    getEgg(date: string): Promise<EggRateEntry[]> {
      return apiClient
        .requestEnvelope<EggRateEntry[]>({
          method: 'GET',
          url: '/poultry-market/exchange-rates/egg',
          params: { date },
        })
        .then((e) => e.data);
    },
    saveEgg(date: string, entries: EggRateEntryInput[]): Promise<{ success: boolean }> {
      return apiClient.post<{ success: boolean }>('/poultry-market/exchange-rates/egg', { date, entries });
    },
  },

  statistics: {
    get(): Promise<MarketStatisticsSummary> {
      return apiClient.get<MarketStatisticsSummary>('/poultry-market/statistics');
    },
  },
};

export type PoultryMarketApi = typeof poultryMarketApi;
