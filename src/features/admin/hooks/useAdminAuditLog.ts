import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { adminApi, adminKeys } from '../api';
import type { AuditLogEntry, Paginated } from '../types';

export function useAdminAuditLog(
  params: {
    action?: string;
    entityType?: string;
    actorUserId?: string;
    pageSize?: number;
    enabled?: boolean;
  } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = {
    action: params.action || undefined,
    entityType: params.entityType || undefined,
    actorUserId: params.actorUserId || undefined,
  };

  const query = useInfiniteQuery<
    Paginated<AuditLogEntry>,
    ApiError,
    InfiniteData<Paginated<AuditLogEntry>>,
    ReturnType<typeof adminKeys.audit.list>,
    number
  >({
    queryKey: adminKeys.audit.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminApi.listAuditLog({ page: pageParam, pageSize, ...filter }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 10_000,
  });

  const entries = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, entries, total: query.data?.pages[0]?.meta.total ?? 0 };
}
