import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PublicOrganization } from '@/features/organizations/types';
import type { ApiError } from '@/services/api';

import { homeSectionKeys, homeSectionsApi } from '../api';
import type {
  AdminFeaturedOrganization,
  CreateFeaturedOrganizationInput,
  FeaturedPlacement,
  UpdateFeaturedOrganizationInput,
} from '../types';

/** Today's featured clinics / offices for one home page (server applies window + visibility). */
export function useFeaturedOrganizations(placement: FeaturedPlacement) {
  return useQuery<PublicOrganization[], ApiError>({
    queryKey: homeSectionKeys.featured(placement),
    queryFn: () => homeSectionsApi.listFeatured(placement),
    staleTime: 60_000,
  });
}

/** Admin list of every entry (all pages, all states). */
export function useAdminFeaturedOrganizations() {
  return useQuery<AdminFeaturedOrganization[], ApiError>({
    queryKey: homeSectionKeys.adminFeatured(),
    queryFn: () => homeSectionsApi.adminListFeatured(),
  });
}

/** Create / update / remove — each refreshes the admin list and both carousels. */
export function useFeaturedOrganizationMutations() {
  const qc = useQueryClient();
  const refresh = (): void => {
    void qc.invalidateQueries({ queryKey: homeSectionKeys.adminFeatured() });
    void qc.invalidateQueries({ queryKey: [...homeSectionKeys.all, 'featured'] });
  };
  const create = useMutation<AdminFeaturedOrganization, ApiError, CreateFeaturedOrganizationInput>({
    mutationFn: (input) => homeSectionsApi.createFeatured(input),
    onSuccess: refresh,
  });
  const update = useMutation<
    AdminFeaturedOrganization,
    ApiError,
    { id: string; input: UpdateFeaturedOrganizationInput }
  >({
    mutationFn: ({ id, input }) => homeSectionsApi.updateFeatured(id, input),
    onSuccess: refresh,
  });
  const remove = useMutation<{ removed: boolean }, ApiError, string>({
    mutationFn: (id) => homeSectionsApi.removeFeatured(id),
    onSuccess: refresh,
  });
  return { create, update, remove };
}
