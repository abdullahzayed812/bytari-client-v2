import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { orgKeys, organizationsApi } from '../api';
import type {
  AdminOrganizationReview,
  OrganizationReview,
  OrganizationReviewWithAuthor,
  OrganizationType,
  Paginated,
  PublicOrganizationDetail,
  SubmitReviewInput,
} from '../types';

const REVIEWS_PAGE_SIZE = 20;

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

/**
 * Like / unlike — optimistic on `likesCount` (NOT `followersCount`: a like and
 * a follow are separate engagements, `organization_likes` vs
 * `organization_follows`), reconciled from the server on settle.
 */
function useLikeToggle(
  organizationId: string,
  liked: boolean,
): UseMutationResult<{ success: boolean }, unknown, void, { previous?: PublicOrganizationDetail }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', liked ? 'like' : 'unlike', organizationId],
    mutationFn: () =>
      liked ? organizationsApi.like(organizationId) : organizationsApi.unlike(organizationId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: orgKeys.publicDetail(organizationId) });
      const previous = qc.getQueryData<PublicOrganizationDetail>(
        orgKeys.publicDetail(organizationId),
      );
      if (previous) {
        const count = previous.engagement.likesCount ?? 0;
        qc.setQueryData<PublicOrganizationDetail>(orgKeys.publicDetail(organizationId), {
          ...previous,
          engagement: {
            ...previous.engagement,
            isLiked: liked,
            likesCount: liked ? count + 1 : Math.max(0, count - 1),
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

export function useLikeOrganization(organizationId: string) {
  return useLikeToggle(organizationId, true);
}

export function useUnlikeOrganization(organizationId: string) {
  return useLikeToggle(organizationId, false);
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
      void qc.invalidateQueries({ queryKey: orgKeys.reviews(organizationId) });
    },
  });
}

export function useDeleteOwnOrganizationReview(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'reviews', 'delete-own', organizationId],
    mutationFn: () => organizationsApi.deleteOwnReview(organizationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.publicDetail(organizationId) });
      void qc.invalidateQueries({ queryKey: orgKeys.reviews(organizationId) });
    },
  });
}

/** Paginated reviews of one organization (newest first). */
export function useOrganizationReviews(organizationId: string | undefined) {
  const query = useInfiniteQuery<
    Paginated<OrganizationReviewWithAuthor>,
    unknown,
    InfiniteData<Paginated<OrganizationReviewWithAuthor>>,
    ReturnType<typeof orgKeys.reviews>,
    number
  >({
    queryKey: orgKeys.reviews(organizationId ?? ''),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      organizationsApi.listReviews(organizationId as string, pageParam, REVIEWS_PAGE_SIZE),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(organizationId),
  });
  const reviews = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, reviews, total: query.data?.pages[0]?.meta.total ?? 0 };
}

/** Admin moderation queue — every review with the organization it belongs to. */
export function useAdminOrganizationReviews(filter: {
  type?: OrganizationType;
  maxRating?: number;
}) {
  const query = useInfiniteQuery<
    Paginated<AdminOrganizationReview>,
    unknown,
    InfiniteData<Paginated<AdminOrganizationReview>>,
    ReturnType<typeof orgKeys.adminReviews>,
    number
  >({
    queryKey: orgKeys.adminReviews(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      organizationsApi.adminListReviews({
        page: pageParam,
        pageSize: REVIEWS_PAGE_SIZE,
        ...filter,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
  const reviews = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, reviews, total: query.data?.pages[0]?.meta.total ?? 0 };
}

export function useAdminDeleteOrganizationReview(): UseMutationResult<
  { success: boolean },
  unknown,
  { reviewId: string; reason?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'admin-reviews', 'delete'],
    mutationFn: ({ reviewId, reason }) => organizationsApi.adminDeleteReview(reviewId, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...orgKeys.all] });
    },
  });
}
