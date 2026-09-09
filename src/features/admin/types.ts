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
  FarmSubscriptionStatus,
  Organization,
  OrganizationStatus,
  OrganizationType,
  OrganizationWithDetails,
} from '@/features/organizations/types';
import type { PageMeta } from '@/services/api';

export type { RoleKey, SupervisorDomain, UserStatus, VeterinarianStatus };
export type { Organization, OrganizationStatus, OrganizationType, OrganizationWithDetails };
export type { FarmSubscriptionStatus };

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
  'SUPPORT',
  'MARKET',
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

// --- Poultry Farms management (subscription + renewal requests) ----------
// server/src/modules/organizations/infrastructure/farm-subscription-renewal.repository.ts
// server/src/modules/farms/domain/farm-subscription.types.ts

/** `GET /admin/organizations/farms` list item. */
export interface AdminFarmListItem {
  organizationId: string;
  name: string;
  status: OrganizationStatus;
  decidedAt: string | null;
  decisionReason: string | null;
  createdAt: string;
  ownerUserId: string;
  ownerName: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  /** Computed server-side — never computed by the app. */
  subscriptionStatus: FarmSubscriptionStatus;
  hasOpenRenewalRequest: boolean;
  supervisors: { userId: string; name: string }[];
  /** `POULTRY` | `SHEEP` | `CATTLE` | `MIXED` | `null` (legacy farms). */
  farmSpecies?: 'POULTRY' | 'SHEEP' | 'CATTLE' | 'MIXED' | null;
}

/** Which farm family the admin list is scoped to. */
export type FarmSpeciesGroup = 'POULTRY' | 'LIVESTOCK';

export interface AdminListFarmsFilter {
  page: number;
  pageSize: number;
  status?: OrganizationStatus;
  subscriptionStatus?: FarmSubscriptionStatus;
  /** `POULTRY` → poultry farms; `LIVESTOCK` → sheep + cattle farms. */
  speciesGroup?: FarmSpeciesGroup;
}

export const RENEWAL_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type RenewalRequestStatus = (typeof RENEWAL_REQUEST_STATUSES)[number];

export interface AdminFarmRenewalRequest {
  id: string;
  organizationId: string;
  requestedByUserId: string;
  status: RenewalRequestStatus;
  note: string | null;
  previousSubscriptionEndDate: string | null;
  newSubscriptionStartDate: string | null;
  newSubscriptionEndDate: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SetFarmSubscriptionInput {
  startDate: string;
  endDate: string;
}

export interface ApproveFarmRenewalInput {
  startDate: string;
  endDate: string;
}

// --- Admin animals (oversight of user pets) ------------------------
// Backend: server/src/modules/animals/presentation/admin-animal.controller.ts
//   GET    /admin/animals            — animal.read  (ADMIN or ANIMAL supervisor)
//   DELETE /admin/animals/:animalId  — animal.delete (ADMIN override)

export type AdminAnimalStatus = 'ACTIVE' | 'DEACTIVATED';

export interface AdminAnimal {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string;
  status: AdminAnimalStatus;
  currentOwnerUserId: string | null;
  /** Current owner's display name, resolved server-side. */
  ownerName: string | null;
  galleryUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminAnimalsFilter {
  page: number;
  pageSize: number;
  status?: AdminAnimalStatus;
  species?: string;
  search?: string;
  ownerUserId?: string;
}
