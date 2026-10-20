import type { IconName } from '@/components/content';

/**
 * Accent palettes of the store references (متجر أصحاب الحيوانات / المتجر
 * البيطري and their category pages): each category page is tinted with one
 * colour — pets rose, sheep & cattle amber, birds & poultry sky, medicines
 * green, medical equipment purple, nutrition orange, lab supplies blue.
 */
export interface StoreAccent {
  /** Buttons, active pill, icons. */
  main: string;
  /** Pressed / darker text on soft backgrounds. */
  strong: string;
  /** Icon tiles, image wells. */
  soft: string;
  /** Hover / selected border. */
  border: string;
}

export const STORE_ACCENTS = {
  green: { main: '#078B4E', strong: '#057441', soft: '#ECFDF5', border: '#A7F3D0' },
  rose: { main: '#E11D48', strong: '#BE123C', soft: '#FFF1F2', border: '#FECDD3' },
  amber: { main: '#D97706', strong: '#B45309', soft: '#FFFBEB', border: '#FDE68A' },
  sky: { main: '#0284C7', strong: '#0369A1', soft: '#F0F9FF', border: '#BAE6FD' },
  purple: { main: '#7B20D4', strong: '#6B21A8', soft: '#FAF5FF', border: '#E9D5FF' },
  orange: { main: '#EA580C', strong: '#C2410C', soft: '#FFF7ED', border: '#FED7AA' },
  blue: { main: '#086AD8', strong: '#1D4ED8', soft: '#EFF6FF', border: '#BFDBFE' },
} as const satisfies Record<string, StoreAccent>;

export type StoreAccentKey = keyof typeof STORE_ACCENTS;

const RULES: { accent: StoreAccentKey; icon: IconName; match: RegExp }[] = [
  { accent: 'rose', icon: 'paw', match: /pet|dog|cat|أليف|اليف|كلاب|قطط/i },
  {
    accent: 'amber',
    icon: 'leaf-outline',
    match: /sheep|cattle|cow|goat|livestock|أغنام|اغنام|أبقار|ابقار|ماعز|مواشي/i,
  },
  { accent: 'sky', icon: 'egg-outline', match: /poultry|bird|chicken|دواجن|طيور/i },
  { accent: 'blue', icon: 'flask-outline', match: /lab|مختبر|تحاليل/i },
  { accent: 'purple', icon: 'pulse-outline', match: /equip|device|instrument|معدات|أجهزة|اجهزة/i },
  {
    accent: 'orange',
    icon: 'nutrition-outline',
    match: /nutri|supplement|food|feed|تغذية|مكملات|أغذية|اغذية|أعلاف|اعلاف/i,
  },
  { accent: 'green', icon: 'medkit-outline', match: /medic|drug|pharma|أدوية|ادوية|دواء/i },
];

/**
 * Accent + icon for a store category, from its slug / name (admin-managed
 * data, so matched by keywords; unknown categories fall back to the brand
 * green). A sub-category is resolved through its section first, so a whole
 * category page stays one colour.
 */
export function storeCategoryStyle(
  category: { slug: string; name: string } | undefined,
  section?: { slug: string; name: string },
): { accentKey: StoreAccentKey; accent: StoreAccent; icon: IconName } {
  for (const c of [section, category]) {
    if (!c) continue;
    const text = `${c.slug} ${c.name}`;
    const rule = RULES.find((r) => r.match.test(text));
    if (rule)
      return { accentKey: rule.accent, accent: STORE_ACCENTS[rule.accent], icon: rule.icon };
  }
  return { accentKey: 'green', accent: STORE_ACCENTS.green, icon: 'pricetags-outline' };
}
