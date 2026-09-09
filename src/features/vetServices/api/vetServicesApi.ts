import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  CreateListingRequestInput,
  CreateOfferInput,
  CreateServiceListingInput,
  CreateServiceRequestInput,
  EngagementStatus,
  ListingBrowseFilter,
  ListingRequest,
  ModerationStatus,
  Paginated,
  RequestBrowseFilter,
  ServiceListing,
  ServiceOffer,
  ServiceRequest,
} from '../types';

function meta(m: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const x = (m ?? {}) as Partial<ApiPageMeta>;
  return {
    page: x.page ?? page,
    pageSize: x.pageSize ?? pageSize,
    total: x.total ?? count,
    totalPages: x.totalPages ?? 1,
  };
}

async function page<T>(url: string, params: Record<string, unknown>): Promise<Paginated<T>> {
  const p = Number(params.page ?? 1);
  const ps = Number(params.pageSize ?? 20);
  const env = await apiClient.requestEnvelope<T[]>({ method: 'GET', url, params });
  return { items: env.data, meta: meta(env.meta, p, ps, env.data.length) };
}

/**
 * Thin wrappers over `/api/v1/vet-services/*` + `/api/v1/admin/vet-service-*`.
 * The API client attaches auth; the backend derives + enforces every
 * role / ownership / moderation rule.
 */
export const vetServicesApi = {
  // --- images ---------------------------------------------
  requestImageUploadUrl(input: {
    filename: string;
    mimeType: string;
    size: number;
  }): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>('/vet-services/images/upload-url', input);
  },

  // --- listings ------------------------------------------
  listListings(
    filter: ListingBrowseFilter & { page: number; pageSize: number },
  ): Promise<Paginated<ServiceListing>> {
    return page<ServiceListing>('/vet-services/listings', {
      page: filter.page,
      pageSize: filter.pageSize,
      search: filter.search || undefined,
      serviceType: filter.serviceType,
      animalType: filter.animalType,
      governorate: filter.governorate || undefined,
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
    });
  },
  listMyListings(params: {
    page: number;
    pageSize: number;
    status?: ModerationStatus;
  }): Promise<Paginated<ServiceListing>> {
    return page<ServiceListing>('/vet-services/listings/mine', params);
  },
  getListing(id: string): Promise<ServiceListing> {
    return apiClient.get<ServiceListing>(`/vet-services/listings/${id}`);
  },
  getMyListing(id: string): Promise<ServiceListing> {
    return apiClient.get<ServiceListing>(`/vet-services/listings/${id}/manage`);
  },
  createListing(input: CreateServiceListingInput): Promise<ServiceListing> {
    return apiClient.post<ServiceListing>('/vet-services/listings', input);
  },
  deleteListing(id: string): Promise<unknown> {
    return apiClient.delete(`/vet-services/listings/${id}`);
  },
  closeListing(id: string): Promise<ServiceListing> {
    return apiClient.post<ServiceListing>(`/vet-services/listings/${id}/close`);
  },
  startListingConversation(id: string): Promise<{ conversationId: string }> {
    return apiClient.post<{ conversationId: string }>(`/vet-services/listings/${id}/conversation`);
  },

  // --- requests ------------------------------------------
  listRequests(
    filter: RequestBrowseFilter & { page: number; pageSize: number },
  ): Promise<Paginated<ServiceRequest>> {
    return page<ServiceRequest>('/vet-services/requests', {
      page: filter.page,
      pageSize: filter.pageSize,
      search: filter.search || undefined,
      serviceType: filter.serviceType,
      animalType: filter.animalType,
      governorate: filter.governorate || undefined,
      urgency: filter.urgency,
      sort: filter.sort,
    });
  },
  listMyRequests(params: {
    page: number;
    pageSize: number;
    status?: ModerationStatus;
  }): Promise<Paginated<ServiceRequest>> {
    return page<ServiceRequest>('/vet-services/requests/mine', params);
  },
  getRequest(id: string): Promise<ServiceRequest> {
    return apiClient.get<ServiceRequest>(`/vet-services/requests/${id}`);
  },
  createRequest(input: CreateServiceRequestInput): Promise<ServiceRequest> {
    return apiClient.post<ServiceRequest>('/vet-services/requests', input);
  },
  deleteRequest(id: string): Promise<unknown> {
    return apiClient.delete(`/vet-services/requests/${id}`);
  },
  closeRequest(id: string): Promise<ServiceRequest> {
    return apiClient.post<ServiceRequest>(`/vet-services/requests/${id}/close`);
  },
  startRequestConversation(id: string): Promise<{ conversationId: string }> {
    return apiClient.post<{ conversationId: string }>(`/vet-services/requests/${id}/conversation`);
  },

  // --- offers (vet → request) --------------------------
  createOffer(requestId: string, input: CreateOfferInput): Promise<ServiceOffer> {
    return apiClient.post<ServiceOffer>(`/vet-services/requests/${requestId}/offers`, input);
  },
  listRequestOffers(
    requestId: string,
    params: { page: number; pageSize: number; status?: EngagementStatus },
  ): Promise<Paginated<ServiceOffer>> {
    return page<ServiceOffer>(`/vet-services/requests/${requestId}/offers`, params);
  },
  listMyOffers(params: {
    page: number;
    pageSize: number;
    status?: EngagementStatus;
  }): Promise<Paginated<ServiceOffer>> {
    return page<ServiceOffer>('/vet-services/offers/mine', params);
  },
  getOffer(id: string): Promise<ServiceOffer> {
    return apiClient.get<ServiceOffer>(`/vet-services/offers/${id}`);
  },
  offerAction(id: string, action: 'accept' | 'reject' | 'withdraw' | 'complete'): Promise<ServiceOffer> {
    return apiClient.post<ServiceOffer>(`/vet-services/offers/${id}/${action}`);
  },

  // --- listing-requests (owner → listing) -------------
  createListingRequest(
    listingId: string,
    input: CreateListingRequestInput,
  ): Promise<ListingRequest> {
    return apiClient.post<ListingRequest>(`/vet-services/listings/${listingId}/requests`, input);
  },
  listListingRequestsForListing(
    listingId: string,
    params: { page: number; pageSize: number; status?: EngagementStatus },
  ): Promise<Paginated<ListingRequest>> {
    return page<ListingRequest>(`/vet-services/listings/${listingId}/requests`, params);
  },
  listReceivedListingRequests(params: {
    page: number;
    pageSize: number;
    status?: EngagementStatus;
  }): Promise<Paginated<ListingRequest>> {
    return page<ListingRequest>('/vet-services/listing-requests/received', params);
  },
  listMyListingRequests(params: {
    page: number;
    pageSize: number;
    status?: EngagementStatus;
  }): Promise<Paginated<ListingRequest>> {
    return page<ListingRequest>('/vet-services/listing-requests/mine', params);
  },
  getListingRequest(id: string): Promise<ListingRequest> {
    return apiClient.get<ListingRequest>(`/vet-services/listing-requests/${id}`);
  },
  listingRequestAction(
    id: string,
    action: 'accept' | 'reject' | 'cancel' | 'complete',
  ): Promise<ListingRequest> {
    return apiClient.post<ListingRequest>(`/vet-services/listing-requests/${id}/${action}`);
  },
};

export type VetServicesApi = typeof vetServicesApi;
