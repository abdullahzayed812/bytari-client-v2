import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { chatKeys } from '@/features/chat/api';

import { globalChatApi, globalChatKeys } from '../api';
import type { ChatRoomDetail, ContentReport, CreateChatRoomInput, SubmitReportInput } from '../types';

export function useJoinChatRoom(organizationId: string): UseMutationResult<ChatRoomDetail, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => globalChatApi.join(organizationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: globalChatKeys.detail(organizationId) });
      void qc.invalidateQueries({ queryKey: globalChatKeys.lists() });
    },
  });
}

export function useLeaveChatRoom(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => globalChatApi.leave(organizationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: globalChatKeys.detail(organizationId) });
      void qc.invalidateQueries({ queryKey: globalChatKeys.lists() });
    },
  });
}

export function useSetChatRoomMuted(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, boolean> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (muted: boolean) => globalChatApi.setMuted(organizationId, muted),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: globalChatKeys.detail(organizationId) });
    },
  });
}

export function useUpdateChatRoomRules(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, string | null> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rules: string | null) => globalChatApi.updateRules(organizationId, rules),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: globalChatKeys.detail(organizationId) });
    },
  });
}

export function usePinRoomMessage(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => globalChatApi.pinMessage(organizationId, messageId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: globalChatKeys.detail(organizationId) });
    },
  });
}

export function useUnpinRoomMessage(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => globalChatApi.unpinMessage(organizationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: globalChatKeys.detail(organizationId) });
    },
  });
}

/** Moderator-only removal of another member's message (`chat_room.message.delete`). */
export function useDeleteRoomMessage(
  organizationId: string,
  conversationId: string,
): UseMutationResult<{ success: boolean }, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => globalChatApi.deleteMessage(organizationId, messageId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
    },
  });
}

/** `POST /admin/chat-rooms` — ADMIN only (`chat_room.admin.create`). */
export function useCreateChatRoomAdmin(): UseMutationResult<
  ChatRoomDetail,
  unknown,
  CreateChatRoomInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChatRoomInput) => globalChatApi.createAdmin(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: globalChatKeys.lists() }),
  });
}

/** `POST /reports` — any authenticated user reports a message or a room. */
export function useSubmitReport(): UseMutationResult<ContentReport, unknown, SubmitReportInput> {
  return useMutation({
    mutationFn: (input: SubmitReportInput) => globalChatApi.submitReport(input),
  });
}
