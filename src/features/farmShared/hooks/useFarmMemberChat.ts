import { router } from 'expo-router';
import { useCallback } from 'react';

import { useToast } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { useStartConversation } from '@/features/chat';
import type { OrganizationMember } from '@/features/organizations/types';
import { useAuth } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';

/**
 * The "محادثة" button on a farm's doctors/workers list. Farm chat is the
 * existing `FARM_OWNER_MEMBER` conversation (`POST /organizations/:id/
 * conversations`): the OWNER opens one with any active non-owner member
 * (`targetUserId`, FARM_OWNER_MEMBER), a member opens their own conversation
 * with the owner (no target), and a member names a COLLEAGUE — the farm's vet
 * ↔ an employee — for a FARM_MEMBER_DIRECT chat. The server re-checks that
 * both are active non-owner members of this farm.
 *
 * Returns the press handler for a member row, or `undefined` for "no button".
 */
export function useFarmMemberChat(
  organizationId: string,
  ownerUserId: string | undefined,
  /** The caller's own farm role — `null` (e.g. an admin browsing) → no chat buttons. */
  viewerRole: string | null | undefined,
) {
  const { user } = useAuth();
  const toast = useToast();
  const start = useStartConversation();
  const me = user?.id;

  const open = useCallback(
    (targetUserId?: string) => {
      if (start.isPending) return;
      start.mutate(
        { organizationId, targetUserId },
        {
          onSuccess: (conversation) => router.push(Routes.chatThread(conversation.id)),
          onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
        },
      );
    },
    [start, organizationId, toast],
  );

  return useCallback(
    (member: OrganizationMember): (() => void) | undefined => {
      if (!me || !ownerUserId || !viewerRole || member.userId === me) return undefined;
      if (me === ownerUserId) {
        return member.roleKey === 'OWNER' ? undefined : () => open(member.userId);
      }
      // A member: the owner (FARM_OWNER_MEMBER) or a colleague — the farm's
      // vet ↔ an employee (FARM_MEMBER_DIRECT, server-checked).
      if (member.userId === ownerUserId) return () => open();
      return member.roleKey === 'OWNER' ? undefined : () => open(member.userId);
    },
    [me, ownerUserId, viewerRole, open],
  );
}
