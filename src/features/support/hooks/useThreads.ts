import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { supportKeys, threadApi } from '../api';
import type { Paginated, Thread, ThreadKind, ThreadMessage, ThreadStatus } from '../types';

interface ListParams {
  status?: ThreadStatus;
  pageSize?: number;
  enabled?: boolean;
}

/** The caller's OWN consultation / inquiry threads (`GET /<slug>`). */
export function useMyThreads(kind: ThreadKind, params: ListParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { status: params.status, pageSize };
  const api = threadApi(kind);

  const query = useInfiniteQuery<
    Paginated<Thread>,
    unknown,
    InfiniteData<Paginated<Thread>>,
    ReturnType<typeof supportKeys.myList>,
    number
  >({
    queryKey: supportKeys.myList(kind, filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.listMine({ page: pageParam, pageSize, status: params.status }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const threads = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, threads, total };
}

interface AdminListParams extends ListParams {
  createdBy?: string;
}

/** All threads for a supervisor / admin (`GET /admin/<slug>`). Caller must gate `enabled`. */
export function useAdminThreads(kind: ThreadKind, params: AdminListParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { status: params.status, createdBy: params.createdBy || undefined, pageSize };
  const api = threadApi(kind);

  const query = useInfiniteQuery<
    Paginated<Thread>,
    unknown,
    InfiniteData<Paginated<Thread>>,
    ReturnType<typeof supportKeys.adminList>,
    number
  >({
    queryKey: supportKeys.adminList(kind, filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.listAdmin({
        page: pageParam,
        pageSize,
        status: params.status,
        createdBy: params.createdBy || undefined,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const threads = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, threads, total };
}

/** One thread. `admin` picks `/admin/<slug>/:id`; otherwise the relationship-scoped route. A 404 hides "does it exist". */
export function useThread(
  kind: ThreadKind,
  threadId: string | undefined,
  options: { admin?: boolean; enabled?: boolean } = {},
) {
  const api = threadApi(kind);
  return useQuery<Thread, ApiError>({
    queryKey: supportKeys.detail(kind, threadId ?? 'unknown'),
    queryFn: () => (options.admin ? api.getAdmin(threadId as string) : api.get(threadId as string)),
    enabled: Boolean(threadId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}

/** A thread's messages, oldest → newest, paginated. */
export function useThreadMessages(
  kind: ThreadKind,
  threadId: string | undefined,
  options: { pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = options.pageSize ?? 30;
  const api = threadApi(kind);

  const query = useInfiniteQuery<
    Paginated<ThreadMessage>,
    unknown,
    InfiniteData<Paginated<ThreadMessage>>,
    ReturnType<typeof supportKeys.messages>,
    number
  >({
    queryKey: supportKeys.messages(kind, threadId ?? 'unknown'),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.listMessages(threadId as string, pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(threadId) && (options.enabled ?? true),
    staleTime: 10_000,
  });

  const messages = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, messages, total };
}
