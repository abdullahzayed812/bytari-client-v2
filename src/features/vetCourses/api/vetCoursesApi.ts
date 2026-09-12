import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  CourseBrowseFilter,
  CreateVetCourseInput,
  CreateVetCourseRegistrationInput,
  Paginated,
  PublicVetCourse,
  UpdateVetCourseInput,
  VetCourse,
  VetCourseRegistration,
} from '../types';

function meta(m: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const x = (m ?? {}) as Partial<ApiPageMeta>;
  return {
    page: x.page ?? page,
    pageSize: x.pageSize ?? pageSize,
    total: x.total ?? count,
    totalPages: x.totalPages ?? 1,
  };
}

async function page<T>(url: string, params: Record<string, unknown>): Promise<Paginated<T>> {
  const p = Number(params.page ?? 1);
  const ps = Number(params.pageSize ?? 20);
  const env = await apiClient.requestEnvelope<T[]>({ method: 'GET', url, params });
  return { items: env.data, meta: meta(env.meta, p, ps, env.data.length) };
}

/**
 * Thin wrappers over `/api/v1/vet-courses/*`. The API client attaches auth;
 * the backend derives + enforces every role / ownership / moderation /
 * registration rule (e.g. only an approved veterinarian may create a course
 * or register, capacity + deadline + at-most-once enforced server-side).
 */
export const vetCoursesApi = {
  // --- cover image ---------------------------------------------
  requestImageUploadUrl(input: { filename: string; mimeType: string; size: number }): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>('/vet-courses/images/upload-url', input);
  },

  // --- courses / seminars / workshops ------------------------------------
  listCourses(
    filter: CourseBrowseFilter & { page: number; pageSize: number },
  ): Promise<Paginated<PublicVetCourse>> {
    return page<PublicVetCourse>('/vet-courses', {
      page: filter.page,
      pageSize: filter.pageSize,
      search: filter.search || undefined,
      type: filter.type,
      locationMode: filter.locationMode,
    });
  },
  listMyCourses(params: { page: number; pageSize: number; status?: string }): Promise<Paginated<VetCourse>> {
    return page<VetCourse>('/vet-courses/mine', params);
  },
  getCourse(id: string): Promise<PublicVetCourse> {
    return apiClient.get<PublicVetCourse>(`/vet-courses/${id}`);
  },
  getMyCourse(id: string): Promise<VetCourse> {
    return apiClient.get<VetCourse>(`/vet-courses/${id}/manage`);
  },
  createCourse(input: CreateVetCourseInput): Promise<VetCourse> {
    return apiClient.post<VetCourse>('/vet-courses', input);
  },
  updateCourse(id: string, input: UpdateVetCourseInput): Promise<VetCourse> {
    return apiClient.patch<VetCourse>(`/vet-courses/${id}`, input);
  },
  deleteCourse(id: string): Promise<unknown> {
    return apiClient.delete(`/vet-courses/${id}`);
  },
  cancelCourse(id: string): Promise<VetCourse> {
    return apiClient.post<VetCourse>(`/vet-courses/${id}/cancel`);
  },

  // --- registrations --------------------------------------------
  register(courseId: string, input: CreateVetCourseRegistrationInput): Promise<VetCourseRegistration> {
    return apiClient.post<VetCourseRegistration>(`/vet-courses/${courseId}/registrations`, input);
  },
  listCourseRegistrations(
    courseId: string,
    params: { page: number; pageSize: number },
  ): Promise<Paginated<VetCourseRegistration>> {
    return page<VetCourseRegistration>(`/vet-courses/${courseId}/registrations`, params);
  },
  listMyRegistrations(params: { page: number; pageSize: number }): Promise<Paginated<VetCourseRegistration>> {
    return page<VetCourseRegistration>('/vet-courses/registrations/mine', params);
  },
  getRegistration(id: string): Promise<VetCourseRegistration> {
    return apiClient.get<VetCourseRegistration>(`/vet-courses/registrations/${id}`);
  },
};

export type VetCoursesApi = typeof vetCoursesApi;
