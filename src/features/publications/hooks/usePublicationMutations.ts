import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { publicationKeys, publicationsApi } from '../api';
import type {
  AnimalPublication,
  CreateInteractionInput,
  CreatePublicationInput,
  PublicationInteraction,
  PublicationKind,
} from '../types';

/**
 * Publish an owned animal as Lost / for Adoption / for Mating. The publication
 * starts PENDING and is not publicly visible until an admin / ANIMAL supervisor
 * approves it — the client never bypasses that. The animal id comes from the
 * route; the backend derives the owner and rejects a non-owner (`404`). No
 * optimistic updates — mutate → server success → invalidate (§29).
 */
export function useCreatePublication(
  animalId: string,
): UseMutationResult<AnimalPublication, unknown, CreatePublicationInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['publications', 'create', animalId],
    mutationFn: (input: CreatePublicationInput) => publicationsApi.create(animalId, input),
    onSuccess: (created) => {
      // Owner view: this animal's listings ("My Listings").
      void qc.invalidateQueries({ queryKey: publicationKeys.forAnimal(animalId) });
      // Public browse for that kind (harmless now — visible only once approved).
      void qc.invalidateQueries({ queryKey: publicationKeys.publicList(created.kind) });
    },
  });
}

/**
 * Delete one of the caller's own listings. The backend enforces that only the
 * listing's creator, an ADMIN, or an ACTIVE ANIMAL supervisor may delete it —
 * a non-owner gets `404`. `animalId` is passed only to invalidate that
 * animal's owner-view cache.
 */
export function useDeletePublication(): UseMutationResult<
  { success: boolean },
  unknown,
  { publicationId: string; kind: PublicationKind; animalId?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['publications', 'delete'],
    mutationFn: ({ publicationId }) => publicationsApi.remove(publicationId),
    onSuccess: (_data, { kind, animalId }) => {
      void qc.invalidateQueries({ queryKey: publicationKeys.mine() });
      void qc.invalidateQueries({ queryKey: publicationKeys.publicList(kind) });
      if (animalId) void qc.invalidateQueries({ queryKey: publicationKeys.forAnimal(animalId) });
    },
  });
}

/**
 * "طلب التبني" / "طلب تزاوج" / "ابلاغ عن مشاهدة" on an APPROVED listing.
 * Fire-and-forget — notifies the owner, no workflow to track locally.
 */
export function useCreatePublicationInteraction(
  publicationId: string,
): UseMutationResult<PublicationInteraction, unknown, CreateInteractionInput> {
  return useMutation({
    mutationKey: ['publications', 'interactions', 'create', publicationId],
    mutationFn: (input: CreateInteractionInput) =>
      publicationsApi.createInteraction(publicationId, input),
  });
}
