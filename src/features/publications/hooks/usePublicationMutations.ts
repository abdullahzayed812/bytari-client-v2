import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { publicationKeys, publicationsApi } from '../api';
import type { AnimalPublication, CreatePublicationInput } from '../types';

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
      // Owner view: this animal's listings.
      void qc.invalidateQueries({ queryKey: publicationKeys.forAnimal(animalId) });
      // Public browse for that kind (harmless now — visible only once approved).
      void qc.invalidateQueries({ queryKey: publicationKeys.publicList(created.kind) });
    },
  });
}
