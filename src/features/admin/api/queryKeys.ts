import type {
  AdminAnimalsFilter,
  AdminListFarmsFilter,
  AuditListFilter,
  OrganizationType,
  OrgListFilter,
  SupervisorListFilter,
  UserListFilter,
} from '../types';

/**
 * Admin query keys. Invalidate by the narrowest prefix that covers the change.
 *
 *   adminKeys.users.list(filter)  → ['admin','users','list', {…}]
 *   adminKeys.users.detail(id)    → ['admin','users','detail', id]
 */
export const adminKeys = {
  all: ['admin'] as const,

  users: {
    all: ['admin', 'users'] as const,
    lists: () => [...adminKeys.users.all, 'list'] as const,
    list: (filter: Omit<UserListFilter, 'page' | 'pageSize'>) =>
      [...adminKeys.users.lists(), filter] as const,
    details: () => [...adminKeys.users.all, 'detail'] as const,
    detail: (userId: string) => [...adminKeys.users.details(), userId] as const,
  },

  vetApplications: {
    all: ['admin', 'vet-applications'] as const,
    list: () => [...adminKeys.vetApplications.all, 'list'] as const,
  },

  animals: {
    all: ['admin', 'animals'] as const,
    lists: () => [...adminKeys.animals.all, 'list'] as const,
    list: (filter: Omit<AdminAnimalsFilter, 'page' | 'pageSize'>) =>
      [...adminKeys.animals.lists(), filter] as const,
  },

  organizations: {
    all: ['admin', 'organizations'] as const,
    lists: () => [...adminKeys.organizations.all, 'list'] as const,
    list: (filter: Omit<OrgListFilter, 'page' | 'pageSize'> & { pending?: boolean }) =>
      [...adminKeys.organizations.lists(), filter] as const,
    details: () => [...adminKeys.organizations.all, 'detail'] as const,
    detail: (organizationId: string) =>
      [...adminKeys.organizations.details(), organizationId] as const,
    members: (organizationId: string) =>
      [...adminKeys.organizations.detail(organizationId), 'members'] as const,
    pendingRenewalsAll: () => [...adminKeys.organizations.all, 'pending-renewals'] as const,
    pendingRenewals: (organizationType?: OrganizationType) =>
      [...adminKeys.organizations.pendingRenewalsAll(), organizationType ?? 'all'] as const,
  },

  farms: {
    all: ['admin', 'farms'] as const,
    lists: () => [...adminKeys.farms.all, 'list'] as const,
    list: (filter: Omit<AdminListFarmsFilter, 'page' | 'pageSize'>) =>
      [...adminKeys.farms.lists(), filter] as const,
    renewals: (organizationId: string) =>
      [...adminKeys.farms.all, organizationId, 'renewals'] as const,
  },

  supervisors: {
    all: ['admin', 'supervisors'] as const,
    list: (filter: Omit<SupervisorListFilter, 'page' | 'pageSize'>) =>
      [...adminKeys.supervisors.all, 'list', filter] as const,
  },

  audit: {
    all: ['admin', 'audit'] as const,
    list: (filter: Omit<AuditListFilter, 'page' | 'pageSize'>) =>
      [...adminKeys.audit.all, 'list', filter] as const,
  },

  chats: {
    all: ['admin', 'chats'] as const,
    lists: () => [...adminKeys.chats.all, 'list'] as const,
  },

  dashboard: {
    all: ['admin', 'dashboard'] as const,
    summary: () => [...adminKeys.dashboard.all, 'summary'] as const,
  },
};
