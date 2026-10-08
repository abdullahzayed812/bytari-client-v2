import type { KuNamespace } from './types';

const orgAnimals: KuNamespace<'orgAnimals'> = {
  common: {
    cancel: 'هەڵوەشاندنەوە',
  },
  species: {
    DOG: 'سەگ',
    CAT: 'پشیلە',
    BIRD: 'باڵندە',
    RABBIT: 'کەروێشک',
    REPTILE: 'خشۆکەکان',
    FISH: 'ماسی',
    HORSE: 'ئەسپ',
    OTHER: 'هیتر',
  },
  animalStatus: {
    ACTIVE: 'چالاک',
    DEACTIVATED: 'ئەرشیفکراو',
  },
  card: {
    open: 'کردنەوەی فایلی {{name}}',
  },
  list: {
    title: 'ئاژەڵەکانی دامەزراوە',
    filterPlaceholder: 'پاڵاوتن بە ناو…',
    count: '{{count}} ئاژەڵ',
    empty: 'هیچ ئاژەڵێک بەم دامەزراوەیەوە نەبەستراوەتەوە',
    emptyHint:
      'ئاژەڵێکی هەبوو بە دامەزراوەکەوە ببەستەوە بۆ کارکردن لەسەری. ئەمە کاریگەری لەسەر خاوەندارێتی خاوەنەکەی نییە.',
    noFilterMatch: 'ئاژەڵەکە نەدۆزرایەوە',
    loadingMore: 'بار دەکرێت…',
  },
  detail: {
    title: 'ئاژەڵی دامەزراوە',
    notAvailableTitle: 'ئاژەڵەکە بەردەست نییە',
    notAvailableBody: 'دامەزراوەکەت مۆڵەتی دەستگەیشتنی بەم ئاژەڵە نییە.',
    backToList: 'گەڕانەوە بۆ ئاژەڵەکانی دامەزراوە',
    notFoundTitle: 'ئاژەڵەکە بە دامەزراوەکەوە نەبەستراوەتەوە',
    notFoundBody:
      'لەوانەیە دەستگەیشتنەکە هەڵوەشێنرابێتەوە. ئاژەڵەکە لە لیستی ئاژەڵەکانی دامەزراوەوە بکەرەوە.',
    overview: 'زانیاری ئاژەڵ',
    fieldSpecies: 'جۆر',
    fieldAnimalStatus: 'دۆخی ئاژەڵ',
    fieldsNote:
      'دامەزراوە تەنها ناو و جۆر و دۆخ پیشان دەدات؛ باقی زانیارییەکانی ئاژەڵەکە هاوبەش ناکرێن.',
    ownerSection: 'زانیاری خاوەن',
    ownerHiddenTitle: 'زانیاری خاوەن بەردەست نییە',
    ownerHiddenBody:
      'لەم قۆناغەدا سیستەمەکە ناسنامەی خاوەنی ئاژەڵ لەگەڵ دامەزراوەکان هاوبەش ناکات.',
    medicalSection: 'تۆمارە پزیشکییەکان',
    medicalHistory: 'مێژووی پزیشکیی تەواو',
    medicalRecords: 'تۆماری پزیشکی',
    vaccinations: 'کوتانەکان',
    treatments: 'چارەسەرەکان',
    appointments: 'ژوانەکان',
  },
};

export default orgAnimals;
