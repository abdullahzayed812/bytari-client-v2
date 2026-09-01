/**
 * Organization contract — Mobile Phase 4. Mirrors the backend EXACTLY
 * (`server/src/modules/organizations/domain/organization.types.ts`,
 * `organization-rbac.constants.ts`, `organization.schemas.ts`) and the
 * `phase3` OpenAPI schemas. No invented fields, no invented endpoints.
 *
 * Authorization is ALWAYS the backend's job. The `myRole` string on a detail
 * response and the `orgCapabilities()` helper only decide what UI to show.
 */

// --- controlled vocabularies (exact backend values) -------------------
export const ORGANIZATION_TYPES = [
  'CLINIC',
  'FARM',
  'VETERINARY_OFFICE',
  'VETERINARY_STORE',
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

/** Organization types whose owner MUST be a globally APPROVED veterinarian. */
export const VET_APPROVAL_REQUIRED_TYPES: readonly OrganizationType[] = ['CLINIC', 'FARM'];

export const ORGANIZATION_STATUSES = [
  'PENDING',
  'ACTIVE',
  'REJECTED',
  'SUSPENDED',
  'DEACTIVATED',
] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const MEMBERSHIP_STATUSES = ['ACTIVE', 'SUSPENDED', 'REMOVED', 'LEFT'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const ORG_ROLE_KEYS = ['OWNER', 'VETERINARIAN', 'SUPERVISOR', 'STAFF'] as const;
export type OrgRoleKey = (typeof ORG_ROLE_KEYS)[number];

/** Roles the backend accepts when adding / updating a plain member. */
export const ASSIGNABLE_MEMBER_ROLES = ['VETERINARIAN', 'STAFF'] as const;
export type AssignableMemberRole = (typeof ASSIGNABLE_MEMBER_ROLES)[number];

/** Statuses the backend accepts when updating a member. */
export const MEMBER_STATUS_ACTIONS = ['ACTIVE', 'SUSPENDED'] as const;
export type MemberStatusAction = (typeof MEMBER_STATUS_ACTIONS)[number];

// --- DTOs -----------------------------------------------------------
export interface Organization {
  id: string;
  type: OrganizationType;
  name: string;
  description: string | null;
  ownerUserId: string;
  status: OrganizationStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationDetails {
  /** FARM organizations only. */
  joinCode?: string;
}

export interface OrganizationWithDetails extends Organization {
  details: OrganizationDetails;
}

/** `GET /organizations` list item — an {@link Organization} plus the caller's role. */
export interface MyOrganization extends Organization {
  myRole: OrgRoleKey | string;
}

/**
 * `GET /organizations/:id` — {@link OrganizationWithDetails} plus the caller's
 * organization role (`null` for an ADMIN who is not a member). The backend does
 * NOT return the caller's permission set here, so the client derives coarse UI
 * gates from `myRole` — see {@link orgCapabilities} in `../constants`.
 */
export interface OrganizationDetail extends OrganizationWithDetails {
  myRole: OrgRoleKey | string | null;
}

export interface OrgMemberUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  roleKey: OrgRoleKey | string;
  status: MembershipStatus;
  addedBy: string | null;
  createdAt: string;
  updatedAt: string;
  user: OrgMemberUser;
}

export interface OrganizationSupervisor extends OrganizationMember {
  /** The owner-selected organization permission keys for this supervisor. */
  permissions: string[];
}

// --- request payloads (client sends ONLY these fields) ---------------
export interface CreateOrganizationInput {
  type: OrganizationType;
  name: string;
  description?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string | null;
}

export interface AddMemberInput {
  userId: string;
  role: AssignableMemberRole;
}

export interface UpdateMemberInput {
  role?: AssignableMemberRole;
  status?: MemberStatusAction;
}

export interface AssignSupervisorInput {
  userId: string;
  permissions: string[];
}

export interface UpdateSupervisorInput {
  permissions: string[];
}

// --- list -----------------------------------------------------------
export interface MemberListFilter {
  page: number;
  pageSize: number;
  status?: MembershipStatus;
  roleKey?: OrgRoleKey;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}
