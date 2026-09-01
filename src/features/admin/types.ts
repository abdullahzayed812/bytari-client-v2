/**
 * Admin (Management Centre) contract — mirrors the backend admin surface
 * EXACTLY. No invented fields, no invented endpoints. Authorization is always
 * the backend's job; the mobile capability checks only decide what UI to show.
 *
 *   server/src/modules/users/admin-users.routes.ts          → /admin/users/*
 *   server/src/modules/veterinarians/veterinarian.routes.ts → /admin/veterinarians/*
 *   server/src/modules/organizations/.../admin-organization.routes.ts → /admin/organizations/*
 *   server/src/modules/supervisors/supervisor.routes.ts     → /admin/supervisors/*
 *   server/src/modules/audit/admin-audit.routes.ts          → /admin/audit-logs
 */

import type {
  RoleKey,
  SupervisorDomain,
  UserStatus,
  VeterinarianStatus,
} from '@/features/auth/types';
import type {
  Organization,
  OrganizationStatus,
  OrganizationType,
} from '@/features/organizations/types';
import type { PageMeta } from '@/services/api';

export type { RoleKey, SupervisorDomain, UserStatus, VeterinarianStatus };
export type { Organization, OrganizationStatus, OrganizationType };

export interface Paginated<T> {
  items: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export type { PageMeta };

// --- users -----------------------------------------------------------

export const USER_STATUSES: readonly UserStatus[] = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'];
export const ROLE_KEYS: readonly RoleKey[] = ['ADMIN', 'MODERATOR', 'PET_OWNER', 'VETERINARIAN'];

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  veterinarianStatus: VeterinarianStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail extends AdminUser {
  roles: RoleKey[];
}

export interface UserListFilter {
  page: number;
  pageSize: number;
  status?: UserStatus;
  veterinarianStatus?: VeterinarianStatus;
  search?: string;
}

export type UserStatusAction = 'suspend' | 'activate' | 'deactivate';

/** `{ userId, roles }` returned by the role add/remove endpoints. */
export interface UserRolesResult {
  userId: string;
  roles: RoleKey[];
}

// --- veterinarian applications -------------------------------------

export interface PendingVetApplication {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

// --- organizations (admin surface) --------------------------------

export interface OrgListFilter {
  page: number;
  pageSize: number;
  type?: OrganizationType;
  status?: OrganizationStatus;
  search?: string;
}

export interface AdminOrgMember {
  id: string;
  organizationId: string;
  userId: string;
  roleKey: string;
  status: string;
  addedBy: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

export type OrgStatusAction = 'suspend' | 'activate' | 'deactivate';

// --- system supervisors ------------------------------------------

export const SUPERVISOR_DOMAINS: readonly SupervisorDomain[] = [
  'ANIMAL',
  'CLINIC',
  'STORE',
  'CONTENT',
  'CONSULTATION',
  'INQUIRY',
];
export type SupervisorAssignmentStatus = 'ACTIVE' | 'INACTIVE';

export interface SupervisorAssignment {
  id: string;
  userId: string;
  domain: SupervisorDomain;
  status: SupervisorAssignmentStatus;
  assignedBy: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

export interface SupervisorListFilter {
  page: number;
  pageSize: number;
  domain?: SupervisorDomain;
  status?: SupervisorAssignmentStatus;
}

export interface AssignSupervisorInput {
  userId: string;
  domain: SupervisorDomain;
}

// --- audit log --------------------------------------------------

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface AuditListFilter {
  page: number;
  pageSize: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
}
