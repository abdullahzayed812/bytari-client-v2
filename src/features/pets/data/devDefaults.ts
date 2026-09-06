/**
 * DEVELOPMENT ONLY — pre-fills the "Add Pet" form so testing doesn't require
 * retyping the same values every time. `__DEV__` is statically replaced with
 * `false` in release builds, so this whole module is dead-code-eliminated and
 * never ships.
 */
import type { PetFormValues } from '../validation/schemas';

function isoYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

export function devPetDefaults(): Partial<PetFormValues> {
  return {
    name: 'ريكس',
    species: 'DOG',
    sex: 'MALE',
    breed: 'جيرمن شيبرد',
    dateOfBirth: isoYearsAgo(2),
    notes: 'حيوان أليف هادئ الطباع ويحب اللعب في الحديقة.',
  };
}
