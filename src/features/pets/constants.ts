import type { IconName } from '@/components/content';

import { PET_SEXES, PET_SPECIES, type PetSex, type PetSpecies } from './types';

/** Species → line icon (Ionicons via the `Icon` wrapper). */
export const SPECIES_ICON: Record<PetSpecies, IconName> = {
  DOG: 'paw-outline',
  CAT: 'paw-outline',
  BIRD: 'egg-outline',
  RABBIT: 'paw-outline',
  REPTILE: 'bug-outline',
  FISH: 'fish-outline',
  HORSE: 'paw-outline',
  OTHER: 'help-circle-outline',
};

/** Ordered option values for the `Select`s — labels are resolved via i18n `pets.*`. */
export const SPECIES_OPTIONS: readonly PetSpecies[] = PET_SPECIES;
export const SEX_OPTIONS: readonly PetSex[] = PET_SEXES;

export interface PetAge {
  years: number;
  months: number;
}

/** Rough age from a `YYYY-MM-DD` birth date. `null` when absent/invalid/future. */
export function petAge(
  dateOfBirth: string | null | undefined,
  now: Date = new Date(),
): PetAge | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime()) || dob > now) return null;
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) months -= 1;
  if (months < 0) months = 0;
  return { years: Math.floor(months / 12), months: months % 12 };
}
