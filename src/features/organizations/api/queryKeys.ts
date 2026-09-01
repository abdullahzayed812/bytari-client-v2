import type { MemberListFilter } from '../types';

/**
 * Centralised organization query keys (§14 — no raw key arrays elsewhere,
 * invalidate by the narrowest prefix that covers the change).
 *
 *   orgKeys.all                       → ['organizations']
 *   orgKeys.lists()                   → ['organizations', 'list']
 *   orgKeys.list(page)                → ['organizations', 'list', { page }]
 *   orgKeys.details()                 → ['organizations', 'detail']
 *   orgKeys.detail(id)                → ['organizations', 'detail', id]
 *   orgKeys.members(id)               → ['organizations', 'detail', id, 'members']
 *   orgKeys.memberList(id, filter)    → ['organizations', 'detail', id, 'members', { …filter }]
 *   orgKeys.supervisors(id)           → ['organizations', 'detail', id, 'supervisors']
 */
export const orgKeys = {
  all: ['organizations'] as const,
  lists: () => [...orgKeys.all, 'list'] as const,
  list: (page: number) => [...orgKeys.lists(), { page }] as const,
  details: () => [...orgKeys.all, 'detail'] as const,
  detail: (organizationId: string) => [...orgKeys.details(), organizationId] as const,
  members: (organizationId: string) => [...orgKeys.detail(organizationId), 'members'] as const,
  memberList: (organizationId: string, filter: Omit<MemberListFilter, 'page'>) =>
    [...orgKeys.members(organizationId), filter] as const,
  supervisors: (organizationId: string) =>
    [...orgKeys.detail(organizationId), 'supervisors'] as const,
};
