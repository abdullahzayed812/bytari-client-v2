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
  createdAt: string;
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
}

export interface SyndicateAnnouncement {
  id: string;
  organizationId: string;
  syndicateName: string;
  type: SyndicateAnnouncementType;
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: string;
}

export interface CreateAnnouncementInput {
  type: SyndicateAnnouncementType;
  title: string;
  body: string;
  imageStorageKey?: string | null;
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
