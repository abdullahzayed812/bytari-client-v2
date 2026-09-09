import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  AdminFarmListItem,
  AdminFarmRenewalRequest,
  AdminListFarmsFilter,
  AdminOrgMember,
  AdminUser,
  AdminUserDetail,
  ApproveFarmRenewalInput,
  AssignSupervisorInput,
  AuditListFilter,
  AuditLogEntry,
  Organization,
  OrganizationWithDetails,
  OrgListFilter,
  OrgStatusAction,
  Paginated,
  PendingVetApplication,
  SetFarmSubscriptionInput,
  SupervisorAssignment,
  SupervisorListFilter,
  UserListFilter,
  UserRolesResult,
  UserStatusAction,
  RoleKey,
  AdminAnimal,
  AdminAnimalsFilter,
} from '../types';

/**
 * `/api/v1/admin/*` — the Management Centre surface. Every endpoint maps 1:1 to
 * a backend route + permission (see `../types.ts` for the file references). The
 * backend independently authorises every call.
 */

type PageMetaOut = { page: number; pageSize: number; total: number; totalPages: number };

function readMeta(
  meta: unknown,
  page: number,
  pageSize: number,
  fallbackTotal: number,
): PageMetaOut {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? fallbackTotal,
    totalPages: m.totalPages ?? 1,
  };
}

async function listPaged<T>(
  url: string,
  page: number,
  pageSize: number,
  params: Record<string, unknown>,
): Promise<Paginated<T>> {
  const envelope = await apiClient.requestEnvelope<T[]>({
    method: 'GET',
    url,
    params: { page, pageSize, ...params },
  });
  return {
    items: envelope.data,
    meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
  };
}

export const adminApi = {
  // --- users -----------------------------------------------------
  listUsers(f: UserListFilter): Promise<Paginated<AdminUser>> {
    return listPaged<AdminUser>('/admin/users', f.page, f.pageSize, {
      status: f.status,
      veterinarianStatus: f.veterinarianStatus,
      search: f.search,
    });
  },

  getUser(userId: string): Promise<AdminUserDetail> {
    return apiClient.get<AdminUserDetail>(`/admin/users/${userId}`);
  },

  changeUserStatus(userId: string, action: UserStatusAction, reason?: string): Promise<AdminUser> {
    return apiClient.post<AdminUser>(`/admin/users/${userId}/${action}`, reason ? { reason } : {});
  },

  addUserRole(userId: string, roleKey: RoleKey): Promise<UserRolesResult> {
    return apiClient.post<UserRolesResult>(`/admin/users/${userId}/roles`, { roleKey });
  },

  removeUserRole(userId: string, roleKey: RoleKey): Promise<UserRolesResult> {
    return apiClient.delete<UserRolesResult>(`/admin/users/${userId}/roles/${roleKey}`);
  },

  // --- veterinarian applications ------------------------------
  listPendingVetApplications(
    page: number,
    pageSize: number,
  ): Promise<Paginated<PendingVetApplication>> {
    return listPaged<PendingVetApplication>('/admin/veterinarians/pending', page, pageSize, {});
  },

  approveVetApplication(userId: string): Promise<unknown> {
    return apiClient.post<unknown>(`/admin/veterinarians/${userId}/approve`);
  },

  rejectVetApplication(userId: string, reason: string): Promise<unknown> {
    return apiClient.post<unknown>(`/admin/veterinarians/${userId}/reject`, { reason });
  },

  // --- organizations ----------------------------------------
  listOrganizations(f: OrgListFilter): Promise<Paginated<Organization>> {
    return listPaged<Organization>('/admin/organizations', f.page, f.pageSize, {
      type: f.type,
      status: f.status,
      search: f.search,
    });
  },

  listPendingOrganizations(page: number, pageSize: number): Promise<Paginated<Organization>> {
    return listPaged<Organization>('/admin/organizations/pending', page, pageSize, {});
  },

  getOrganization(organizationId: string): Promise<OrganizationWithDetails> {
    return apiClient.get<OrganizationWithDetails>(`/admin/organizations/${organizationId}`);
  },

  listOrganizationMembers(organizationId: string): Promise<AdminOrgMember[]> {
    return apiClient
      .requestEnvelope<AdminOrgMember[]>({
        method: 'GET',
        url: `/admin/organizations/${organizationId}/members`,
      })
      .then((e) => e.data);
  },

  approveOrganization(organizationId: string): Promise<Organization> {
    return apiClient.post<Organization>(`/admin/organizations/${organizationId}/approve`);
  },

  rejectOrganization(organizationId: string, reason: string): Promise<Organization> {
    return apiClient.post<Organization>(`/admin/organizations/${organizationId}/reject`, {
      reason,
    });
  },

  changeOrganizationStatus(
    organizationId: string,
    action: OrgStatusAction,
    reason?: string,
  ): Promise<Organization> {
    return apiClient.post<Organization>(
      `/admin/organizations/${organizationId}/${action}`,
      reason ? { reason } : {},
    );
  },

  // --- Poultry Farms management (subscription + renewal requests) -----
  listFarms(f: AdminListFarmsFilter): Promise<Paginated<AdminFarmListItem>> {
    return listPaged<AdminFarmListItem>('/admin/organizations/farms', f.page, f.pageSize, {
      status: f.status,
      subscriptionStatus: f.subscriptionStatus,
    });
  },

  listFarmRenewalRequests(organizationId: string): Promise<AdminFarmRenewalRequest[]> {
    return apiClient
      .requestEnvelope<AdminFarmRenewalRequest[]>({
        method: 'GET',
        url: `/admin/organizations/${organizationId}/subscription-renewals`,
      })
      .then((e) => e.data);
  },

  setFarmSubscription(
    organizationId: string,
    input: SetFarmSubscriptionInput,
  ): Promise<{ updated: boolean }> {
    return apiClient.post<{ updated: boolean }>(
      `/admin/organizations/${organizationId}/subscription`,
      input,
    );
  },

  approveFarmRenewal(
    organizationId: string,
    requestId: string,
    input: ApproveFarmRenewalInput,
  ): Promise<AdminFarmRenewalRequest> {
    return apiClient.post<AdminFarmRenewalRequest>(
      `/admin/organizations/${organizationId}/subscription-renewals/${requestId}/approve`,
      input,
    );
  },

  rejectFarmRenewal(
    organizationId: string,
    requestId: string,
    reason: string,
  ): Promise<AdminFarmRenewalRequest> {
    return apiClient.post<AdminFarmRenewalRequest>(
      `/admin/organizations/${organizationId}/subscription-renewals/${requestId}/reject`,
      { reason },
    );
  },

  // --- system supervisors --------------------------------
  listSupervisors(f: SupervisorListFilter): Promise<Paginated<SupervisorAssignment>> {
    return listPaged<SupervisorAssignment>('/admin/supervisors', f.page, f.pageSize, {
      domain: f.domain,
      status: f.status,
    });
  },

  assignSupervisor(input: AssignSupervisorInput): Promise<SupervisorAssignment> {
    return apiClient.post<SupervisorAssignment>('/admin/supervisors', input);
  },

  removeSupervisor(assignmentId: string): Promise<SupervisorAssignment> {
    return apiClient.delete<SupervisorAssignment>(`/admin/supervisors/${assignmentId}`);
  },

  // --- animals (oversight of user pets) -----------------
  listAnimals(f: AdminAnimalsFilter): Promise<Paginated<AdminAnimal>> {
    return listPaged<AdminAnimal>('/admin/animals', f.page, f.pageSize, {
      status: f.status,
      species: f.species,
      search: f.search,
      ownerUserId: f.ownerUserId,
    });
  },

  deleteAnimal(animalId: string): Promise<{ id: string; status: string }> {
    return apiClient.delete<{ id: string; status: string }>(`/admin/animals/${animalId}`);
  },

  // --- audit log ---------------------------------------
  listAuditLog(f: AuditListFilter): Promise<Paginated<AuditLogEntry>> {
    return listPaged<AuditLogEntry>('/admin/audit-logs', f.page, f.pageSize, {
      action: f.action,
      entityType: f.entityType,
      entityId: f.entityId,
      actorUserId: f.actorUserId,
    });
  },
};

export type AdminApi = typeof adminApi;
