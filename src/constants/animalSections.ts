/**
 * The animal sections whose News / Best Tips feeds are separated (mirrors the
 * server's `ANIMAL_SECTIONS`). An item with no section is "general".
 */
export const ANIMAL_SECTIONS = ['PETS', 'SHEEP', 'CATTLE', 'POULTRY'] as const;
export type AnimalSection = (typeof ANIMAL_SECTIONS)[number];

/** `?section=` route param ("POULTRY" or "SHEEP,CATTLE") → validated list. */
export function parseAnimalSections(raw: string | undefined): AnimalSection[] | undefined {
  if (!raw) return undefined;
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is AnimalSection => (ANIMAL_SECTIONS as readonly string[]).includes(s));
  return list.length ? list : undefined;
}
