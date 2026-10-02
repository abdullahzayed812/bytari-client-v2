import type { KuNamespace } from './types';

// Section names only; ad management (`admin.*`) keeps the Arabic fallback.
const ads: KuNamespace<'ads'> = {
  placements: {
    HOME: 'سەرەکی',
    PETS: 'ئاژەڵە ماڵییەکان',
    POULTRY_FARMS: 'کێڵگەکانی پەلەوەر',
    CLINICS: 'کلینیکەکان',
    VETERINARY_OFFICES: 'نووسینگە ڤێتێرنەرییەکان',
    VETERINARY_STORES: 'فرۆشگا ڤێتێرنەرییەکان',
    PET_OWNER_STORE: 'فرۆشگای خاوەن ئاژەڵان',
    VETERINARIAN_STORE: 'فرۆشگای ڤێتێرنەری',
    CONSULTATIONS: 'ڕاوێژەکان',
    COURSES: 'خولەکان',
    SEMINARS: 'سیمینارەکان',
    POULTRY_MARKET: 'بازاڕی پەلەوەر',
    EGG_MARKET: 'بازاڕی هێلکە',
    EXCHANGE_RATES: 'نرخەکانی بۆرسە',
    TRADER_REGISTRATION: 'تۆمارکردنی بازرگانان',
    SHEEP_FARMS: 'کێڵگەکانی مەڕ',
    CATTLE_FARMS: 'کێڵگەکانی مانگا',
    VETERINARIAN_HOME: 'سەرەکی (پزیشکە ڤێتێرنەرییەکان)',
  },
};

export default ads;
