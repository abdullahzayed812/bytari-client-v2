/**
 * Safety — Google Play UGC / AI-content requirements, shared by every feature:
 *  - user blocking (`/users/me/blocks`): blocked users can't exchange direct
 *    messages with the viewer; their Global Chat messages are hidden.
 *  - content reporting: `openReport(targetType, targetId)` opens the shared
 *    report screen (`POST /reports`) for messages, users, listings,
 *    organizations, reviews, comments and AI answers.
 */
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/hooks';
import { apiClient } from '@/services/api';

export interface BlockedUser {
  userId: string;
  firstName: string;
  lastName: string;
  blockedAt: string;
}

export const safetyKeys = {
  blocks: ['safety', 'blocks'] as const,
};

export const safetyApi = {
  listBlocks(): Promise<BlockedUser[]> {
    return apiClient.get<BlockedUser[]>('/users/me/blocks');
  },
  block(userId: string): Promise<{ userId: string; blocked: true }> {
    return apiClient.put(`/users/me/blocks/${userId}`);
  },
  unblock(userId: string): Promise<{ userId: string; blocked: false }> {
    return apiClient.delete(`/users/me/blocks/${userId}`);
  },
};

export function useBlockedUsers(): UseQueryResult<BlockedUser[]> {
  const { user } = useAuth();
  return useQuery({
    queryKey: safetyKeys.blocks,
    queryFn: () => safetyApi.listBlocks(),
    enabled: Boolean(user),
    staleTime: 60_000,
  });
}

/** The ids the viewer has blocked (empty while loading). */
export function useBlockedUserIds(): Set<string> {
  const q = useBlockedUsers();
  return useMemo(() => new Set((q.data ?? []).map((b) => b.userId)), [q.data]);
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => safetyApi.block(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: safetyKeys.blocks }),
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => safetyApi.unblock(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: safetyKeys.blocks }),
  });
}

export { openReport } from './openReport';
export { ReportLink } from './ReportLink';
