import type { ConversationListFilter } from '../types';

/**
 * Chat query keys. `list(filter)` keeps a per-org-filter cache separate from the
 * all-conversations cache; `messages` nests under `detail` so a thread refetch
 * is one `invalidateQueries({ queryKey: chatKeys.detail(id) })`.
 *
 *   chatKeys.list(filter)          → ['chat', 'list', { …filter }]
 *   chatKeys.detail(id)            → ['chat', 'detail', id]
 *   chatKeys.messages(id)          → ['chat', 'detail', id, 'messages']
 *   chatKeys.unreadTotal()        → ['chat', 'unread-total']
 */
export const chatKeys = {
  all: ['chat'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (filter: Omit<ConversationListFilter, 'page'>) => [...chatKeys.lists(), filter] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (conversationId: string) => [...chatKeys.details(), conversationId] as const,
  messages: (conversationId: string) => [...chatKeys.detail(conversationId), 'messages'] as const,
  unreadTotal: () => [...chatKeys.all, 'unread-total'] as const,
};
