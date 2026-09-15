import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { useAuth } from '@/hooks';
import { ApiError } from '@/services/api';

import { adminApi, adminKeys } from '../api';
import type {
  AdminUser,
  AdminUserDetail,
  Paginated,
  RoleKey,
  UserStatusAction,
  VeterinarianStatus,
  UserStatus,
} from '../types';

export interface AdminUsersParams {
  search?: string;
  status?: UserStatus;
  veterinarianStatus?: VeterinarianStatus;
  role?: 'PET_OWNER' | 'VETERINARIAN';
  pageSize?: number;
  enabled?: boolean;
}

export function useAdminUsers(params: AdminUsersParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = {
    search: params.search || undefined,
    status: params.status,
    veterinarianStatus: params.veterinarianStatus,
    role: params.role,
  };

  const query = useInfiniteQuery<
    Paginated<AdminUser>,
    ApiError,
    InfiniteData<Paginated<AdminUser>>,
    ReturnType<typeof adminKeys.users.list>,
    number
  >({
    queryKey: adminKeys.users.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminApi.listUsers({ page: pageParam, pageSize, ...filter }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const users = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, users, total: query.data?.pages[0]?.meta.total ?? 0 };
}

export function useAdminUser(userId: string, options: { enabled?: boolean } = {}) {
  return useQuery<AdminUserDetail, ApiError>({
    queryKey: adminKeys.users.detail(userId),
    queryFn: () => adminApi.getUser(userId),
    enabled: (options.enabled ?? true) && Boolean(userId),
    staleTime: 15_000,
  });
}

export function useUserStatusMutation(
  userId: string,
): UseMutationResult<AdminUser, unknown, { action: UserStatusAction; reason?: string }> {
  const qc = useQueryClient();
  const { session, refreshSession } = useAuth();
  return useMutation({
    mutationKey: ['admin', 'users', userId, 'status'],
    mutationFn: ({ action, reason }) => adminApi.changeUserStatus(userId, action, reason),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users.detail(userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
      // If an admin changed their own record, refresh the session snapshot.
      if (session?.user.id === userId) await refreshSession();
    },
  });
}

export function useUserRoleMutation(
  userId: string,
): UseMutationResult<unknown, unknown, { roleKey: RoleKey; op: 'add' | 'remove' }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'users', userId, 'roles'],
    mutationFn: ({ roleKey, op }) =>
      op === 'add'
        ? adminApi.addUserRole(userId, roleKey)
        : adminApi.removeUserRole(userId, roleKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users.detail(userId) });
    },
  });
}
