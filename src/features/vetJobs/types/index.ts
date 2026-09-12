/**
 * Veterinarian Jobs / Careers contract. Mirrors
 * `server/src/modules/vet-jobs` (`vet-job.types.ts` / `vet-job.constants.ts`)
 * and OpenAPI `vetJobs` — verified against the real implementation.
 *
 * Two moderated entities (employer-posted OFFERS, veterinarian SEEKER
 * PROFILES "باحثون عن عمل"), each PENDING → APPROVED / REJECTED. One
 * engagement entity (a veterinarian's APPLICATION against an offer) with its
 * own PENDING → ACCEPTED / REJECTED lifecycle decided by the offer's poster.
 * On ACCEPTED, a chat conversation exists (`@/features/chat`, reusing the
 * PET_OWNER_VETERINARIAN thread — no separate Jobs chat system).
 */

export const VET_JOB_EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'SHIFT', 'EVENING', 'OTHER'] as const;
export type VetJobEmploymentType = (typeof VET_JOB_EMPLOYMENT_TYPES)[number];

export const VET_JOB_MODERATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type VetJobModerationStatus = (typeof VET_JOB_MODERATION_STATUSES)[number];

export const VET_JOB_APPLICATION_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED'] as const;
export type VetJobApplicationStatus = (typeof VET_JOB_APPLICATION_STATUSES)[number];

export interface VetJobUserSummary {
  id: string;
  firstName: string;
  lastName: string;
}

// --- offers -----------------------------------------------------

export interface VetJobOffer {
  id: string;
  postedByUserId: string;
  postedBy: VetJobUserSummary;
  organizationId: string | null;
  organizationName: string;
  title: string;
  employmentType: VetJobEmploymentType;
  governorate: string;
  district: string | null;
  salaryAmount: string | null;
  salaryNegotiable: boolean;
  experienceYearsRequired: number | null;
  qualifications: string | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  contactPhone: string;
  contactEmail: string | null;
  applicationDeadline: string | null;
  status: VetJobModerationStatus;
  rejectionReason: string | null;
  closedAt: string | null;
  applicationCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicVetJobOffer {
  id: string;
  organizationName: string;
  title: string;
  employmentType: VetJobEmploymentType;
  governorate: string;
  district: string | null;
  salaryAmount: string | null;
  salaryNegotiable: boolean;
  experienceYearsRequired: number | null;
  qualifications: string | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  contactPhone: string;
  contactEmail: string | null;
  applicationDeadline: string | null;
  publishedAt: string;
}

export interface CreateVetJobOfferInput {
  organizationId?: string | null;
  organizationName: string;
  title: string;
  employmentType: VetJobEmploymentType;
  governorate: string;
  district?: string | null;
  salaryAmount?: string | null;
  salaryNegotiable?: boolean;
  experienceYearsRequired?: number | null;
  qualifications?: string | null;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  contactPhone: string;
  contactEmail?: string | null;
  applicationDeadline?: string | null;
}

export type UpdateVetJobOfferInput = Partial<CreateVetJobOfferInput>;

export interface OfferBrowseFilter {
  search?: string;
  employmentType?: VetJobEmploymentType;
  governorate?: string;
}

// --- job-seeker profiles ("باحثون عن عمل") -------------------------

export interface VetJobSeekerProfile {
  id: string;
  user: VetJobUserSummary;
  specialty: string;
  headline: string | null;
  experienceYears: number;
  governorate: string;
  district: string | null;
  qualifications: string | null;
  skills: string[];
  preferredEmploymentTypes: VetJobEmploymentType[];
  phone: string;
  email: string | null;
  cvUrl: string | null;
  photoUrl: string | null;
  status: VetJobModerationStatus;
  rejectionReason: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicVetJobSeekerProfile {
  id: string;
  specialty: string;
  headline: string | null;
  experienceYears: number;
  governorate: string;
  district: string | null;
  qualifications: string | null;
  skills: string[];
  preferredEmploymentTypes: VetJobEmploymentType[];
  photoUrl: string | null;
  cvUrl: string | null;
  user: VetJobUserSummary;
  publishedAt: string;
}

export interface CreateVetJobSeekerProfileInput {
  specialty: string;
  headline?: string | null;
  experienceYears?: number;
  governorate: string;
  district?: string | null;
  qualifications?: string | null;
  skills?: string[];
  preferredEmploymentTypes?: VetJobEmploymentType[];
  phone: string;
  email?: string | null;
  cvStorageKey?: string | null;
  photoStorageKey?: string | null;
}

export type UpdateVetJobSeekerProfileInput = Partial<CreateVetJobSeekerProfileInput>;

export interface SeekerBrowseFilter {
  search?: string;
  specialty?: string;
  governorate?: string;
}

// --- applications --------------------------------------------------

export interface VetJobApplication {
  id: string;
  jobOfferId: string;
  applicant: VetJobUserSummary;
  fullName: string;
  phone: string;
  email: string | null;
  specialty: string | null;
  experienceYears: number | null;
  qualifications: string | null;
  coverNote: string | null;
  cvUrl: string | null;
  photoUrl: string | null;
  status: VetJobApplicationStatus;
  conversationId: string | null;
  offer?: { id: string; title: string; organizationName: string; postedByUserId: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateVetJobApplicationInput {
  fullName: string;
  phone: string;
  email?: string | null;
  specialty?: string | null;
  experienceYears?: number | null;
  qualifications?: string | null;
  coverNote?: string | null;
  cvStorageKey?: string | null;
  photoStorageKey?: string | null;
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
