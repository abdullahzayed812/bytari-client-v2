import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';
import type { ApiError } from '@/services/api';
import type { LocalFile } from '@/services/files/types';

import {
  accountApi,
  accountKeys,
  type MyDocuments,
  type UpdateMyProfileInput,
} from '../api/accountApi';

/**
 * `PATCH /users/me`, then re-pull `/auth/me` so every screen reading
 * `useAuth()` shows the new profile immediately.
 */
export function useUpdateMyProfile() {
  return useMutation<unknown, ApiError, UpdateMyProfileInput>({
    mutationFn: async (input) => {
      const user = await accountApi.updateMe(input);
      useAuthStore.setState({ user });
      await useAuthStore.getState().refreshSession();
      return user;
    },
  });
}

/** Upload a new avatar (already cropped by the shared image editor), then refresh the session. */
export function useUploadMyAvatar() {
  return useMutation<unknown, unknown, LocalFile>({
    mutationFn: async (file) => {
      await accountApi.uploadAvatar(file);
      await useAuthStore.getState().refreshSession();
    },
  });
}

/** The caller's own verification documents (signed view URLs expire — keep it fresh). */
export function useMyDocuments(options: { enabled?: boolean } = {}) {
  return useQuery<MyDocuments, ApiError>({
    queryKey: accountKeys.documents(),
    queryFn: () => accountApi.myDocuments(),
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
}
