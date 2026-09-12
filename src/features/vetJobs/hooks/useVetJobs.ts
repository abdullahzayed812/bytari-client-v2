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

import { vetJobKeys, vetJobsApi } from '../api';
import type {
  CreateVetJobApplicationInput,
  CreateVetJobOfferInput,
  CreateVetJobSeekerProfileInput,
  OfferBrowseFilter,
  Paginated,
  PublicVetJobOffer,
  PublicVetJobSeekerProfile,
  SeekerBrowseFilter,
  UpdateVetJobOfferInput,
  UpdateVetJobSeekerProfileInput,
  VetJobApplication,
  VetJobApplicationStatus,
  VetJobModerationStatus,
  VetJobOffer,
  VetJobSeekerProfile,
} from '../types';

const PAGE = AppConfig.defaultPageSize;

/** `PresignProvider` for every Jobs attachment field (CV / photo). */
export function useVetJobAttachmentProvider(): PresignProvider {
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file: LocalFile) =>
        vetJobsApi.requestAttachmentUploadUrl({
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

// ================= offers =================

export function useVetJobOffers(filter: OfferBrowseFilter, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<PublicVetJobOffer>(
    vetJobKeys.offerList(filter),
    (page) => vetJobsApi.listOffers({ ...filter, page, pageSize: PAGE }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, offers: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useMyVetJobOffers(status?: VetJobModerationStatus, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<VetJobOffer>(
    vetJobKeys.myOfferList(status),
    (page) => vetJobsApi.listMyOffers({ page, pageSize: PAGE, status }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, offers: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useVetJobOffer(id: string | undefined, opts: { manage?: boolean } = {}) {
  return useQuery<PublicVetJobOffer | VetJobOffer, ApiError>({
    queryKey: opts.manage ? vetJobKeys.myOffer(id ?? '_') : vetJobKeys.offer(id ?? '_'),
    queryFn: () => (opts.manage ? vetJobsApi.getMyOffer(id as string) : vetJobsApi.getOffer(id as string)),
    enabled: Boolean(id),
  });
}

export function useCreateVetJobOffer() {
  const qc = useQueryClient();
  return useMutation<VetJobOffer, ApiError, CreateVetJobOfferInput>({
    mutationFn: (input) => vetJobsApi.createOffer(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetJobKeys.offers() }),
  });
}

export function useUpdateVetJobOffer() {
  const qc = useQueryClient();
  return useMutation<VetJobOffer, ApiError, { id: string; input: UpdateVetJobOfferInput }>({
    mutationFn: ({ id, input }) => vetJobsApi.updateOffer(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetJobKeys.offers() }),
  });
}

export function useDeleteVetJobOffer() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => vetJobsApi.deleteOffer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetJobKeys.offers() }),
  });
}

export function useCloseVetJobOffer() {
  const qc = useQueryClient();
  return useMutation<VetJobOffer, ApiError, string>({
    mutationFn: (id) => vetJobsApi.closeOffer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetJobKeys.offers() }),
  });
}

// ================= job-seeker profiles ("باحثون عن عمل") =================

export function useVetJobSeekers(filter: SeekerBrowseFilter, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<PublicVetJobSeekerProfile>(
    vetJobKeys.seekerList(filter),
    (page) => vetJobsApi.listSeekers({ ...filter, page, pageSize: PAGE }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, seekers: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useVetJobSeeker(id: string | undefined) {
  return useQuery<PublicVetJobSeekerProfile, ApiError>({
    queryKey: vetJobKeys.seeker(id ?? '_'),
    queryFn: () => vetJobsApi.getSeeker(id as string),
    enabled: Boolean(id),
  });
}

export function useMyVetJobSeekerProfile(opts: { enabled?: boolean } = {}) {
  return useQuery<VetJobSeekerProfile | null, ApiError>({
    queryKey: vetJobKeys.mySeekerProfile(),
    queryFn: () => vetJobsApi.getMySeekerProfile(),
    enabled: opts.enabled ?? true,
  });
}

export function useCreateVetJobSeekerProfile() {
  const qc = useQueryClient();
  return useMutation<VetJobSeekerProfile, ApiError, CreateVetJobSeekerProfileInput>({
    mutationFn: (input) => vetJobsApi.createSeekerProfile(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetJobKeys.seekers() }),
  });
}

export function useUpdateVetJobSeekerProfile() {
  const qc = useQueryClient();
  return useMutation<VetJobSeekerProfile, ApiError, UpdateVetJobSeekerProfileInput>({
    mutationFn: (input) => vetJobsApi.updateSeekerProfile(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetJobKeys.seekers() }),
  });
}

export function useDeactivateVetJobSeekerProfile() {
  const qc = useQueryClient();
  return useMutation<VetJobSeekerProfile, ApiError, void>({
    mutationFn: () => vetJobsApi.deactivateSeekerProfile(),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetJobKeys.seekers() }),
  });
}

export function useStartConversationWithSeeker() {
  return useMutation<{ conversationId: string }, ApiError, string>({
    mutationFn: (seekerId) => vetJobsApi.startConversationWithSeeker(seekerId),
  });
}

// ================= applications =================

export function useApplyToVetJobOffer(jobOfferId: string) {
  const qc = useQueryClient();
  return useMutation<VetJobApplication, ApiError, CreateVetJobApplicationInput>({
    mutationFn: (input) => vetJobsApi.apply(jobOfferId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetJobKeys.all }),
  });
}

export function useVetJobOfferApplications(
  jobOfferId: string | undefined,
  status?: VetJobApplicationStatus,
) {
  const q = useInfinite<VetJobApplication>(
    vetJobKeys.offerApplications(jobOfferId ?? '_', status),
    (page) => vetJobsApi.listOfferApplications(jobOfferId as string, { page, pageSize: PAGE, status }),
    Boolean(jobOfferId),
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, applications: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useReceivedVetJobApplications(
  status?: VetJobApplicationStatus,
  opts: { enabled?: boolean } = {},
) {
  const q = useInfinite<VetJobApplication>(
    vetJobKeys.receivedApplications(status),
    (page) => vetJobsApi.listReceivedApplications({ page, pageSize: PAGE, status }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, applications: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useMyVetJobApplications(
  status?: VetJobApplicationStatus,
  opts: { enabled?: boolean } = {},
) {
  const q = useInfinite<VetJobApplication>(
    vetJobKeys.myApplications(status),
    (page) => vetJobsApi.listMyApplications({ page, pageSize: PAGE, status }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, applications: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useVetJobApplication(id: string | undefined) {
  return useQuery<VetJobApplication, ApiError>({
    queryKey: vetJobKeys.application(id ?? '_'),
    queryFn: () => vetJobsApi.getApplication(id as string),
    enabled: Boolean(id),
  });
}

export function useVetJobApplicationAction() {
  const qc = useQueryClient();
  return useMutation<VetJobApplication, ApiError, { id: string; action: 'accept' | 'reject' }>({
    mutationFn: ({ id, action }) =>
      action === 'accept' ? vetJobsApi.acceptApplication(id) : vetJobsApi.rejectApplication(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetJobKeys.all }),
  });
}
