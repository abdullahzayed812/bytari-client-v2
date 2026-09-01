import type { AdminThreadListFilter, ThreadKind, ThreadListFilter } from '../types';

/**
 * Consultation / Inquiry query keys (§28). Keyed by `kind` first so the two
 * domains never share a cache entry, then by list scope (`mine` vs `admin`) and
 * filter.
 *
 *   supportKeys.forKind(kind)                  → ['support', kind]
 *   supportKeys.myList(kind, filter)           → ['support', kind, 'mine', { …filter }]
 *   supportKeys.adminList(kind, filter)        → ['support', kind, 'admin', { …filter }]
 *   supportKeys.detail(kind, id)               → ['support', kind, 'detail', id]
 *   supportKeys.messages(kind, id)             → ['support', kind, 'detail', id, 'messages']
 *   supportKeys.aiSettings()                   → ['support', 'ai-settings']
 */
export const supportKeys = {
  all: ['support'] as const,
  forKind: (kind: ThreadKind) => [...supportKeys.all, kind] as const,
  myLists: (kind: ThreadKind) => [...supportKeys.forKind(kind), 'mine'] as const,
  myList: (kind: ThreadKind, filter: Omit<ThreadListFilter, 'page'>) =>
    [...supportKeys.myLists(kind), filter] as const,
  adminLists: (kind: ThreadKind) => [...supportKeys.forKind(kind), 'admin'] as const,
  adminList: (kind: ThreadKind, filter: Omit<AdminThreadListFilter, 'page'>) =>
    [...supportKeys.adminLists(kind), filter] as const,
  details: (kind: ThreadKind) => [...supportKeys.forKind(kind), 'detail'] as const,
  detail: (kind: ThreadKind, threadId: string) => [...supportKeys.details(kind), threadId] as const,
  messages: (kind: ThreadKind, threadId: string) =>
    [...supportKeys.detail(kind, threadId), 'messages'] as const,
  aiSettings: () => [...supportKeys.all, 'ai-settings'] as const,
};
