import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { adminVetServicesApi, vetServiceKeys } from '../api';
import type { ModerationStatus, Paginated, ServiceListing, ServiceRequest } from '../types';

const PAGE = AppConfig.defaultPageSize;

/** `GET /admin/vet-service-listings` — the listing moderation queue (defaults to PENDING). */
export function useAdminVetServiceListings(filter: { status?: ModerationStatus } = {}) {
  const query = useInfiniteQuery<
    Paginated<ServiceListing>,
    unknown,
    InfiniteData<Paginated<ServiceListing>>,
    ReturnType<typeof vetServiceKeys.adminListingList>,
    number
  >({
    queryKey: vetServiceKeys.adminListingList(filter.status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminVetServicesApi.listListings(pageParam, PAGE, filter),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });
  const listings = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, listings, total: query.data?.pages[0]?.meta.total ?? 0 };
}

/** `GET /admin/vet-service-requests` — the pet-owner request moderation queue. */
export function useAdminVetServiceRequests(filter: { status?: ModerationStatus } = {}) {
  const query = useInfiniteQuery<
    Paginated<ServiceRequest>,
    unknown,
    InfiniteData<Paginated<ServiceRequest>>,
    ReturnType<typeof vetServiceKeys.adminRequestList>,
    number
  >({
    queryKey: vetServiceKeys.adminRequestList(filter.status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminVetServicesApi.listRequests(pageParam, PAGE, filter),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });
  const requests = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, requests, total: query.data?.pages[0]?.meta.total ?? 0 };
}

function useModerate<T>(
  fn: (id: string, reason?: string) => Promise<T>,
  key: string,
): UseMutationResult<T, ApiError, { id: string; reason?: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['vet-services', 'admin', key],
    mutationFn: ({ id, reason }) => fn(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetServiceKeys.all }),
  });
}

export function useAdminApproveVetServiceListing() {
  return useModerate((id) => adminVetServicesApi.approveListing(id), 'listing-approve');
}
export function useAdminRejectVetServiceListing() {
  return useModerate((id, reason) => adminVetServicesApi.rejectListing(id, reason ?? ''), 'listing-reject');
}
export function useAdminApproveVetServiceRequest() {
  return useModerate((id) => adminVetServicesApi.approveRequest(id), 'request-approve');
}
export function useAdminRejectVetServiceRequest() {
  return useModerate((id, reason) => adminVetServicesApi.rejectRequest(id, reason ?? ''), 'request-reject');
}
