/**
 * Veterinary Syndicates / Unions ("نقابة الأطباء البيطريين") contract.
 * Mirrors `server/src/modules/syndicates` and OpenAPI `syndicates`.
 *
 * A syndicate is a platform `organizations` row (`type = 'SYNDICATE'`) —
 * following it reuses the existing generic follow feature
 * (`@/features/organizations`'s `organizationsApi.follow/unfollow`).
 * Announcements publish immediately (no moderation — only an authorized
 * supervisor/admin may create one at all). Requests/inquiries ("submissions")
 * follow PENDING → RESPONDED / CLOSED.
 */

export const SYNDICATE_ANNOUNCEMENT_TYPES = ['ANNOUNCEMENT', 'IMPORTANT_NOTICE'] as const;
export type SyndicateAnnouncementType = (typeof SYNDICATE_ANNOUNCEMENT_TYPES)[number];

export const SYNDICATE_SUBMISSION_KINDS = ['REQUEST', 'INQUIRY'] as const;
export type SyndicateSubmissionKind = (typeof SYNDICATE_SUBMISSION_KINDS)[number];

export const SYNDICATE_REQUEST_TYPES = [
  'ID_ISSUANCE',
  'ID_RENEWAL',
  'OFFICE_LICENSE_ISSUANCE',
  'OFFICE_LICENSE_RENEWAL',
  'OTHER',
] as const;
export type SyndicateRequestType = (typeof SYNDICATE_REQUEST_TYPES)[number];

export const SYNDICATE_SUBMISSION_STATUSES = ['PENDING', 'RESPONDED', 'CLOSED'] as const;
export type SyndicateSubmissionStatus = (typeof SYNDICATE_SUBMISSION_STATUSES)[number];

export interface SyndicateUserSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface PublicSyndicate {
  id: string;
  /** Pinned to the Veterinarian Home by the administration. Absent on older payloads. */
  pinnedToHome?: boolean;
  parentOrganizationId: string | null;
  name: string;
  description: string | null;
  status: string;
  governorate: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  headOfficerName: string | null;
  headOfficerTitle: string | null;
  termStartYear: number | null;
  termEndYear: number | null;
  branchCount: number;
  isFollowing: boolean;
  followersCount: number;
  /** Viewer-relative: the caller holds an ACTIVE registration here. */
  isRegistered: boolean;
  membersCount: number;
  /** Only for a viewer who may read this syndicate's requests/inquiries; `null` otherwise. */
  counters: SyndicateCounters | null;
  createdAt: string;
}

/** Server-computed card counters ("unread" = this officer's unread new-submission alerts). */
export interface SyndicateCounters {
  unreadRequests: number;
  unreadInquiries: number;
  pendingRequests: number;
  pendingInquiries: number;
}

/** A registered member as a syndicate admin sees them — basic info only. */
export interface SyndicateMember {
  registrationId: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  governorate: string | null;
  specialization: string | null;
  isVeterinarian: boolean;
  status: string;
  registeredAt: string;
}

export interface MySyndicateRegistration {
  registrationId: string;
  organizationId: string;
  status: string;
  registeredAt: string;
}

export interface MessageSyndicateMembersInput {
  title: string;
  body: string;
  /** Idempotency key — a retried send never notifies anyone twice. */
  clientRequestId: string;
  imageStorageKey?: string | null;
  linkUrl?: string | null;
}

export interface UpdateSyndicateProfileInput {
  name?: string;
  description?: string | null;
  governorate?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logoStorageKey?: string | null;
  headOfficerName?: string | null;
  headOfficerTitle?: string | null;
  termStartYear?: number | null;
  termEndYear?: number | null;
}

export interface CreateSyndicateInput {
  parentOrganizationId?: string | null;
  name: string;
  description?: string | null;
  governorate?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  headOfficerName?: string | null;
  headOfficerTitle?: string | null;
  termStartYear?: number | null;
  termEndYear?: number | null;
}

export interface SyndicateBrowseFilter {
  search?: string;
}

/**
 * "What can I do here?" — computed server-side from the org-scoped
 * membership context, never assumed client-side. Drives whether management
 * actions (e.g. "الطلبات والاستفسارات") render for THIS specific syndicate.
 */
export interface MySyndicateAccess {
  isAdmin: boolean;
  isOwner: boolean;
  canManageProfile: boolean;
  canManageAnnouncements: boolean;
  canReadSubmissions: boolean;
  canRespondSubmissions: boolean;
  canReadMembers: boolean;
  canManageMembers: boolean;
  canMessageMembers: boolean;
  /** Global Admin only. */
  canDelete: boolean;
  isRegistered: boolean;
}

export interface SyndicateAnnouncement {
  id: string;
  organizationId: string;
  syndicateName: string;
  type: SyndicateAnnouncementType;
  title: string;
  body: string;
  imageUrl: string | null;
  /** Optional external http(s) link (server-validated). */
  linkUrl: string | null;
  publishedAt: string;
}

export interface CreateAnnouncementInput {
  type: SyndicateAnnouncementType;
  title: string;
  body: string;
  imageStorageKey?: string | null;
  /** http(s) only; `null` clears it on update. */
  linkUrl?: string | null;
}

export type UpdateAnnouncementInput = Partial<CreateAnnouncementInput>;

export interface SyndicateSubmission {
  id: string;
  organizationId: string;
  syndicateName: string;
  kind: SyndicateSubmissionKind;
  requestType: SyndicateRequestType | null;
  message: string;
  attachmentUrls: string[];
  submittedBy: SyndicateUserSummary;
  status: SyndicateSubmissionStatus;
  responseText: string | null;
  respondedAt: string | null;
  createdAt: string;
  /**
   * List reads: the CALLER still has an unread alert for it — an officer's
   * "new submission", or the submitter's "new reply". Server-computed.
   */
  isUnread?: boolean;
}

export interface CreateSubmissionInput {
  kind: SyndicateSubmissionKind;
  requestType?: SyndicateRequestType | null;
  message: string;
  attachmentStorageKeys?: string[];
}

export interface SubmissionListFilter {
  kind?: SyndicateSubmissionKind;
  status?: SyndicateSubmissionStatus;
}

export interface MySubmissionListFilter {
  kind?: SyndicateSubmissionKind;
}

// --- pagination (mirrors @/services/api PageMeta) ------------

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

// --- services ("الخدمات") ---------------------------------------------

export const SYNDICATE_SERVICE_KEYS = [
  'ID_CARD',
  'INQUIRY',
  'ANNOUNCEMENTS',
  'REGISTER_DOCTORS',
  'LEGAL_SUPPORT',
  'OFFICE_LICENSES',
] as const;
export type SyndicateServiceKey = (typeof SYNDICATE_SERVICE_KEYS)[number];

/**
 * One of a syndicate's six services. `title` / `description` null = the app's
 * built-in text; `isEnabled: false` hides the tile from the syndicate page.
 */
export interface SyndicateServiceItem {
  id: string;
  organizationId: string;
  serviceKey: SyndicateServiceKey;
  title: string | null;
  description: string | null;
  isEnabled: boolean;
  sortOrder: number;
  /** Edited page content (ID_CARD / LEGAL_SUPPORT / OFFICE_LICENSES); `null` = built-in. */
  content?: SyndicateServiceContent | null;
  updatedAt: string;
}

/** CHECK = green ✓ bullets (requirements), NOTE = amber ! bullets (notes). */
export type SyndicateContentSectionStyle = 'CHECK' | 'NOTE';

export interface SyndicateContentItem {
  id: string;
  text: string;
}

export interface SyndicateContentSection {
  id: string;
  title: string;
  style: SyndicateContentSectionStyle;
  items: SyndicateContentItem[];
}

/** A service page's content document — array order is display order. */
export interface SyndicateServiceContent {
  /** Label above the sections ("المتطلبات" / "معلومات الخدمة"). */
  heading: string | null;
  /** Intro paragraph under the heading. */
  body: string | null;
  sections: SyndicateContentSection[];
  /** Muted line after the sections (e.g. processing time). */
  footnote: string | null;
  /** Info box at the bottom. */
  note: string | null;
}

export interface UpdateSyndicateServiceInput {
  /** Blank → back to the built-in title. */
  title?: string | null;
  description?: string | null;
  isEnabled?: boolean;
  /** Whole page document; `null` = back to the built-in content. */
  content?: SyndicateServiceContent | null;
}
