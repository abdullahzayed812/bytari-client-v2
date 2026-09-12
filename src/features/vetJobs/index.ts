/**
 * Veterinarian Jobs / Careers ("الوظائف البيطرية").
 *
 * Two moderated entities (employer-posted OFFERS, veterinarian SEEKER
 * PROFILES "باحثون عن عمل"), each PENDING → APPROVED / REJECTED before it is
 * public. One engagement entity (a veterinarian's APPLICATION against an
 * offer) with PENDING → ACCEPTED / REJECTED decided by the offer's poster,
 * plus a PET_OWNER_VETERINARIAN chat (reuses `@/features/chat` — no separate
 * Jobs chat system) reachable immediately from a seeker profile ("تواصل مع
 * الطبيب") and created automatically once an application is accepted.
 *
 * Backend enforces every role / ownership / moderation rule
 * (`server/src/modules/vet-jobs`). Only an approved veterinarian may create a
 * seeker profile or apply; any authenticated user may post a job offer.
 */
export {
  vetJobsApi,
  adminVetJobsApi,
  vetJobKeys,
  type VetJobsApi,
  type AdminVetJobsApi,
} from './api';
export * from './hooks';
export * from './components';
export * from './screens';
export * from './types';
