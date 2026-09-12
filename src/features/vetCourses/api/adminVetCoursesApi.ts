import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { Paginated, VetCourse, VetCourseModerationStatus, VetCourseRegistration } from '../types';

function readMeta(meta: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? count,
    totalPages: m.totalPages ?? 1,
  };
}

/**
 * `/admin/vet-courses*` — the Veterinarian Courses & Seminars moderation
 * queue. `list` / `get` need `vet_course.read`; `approve` needs
 * `vet_course.approve`; `reject` needs `vet_course.reject`. Held by ADMIN
 * (override) or an ACTIVE VET_COURSES system-supervisor. The backend
 * re-authorises every call — hiding a button here is UX only.
 */
export const adminVetCoursesApi = {
  async listCourses(
    page: number,
    pageSize: number,
    filter: { status?: VetCourseModerationStatus } = {},
  ): Promise<Paginated<VetCourse>> {
    const env = await apiClient.requestEnvelope<VetCourse[]>({
      method: 'GET',
      url: '/admin/vet-courses',
      params: { page, pageSize, status: filter.status },
    });
    return { items: env.data, meta: readMeta(env.meta, page, pageSize, env.data.length) };
  },
  getCourse(id: string): Promise<VetCourse> {
    return apiClient.get<VetCourse>(`/admin/vet-courses/${id}`);
  },
  approveCourse(id: string): Promise<VetCourse> {
    return apiClient.post<VetCourse>(`/admin/vet-courses/${id}/approve`);
  },
  rejectCourse(id: string, reason: string): Promise<VetCourse> {
    return apiClient.post<VetCourse>(`/admin/vet-courses/${id}/reject`, { reason });
  },
  cancelCourse(id: string): Promise<VetCourse> {
    return apiClient.post<VetCourse>(`/admin/vet-courses/${id}/cancel`);
  },
  async listRegistrations(
    courseId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<VetCourseRegistration>> {
    const env = await apiClient.requestEnvelope<VetCourseRegistration[]>({
      method: 'GET',
      url: `/admin/vet-courses/${courseId}/registrations`,
      params: { page, pageSize },
    });
    return { items: env.data, meta: readMeta(env.meta, page, pageSize, env.data.length) };
  },
};

export type AdminVetCoursesApi = typeof adminVetCoursesApi;
