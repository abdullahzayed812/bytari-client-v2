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
/**
 * `SYNDICATE` and `CHAT_ROOM` are real backend-side
 * (`organization.types.ts`'s `ORGANIZATION_TYPES`) but excluded from
 * self-service creation (`createOrganizationBodySchema` — admin-only via
 * `POST /admin/syndicates` / `POST /admin/chat-rooms`) — included here for
 * display (admin dashboard, org-type badges) but deliberately NOT added to
 * `ORG_TYPE_ORDER` (the create-flow type picker).
 */
export const ORGANIZATION_TYPES = [
  'CLINIC',
  'FARM',
  'VETERINARY_OFFICE',
  'VETERINARY_STORE',
  'SYNDICATE',
  'CHAT_ROOM',
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

/** `farm_details.farm_species` — the FARM sub-type. `null` on legacy farms / non-FARM orgs. */
export const FARM_SPECIES = ['POULTRY', 'SHEEP', 'CATTLE', 'MIXED'] as const;
export type FarmSpecies = (typeof FARM_SPECIES)[number];

/** Organization types whose owner MUST be a globally APPROVED veterinarian. */
export const VET_APPROVAL_REQUIRED_TYPES: readonly OrganizationType[] = ['CLINIC', 'FARM'];

/**
 * Organization types with a directory profile (address/contact/social fields)
 * — mirrors the backend's `OrganizationPolicy.assertHasProfileFields`.
 */
export const PROFILE_FIELDS_ORG_TYPES: readonly OrganizationType[] = [
  'CLINIC',
  'VETERINARY_OFFICE',
  'VETERINARY_STORE',
];

/** Narrower than {@link PROFILE_FIELDS_ORG_TYPES} — mirrors `LICENSABLE_TYPES` server-side. */
export const LICENSABLE_ORG_TYPES: readonly OrganizationType[] = ['CLINIC', 'VETERINARY_OFFICE'];

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

/**
 * Directory profile fields — CLINIC / VETERINARY_OFFICE / VETERINARY_STORE
 * only. `logoUrl` / `galleryUrls` are server-resolved (public R2 URL or a
 * signed fallback) — the client never builds them.
 */
export interface OrganizationProfile {
  address?: string | null;
  /** Free-text — no backend country enum; the client offers a picker over a static list. */
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  logoUrl?: string | null;
  workingHours?: string | null;
  services?: string[];
  email?: string | null;
  whatsapp?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  galleryUrls?: string[];
}

/**
 * A FARM's subscription validity — SEPARATE from `Organization.status` (the
 * approval state). Always computed server-side from the stored dates vs the
 * backend's clock; the app must never compute this itself.
 */
export const FARM_SUBSCRIPTION_STATUSES = ['NOT_STARTED', 'ACTIVE', 'EXPIRED'] as const;
export type FarmSubscriptionStatus = (typeof FARM_SUBSCRIPTION_STATUSES)[number];

export interface OrganizationDetails extends OrganizationProfile {
  /** FARM organizations only. */
  joinCode?: string;
  /** FARM / VETERINARY_OFFICE / CLINIC — admin/supervisor-controlled subscription period. */
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  /** Computed server-side, never by the app. */
  subscriptionStatus?: FarmSubscriptionStatus;
  /**
   * CLINIC / VETERINARY_OFFICE only — owner/admin-facing registration
   * credentials. Never on {@link PublicOrganization}: reviewed by an admin
   * before approval, not shown on the public directory.
   */
  licenseNumber?: string | null;
  licenseDocumentUrls?: string[];
}

export interface OrganizationWithDetails extends Organization {
  details: OrganizationDetails;
}

/**
 * `GET /organizations/discover` / `GET /organizations/discover/:id` — any
 * authenticated user, not just members (e.g. the Pet Owner Home "Available
 * clinics" section / `ClinicsScreen` (features/clinics)). ACTIVE organizations only;
 * deliberately narrower than {@link Organization} — no owner id / decision
 * metadata. `address`/`latitude`/`longitude`/`phone`/`logoUrl` are `null` for
 * FARM and for CLINIC/OFFICE/STORE organizations that haven't filled them in
 * yet. `distanceKm` is only set when the list was fetched with `sort=nearest`.
 */
export interface PublicOrganization extends OrganizationProfile {
  id: string;
  type: OrganizationType;
  name: string;
  description: string | null;
  distanceKm: number | null;
  /** Average rating rounded to 1 decimal, `null` with no reviews yet. */
  rating: number | null;
  reviewsCount: number;
  createdAt: string;
}

export type DiscoverSort = 'default' | 'nearest';

/** `GET /organizations/discover/:id` — public profile + veterinarians + the viewer's engagement. */
export interface PublicVeterinarian {
  id: string;
  firstName: string;
  lastName: string;
}

export interface OrganizationEngagementSummary {
  isFollowing: boolean;
  followersCount: number;
  /** Average rating rounded to 1 decimal, `null` when there are no reviews yet. */
  rating: number | null;
  reviewsCount: number;
}

export interface PublicOrganizationDetail extends PublicOrganization {
  veterinarians: PublicVeterinarian[];
  engagement: OrganizationEngagementSummary;
}

export interface OrganizationReview {
  id: string;
  organizationId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitReviewInput {
  rating: number;
  comment?: string | null;
}

/**
 * `GET /organizations` list item — an {@link Organization} plus the caller's
 * role and, for FARM rows, the farm species (`null` for non-FARM / legacy).
 * VETERINARY_OFFICE / CLINIC rows also carry the derived subscription status
 * plus address/phone/logoUrl — the Veterinary Office Dashboard's "my
 * organizations" card (`OwnedOrganizationCard`). Always `null` for other types.
 */
export interface MyOrganization extends Organization {
  myRole: OrgRoleKey | string;
  /** FARM rows only; `null` for non-FARM / legacy farms. Absent on pre-existing cached payloads. */
  farmSpecies?: FarmSpecies | null;
  subscriptionStatus?: FarmSubscriptionStatus | null;
  subscriptionEndDate?: string | null;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
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
/**
 * Profile fields captured directly at creation (`details`) — CLINIC /
 * VETERINARY_OFFICE / VETERINARY_STORE only, ignored server-side otherwise.
 * Registration screens ("تسجيل العيادة") send the full profile in one
 * submission: the owner cannot `PATCH` (or upload gallery/license-document
 * images) until an admin approves the PENDING organization.
 */
export interface CreateOrganizationDetailsInput {
  address?: string | null;
  country?: string | null;
  phone?: string | null;
  workingHours?: string | null;
  services?: string[];
  email?: string | null;
  whatsapp?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  /** CLINIC / VETERINARY_OFFICE only. */
  licenseNumber?: string | null;
}

export interface CreateOrganizationInput {
  type: OrganizationType;
  name: string;
  description?: string;
  details?: CreateOrganizationDetailsInput;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string | null;
  address?: string | null;
  country?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  workingHours?: string | null;
  services?: string[];
  email?: string | null;
  whatsapp?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  /** CLINIC / VETERINARY_OFFICE only. */
  licenseNumber?: string | null;
}

/** Identify the target by exactly one of `userId` or `email` (the email must belong to an existing account). */
export interface AddMemberInput {
  userId?: string;
  email?: string;
  role: AssignableMemberRole;
}

export interface UpdateMemberInput {
  role?: AssignableMemberRole;
  status?: MemberStatusAction;
}

export interface AssignSupervisorInput {
  userId?: string;
  email?: string;
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
