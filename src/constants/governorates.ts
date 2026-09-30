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

/**
 * The four governorates of the Kurdistan Region. The poultry / egg exchange
 * (bourse) presents them as ONE exchange group ("إقليم كوردستان") with each
 * city's own prices underneath — a presentation grouping only: prices stay
 * stored per governorate, exactly as before.
 */
export const KURDISTAN_REGION_GOVERNORATES: readonly string[] = [
  'أربيل',
  'دهوك',
  'السليمانية',
  'حلبجة',
];

export type GovernorateMarketRow =
  | { kind: 'governorate'; governorate: string }
  | { kind: 'region'; region: 'KURDISTAN'; governorates: readonly string[] };

/**
 * `IRAQ_GOVERNORATES` for the exchange boards: every governorate in its
 * canonical order, except the Kurdistan Region's four, which appear together
 * as one group at the position of the first of them.
 */
export function governoratesForMarket(): GovernorateMarketRow[] {
  const rows: GovernorateMarketRow[] = [];
  let regionAdded = false;
  for (const governorate of IRAQ_GOVERNORATES) {
    if (KURDISTAN_REGION_GOVERNORATES.includes(governorate)) {
      if (!regionAdded) {
        rows.push({
          kind: 'region',
          region: 'KURDISTAN',
          governorates: KURDISTAN_REGION_GOVERNORATES,
        });
        regionAdded = true;
      }
      continue;
    }
    rows.push({ kind: 'governorate', governorate });
  }
  return rows;
}
