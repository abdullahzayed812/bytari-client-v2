import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import type { ContentReport, Paginated } from '@/features/globalChat/types';
import { apiClient } from '@/services/api';

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED';

/** `GET /admin/reports` row — the report plus a snapshot of what was reported. */
export interface AdminContentReport extends ContentReport {
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  target: { preview: string | null; authorUserId: string | null; exists: boolean };
}

const PAGE_SIZE = 20;
const keys = {
  all: ['admin', 'reports'] as const,
  list: (status?: ReportStatus) => ['admin', 'reports', status ?? 'ALL'] as const,
};

async function listReports(
  page: number,
  status?: ReportStatus,
): Promise<Paginated<AdminContentReport>> {
  const envelope = await apiClient.requestEnvelope<AdminContentReport[]>({
    method: 'GET',
    url: '/admin/reports',
    params: { page, pageSize: PAGE_SIZE, ...(status ? { status } : {}) },
  });
  const m = (envelope.meta ?? {}) as Partial<Paginated<unknown>['meta']>;
  return {
    items: envelope.data,
    meta: {
      page: m.page ?? page,
      pageSize: m.pageSize ?? PAGE_SIZE,
      total: m.total ?? envelope.data.length,
      totalPages: m.totalPages ?? 1,
    },
  };
}

/** Admin moderation queue (`content_report.admin.manage`). */
export function useAdminReports(status?: ReportStatus) {
  const query = useInfiniteQuery<
    Paginated<AdminContentReport>,
    unknown,
    InfiniteData<Paginated<AdminContentReport>>,
    ReturnType<typeof keys.list>,
    number
  >({
    queryKey: keys.list(status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listReports(pageParam, status),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
  const reports = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, reports };
}

export function useReviewReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { reportId: string; status: 'REVIEWED' | 'DISMISSED' }) =>
      apiClient.patch(`/admin/reports/${input.reportId}`, { status: input.status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
