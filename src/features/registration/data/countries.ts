import type { CountryOption } from '../types';

/**
 * ISO-3166 alpha-2 country list with Arabic display names, used by
 * `CountrySelect`. Iraq — the platform's target geography (IQD prices,
 * Iraqi governorates, +964 contact line) — is pinned first and is the form
 * default. Scoped to the 22 Arab League member states — this app is
 * Arabic-first and targets Arab users.
 */
export const COUNTRIES: CountryOption[] = [
  { code: 'IQ', nameAr: 'العراق', nameEn: 'Iraq' },
  { code: 'SA', nameAr: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia' },
  { code: 'AE', nameAr: 'الإمارات العربية المتحدة', nameEn: 'United Arab Emirates' },
  { code: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait' },
  { code: 'QA', nameAr: 'قطر', nameEn: 'Qatar' },
  { code: 'BH', nameAr: 'البحرين', nameEn: 'Bahrain' },
  { code: 'OM', nameAr: 'عمان', nameEn: 'Oman' },
  { code: 'EG', nameAr: 'مصر', nameEn: 'Egypt' },
  { code: 'JO', nameAr: 'الأردن', nameEn: 'Jordan' },
  { code: 'LB', nameAr: 'لبنان', nameEn: 'Lebanon' },
  { code: 'SY', nameAr: 'سوريا', nameEn: 'Syria' },
  { code: 'YE', nameAr: 'اليمن', nameEn: 'Yemen' },
  { code: 'PS', nameAr: 'فلسطين', nameEn: 'Palestine' },
  { code: 'LY', nameAr: 'ليبيا', nameEn: 'Libya' },
  { code: 'TN', nameAr: 'تونس', nameEn: 'Tunisia' },
  { code: 'DZ', nameAr: 'الجزائر', nameEn: 'Algeria' },
  { code: 'MA', nameAr: 'المغرب', nameEn: 'Morocco' },
  { code: 'SD', nameAr: 'السودان', nameEn: 'Sudan' },
  { code: 'MR', nameAr: 'موريتانيا', nameEn: 'Mauritania' },
  { code: 'SO', nameAr: 'الصومال', nameEn: 'Somalia' },
  { code: 'DJ', nameAr: 'جيبوتي', nameEn: 'Djibouti' },
  { code: 'KM', nameAr: 'جزر القمر', nameEn: 'Comoros' },
];
