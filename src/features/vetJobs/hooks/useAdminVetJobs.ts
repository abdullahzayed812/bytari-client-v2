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

import { adminVetJobsApi, vetJobKeys } from '../api';
import type { Paginated, VetJobModerationStatus, VetJobOffer, VetJobSeekerProfile } from '../types';

const PAGE = AppConfig.defaultPageSize;

/** `GET /admin/vet-job-offers` — the offer moderation queue (defaults to PENDING). */
export function useAdminVetJobOffers(filter: { status?: VetJobModerationStatus } = {}) {
  const query = useInfiniteQuery<
    Paginated<VetJobOffer>,
    unknown,
    InfiniteData<Paginated<VetJobOffer>>,
    ReturnType<typeof vetJobKeys.adminOfferList>,
    number
  >({
    queryKey: vetJobKeys.adminOfferList(filter.status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminVetJobsApi.listOffers(pageParam, PAGE, filter),
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    staleTime: 10_000,
  });
  const offers = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, offers, total: query.data?.pages[0]?.meta.total ?? 0 };
}

/** `GET /admin/vet-job-seekers` — the job-seeker profile moderation queue. */
export function useAdminVetJobSeekers(filter: { status?: VetJobModerationStatus } = {}) {
  const query = useInfiniteQuery<
    Paginated<VetJobSeekerProfile>,
    unknown,
    InfiniteData<Paginated<VetJobSeekerProfile>>,
    ReturnType<typeof vetJobKeys.adminSeekerList>,
    number
  >({
    queryKey: vetJobKeys.adminSeekerList(filter.status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminVetJobsApi.listSeekers(pageParam, PAGE, filter),
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    staleTime: 10_000,
  });
  const seekers = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, seekers, total: query.data?.pages[0]?.meta.total ?? 0 };
}

function useModerate<T>(
  fn: (id: string, reason?: string) => Promise<T>,
  key: string,
): UseMutationResult<T, ApiError, { id: string; reason?: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['vet-jobs', 'admin', key],
    mutationFn: ({ id, reason }) => fn(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetJobKeys.all }),
  });
}

export function useAdminApproveVetJobOffer() {
  return useModerate((id) => adminVetJobsApi.approveOffer(id), 'offer-approve');
}
export function useAdminRejectVetJobOffer() {
  return useModerate((id, reason) => adminVetJobsApi.rejectOffer(id, reason ?? ''), 'offer-reject');
}
export function useAdminApproveVetJobSeeker() {
  return useModerate((id) => adminVetJobsApi.approveSeeker(id), 'seeker-approve');
}
export function useAdminRejectVetJobSeeker() {
  return useModerate((id, reason) => adminVetJobsApi.rejectSeeker(id, reason ?? ''), 'seeker-reject');
}
