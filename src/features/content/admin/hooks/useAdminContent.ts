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

import { contentKeys } from '../../api';
import type { Paginated } from '../../types';
import { adminContentApi, adminContentKeys } from '../api';
import type {
  AdminCategory,
  AdminContentItem,
  AdminContentListFilter,
  CreateCategoryInput,
  CreateContentInput,
  UpdateCategoryInput,
  UpdateContentInput,
} from '../types';

// --- content items --------------------------------------------------

export function useAdminContentList(params: Omit<AdminContentListFilter, 'page' | 'pageSize'>) {
  const pageSize = AppConfig.defaultPageSize;
  const filter = { ...params, pageSize };

  const query = useInfiniteQuery<
    Paginated<AdminContentItem>,
    ApiError,
    InfiniteData<Paginated<AdminContentItem>>,
    ReturnType<typeof adminContentKeys.list>,
    number
  >({
    queryKey: adminContentKeys.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminContentApi.list({ ...filter, page: pageParam }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, items, total };
}

export function useAdminContentItem(contentId: string | undefined) {
  return useQuery<AdminContentItem, ApiError>({
    queryKey: adminContentKeys.detail(contentId ?? 'unknown'),
    queryFn: () => adminContentApi.get(contentId as string),
    enabled: Boolean(contentId),
  });
}

function useInvalidateAdminContent() {
  const qc = useQueryClient();
  return (contentId?: string) => {
    void qc.invalidateQueries({ queryKey: adminContentKeys.lists() });
    void qc.invalidateQueries({ queryKey: contentKeys.lists() });
    if (contentId) {
      void qc.invalidateQueries({ queryKey: adminContentKeys.detail(contentId) });
      void qc.invalidateQueries({ queryKey: contentKeys.detail(contentId) });
    }
  };
}

export function useCreateAdminContent() {
  const invalidate = useInvalidateAdminContent();
  return useMutation<AdminContentItem, ApiError, CreateContentInput>({
    mutationFn: (body) => adminContentApi.create(body),
    onSuccess: (item) => invalidate(item.id),
  });
}

export function useUpdateAdminContent() {
  const invalidate = useInvalidateAdminContent();
  return useMutation<AdminContentItem, ApiError, { contentId: string; body: UpdateContentInput }>({
    mutationFn: ({ contentId, body }) => adminContentApi.update(contentId, body),
    onSuccess: (item) => invalidate(item.id),
  });
}

export function useAdminContentLifecycle() {
  const invalidate = useInvalidateAdminContent();
  const publish = useMutation<AdminContentItem, ApiError, string>({
    mutationFn: (contentId) => adminContentApi.publish(contentId),
    onSuccess: (item) => invalidate(item.id),
  });
  const archive = useMutation<AdminContentItem, ApiError, string>({
    mutationFn: (contentId) => adminContentApi.archive(contentId),
    onSuccess: (item) => invalidate(item.id),
  });
  const remove = useMutation<AdminContentItem, ApiError, string>({
    mutationFn: (contentId) => adminContentApi.remove(contentId),
    onSuccess: (item) => invalidate(item.id),
  });
  const restore = useMutation<AdminContentItem, ApiError, string>({
    mutationFn: (contentId) => adminContentApi.restore(contentId),
    onSuccess: (item) => invalidate(item.id),
  });
  return { publish, archive, remove, restore };
}

export function useDeleteAdminContentFile(contentId: string) {
  const invalidate = useInvalidateAdminContent();
  return useMutation<AdminContentItem, ApiError, string>({
    mutationFn: (fileId) => adminContentApi.deleteFile(contentId, fileId),
    onSuccess: () => invalidate(contentId),
  });
}

/** A signed URL for an already-uploaded admin file (draft-safe — no published requirement). */
export function useAdminContentFileUrl(
  contentId: string | undefined,
  fileId: string | undefined,
) {
  return useQuery<{ url: string; expiresInSeconds: number | null }, ApiError>({
    queryKey: adminContentKeys.file(contentId ?? 'unknown', fileId ?? 'unknown'),
    queryFn: () => adminContentApi.downloadFile(contentId as string, fileId as string),
    enabled: Boolean(contentId) && Boolean(fileId),
    staleTime: 0,
    gcTime: 60_000,
  });
}

// --- categories ------------------------------------------------------

export function useAdminContentCategories() {
  return useQuery<AdminCategory[], ApiError>({
    queryKey: adminContentKeys.categories(),
    queryFn: () => adminContentApi.listCategories(),
    staleTime: 30_000,
  });
}

export function useAdminContentCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminContentKeys.categories() });
    void qc.invalidateQueries({ queryKey: contentKeys.categories() });
  };

  const create = useMutation<AdminCategory, ApiError, CreateCategoryInput>({
    mutationFn: (body) => adminContentApi.createCategory(body),
    onSuccess: invalidate,
  });
  const update = useMutation<
    AdminCategory,
    ApiError,
    { categoryId: string; body: UpdateCategoryInput }
  >({
    mutationFn: ({ categoryId, body }) => adminContentApi.updateCategory(categoryId, body),
    onSuccess: invalidate,
  });
  const remove = useMutation<void, ApiError, string>({
    mutationFn: (categoryId) => adminContentApi.deleteCategory(categoryId),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
