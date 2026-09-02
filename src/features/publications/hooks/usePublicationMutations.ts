import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { publicationKeys, publicationsApi } from '../api';
import type {
  AnimalPublication,
  CreateInteractionInput,
  CreatePublicationInput,
  PublicationInteraction,
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
