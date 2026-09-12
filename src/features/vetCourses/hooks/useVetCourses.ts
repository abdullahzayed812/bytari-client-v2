import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';
import type { LocalFile, PresignProvider } from '@/services/media';

import { vetCourseKeys, vetCoursesApi } from '../api';
import type {
  CourseBrowseFilter,
  CreateVetCourseInput,
  CreateVetCourseRegistrationInput,
  Paginated,
  PublicVetCourse,
  UpdateVetCourseInput,
  VetCourse,
  VetCourseModerationStatus,
  VetCourseRegistration,
} from '../types';

const PAGE = AppConfig.defaultPageSize;

/** `PresignProvider` for the course cover-image field. */
export function useVetCourseImageProvider(): PresignProvider {
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file: LocalFile) =>
        vetCoursesApi.requestImageUploadUrl({
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
    }),
    [],
  );
}

function useInfinite<T>(
  key: readonly unknown[],
  fetcher: (page: number) => Promise<Paginated<T>>,
  enabled = true,
) {
  return useInfiniteQuery<Paginated<T>, unknown, InfiniteData<Paginated<T>>, readonly unknown[], number>({
    queryKey: key,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetcher(pageParam),
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled,
    staleTime: 10_000,
  });
}

// ================= courses / seminars / workshops =================

export function useVetCourses(filter: CourseBrowseFilter, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<PublicVetCourse>(
    vetCourseKeys.courseList(filter),
    (page) => vetCoursesApi.listCourses({ ...filter, page, pageSize: PAGE }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, courses: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useMyVetCourses(status?: VetCourseModerationStatus, opts: { enabled?: boolean } = {}) {
  const q = useInfinite<VetCourse>(
    vetCourseKeys.myCourseList(status),
    (page) => vetCoursesApi.listMyCourses({ page, pageSize: PAGE, status }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, courses: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useVetCourse(
  id: string | undefined,
  opts?: { manage?: false },
): ReturnType<typeof useQuery<PublicVetCourse, ApiError>>;
export function useVetCourse(
  id: string | undefined,
  opts: { manage: true },
): ReturnType<typeof useQuery<VetCourse, ApiError>>;
export function useVetCourse(id: string | undefined, opts: { manage?: boolean } = {}) {
  return useQuery<PublicVetCourse | VetCourse, ApiError>({
    queryKey: opts.manage ? vetCourseKeys.myCourse(id ?? '_') : vetCourseKeys.course(id ?? '_'),
    queryFn: () => (opts.manage ? vetCoursesApi.getMyCourse(id as string) : vetCoursesApi.getCourse(id as string)),
    enabled: Boolean(id),
  });
}

export function useCreateVetCourse() {
  const qc = useQueryClient();
  return useMutation<VetCourse, ApiError, CreateVetCourseInput>({
    mutationFn: (input) => vetCoursesApi.createCourse(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetCourseKeys.courses() }),
  });
}

export function useUpdateVetCourse() {
  const qc = useQueryClient();
  return useMutation<VetCourse, ApiError, { id: string; input: UpdateVetCourseInput }>({
    mutationFn: ({ id, input }) => vetCoursesApi.updateCourse(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetCourseKeys.courses() }),
  });
}

export function useDeleteVetCourse() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => vetCoursesApi.deleteCourse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetCourseKeys.courses() }),
  });
}

export function useCancelVetCourse() {
  const qc = useQueryClient();
  return useMutation<VetCourse, ApiError, string>({
    mutationFn: (id) => vetCoursesApi.cancelCourse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetCourseKeys.courses() }),
  });
}

// ================= registrations =================

export function useRegisterForVetCourse(courseId: string) {
  const qc = useQueryClient();
  return useMutation<VetCourseRegistration, ApiError, CreateVetCourseRegistrationInput>({
    mutationFn: (input) => vetCoursesApi.register(courseId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vetCourseKeys.all }),
  });
}

export function useVetCourseRegistrations(courseId: string | undefined) {
  const q = useInfinite<VetCourseRegistration>(
    vetCourseKeys.courseRegistrations(courseId ?? '_'),
    (page) => vetCoursesApi.listCourseRegistrations(courseId as string, { page, pageSize: PAGE }),
    Boolean(courseId),
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, registrations: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useMyVetCourseRegistrations(opts: { enabled?: boolean } = {}) {
  const q = useInfinite<VetCourseRegistration>(
    vetCourseKeys.myRegistrations(),
    (page) => vetCoursesApi.listMyRegistrations({ page, pageSize: PAGE }),
    opts.enabled ?? true,
  );
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, registrations: items, total: q.data?.pages[0]?.meta.total ?? 0 };
}

export function useVetCourseRegistration(id: string | undefined) {
  return useQuery<VetCourseRegistration, ApiError>({
    queryKey: vetCourseKeys.registration(id ?? '_'),
    queryFn: () => vetCoursesApi.getRegistration(id as string),
    enabled: Boolean(id),
  });
}
