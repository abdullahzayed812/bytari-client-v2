import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { organizationsApi } from '@/features/organizations';
import { ApiError } from '@/services/api';
import type { LocalFile, PresignProvider } from '@/services/media';

import { syndicateKeys, syndicatesApi, type SyndicateMediaKind } from '../api';
import type {
  CreateAnnouncementInput,
  CreateSubmissionInput,
  MySubmissionListFilter,
  MySyndicateAccess,
  Paginated,
  PublicSyndicate,
  SubmissionListFilter,
  SyndicateAnnouncement,
  SyndicateBrowseFilter,
  SyndicateSubmission,
  UpdateAnnouncementInput,
  UpdateSyndicateProfileInput,
} from '../types';

const PAGE = AppConfig.defaultPageSize;

/** `PresignProvider` factory for a syndicate media kind (logo / announcement image / attachment). */
export function useSyndicateMediaProvider(kind: SyndicateMediaKind): PresignProvider {
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file: LocalFile) =>
        syndicatesApi.requestUploadUrl(kind, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
    }),
    [kind],
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

// ================= syndicate profile =================

export function useMainSyndicates(filter: SyndicateBrowseFilter = {}, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<PublicSyndicate>(
    syndicateKeys.mainList(filter),
    (page) => syndicatesApi.listMain({ ...filter, page, pageSize: PAGE }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, syndicates: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useSyndicate(organizationId: string | undefined) {
  return useQuery<PublicSyndicate, ApiError>({
    queryKey: syndicateKeys.syndicate(organizationId ?? '_'),
    queryFn: () => syndicatesApi.getOne(organizationId as string),
    enabled: Boolean(organizationId),
  });
}

/** "What can I do here?" — gates management UI (e.g. "الطلبات والاستفسارات") for THIS syndicate. */
export function useMySyndicateAccess(organizationId: string | undefined) {
  return useQuery<MySyndicateAccess, ApiError>({
    queryKey: syndicateKeys.myAccess(organizationId ?? '_'),
    queryFn: () => syndicatesApi.getMyAccess(organizationId as string),
    enabled: Boolean(organizationId),
  });
}

export function useSyndicateBranches(organizationId: string | undefined, filter: SyndicateBrowseFilter = {}) {
  const q = useInfinite<PublicSyndicate>(
    syndicateKeys.branchList(organizationId ?? '_', filter),
    (page) => syndicatesApi.listBranches(organizationId as string, { ...filter, page, pageSize: PAGE }),
    Boolean(organizationId),
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, branches: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useUpdateSyndicateProfile(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<PublicSyndicate, ApiError, UpdateSyndicateProfileInput>({
    mutationFn: (input) => syndicatesApi.updateProfile(organizationId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: syndicateKeys.syndicate(organizationId) }),
  });
}

export function useFollowSyndicate(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, ApiError, void>({
    mutationFn: () => organizationsApi.follow(organizationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: syndicateKeys.syndicate(organizationId) }),
  });
}

export function useUnfollowSyndicate(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, ApiError, void>({
    mutationFn: () => organizationsApi.unfollow(organizationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: syndicateKeys.syndicate(organizationId) }),
  });
}

// ================= announcements =================

export function useSyndicateAnnouncements(organizationId: string | undefined) {
  const q = useInfinite<SyndicateAnnouncement>(
    syndicateKeys.announcementList(organizationId ?? '_'),
    (page) => syndicatesApi.listAnnouncements(organizationId as string, { page, pageSize: PAGE }),
    Boolean(organizationId),
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, announcements: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useSyndicateAnnouncement(id: string | undefined) {
  return useQuery<SyndicateAnnouncement, ApiError>({
    queryKey: syndicateKeys.announcement(id ?? '_'),
    queryFn: () => syndicatesApi.getAnnouncement(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateSyndicateAnnouncement(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<SyndicateAnnouncement, ApiError, CreateAnnouncementInput>({
    mutationFn: (input) => syndicatesApi.createAnnouncement(organizationId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: syndicateKeys.announcementList(organizationId) }),
  });
}

export function useUpdateSyndicateAnnouncement(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<SyndicateAnnouncement, ApiError, { id: string; input: UpdateAnnouncementInput }>({
    mutationFn: ({ id, input }) => syndicatesApi.updateAnnouncement(organizationId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: syndicateKeys.announcements() }),
  });
}

export function useDeleteSyndicateAnnouncement(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => syndicatesApi.deleteAnnouncement(organizationId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: syndicateKeys.announcementList(organizationId) }),
  });
}

// ================= submissions (requests + inquiries) =================

export function useCreateSyndicateSubmission(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<SyndicateSubmission, ApiError, CreateSubmissionInput>({
    mutationFn: (input) => syndicatesApi.createSubmission(organizationId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: syndicateKeys.submissions() }),
  });
}

export function useSyndicateSubmissions(organizationId: string | undefined, filter: SubmissionListFilter = {}) {
  const q = useInfinite<SyndicateSubmission>(
    syndicateKeys.submissionList(organizationId ?? '_', filter),
    (page) => syndicatesApi.listSubmissions(organizationId as string, { ...filter, page, pageSize: PAGE }),
    Boolean(organizationId),
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, submissions: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useSyndicateSubmission(organizationId: string | undefined, id: string | undefined) {
  return useQuery<SyndicateSubmission, ApiError>({
    queryKey: syndicateKeys.submission(organizationId ?? '_', id ?? '_'),
    queryFn: () => syndicatesApi.getSubmission(organizationId as string, id as string),
    enabled: Boolean(organizationId) && Boolean(id),
  });
}

export function useRespondToSyndicateSubmission(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<SyndicateSubmission, ApiError, { id: string; responseText: string }>({
    mutationFn: ({ id, responseText }) => syndicatesApi.respondToSubmission(organizationId, id, responseText),
    onSuccess: () => qc.invalidateQueries({ queryKey: syndicateKeys.submissions() }),
  });
}

export function useCloseSyndicateSubmission(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<SyndicateSubmission, ApiError, string>({
    mutationFn: (id) => syndicatesApi.closeSubmission(organizationId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: syndicateKeys.submissions() }),
  });
}

export function useMySyndicateSubmissions(filter: MySubmissionListFilter = {}, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<SyndicateSubmission>(
    syndicateKeys.mySubmissions(filter),
    (page) => syndicatesApi.listMySubmissions({ ...filter, page, pageSize: PAGE }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, submissions: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useMySyndicateSubmission(id: string | undefined) {
  return useQuery<SyndicateSubmission, ApiError>({
    queryKey: syndicateKeys.mySubmission(id ?? '_'),
    queryFn: () => syndicatesApi.getMySubmission(id as string),
    enabled: Boolean(id),
  });
}
