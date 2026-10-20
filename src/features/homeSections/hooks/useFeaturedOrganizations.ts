import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PublicOrganization } from '@/features/organizations/types';
import type { ApiError } from '@/services/api';

import { homeSectionKeys, homeSectionsApi } from '../api';
import {
  FEATURED_TYPE_BY_PLACEMENT,
  type AdminFeaturedOrganization,
  type CreateFeaturedOrganizationInput,
  type FeaturedPlacement,
  type UpdateFeaturedOrganizationInput,
} from '../types';

/**
 * Today's featured organizations for one home page — clinics on the Pet Owner
 * home, veterinary offices / companies on the Veterinarian home. The server
 * applies window + visibility + the page's type; the type is re-checked here
 * so a page can never render the other audience's organizations.
 */
export function useFeaturedOrganizations(placement: FeaturedPlacement) {
  return useQuery<PublicOrganization[], ApiError>({
    queryKey: homeSectionKeys.featured(placement),
    queryFn: () => homeSectionsApi.listFeatured(placement),
    select: (orgs) => orgs.filter((o) => o.type === FEATURED_TYPE_BY_PLACEMENT[placement]),
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
