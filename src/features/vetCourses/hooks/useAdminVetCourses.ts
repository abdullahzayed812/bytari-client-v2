import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { adminVetCoursesApi, vetCourseKeys } from '../api';
import type {
  Paginated,
  VetCourse,
  VetCourseModerationStatus,
  VetCourseRegistration,
  VetCourseType,
} from '../types';

const PAGE = AppConfig.defaultPageSize;

/**
 * `GET /admin/vet-courses` — the course/seminar/workshop moderation queue.
 * `type` scopes this to ONE dedicated screen (Courses vs Seminars) so the two
 * never mix in the same list — `AdminVetCoursesScreen` always passes it.
 */
export function useAdminVetCourses(
  filter: { status?: VetCourseModerationStatus; type?: VetCourseType } = {},
) {
  const query = useInfiniteQuery<
    Paginated<VetCourse>,
    unknown,
    InfiniteData<Paginated<VetCourse>>,
    ReturnType<typeof vetCourseKeys.adminCourseList>,
    number
  >({
    queryKey: vetCourseKeys.adminCourseList(filter.status, filter.type),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminVetCoursesApi.listCourses(pageParam, PAGE, filter),
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    staleTime: 10_000,
  });
  const courses = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, courses, total: query.data?.pages[0]?.meta.total ?? 0 };
}

/** `GET /admin/vet-courses/:id/registrations` — read-only registrant oversight for one course. */
export function useAdminVetCourseRegistrations(courseId: string | undefined) {
  const query = useInfiniteQuery<
    Paginated<VetCourseRegistration>,
    unknown,
    InfiniteData<Paginated<VetCourseRegistration>>,
    ReturnType<typeof vetCourseKeys.adminCourseRegistrations>,
    number
  >({
    queryKey: vetCourseKeys.adminCourseRegistrations(courseId ?? '_'),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminVetCoursesApi.listRegistrations(courseId as string, pageParam, PAGE),
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled: Boolean(courseId),
    staleTime: 10_000,
  });
  const registrations = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, registrations, total: query.data?.pages[0]?.meta.total ?? 0 };
}

function useModerate<T>(
  fn: (id: string, reason?: string) => Promise<T>,
  key: string,
): UseMutationResult<T, ApiError, { id: string; reason?: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['vet-courses', 'admin', key],
    mutationFn: ({ id, reason }) => fn(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetCourseKeys.all }),
  });
}

export function useAdminApproveVetCourse() {
  return useModerate((id) => adminVetCoursesApi.approveCourse(id), 'course-approve');
}
export function useAdminRejectVetCourse() {
  return useModerate((id, reason) => adminVetCoursesApi.rejectCourse(id, reason ?? ''), 'course-reject');
}
export function useAdminCancelVetCourse() {
  return useModerate((id) => adminVetCoursesApi.cancelCourse(id), 'course-cancel');
}
