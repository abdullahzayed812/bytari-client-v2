import type { BadgeTone, IconName } from '@/components/content';

import type { PublicationKind, PublicationStatus } from './types';

/** Kind → icon + url slug. Labels/empty text come from the `publications` i18n namespace. */
export const PUBLICATION_KIND_META: Record<
  PublicationKind,
  { icon: IconName; slug: 'adoption' | 'mating' | 'lost' }
> = {
  ADOPTION: { icon: 'heart-outline', slug: 'adoption' },
  MATING: { icon: 'male-female-outline', slug: 'mating' },
  LOST: { icon: 'search-outline', slug: 'lost' },
};

const SLUG_TO_KIND: Record<string, PublicationKind> = {
  adoption: 'ADOPTION',
  mating: 'MATING',
  lost: 'LOST',
};

/** Resolve a route `[kind]` slug to a backend `PublicationKind` (or `null`). */
export function publicationKindFromSlug(slug: string | undefined): PublicationKind | null {
  return slug ? (SLUG_TO_KIND[slug] ?? null) : null;
}

export function publicationKindSlug(kind: PublicationKind): 'adoption' | 'mating' | 'lost' {
  return PUBLICATION_KIND_META[kind].slug;
}

/** Publication kind → badge tone. */
export const PUBLICATION_KIND_TONE: Record<PublicationKind, BadgeTone> = {
  ADOPTION: 'primary',
  MATING: 'info',
  LOST: 'warning',
};

/** Approval status → badge tone (owner view only). */
export const PUBLICATION_STATUS_TONE: Record<PublicationStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

/** Species → line icon (reuses the pets vocabulary; safe fallback for unknowns). */
export const PUBLICATION_SPECIES_ICON: Record<string, IconName> = {
  DOG: 'paw-outline',
  CAT: 'paw-outline',
  BIRD: 'egg-outline',
  RABBIT: 'paw-outline',
  REPTILE: 'bug-outline',
  FISH: 'fish-outline',
  HORSE: 'paw-outline',
  OTHER: 'help-circle-outline',
};

export function publicationSpeciesIcon(species: string): IconName {
  return PUBLICATION_SPECIES_ICON[species] ?? 'help-circle-outline';
}
