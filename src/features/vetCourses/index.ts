/**
 * Veterinarian Courses & Seminars ("الدورات والندوات").
 *
 * One moderated entity (a veterinarian-created COURSE / SEMINAR / WORKSHOP,
 * distinguished by `type`), PENDING → APPROVED / REJECTED before it is
 * public. One engagement entity (a veterinarian's REGISTRATION against an
 * approved course) with no moderation of its own — capacity / deadline / at
 * most one registration per user enforced server-side.
 *
 * Backend enforces every role / ownership / moderation / registration rule
 * (`server/src/modules/vet-courses`). Only an approved veterinarian may
 * create a course or register.
 */
export {
  vetCoursesApi,
  adminVetCoursesApi,
  vetCourseKeys,
  type VetCoursesApi,
  type AdminVetCoursesApi,
} from './api';
export * from './hooks';
export * from './components';
export * from './screens';
export * from './types';
