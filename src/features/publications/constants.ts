import type { BadgeTone, IconName } from '@/components/content';
import type { ColorTokens } from '@/theme';

import type {
  AgeEstimate,
  HealthStatus,
  PublicationInteractionType,
  PublicationKind,
  PublicationStatus,
  VaccinationStatus,
} from './types';

/**
 * Kind → icon + url slug + theme colors. Reuses the EXACT tokens the Pets
 * Landing feature cards already use for these three concepts
 * (`featureAdoptionAccent` etc.) — no new colors invented.
 */
export const PUBLICATION_KIND_META: Record<
  PublicationKind,
  {
    icon: IconName;
    slug: 'adoption' | 'mating' | 'lost';
    surface: keyof ColorTokens;
    accent: keyof ColorTokens;
  }
> = {
  ADOPTION: {
    icon: 'heart-outline',
    slug: 'adoption',
    surface: 'featureAdoptionSurface',
    accent: 'featureAdoptionAccent',
  },
  MATING: {
    icon: 'male-female-outline',
    slug: 'mating',
    surface: 'featureMatingSurface',
    accent: 'featureMatingAccent',
  },
  LOST: {
    icon: 'search-outline',
    slug: 'lost',
    surface: 'featureLostSurface',
    accent: 'featureLostAccent',
  },
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

/** Kind → badge tone — used by `PublicationKindBadge` (e.g. inline on `PetDetailsScreen`). */
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

export const AGE_ESTIMATE_OPTIONS: AgeEstimate[] = [
  'UNDER_1_YEAR',
  'ONE_TO_3_YEARS',
  'THREE_TO_7_YEARS',
  'OVER_7_YEARS',
];

export const HEALTH_STATUS_OPTIONS: HealthStatus[] = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'];

export const VACCINATION_STATUS_OPTIONS: VaccinationStatus[] = ['COMPLETE', 'PARTIAL', 'NONE'];

/** The single "request" / "report" action per kind — icon + i18n key + which button slot it fills. */
export const KIND_INTERACTION: Record<PublicationKind, PublicationInteractionType | null> = {
  ADOPTION: 'REQUEST',
  MATING: 'REQUEST',
  LOST: 'SIGHTING',
};
