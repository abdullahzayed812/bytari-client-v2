import type { BadgeTone, IconName } from '@/components/content';

import type {
  MembershipStatus,
  OrganizationStatus,
  OrganizationTermsKey,
  OrganizationType,
  OrgRoleKey,
} from './types';

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

/**
 * SYNDICATE-only supervisor permissions ("مسؤول النقابة"). Copied VERBATIM
 * from the backend `ORG_PERMISSION_KEYS` catalogue. Without these a syndicate
 * supervisor assigned through the generic flow received no syndicate rights.
 */
export const SYNDICATE_PERMISSION_GROUPS = [
  {
    key: 'syndicate',
    permissions: [
      'syndicate.profile.manage',
      'syndicate.announcement.manage',
      'syndicate.submission.read',
      'syndicate.submission.respond',
      'syndicate.member.read',
      'syndicate.member.manage',
      'syndicate.member.message',
    ],
  },
] as const satisfies readonly { key: string; permissions: readonly string[] }[];

/**
 * VETERINARY_OFFICE / VETERINARY_STORE supervisor permissions — the office's
 * products (view / add / edit / delete / stock) and the "رسالة للمتابعين"
 * broadcast. A SUPERVISOR has NO product permission by default (backend
 * design: the owner picks per membership), so without these an office
 * supervisor could never reach the office's products. Copied VERBATIM from
 * the backend `ORG_PERMISSION_KEYS` catalogue.
 */
export const OFFICE_PERMISSION_GROUPS = [
  {
    key: 'products',
    permissions: [
      'product.read',
      'product.create',
      'product.update',
      'product.delete',
      'product.inventory.adjust',
    ],
  },
  {
    key: 'followers',
    permissions: ['organization.broadcast.send'],
  },
] as const satisfies readonly { key: string; permissions: readonly string[] }[];

/**
 * CLINIC supervisor permissions — the clinic dashboard sections (patients,
 * medical records, vaccinations & reminders, appointments, follower
 * broadcast). A SUPERVISOR has NO clinic permission by role, so without these
 * the owner could never let a supervisor see more than the chats. Copied
 * VERBATIM from the backend `ORG_PERMISSION_KEYS` catalogue.
 */
export const CLINIC_PERMISSION_GROUPS = [
  {
    key: 'clinic_animals',
    permissions: ['animal.veterinary.access.read', 'animal.veterinary.access.manage'],
  },
  {
    key: 'clinic_medical',
    permissions: [
      'medical_record.read',
      'medical_record.create',
      'medical_record.update',
      'medical_record.delete',
    ],
  },
  {
    key: 'clinic_vaccinations',
    permissions: [
      'vaccination.read',
      'vaccination.create',
      'vaccination.update',
      'vaccination.delete',
    ],
  },
  {
    key: 'clinic_appointments',
    permissions: ['clinic.appointment.read', 'clinic.appointment.manage'],
  },
  {
    key: 'followers',
    permissions: ['organization.broadcast.send'],
  },
] as const satisfies readonly { key: string; permissions: readonly string[] }[];

/**
 * FARM supervisor permissions — batches (poultry / sheep / cattle), the
 * day-to-day sections and the owner-level financials / selling. Copied
 * VERBATIM from the backend catalogue. `farm.subscription.manage` is
 * deliberately NOT offered: approving the farm's own renewal is
 * administration territory.
 */
export const FARM_PERMISSION_GROUPS = [
  {
    key: 'farm_batches',
    permissions: [
      'farm.poultry.read',
      'farm.poultry.create',
      'farm.poultry.update',
      'farm.poultry.delete',
      'farm.sheep_batch.read',
      'farm.sheep_batch.create',
      'farm.sheep_batch.update',
      'farm.sheep_batch.delete',
      'farm.cattle_batch.read',
      'farm.cattle_batch.create',
      'farm.cattle_batch.update',
      'farm.cattle_batch.delete',
    ],
  },
  {
    key: 'farm_daily_records',
    permissions: [
      'farm.daily_record.read',
      'farm.daily_record.create',
      'farm.daily_record.update',
      'farm.daily_record.delete',
    ],
  },
  {
    key: 'farm_health_events',
    permissions: [
      'farm.health_event.read',
      'farm.health_event.create',
      'farm.health_event.update',
      'farm.health_event.delete',
    ],
  },
  {
    key: 'farm_cases',
    permissions: ['farm.case.read', 'farm.case.create', 'farm.case.update', 'farm.case.delete'],
  },
  {
    key: 'farm_appointments',
    permissions: [
      'farm.appointment.read',
      'farm.appointment.create',
      'farm.appointment.update',
      'farm.appointment.delete',
    ],
  },
  {
    key: 'farm_expenses',
    permissions: [
      'farm.expense.read',
      'farm.expense.create',
      'farm.expense.update',
      'farm.expense.delete',
    ],
  },
  {
    key: 'farm_owner',
    permissions: ['farm.financials.read', 'farm.batch.sell', 'farm.subscription.read'],
  },
] as const satisfies readonly { key: string; permissions: readonly string[] }[];

export type AnyOrgPermissionGroupKey =
  | OrgPermissionGroupKey
  | (typeof CLINIC_PERMISSION_GROUPS)[number]['key']
  | (typeof FARM_PERMISSION_GROUPS)[number]['key']
  | (typeof CHAT_ROOM_PERMISSION_GROUPS)[number]['key']
  | (typeof SYNDICATE_PERMISSION_GROUPS)[number]['key']
  | (typeof OFFICE_PERMISSION_GROUPS)[number]['key'];
export type AnyOrgPermissionKey =
  | OrgManagementPermissionKey
  | (typeof CLINIC_PERMISSION_GROUPS)[number]['permissions'][number]
  | (typeof FARM_PERMISSION_GROUPS)[number]['permissions'][number]
  | (typeof CHAT_ROOM_PERMISSION_GROUPS)[number]['permissions'][number]
  | (typeof SYNDICATE_PERMISSION_GROUPS)[number]['permissions'][number]
  | (typeof OFFICE_PERMISSION_GROUPS)[number]['permissions'][number];

export interface OrgPermissionGroup {
  key: AnyOrgPermissionGroupKey;
  permissions: readonly AnyOrgPermissionKey[];
}

/** The permission groups to offer in the supervisor-assignment UI for one organization type. */
export function permissionGroupsFor(
  type: OrganizationType | undefined,
): readonly OrgPermissionGroup[] {
  if (type === 'CHAT_ROOM') return [...ORG_PERMISSION_GROUPS, ...CHAT_ROOM_PERMISSION_GROUPS];
  if (type === 'SYNDICATE') return [...SYNDICATE_PERMISSION_GROUPS, ...ORG_PERMISSION_GROUPS];
  if (type === 'VETERINARY_STORE') return [...OFFICE_PERMISSION_GROUPS, ...ORG_PERMISSION_GROUPS];
  if (type === 'VETERINARY_OFFICE') {
    // Office products have no inventory — stock adjustment is store-only.
    const officeGroups = OFFICE_PERMISSION_GROUPS.map((g) => ({
      ...g,
      permissions: g.permissions.filter((p) => p !== 'product.inventory.adjust'),
    }));
    return [...officeGroups, ...ORG_PERMISSION_GROUPS];
  }
  if (type === 'CLINIC') return [...CLINIC_PERMISSION_GROUPS, ...ORG_PERMISSION_GROUPS];
  if (type === 'FARM') return [...FARM_PERMISSION_GROUPS, ...ORG_PERMISSION_GROUPS];
  return ORG_PERMISSION_GROUPS;
}

export interface OrgCapabilities {
  /** They successfully loaded the detail, so they can read the profile. */
  canViewOrganization: boolean;
  canEditOrganization: boolean;
  canViewMembers: boolean;
  /** Add a member (`member.add`). */
  canAddMembers: boolean;
  /** Any member management — add, remove or change a member (`member.*`). */
  canManageMembers: boolean;
  canViewSupervisors: boolean;
  /** Assign a supervisor / edit a supervisor's permissions (`supervisor.assign`). */
  canAssignSupervisors: boolean;
  /** Remove a supervisor (`supervisor.remove`). */
  canRemoveSupervisors: boolean;
  /** Either of the two above. */
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
   * and STAFF org roles). Gated to CLINIC org types + an ACTIVE veterinary-access grant
   * by the backend.
   */
  canViewOrganizationMedical: boolean;
  /**
   * Phase 6 — may create / edit medical records, vaccinations + reminders
   * (`medical_record.{create,update}` / `vaccination.{create,update}`, seeded
   * to the VETERINARIAN and STAFF org roles). A clinic may only edit entries
   * IT recorded (backend returns 404 otherwise).
   */
  canManageOrganizationMedical: boolean;
  /**
   * May delete them (`medical_record.delete` / `vaccination.delete`) —
   * VETERINARIAN only by role; clinic STAFF create / update but never delete.
   */
  canDeleteOrganizationMedical: boolean;
  /**
   * Phase 7 — may list a FARM's poultry flocks (`farm.poultry.read`, seeded to
   * OWNER-override / VETERINARIAN / SUPERVISOR / STAFF org roles). Gated to FARM
   * org types by the caller; the backend also enforces `farm.poultry.read`.
   */
  canViewFarmPoultry: boolean;
  /**
   * Day-to-day farm operations — add / edit daily records, treatments &
   * vaccinations, expenses, appointments, cases. OWNER / VETERINARIAN /
   * SUPERVISOR and farm STAFF (employees). Server re-checks every write.
   */
  canManageFarmPoultry: boolean;
  /** Per-section reads on the farm details screen (`farm.<section>.read`). */
  canViewFarmDailyRecords: boolean;
  /** Add a daily record (`farm.daily_record.create`). */
  canCreateFarmDailyRecords: boolean;
  canViewFarmExpenses: boolean;
  canViewFarmHealthEvents: boolean;
  canViewFarmAppointments: boolean;
  canViewFarmCases: boolean;
  /** Delete an operational record — not farm STAFF (create/update only). */
  canDeleteFarmRecords: boolean;
  /** Edit a batch's fields (`farm.*.update`) — OWNER / VETERINARIAN / SUPERVISOR. */
  canEditFarmBatch: boolean;
  /** Create / delete a batch — OWNER / ADMIN only (`farm.*.create|delete`). */
  canCreateFarmBatch: boolean;
  canDeleteFarmBatch: boolean;
  /** Sell / close / reopen a batch — OWNER / ADMIN only (`farm.batch.sell`). */
  canSellFarmBatch: boolean;
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
 * UX-only capability gates for one organization.
 *
 * With `myPermissions` (returned by `GET /organizations/:id`: the caller's
 * resolved keys — role grants ∪ the owner-selected supervisor grants) every
 * gate follows exactly the permissions the owner granted, so a SUPERVISOR /
 * VETERINARIAN / STAFF member sees only the sections they may use. OWNER and
 * ADMIN get everything (owner override). Without it (older server) the gates
 * fall back to mirroring the seeded role → permission grants. Every mutation
 * is still authorized server-side.
 */
export function orgCapabilities(
  myRole: OrgRoleKey | string | null | undefined,
  isAdmin: boolean,
  myPermissions?: readonly string[] | null,
): OrgCapabilities {
  const owner = myRole === 'OWNER';
  const privileged = isAdmin || owner;
  if (!privileged && myPermissions) return capabilitiesFromPermissions(myRole, myPermissions);

  const isVet = myRole === 'VETERINARIAN';
  const isSupervisor = myRole === 'SUPERVISOR';
  const isStaff = myRole === 'STAFF';
  const farmOps = privileged || isVet || isSupervisor || isStaff;

  return {
    canViewOrganization: true,
    canEditOrganization: privileged,
    // Staff see the member list too (read only) — a farm's employees and its
    // vets see each other; removing members stays `canManageMembers`.
    canViewMembers: privileged || isVet || isSupervisor || isStaff,
    canAddMembers: privileged,
    canManageMembers: privileged,
    canViewSupervisors: privileged || isSupervisor,
    canAssignSupervisors: privileged,
    canRemoveSupervisors: privileged,
    canManageSupervisors: privileged,
    canViewOrganizationAnimals: privileged || isVet || isSupervisor || isStaff,
    canManageOrganizationAnimalAccess: privileged,
    canViewOrganizationMedical: privileged || isVet || isSupervisor || isStaff,
    canManageOrganizationMedical: privileged || isVet || isSupervisor || isStaff,
    canDeleteOrganizationMedical: privileged || isVet || isSupervisor,
    canViewFarmPoultry: farmOps,
    canManageFarmPoultry: farmOps,
    canViewFarmDailyRecords: farmOps,
    canCreateFarmDailyRecords: farmOps,
    canViewFarmExpenses: farmOps,
    canViewFarmHealthEvents: farmOps,
    canViewFarmAppointments: farmOps,
    canViewFarmCases: farmOps,
    canDeleteFarmRecords: privileged || isVet || isSupervisor,
    canEditFarmBatch: privileged || isVet || isSupervisor,
    canCreateFarmBatch: privileged,
    canDeleteFarmBatch: privileged,
    canSellFarmBatch: privileged,
    canViewFarmFinancials: privileged,
    canViewFarmJoinCode: privileged,
    canViewStoreProducts: privileged || isSupervisor || isStaff,
    canManageStoreProducts: privileged || isSupervisor,
    canLeave: myRole != null && !owner,
    isOwner: owner,
    canSendBroadcast: privileged || isSupervisor,
  };
}

/** Batch keys are per species; one farm screen serves all three, so any of them counts. */
const BATCH_KINDS = ['poultry', 'sheep_batch', 'cattle_batch'] as const;

function capabilitiesFromPermissions(
  myRole: OrgRoleKey | string | null | undefined,
  permissions: readonly string[],
): OrgCapabilities {
  const granted = new Set(permissions);
  const has = (key: string): boolean => granted.has(key);
  const any = (...keys: string[]): boolean => keys.some(has);
  const batch = (action: 'read' | 'create' | 'update' | 'delete'): boolean =>
    BATCH_KINDS.some((kind) => has(`farm.${kind}.${action}`));
  const FARM_SECTIONS = ['daily_record', 'expense', 'health_event', 'appointment', 'case'];

  return {
    canViewOrganization: true,
    canEditOrganization: has('organization.update'),
    canViewMembers: has('member.read'),
    canAddMembers: has('member.add'),
    canManageMembers: any('member.add', 'member.remove', 'member.update'),
    canViewSupervisors: has('supervisor.read'),
    canAssignSupervisors: has('supervisor.assign'),
    canRemoveSupervisors: has('supervisor.remove'),
    canManageSupervisors: any('supervisor.assign', 'supervisor.remove'),
    canViewOrganizationAnimals: has('animal.veterinary.access.read'),
    canManageOrganizationAnimalAccess: has('animal.veterinary.access.manage'),
    canViewOrganizationMedical: any('medical_record.read', 'vaccination.read'),
    canManageOrganizationMedical: any(
      'medical_record.create',
      'medical_record.update',
      'vaccination.create',
      'vaccination.update',
    ),
    canDeleteOrganizationMedical: any('medical_record.delete', 'vaccination.delete'),
    canViewFarmPoultry: batch('read'),
    canManageFarmPoultry: FARM_SECTIONS.some((s) => any(`farm.${s}.create`, `farm.${s}.update`)),
    canViewFarmDailyRecords: has('farm.daily_record.read'),
    canCreateFarmDailyRecords: has('farm.daily_record.create'),
    canViewFarmExpenses: has('farm.expense.read'),
    canViewFarmHealthEvents: has('farm.health_event.read'),
    canViewFarmAppointments: has('farm.appointment.read'),
    canViewFarmCases: has('farm.case.read'),
    canDeleteFarmRecords: FARM_SECTIONS.some((s) => has(`farm.${s}.delete`)),
    canEditFarmBatch: batch('update'),
    canCreateFarmBatch: batch('create'),
    canDeleteFarmBatch: batch('delete'),
    canSellFarmBatch: has('farm.batch.sell'),
    canViewFarmFinancials: has('farm.financials.read'),
    // The join code reuses `organization.update` server-side.
    canViewFarmJoinCode: has('organization.update'),
    canViewStoreProducts: has('product.read'),
    canManageStoreProducts: any(
      'product.create',
      'product.update',
      'product.delete',
      'product.inventory.adjust',
    ),
    canLeave: myRole != null,
    isOwner: false,
    canSendBroadcast: has('organization.broadcast.send'),
  };
}

/**
 * Which registration Terms & Conditions an organization must accept —
 * mirrors the server's `termsKeyFor` (CLINIC / VETERINARY_OFFICE by type, a
 * FARM by species: SHEEP / CATTLE, else poultry). `null` = none.
 */
export function termsKeyForOrganization(
  type: string | null | undefined,
  farmSpecies?: string | null,
): OrganizationTermsKey | null {
  if (type === 'CLINIC') return 'CLINIC';
  if (type === 'VETERINARY_OFFICE') return 'VETERINARY_OFFICE';
  if (type === 'FARM') {
    if (farmSpecies === 'SHEEP') return 'SHEEP_FARM';
    if (farmSpecies === 'CATTLE') return 'CATTLE_FARM';
    return 'POULTRY_FARM';
  }
  return null;
}
