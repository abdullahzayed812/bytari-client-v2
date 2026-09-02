import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { orgKeys, organizationsApi } from '../api';
import type { OrganizationReview, PublicOrganizationDetail, SubmitReviewInput } from '../types';

/**
 * Follow / review mutations for the Clinic Details screen. Both invalidate
 * `orgKeys.publicDetail(id)` — the single source of the viewer's engagement
 * summary (`isFollowing` / `followersCount` / `rating` / `reviewsCount`),
 * same "narrowest key prefix" convention as `useOrganizationMutations.ts`.
 */

export function useFollowOrganization(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'follow', organizationId],
    mutationFn: () => organizationsApi.follow(organizationId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: orgKeys.publicDetail(organizationId) });
      const previous = qc.getQueryData<PublicOrganizationDetail>(
        orgKeys.publicDetail(organizationId),
      );
      if (previous) {
        qc.setQueryData<PublicOrganizationDetail>(orgKeys.publicDetail(organizationId), {
          ...previous,
          engagement: {
            ...previous.engagement,
            isFollowing: true,
            followersCount: previous.engagement.followersCount + 1,
          },
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(orgKeys.publicDetail(organizationId), context.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.publicDetail(organizationId) });
    },
  });
}

export function useUnfollowOrganization(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'unfollow', organizationId],
    mutationFn: () => organizationsApi.unfollow(organizationId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: orgKeys.publicDetail(organizationId) });
      const previous = qc.getQueryData<PublicOrganizationDetail>(
        orgKeys.publicDetail(organizationId),
      );
      if (previous) {
        qc.setQueryData<PublicOrganizationDetail>(orgKeys.publicDetail(organizationId), {
          ...previous,
          engagement: {
            ...previous.engagement,
            isFollowing: false,
            followersCount: Math.max(0, previous.engagement.followersCount - 1),
          },
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(orgKeys.publicDetail(organizationId), context.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.publicDetail(organizationId) });
    },
  });
}

export function useSubmitOrganizationReview(
  organizationId: string,
): UseMutationResult<OrganizationReview, unknown, SubmitReviewInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'reviews', 'submit', organizationId],
    mutationFn: (input: SubmitReviewInput) => organizationsApi.submitReview(organizationId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.publicDetail(organizationId) });
    },
  });
}
