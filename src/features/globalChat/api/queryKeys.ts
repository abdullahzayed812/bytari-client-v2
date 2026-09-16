import type { ListChatRoomsFilter } from '../types';

/**
 *   globalChatKeys.list(filter)   → ['global-chat', 'list', { …filter }]
 *   globalChatKeys.detail(id)     → ['global-chat', 'detail', id]
 */
export const globalChatKeys = {
  all: ['global-chat'] as const,
  lists: () => [...globalChatKeys.all, 'list'] as const,
  list: (filter: Omit<ListChatRoomsFilter, 'page'>) => [...globalChatKeys.lists(), filter] as const,
  details: () => [...globalChatKeys.all, 'detail'] as const,
  detail: (organizationId: string) => [...globalChatKeys.details(), organizationId] as const,
};
