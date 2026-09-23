/**
 * Veterinarian Courses & Seminars contract. Mirrors
 * `server/src/modules/vet-courses` (`vet-course.types.ts` /
 * `vet-course.constants.ts`) and OpenAPI `vetCourses` — verified against the
 * real implementation.
 *
 * One moderated entity (a veterinarian-created COURSE / SEMINAR / WORKSHOP,
 * distinguished by `type`), PENDING → APPROVED / REJECTED. One engagement
 * entity (a veterinarian's REGISTRATION against an approved course) with no
 * moderation of its own — enforced synchronously (capacity / deadline / at
 * most one registration per user).
 */

export const VET_COURSE_TYPES = ['COURSE', 'SEMINAR', 'WORKSHOP'] as const;
export type VetCourseType = (typeof VET_COURSE_TYPES)[number];

export const VET_COURSE_MODERATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type VetCourseModerationStatus = (typeof VET_COURSE_MODERATION_STATUSES)[number];

export const VET_COURSE_LOCATION_MODES = ['ONLINE', 'IN_PERSON'] as const;
export type VetCourseLocationMode = (typeof VET_COURSE_LOCATION_MODES)[number];

export interface VetCourseUserSummary {
  id: string;
  firstName: string;
  lastName: string;
}

// --- courses / seminars / workshops --------------------------------------

export interface VetCourse {
  id: string;
  creatorUserId: string;
  creator: VetCourseUserSummary;
  type: VetCourseType;
  title: string;
  description: string;
  organizingBody: string;
  instructorName: string;
  instructorSpecialty: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  timezoneNote: string | null;
  locationMode: VetCourseLocationMode;
  locationDetails: string;
  capacity: number | null;
  price: string | null;
  registrationDeadline: string | null;
  topics: string[];
  coverImageUrl: string | null;
  status: VetCourseModerationStatus;
  rejectionReason: string | null;
  cancelledAt: string | null;
  registrationCount?: number;
  /** `capacity - registrationCount`; null = unlimited. */
  remainingSeats?: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * The caller's registration state, computed server-side: REGISTERED wins,
 * then FULL (no seats left), then CLOSED (past the registration cutoff).
 */
export type VetCourseRegistrationState = 'OPEN' | 'REGISTERED' | 'FULL' | 'CLOSED';

export interface PublicVetCourse {
  id: string;
  type: VetCourseType;
  title: string;
  description: string;
  organizingBody: string;
  instructorName: string;
  instructorSpecialty: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  timezoneNote: string | null;
  locationMode: VetCourseLocationMode;
  locationDetails: string;
  capacity: number | null;
  registrationCount: number;
  remainingSeats: number | null;
  isRegistered: boolean;
  registrationState: VetCourseRegistrationState;
  price: string | null;
  registrationDeadline: string | null;
  topics: string[];
  coverImageUrl: string | null;
  publishedAt: string;
}

export interface CreateVetCourseInput {
  type: VetCourseType;
  title: string;
  description: string;
  organizingBody: string;
  instructorName: string;
  instructorSpecialty?: string | null;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  timezoneNote?: string | null;
  locationMode: VetCourseLocationMode;
  locationDetails: string;
  capacity?: number | null;
  price?: string | null;
  registrationDeadline?: string | null;
  topics?: string[];
  coverImageStorageKey?: string | null;
}

export type UpdateVetCourseInput = Partial<CreateVetCourseInput>;

export interface CourseBrowseFilter {
  search?: string;
  type?: VetCourseType;
  locationMode?: VetCourseLocationMode;
}

// --- registrations --------------------------------------------------

export interface VetCourseRegistration {
  id: string;
  courseId: string;
  registrant: VetCourseUserSummary;
  fullName: string;
  phone: string;
  email: string | null;
  governorate: string;
  specialty: string | null;
  notes: string | null;
  course?: {
    id: string;
    title: string;
    type: VetCourseType;
    startDate: string;
    endDate: string;
    locationMode: VetCourseLocationMode;
    organizingBody: string;
    coverImageUrl: string | null;
    cancelledAt: string | null;
  };
  createdAt: string;
}

export interface CreateVetCourseRegistrationInput {
  fullName: string;
  phone: string;
  email?: string | null;
  governorate: string;
  specialty?: string | null;
  notes?: string | null;
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
