/**
 * International calling codes offered by the registration phone field
 * (`PhoneNumberField`). Iraq (+964) is pinned first and is the form default;
 * then the rest of the Arab League (same order as `COUNTRIES`), then the
 * neighbours and diaspora destinations most common for Iraqi users.
 *
 * `code` is the ISO-3166 alpha-2 country, not the dial code — dial codes are
 * not unique (US/CA share +1), so the form stores the ISO code and resolves
 * the dial code from it.
 */
export interface CallingCodeOption {
  /** ISO-3166 alpha-2, uppercase. */
  code: string;
  /** Dial code digits, no leading `+`. */
  dial: string;
  nameAr: string;
  nameEn: string;
}

export const DEFAULT_CALLING_CODE = 'IQ';

export const CALLING_CODES: CallingCodeOption[] = [
  { code: 'IQ', dial: '964', nameAr: 'العراق', nameEn: 'Iraq' },
  { code: 'SA', dial: '966', nameAr: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia' },
  { code: 'AE', dial: '971', nameAr: 'الإمارات العربية المتحدة', nameEn: 'United Arab Emirates' },
  { code: 'KW', dial: '965', nameAr: 'الكويت', nameEn: 'Kuwait' },
  { code: 'QA', dial: '974', nameAr: 'قطر', nameEn: 'Qatar' },
  { code: 'BH', dial: '973', nameAr: 'البحرين', nameEn: 'Bahrain' },
  { code: 'OM', dial: '968', nameAr: 'عمان', nameEn: 'Oman' },
  { code: 'EG', dial: '20', nameAr: 'مصر', nameEn: 'Egypt' },
  { code: 'JO', dial: '962', nameAr: 'الأردن', nameEn: 'Jordan' },
  { code: 'LB', dial: '961', nameAr: 'لبنان', nameEn: 'Lebanon' },
  { code: 'SY', dial: '963', nameAr: 'سوريا', nameEn: 'Syria' },
  { code: 'YE', dial: '967', nameAr: 'اليمن', nameEn: 'Yemen' },
  { code: 'PS', dial: '970', nameAr: 'فلسطين', nameEn: 'Palestine' },
  { code: 'LY', dial: '218', nameAr: 'ليبيا', nameEn: 'Libya' },
  { code: 'TN', dial: '216', nameAr: 'تونس', nameEn: 'Tunisia' },
  { code: 'DZ', dial: '213', nameAr: 'الجزائر', nameEn: 'Algeria' },
  { code: 'MA', dial: '212', nameAr: 'المغرب', nameEn: 'Morocco' },
  { code: 'SD', dial: '249', nameAr: 'السودان', nameEn: 'Sudan' },
  { code: 'MR', dial: '222', nameAr: 'موريتانيا', nameEn: 'Mauritania' },
  { code: 'SO', dial: '252', nameAr: 'الصومال', nameEn: 'Somalia' },
  { code: 'DJ', dial: '253', nameAr: 'جيبوتي', nameEn: 'Djibouti' },
  { code: 'KM', dial: '269', nameAr: 'جزر القمر', nameEn: 'Comoros' },
  { code: 'TR', dial: '90', nameAr: 'تركيا', nameEn: 'Turkey' },
  { code: 'IR', dial: '98', nameAr: 'إيران', nameEn: 'Iran' },
  { code: 'GB', dial: '44', nameAr: 'المملكة المتحدة', nameEn: 'United Kingdom' },
  { code: 'DE', dial: '49', nameAr: 'ألمانيا', nameEn: 'Germany' },
  { code: 'SE', dial: '46', nameAr: 'السويد', nameEn: 'Sweden' },
  { code: 'NL', dial: '31', nameAr: 'هولندا', nameEn: 'Netherlands' },
  { code: 'FR', dial: '33', nameAr: 'فرنسا', nameEn: 'France' },
  { code: 'US', dial: '1', nameAr: 'الولايات المتحدة', nameEn: 'United States' },
  { code: 'CA', dial: '1', nameAr: 'كندا', nameEn: 'Canada' },
  { code: 'AU', dial: '61', nameAr: 'أستراليا', nameEn: 'Australia' },
];

export function callingCodeFor(code: string | null | undefined): CallingCodeOption | undefined {
  if (!code) return undefined;
  return CALLING_CODES.find((c) => c.code === code.toUpperCase());
}
