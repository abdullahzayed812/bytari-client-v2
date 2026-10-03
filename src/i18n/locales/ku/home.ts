import type { KuNamespace } from './types';

const home: KuNamespace<'home'> = {
  header: {
    searchA11y: 'گەڕان',
    switchToVetA11y: 'گۆڕین بۆ دۆخی پزیشکی ڤێتێرنەری',
    becomeVetA11y: 'داواکاری بۆ ئەوەی ببیت بە پزیشکی ڤێتێرنەریی پەسەندکراو',
  },
  search: {
    title: 'گەڕان',
    placeholder: 'بگەڕێ بۆ کتێب، بەرهەم، کلینیک، نووسینگە، کێڵگە، خزمەتگوزاری…',
    hint: 'لانیکەم دوو پیت بنووسە بۆ گەڕان لە ئەپەکەدا.',
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
