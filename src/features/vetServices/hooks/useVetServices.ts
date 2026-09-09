import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';
import type { LocalFile, PresignProvider } from '@/services/media';

import { vetServiceKeys, vetServicesApi } from '../api';
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

const PAGE = AppConfig.defaultPageSize;

/** `PresignProvider` for every vet-service image field (listing / request / offer). */
export function useVetServiceImageProvider(): PresignProvider {
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file: LocalFile) =>
        vetServicesApi.requestImageUploadUrl({
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
    }),
    [],
  );
}

function useInfinite<T>(
  key: readonly unknown[],
  fetcher: (page: number) => Promise<Paginated<T>>,
  enabled = true,
) {
  return useInfiniteQuery<Paginated<T>, unknown, InfiniteData<Paginated<T>>, readonly unknown[], number>({
    queryKey: key,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetcher(pageParam),
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled,
    staleTime: 10_000,
  });
}

// ================= listings =================

export function useServiceListings(filter: ListingBrowseFilter, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<ServiceListing>(
    vetServiceKeys.listingList(filter),
    (page) => vetServicesApi.listListings({ ...filter, page, pageSize: PAGE }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, listings: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useMyServiceListings(status?: ModerationStatus, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<ServiceListing>(
    vetServiceKeys.myListingList(status),
    (page) => vetServicesApi.listMyListings({ page, pageSize: PAGE, status }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, listings: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useServiceListing(id: string | undefined, opts: { manage?: boolean } = {}) {
  return useQuery<ServiceListing, ApiError>({
    queryKey: opts.manage ? vetServiceKeys.myListing(id ?? '_') : vetServiceKeys.listing(id ?? '_'),
    queryFn: () => (opts.manage ? vetServicesApi.getMyListing(id as string) : vetServicesApi.getListing(id as string)),
    enabled: Boolean(id),
  });
}

export function useCreateServiceListing() {
  const qc = useQueryClient();
  return useMutation<ServiceListing, ApiError, CreateServiceListingInput>({
    mutationFn: (input) => vetServicesApi.createListing(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetServiceKeys.listings() }),
  });
}

export function useDeleteServiceListing() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => vetServicesApi.deleteListing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetServiceKeys.listings() }),
  });
}

export function useCloseServiceListing() {
  const qc = useQueryClient();
  return useMutation<ServiceListing, ApiError, string>({
    mutationFn: (id) => vetServicesApi.closeListing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetServiceKeys.listings() }),
  });
}

// ================= requests =================

export function useServiceRequests(filter: RequestBrowseFilter, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<ServiceRequest>(
    vetServiceKeys.requestList(filter),
    (page) => vetServicesApi.listRequests({ ...filter, page, pageSize: PAGE }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, requests: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useMyServiceRequests(status?: ModerationStatus, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<ServiceRequest>(
    vetServiceKeys.myRequestList(status),
    (page) => vetServicesApi.listMyRequests({ page, pageSize: PAGE, status }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, requests: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useServiceRequest(id: string | undefined) {
  return useQuery<ServiceRequest, ApiError>({
    queryKey: vetServiceKeys.request(id ?? '_'),
    queryFn: () => vetServicesApi.getRequest(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateServiceRequest() {
  const qc = useQueryClient();
  return useMutation<ServiceRequest, ApiError, CreateServiceRequestInput>({
    mutationFn: (input) => vetServicesApi.createRequest(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetServiceKeys.requests() }),
  });
}

export function useDeleteServiceRequest() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => vetServicesApi.deleteRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetServiceKeys.requests() }),
  });
}

export function useCloseServiceRequest() {
  const qc = useQueryClient();
  return useMutation<ServiceRequest, ApiError, string>({
    mutationFn: (id) => vetServicesApi.closeRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetServiceKeys.requests() }),
  });
}

// ================= offers (vet → request) =================

export function useRequestOffers(requestId: string | undefined, status?: EngagementStatus) {
  const q = useInfinite<ServiceOffer>(
    vetServiceKeys.requestOffers(requestId ?? '_', status),
    (page) => vetServicesApi.listRequestOffers(requestId as string, { page, pageSize: PAGE, status }),
    Boolean(requestId),
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, offers: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useMyOffers(status?: EngagementStatus, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<ServiceOffer>(
    vetServiceKeys.myOffers(status),
    (page) => vetServicesApi.listMyOffers({ page, pageSize: PAGE, status }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, offers: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useOffer(id: string | undefined) {
  return useQuery<ServiceOffer, ApiError>({
    queryKey: vetServiceKeys.offer(id ?? '_'),
    queryFn: () => vetServicesApi.getOffer(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateOffer(requestId: string) {
  const qc = useQueryClient();
  return useMutation<ServiceOffer, ApiError, CreateOfferInput>({
    mutationFn: (input) => vetServicesApi.createOffer(requestId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetServiceKeys.all }),
  });
}

export function useOfferAction() {
  const qc = useQueryClient();
  return useMutation<
    ServiceOffer,
    ApiError,
    { id: string; action: 'accept' | 'reject' | 'withdraw' | 'complete' }
  >({
    mutationFn: ({ id, action }) => vetServicesApi.offerAction(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetServiceKeys.all }),
  });
}

// ================= listing-requests (owner → listing) =================

export function useReceivedListingRequests(status?: EngagementStatus, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<ListingRequest>(
    vetServiceKeys.receivedListingRequests(status),
    (page) => vetServicesApi.listReceivedListingRequests({ page, pageSize: PAGE, status }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, listingRequests: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useMyListingRequests(status?: EngagementStatus, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<ListingRequest>(
    vetServiceKeys.myListingRequests(status),
    (page) => vetServicesApi.listMyListingRequests({ page, pageSize: PAGE, status }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, listingRequests: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useListingRequest(id: string | undefined) {
  return useQuery<ListingRequest, ApiError>({
    queryKey: vetServiceKeys.listingRequest(id ?? '_'),
    queryFn: () => vetServicesApi.getListingRequest(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateListingRequest(listingId: string) {
  const qc = useQueryClient();
  return useMutation<ListingRequest, ApiError, CreateListingRequestInput>({
    mutationFn: (input) => vetServicesApi.createListingRequest(listingId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetServiceKeys.all }),
  });
}

export function useListingRequestAction() {
  const qc = useQueryClient();
  return useMutation<
    ListingRequest,
    ApiError,
    { id: string; action: 'accept' | 'reject' | 'cancel' | 'complete' }
  >({
    mutationFn: ({ id, action }) => vetServicesApi.listingRequestAction(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetServiceKeys.all }),
  });
}

// ================= direct chat ("chat immediately") =================

export function useStartListingConversation() {
  return useMutation<{ conversationId: string }, ApiError, string>({
    mutationFn: (listingId) => vetServicesApi.startListingConversation(listingId),
  });
}

export function useStartRequestConversation() {
  return useMutation<{ conversationId: string }, ApiError, string>({
    mutationFn: (requestId) => vetServicesApi.startRequestConversation(requestId),
  });
}
