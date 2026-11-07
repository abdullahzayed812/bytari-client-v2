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
import { FileUploadService } from '@/services/files/fileUploadService';
import type { LocalFile } from '@/services/files/types';

import { adminApi, adminKeys } from '../api';
import type {
  AdminAccountType,
  AdminUpdateUserInput,
  AdminUser,
  AdminUserDetail,
  Paginated,
  RoleKey,
  UserStatusAction,
  VetApplicationDocument,
  VetApplicationDocumentKind,
  VeterinarianStatus,
  UserStatus,
} from '../types';

export interface AdminUsersParams {
  search?: string;
  status?: UserStatus;
  veterinarianStatus?: VeterinarianStatus;
  accountType?: AdminAccountType;
  pageSize?: number;
  enabled?: boolean;
}

export function useAdminUsers(params: AdminUsersParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = {
    search: params.search || undefined,
    status: params.status,
    veterinarianStatus: params.veterinarianStatus,
    accountType: params.accountType,
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

/** `DELETE /admin/users/:id` — permanent. Refreshes the user list + dashboard counters. */
export function useDeleteUserMutation(
  userId: string,
): UseMutationResult<{ id: string; deleted: true }, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'users', userId, 'delete'],
    mutationFn: () => adminApi.deleteUser(userId),
    onSuccess: () => {
      qc.removeQueries({ queryKey: adminKeys.users.detail(userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.users.all });
      void qc.invalidateQueries({ queryKey: adminKeys.dashboard.all });
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

/** `PATCH /admin/users/:id` — profile fields only. */
export function useUpdateUserMutation(
  userId: string,
): UseMutationResult<AdminUser, unknown, AdminUpdateUserInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'users', userId, 'update'],
    mutationFn: (body) => adminApi.updateUser(userId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users.detail(userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
    },
  });
}

/** Set a new password (admin-chosen) or email a reset code. Passwords are never readable. */
export function useUserPasswordMutations(userId: string) {
  const setPassword = useMutation({
    mutationKey: ['admin', 'users', userId, 'password'],
    mutationFn: (newPassword: string) => adminApi.setUserPassword(userId, newPassword),
  });
  const sendReset = useMutation({
    mutationKey: ['admin', 'users', userId, 'password-reset'],
    mutationFn: () => adminApi.sendUserPasswordReset(userId),
  });
  return { setPassword, sendReset };
}

/**
 * Admin: replace one identity / licence document of a veterinarian — presigned
 * upload to private storage (`/admin/veterinarians/:id/documents/upload-url`),
 * then `PUT …/documents/:kind` swaps it in. Refreshes the user detail.
 */
export function useReplaceVetDocumentMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation<
    VetApplicationDocument[],
    ApiError,
    { kind: VetApplicationDocumentKind; file: LocalFile }
  >({
    mutationKey: ['admin', 'users', userId, 'vet-document'],
    mutationFn: async ({ kind, file }) => {
      const result = await new FileUploadService({
        requestUpload: (f) =>
          adminApi.requestVetDocumentUploadUrl(userId, {
            kind,
            filename: f.name,
            mimeType: f.mimeType,
            size: f.size ?? 0,
          }),
      }).upload(file);
      return adminApi.replaceVetDocument(userId, kind, {
        storageKey: result.storageKey,
        filename: file.name,
        mimeType: file.mimeType,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users.detail(userId) });
    },
  });
}

/** "مراسلة المستخدم" — opens a support thread through the existing support chat. */
export function useMessageUserMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'users', userId, 'message'],
    mutationFn: (body: string) => adminApi.messageUser(userId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['support'] });
    },
  });
}
