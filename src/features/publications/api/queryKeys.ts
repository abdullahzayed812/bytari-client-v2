import type { PublicationKind } from '../types';

/**
 * Animal-publication query keys (§28). Two independent trees — the authenticated
 * public browse and the per-animal owner view.
 *
 *   publicationKeys.public()                     → ['publications', 'public']
 *   publicationKeys.publicList(kind)             → ['publications', 'public', 'list', { kind }]
 *   publicationKeys.publicDetail(id)             → ['publications', 'public', 'detail', id]
 *   publicationKeys.forAnimal(animalId)          → ['publications', 'animal', animalId]
 *   publicationKeys.animalList(animalId)         → ['publications', 'animal', animalId, 'list']
 *   publicationKeys.animalDetail(animalId, id)   → ['publications', 'animal', animalId, 'detail', id]
 */
export const publicationKeys = {
  all: ['publications'] as const,

  public: () => [...publicationKeys.all, 'public'] as const,
  publicList: (kind: PublicationKind, filter: { species?: string; search?: string } = {}) =>
    [...publicationKeys.public(), 'list', { kind, ...filter }] as const,
  publicDetail: (publicationId: string) =>
    [...publicationKeys.public(), 'detail', publicationId] as const,

  forAnimal: (animalId: string) => [...publicationKeys.all, 'animal', animalId] as const,
  animalList: (animalId: string) => [...publicationKeys.forAnimal(animalId), 'list'] as const,
  animalDetail: (animalId: string, publicationId: string) =>
    [...publicationKeys.forAnimal(animalId), 'detail', publicationId] as const,
};
