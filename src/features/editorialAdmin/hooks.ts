import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { newsKeys } from '@/features/news/api/queryKeys';
import { tipKeys } from '@/features/tips/api/queryKeys';
import type { PageMeta } from '@/services/api';
import type { PresignProvider } from '@/services/files/types';

import { editorialAdminApi, editorialAdminKeys } from './api';
import type { EditorialInput, EditorialItem, EditorialKind, EditorialStatus } from './types';

const PAGE_SIZE = 20;

type Page = { items: EditorialItem[]; meta: PageMeta };

export function useEditorialList(
  kind: EditorialKind,
  filter: { status?: EditorialStatus; q?: string },
) {
  const query = useInfiniteQuery<
    Page,
    unknown,
    InfiniteData<Page>,
    ReturnType<typeof editorialAdminKeys.list>,
    number
  >({
    queryKey: editorialAdminKeys.list(kind, filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      editorialAdminApi.list(kind, { page: pageParam, pageSize: PAGE_SIZE, ...filter }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, items, total: query.data?.pages[0]?.meta.total ?? 0 };
}

export function useEditorialItem(kind: EditorialKind, id: string | undefined) {
  return useQuery({
    queryKey: editorialAdminKeys.detail(kind, id ?? ''),
    queryFn: () => editorialAdminApi.get(kind, id as string),
    enabled: Boolean(id),
  });
}

/** Invalidate the admin lists AND the public (user-facing) feed of this kind. */
function useInvalidate(kind: EditorialKind) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: editorialAdminKeys.all });
    void qc.invalidateQueries({ queryKey: kind === 'tips' ? tipKeys.all : newsKeys.all });
  };
}

export function useSaveEditorialItem(kind: EditorialKind, id: string | undefined) {
  const invalidate = useInvalidate(kind);
  return useMutation({
    mutationKey: ['editorial-admin', kind, 'save', id ?? 'new'],
    mutationFn: (input: EditorialInput) =>
      id ? editorialAdminApi.update(kind, id, input) : editorialAdminApi.create(kind, input),
    onSuccess: invalidate,
  });
}

export function useEditorialLifecycle(kind: EditorialKind) {
  const invalidate = useInvalidate(kind);
  const publish = useMutation({
    mutationFn: (id: string) => editorialAdminApi.publish(kind, id),
    onSuccess: invalidate,
  });
  const archive = useMutation({
    mutationFn: (id: string) => editorialAdminApi.archive(kind, id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => editorialAdminApi.remove(kind, id),
    onSuccess: invalidate,
  });
  return { publish, archive, remove };
}

/** Presigned cover upload for an existing item (the backend replaces any previous cover). */
export function useEditorialCoverProvider(
  kind: EditorialKind,
  id: string | undefined,
): PresignProvider {
  const invalidate = useInvalidate(kind);
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        if (!id) throw new Error('item id is required');
        return editorialAdminApi.requestCoverUpload(kind, id, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        });
      },
      finalizeUpload: async (storageKey, file) => {
        if (!id) throw new Error('item id is required');
        await editorialAdminApi.registerCover(kind, id, { storageKey, mimeType: file.mimeType });
        invalidate();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `invalidate` is stable in effect
    [kind, id],
  );
}
