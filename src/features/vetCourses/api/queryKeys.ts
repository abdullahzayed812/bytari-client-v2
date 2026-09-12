import type { CourseBrowseFilter, VetCourseModerationStatus } from '../types';

/** One `all` prefix invalidates the whole Courses & Seminars feature after any mutation. */
export const vetCourseKeys = {
  all: ['vet-courses'] as const,

  courses: () => [...vetCourseKeys.all, 'courses'] as const,
  courseList: (f: CourseBrowseFilter) => [...vetCourseKeys.courses(), 'browse', f] as const,
  myCourseList: (status?: VetCourseModerationStatus) =>
    [...vetCourseKeys.courses(), 'mine', { status: status ?? null }] as const,
  course: (id: string) => [...vetCourseKeys.courses(), 'detail', id] as const,
  myCourse: (id: string) => [...vetCourseKeys.courses(), 'manage', id] as const,

  registrations: () => [...vetCourseKeys.all, 'registrations'] as const,
  courseRegistrations: (courseId: string) =>
    [...vetCourseKeys.registrations(), 'for-course', courseId] as const,
  myRegistrations: () => [...vetCourseKeys.registrations(), 'mine'] as const,
  registration: (id: string) => [...vetCourseKeys.registrations(), 'detail', id] as const,

  // --- moderation (ADMIN / VET_COURSES supervisor) ---
  adminCourseList: (status?: VetCourseModerationStatus) =>
    [...vetCourseKeys.courses(), 'admin', { status: status ?? null }] as const,
  adminCourseRegistrations: (courseId: string) =>
    [...vetCourseKeys.registrations(), 'admin', 'for-course', courseId] as const,
};
