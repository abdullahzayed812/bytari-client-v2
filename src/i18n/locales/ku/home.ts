import type { KuNamespace } from './types';

const home: KuNamespace<'home'> = {
  header: {
    searchA11y: 'گەڕان',
    accountA11y: 'پرۆفایل',
    switchToVetA11y: 'گۆڕین بۆ دۆخی پزیشکی ڤێتێرنەری',
    becomeVetA11y: 'داواکاری بۆ ئەوەی ببیت بە پزیشکی ڤێتێرنەریی پەسەندکراو',
  },
  search: {
    title: 'گەڕان',
    placeholder: 'بگەڕێ بۆ بەرهەم، کلینیک، کێڵگە، خزمەتگوزاری، هەواڵ یان ئامۆژگاری…',
    placeholderVet: 'بگەڕێ بۆ کتێب، گۆڤار، بەرهەم، نووسینگە، خزمەتگوزاری، خول یان کار…',
    hint: 'لانیکەم دوو پیت بنووسە بۆ گەڕان لە ئەپەکەدا.',
    officeProductsCta: 'بگەڕێ بۆ بەرهەم لە هەموو نووسینگەکاندا',
    officeProductsCtaA11y: 'گەڕان بۆ بەرهەم لە هەموو نووسینگە ڤێتێرنەرییەکاندا',
    empty: 'هیچ ئەنجامێک نییە',
    emptyHint: 'وشەیەکی تر تاقی بکەرەوە.',
    count: '{{count}} ئەنجام',
    types: {
      BOOK: 'کتێبەکان',
      MAGAZINE: 'گۆڤارەکان',
      PET_STORE_PRODUCT: 'فرۆشگای خاوەن ئاژەڵان',
      VET_STORE_PRODUCT: 'فرۆشگای پزیشکانی ڤێتێرنەری',
      CLINIC: 'کلینیکەکان',
      VETERINARY_OFFICE: 'نووسینگە ڤێتێرنەرییەکان',
      OFFICE_PRODUCT: 'بەرهەمەکانی نووسینگەکان',
      FARM: 'کێڵگەکانم',
      SERVICE: 'خزمەتگوزارییەکان',
      COURSE: 'خول و سیمینارەکان',
      JOB: 'کارەکان',
      NEWS: 'هەواڵەکان',
      TIP: 'ئامۆژگارییەکان',
    },
  },
  ads: {
    a11y: 'ڕیکلام: {{title}}',
  },
  categories: {
    title: 'بەشەکان',
    pets: {
      title: 'ئاژەڵە ماڵییەکان',
      subtitle: 'فایلەکان، بەدواداچوون',
    },
    livestock: {
      title: 'مەڕ و مانگا',
      subtitle: 'فایلەکان، بەدواداچوون',
    },
    poultry: {
      title: 'پەلەوەر و باڵندە',
      subtitle: 'ئامۆژگاری و خزمەتگوزارییەکان',
    },
    comingSoon: 'ئەم بەشە لە ئێستادا لە ژێر گەشەپێداندایە.',
  },
};

export default home;
