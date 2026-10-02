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
  accessStatus: {
    ACTIVE: 'دەستگەیشتنی چالاک',
    REVOKED: 'دەستگەیشتن هەڵوەشێنرایەوە',
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
    grantCta: 'بەستنەوەی ئاژەڵ',
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
    fieldAccessStatus: 'دۆخی دەستگەیشتن',
    fieldGrantedAt: 'بەرواری بەستنەوە',
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
    revoke: 'هەڵوەشاندنەوەی دەستگەیشتنی دامەزراوە',
    revokeConfirmTitle: 'هەڵوەشاندنەوەی دەستگەیشتنی دامەزراوە',
    revokeConfirmBody:
      'دامەزراوەکە مۆڵەتی دەستگەیشتن بەم ئاژەڵە لەدەست دەدات. تۆماری پزیشکی ناسڕدرێتەوە، و دواتر دەتوانرێت دووبارە دەستگەیشتن بدرێت.',
    revokeSuccess: 'دەستگەیشتنی دامەزراوە بە ئاژەڵەکە هەڵوەشێنرایەوە.',
  },
  grant: {
    title: 'بەستنەوەی ئاژەڵ بە دامەزراوەوە',
    animalIdLabel: 'ناسنامەی ئاژەڵ',
    animalIdPlaceholder: 'نموونە: 3fa85f64-5717-4562-b3fc-2c963f66afa6',
    animalIdHint: 'هێشتا گەڕان بە ناو یان ناسنامە نییە؛ ناسنامەی ئاژەڵ (UUID) بەکاربهێنە.',
    ownershipNote:
      'ئەمە تەنها دەستگەیشتنی ڤێتێرنەری دەدات بە دامەزراوەکە، و خاوەندارێتی ئاژەڵەکە ناگوازێتەوە.',
    cta: 'بەستنەوەی ئاژەڵ',
    success: 'ئاژەڵەکە بە دامەزراوەکەوە بەسترایەوە.',
    errors: {
      animalIdInvalid: 'ناسنامەیەکی دروستی ئاژەڵ (UUID) بنووسە.',
      notClinic: 'دەستگەیشتنی ڤێتێرنەری تەنها بۆ دامەزراوەکانی کلینیک بەردەستە.',
      animalNotFound: 'هیچ ئاژەڵێک بەم ناسنامەیە نەدۆزرایەوە.',
      alreadyLinked: 'ئەم ئاژەڵە پێشتر بە دامەزراوەکەوە بەستراوەتەوە.',
    },
  },
};

export default orgAnimals;
