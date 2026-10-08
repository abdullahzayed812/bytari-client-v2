import type { BadgeTone, IconName } from '@/components/content';
import type { OrganizationType } from '@/features/organizations';

/**
 * Organization types that may hold veterinary access to an animal.
 *
 * Backend source of truth: `VETERINARY_ORG_TYPES` in
 * `server/src/modules/veterinary-care/domain/veterinary-care.constants.ts`
 * (`['CLINIC']`). The clinic-pet routes reject any other type with
 * `400 ORGANIZATION_TYPE_NOT_SUPPORTED`. Centralised here so no component does
 * `if (org.type === 'CLINIC')` inline — Farm-specific animal handling can be
 * added by extending this one list + helper (§18).
 */
export const VETERINARY_ANIMAL_ORG_TYPES: readonly OrganizationType[] = ['CLINIC'];

/** Does an organization of this type manage animals in Phase 5? */
export function organizationManagesAnimals(type: OrganizationType | string | undefined): boolean {
  return (VETERINARY_ANIMAL_ORG_TYPES as readonly string[]).includes(type ?? '');
}

/** Species → line icon (reuses the Ionicons vocabulary from the pets feature). */
export const ANIMAL_SPECIES_ICON: Record<string, IconName> = {
  DOG: 'paw-outline',
  CAT: 'paw-outline',
  BIRD: 'egg-outline',
  RABBIT: 'paw-outline',
  REPTILE: 'bug-outline',
  FISH: 'fish-outline',
  HORSE: 'paw-outline',
  OTHER: 'help-circle-outline',
};

export function animalSpeciesIcon(species: string): IconName {
  return ANIMAL_SPECIES_ICON[species] ?? 'help-circle-outline';
}

/** Animal-core status → badge tone. */
export const ANIMAL_STATUS_TONE: Record<string, BadgeTone> = {
  ACTIVE: 'success',
  DEACTIVATED: 'neutral',
};
