import type { BadgeTone, IconName } from '@/components/content';

import type { MembershipStatus, OrganizationStatus, OrganizationType, OrgRoleKey } from './types';

/**
 * Organization type → line icon + i18n label key (`organizations:type.<KEY>`).
 * The order here is the order shown in the "create organization" picker.
 */
export const ORG_TYPE_ICON: Record<OrganizationType, IconName> = {
  CLINIC: 'medkit-outline',
  FARM: 'leaf-outline',
  VETERINARY_OFFICE: 'business-outline',
  VETERINARY_STORE: 'storefront-outline',
  SYNDICATE: 'ribbon-outline',
  CHAT_ROOM: 'chatbubbles-outline',
};

export const ORG_TYPE_ORDER: readonly OrganizationType[] = [
  'VETERINARY_OFFICE',
  'CLINIC',
  'FARM',
  'VETERINARY_STORE',
];

/** Organization lifecycle status → badge tone. */
export const ORG_STATUS_TONE: Record<OrganizationStatus, BadgeTone> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  REJECTED: 'danger',
  SUSPENDED: 'danger',
  DEACTIVATED: 'neutral',
};

/** Membership status → badge tone. */
export const MEMBERSHIP_STATUS_TONE: Record<MembershipStatus, BadgeTone> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  REMOVED: 'neutral',
  LEFT: 'neutral',
};

export const ORG_ROLE_TONE: Record<OrgRoleKey, BadgeTone> = {
  OWNER: 'primary',
  VETERINARIAN: 'info',
  SUPERVISOR: 'info',
  STAFF: 'neutral',
};

/**
 * Organization-management permission catalogue exposed by the supervisor
 * assignment UI. These keys are copied VERBATIM from the backend catalogue
 * (`ORG_PERMISSION_KEYS` in `organization-rbac.constants.ts`) — this is a
 * presentation grouping of the backend's list, not a second source of truth.
 *
 * Only the 11 organization-management permissions are surfaced here. The
 * domain permissions in the same backend catalogue (`medical_record.*`,
 * `vaccination.*`, `farm.poultry.*`, `product.*`,
 * `animal.veterinary.access.*`) belong to their own feature phases (5 / 6 / 10)
 * and are intentionally not offered in this screen yet. The backend still
 * validates every submitted key against the full catalogue and rejects
 * anything else.
 */
export const ORG_PERMISSION_GROUPS = [
  {
    key: 'organization',
    permissions: ['organization.read', 'organization.update'],
  },
  {
    key: 'members',
    permissions: ['member.read', 'member.add', 'member.update', 'member.remove'],
  },
  {
    key: 'supervisors',
    permissions: ['supervisor.read', 'supervisor.assign', 'supervisor.remove'],
  },
  {
    key: 'veterinarians',
    permissions: ['organization.veterinarian.read', 'organization.veterinarian.manage'],
  },
] as const satisfies readonly { key: string; permissions: readonly string[] }[];

export type OrgPermissionGroupKey = (typeof ORG_PERMISSION_GROUPS)[number]['key'];
export type OrgManagementPermissionKey =
  (typeof ORG_PERMISSION_GROUPS)[number]['permissions'][number];

/** Flat list of every permission key the mobile supervisor UI can send. */
export const ORG_MANAGEMENT_PERMISSION_KEYS: readonly OrgManagementPermissionKey[] =
  ORG_PERMISSION_GROUPS.flatMap((g) => [...g.permissions]);

/**
 * CHAT_ROOM-only supervisor permissions — a global chat room moderator, not
 * shown for any other organization type (a CLINIC/FARM/etc. supervisor form
 * has no use for "manage room rules"). Copied VERBATIM from the backend
 * `ORG_PERMISSION_KEYS` catalogue, same convention as {@link ORG_PERMISSION_GROUPS}.
 */
export const CHAT_ROOM_PERMISSION_GROUPS = [
  {
    key: 'chat_room',
    permissions: ['chat_room.rules.manage', 'chat_room.message.delete'],
  },
] as const satisfies readonly { key: string; permissions: readonly string[] }[];

export type AnyOrgPermissionGroupKey =
  | OrgPermissionGroupKey
  | (typeof CHAT_ROOM_PERMISSION_GROUPS)[number]['key'];
export type AnyOrgPermissionKey =
  | OrgManagementPermissionKey
  | (typeof CHAT_ROOM_PERMISSION_GROUPS)[number]['permissions'][number];

export interface OrgPermissionGroup {
  key: AnyOrgPermissionGroupKey;
  permissions: readonly AnyOrgPermissionKey[];
}

/** The permission groups to offer in the supervisor-assignment UI for one organization type. */
export function permissionGroupsFor(type: OrganizationType | undefined): readonly OrgPermissionGroup[] {
  return type === 'CHAT_ROOM'
    ? [...ORG_PERMISSION_GROUPS, ...CHAT_ROOM_PERMISSION_GROUPS]
    : ORG_PERMISSION_GROUPS;
}

export interface OrgCapabilities {
  /** They successfully loaded the detail, so they can read the profile. */
  canViewOrganization: boolean;
  canEditOrganization: boolean;
  canViewMembers: boolean;
  canManageMembers: boolean;
  canViewSupervisors: boolean;
  canManageSupervisors: boolean;
  /**
   * Phase 5 — may list the organization's animals (`animal.veterinary.access.read`,
   * seeded to the VETERINARIAN org role). Still gated to CLINIC org types by the
   * caller.
   */
  canViewOrganizationAnimals: boolean;
  /**
   * Phase 5 — may grant / revoke the organization's veterinary access
   * (`animal.veterinary.access.manage`, seeded to OWNER-override /
   * empowered SUPERVISOR only — NOT the plain VETERINARIAN role).
   */
  canManageOrganizationAnimalAccess: boolean;
  /**
   * Phase 6 — may read an animal's medical records + vaccinations
   * (`medical_record.read` / `vaccination.read`, seeded to the VETERINARIAN
   * org role). Gated to CLINIC org types + an ACTIVE veterinary-access grant
   * by the backend.
   */
  canViewOrganizationMedical: boolean;
  /**
   * Phase 6 — may create / edit / delete medical records + vaccinations
   * (`medical_record.{create,update,delete}` / `vaccination.{create,update,delete}`,
   * seeded to the VETERINARIAN org role). A clinic may only edit / delete
   * entries IT recorded (backend returns 404 otherwise).
   */
  canManageOrganizationMedical: boolean;
  /**
   * Phase 7 — may list a FARM's poultry flocks (`farm.poultry.read`, seeded to
   * OWNER-override / VETERINARIAN / SUPERVISOR / STAFF org roles). Gated to FARM
   * org types by the caller; the backend also enforces `farm.poultry.read`.
   */
  canViewFarmPoultry: boolean;
  /**
   * Phase 7 — may create / edit / delete poultry flocks
   * (`farm.poultry.{create,update,delete}`, seeded to OWNER-override /
   * VETERINARIAN / SUPERVISOR — **not** the plain STAFF role, which is read-only).
   */
  canManageFarmPoultry: boolean;
  /** Estimated profit + expected sale price — OWNER / ADMIN only (backend redacts for others). */
  canViewFarmFinancials: boolean;
  /**
   * Phase 7 — may read / rotate a FARM's join code
   * (`organization.update`, OWNER via override). Non-owners never see the code
   * card and the dedicated endpoint 403s for them.
   */
  canViewFarmJoinCode: boolean;
  /**
   * Phase 10 — may view a VETERINARY_STORE's product catalogue (`product.read`,
   * seeded to OWNER-override / STAFF; a SUPERVISOR's real grants are
   * owner-selected and unknown to the client, so we show them the list and let
   * the backend authorise). Gated to VETERINARY_STORE org types by the caller.
   */
  canViewStoreProducts: boolean;
  /**
   * Phase 10 — may create / edit / deactivate products and adjust stock
   * (`product.{create,update,delete,inventory.adjust}`, seeded to OWNER-override
   * only; a SUPERVISOR may have them if the owner granted them — **not** the
   * plain STAFF role, which is read-only). Every mutation is still gated
   * server-side.
   */
  canManageStoreProducts: boolean;
  /** The organization owner cannot leave (backend rejects it). */
  canLeave: boolean;
  isOwner: boolean;
  /**
   * Veterinary Office Dashboard — may send a broadcast to followers
   * (`organization.broadcast.send`, seeded to OWNER-override only; a SUPERVISOR
   * may have it if the owner granted it). Every send is still gated server-side.
   */
  canSendBroadcast: boolean;
}

/**
 * Coarse, UX-only capability gates derived from the caller's organization role.
 *
 * The backend `GET /organizations/:id` response gives us `myRole` but NOT the
 * resolved permission set, so this mirrors the seeded role → permission grants
 * (`ORG_ROLE_PERMISSIONS`): OWNER (and ADMIN) get everything via the owner
 * override; VETERINARIAN can read members; STAFF can only read the profile; a
 * SUPERVISOR's real permissions are owner-selected and unknown to the client,
 * so we show them a read-only view and let the backend authorise (or 403) any
 * action they attempt. Every mutation is still gated server-side.
 */
export function orgCapabilities(
  myRole: OrgRoleKey | string | null | undefined,
  isAdmin: boolean,
): OrgCapabilities {
  const owner = myRole === 'OWNER';
  const privileged = isAdmin || owner;
  const isVet = myRole === 'VETERINARIAN';
  const isSupervisor = myRole === 'SUPERVISOR';
  const isStaff = myRole === 'STAFF';

  return {
    canViewOrganization: true,
    canEditOrganization: privileged,
    canViewMembers: privileged || isVet || isSupervisor,
    canManageMembers: privileged,
    canViewSupervisors: privileged || isSupervisor,
    canManageSupervisors: privileged,
    canViewOrganizationAnimals: privileged || isVet || isSupervisor,
    canManageOrganizationAnimalAccess: privileged,
    canViewOrganizationMedical: privileged || isVet || isSupervisor,
    canManageOrganizationMedical: privileged || isVet || isSupervisor,
    canViewFarmPoultry: privileged || isVet || isSupervisor || isStaff,
    canManageFarmPoultry: privileged || isVet || isSupervisor,
    canViewFarmFinancials: privileged,
    canViewFarmJoinCode: privileged,
    canViewStoreProducts: privileged || isSupervisor || isStaff,
    canManageStoreProducts: privileged || isSupervisor,
    canLeave: myRole != null && !owner,
    isOwner: owner,
    canSendBroadcast: privileged || isSupervisor,
  };
}
