import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { fullName } from '@/utils';

import { globalChatApi } from '../api';
import type { ChatRoomMember, Paginated } from '../types';

/**
 * Room roster (`GET /chat-rooms/:organizationId/members`) — any active room
 * member, unlike the generic member-list endpoint (`member.read`-gated, which
 * a plain STAFF room member does not hold). Used only to resolve a
 * `senderUserId` to a display name in the thread ("who said what").
 */
export function useChatRoomMembers(organizationId: string | undefined, options: { enabled?: boolean } = {}) {
  const pageSize = AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<ChatRoomMember>,
    unknown,
    InfiniteData<Paginated<ChatRoomMember>>,
    readonly [string, string, string],
    number
  >({
    queryKey: ['global-chat', 'members', organizationId ?? 'unknown'] as const,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => globalChatApi.listMembers(organizationId as string, pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    staleTime: 30_000,
  });

  const members = useMemo<ChatRoomMember[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const nameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) map.set(m.userId, fullName(m.firstName, m.lastName));
    return map;
  }, [members]);

  return { ...query, members, nameByUserId };
}
