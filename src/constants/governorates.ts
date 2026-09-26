/**
 * Iraqi governorates for the "المحافظة" picker. Value === Arabic label.
 * Shared across every farm-type feature (poultry/sheep/cattle), the
 * poultry-market feature and registration — genuinely generic geography data.
 * Mirrors the server list (`server/src/shared/validation/geography.ts`).
 */
export const IRAQ_GOVERNORATES: readonly string[] = [
  'بغداد',
  'البصرة',
  'نينوى',
  'أربيل',
  'النجف',
  'كربلاء',
  'بابل',
  'ذي قار',
  'الأنبار',
  'ديالى',
  'كركوك',
  'صلاح الدين',
  'واسط',
  'ميسان',
  'المثنى',
  'القادسية',
  'دهوك',
  'السليمانية',
  'حلبجة',
];

/**
 * Governorates per ISO-3166 alpha-2 country. Only the target geography (Iraq)
 * has a fixed list; any other country falls back to a free-text field
 * (`governoratesFor` → `null`). Add a country here AND on the server.
 */
export const GOVERNORATES_BY_COUNTRY: Readonly<Record<string, readonly string[]>> = {
  IQ: IRAQ_GOVERNORATES,
};

export function governoratesFor(country: string | null | undefined): readonly string[] | null {
  if (!country) return null;
  return GOVERNORATES_BY_COUNTRY[country.toUpperCase()] ?? null;
}
