import type { KuNamespace } from './types';

// Shopper-facing copy; store management (`admin.*`) keeps the Arabic fallback.
const veterinarianStore: KuNamespace<'veterinarianStore'> = {
  common: {
    price: '{{value}} د.ع',
    back: 'گەڕانەوە',
    delete: 'سڕینەوە',
    cancel: 'هەڵوەشاندنەوە',
    confirm: 'پشتڕاستکردنەوە',
  },

  home: {
    title: 'فرۆشگای ڤێتێرنەری',
    subtitle: 'بەرهەمی پزیشکیی هەڵبژێردراو بۆ پزیشکە ڤێتێرنەرییەکان',
    searchPlaceholder: 'گەڕان بۆ بەرهەم، مارکەی بازرگانی…',
    shopByAnimal: 'بازاڕکردن بەپێی پۆل',
    picks: 'بەرهەمە هەڵبژێردراوەکان',
    emptyPicks: 'لە ئێستادا هیچ بەرهەمێک بەردەست نییە',
  },

  products: {
    title: 'بەرهەمەکان',
    subtitle: 'لە کۆمەڵە بەرهەمەکانمان بازاڕ بکە',
    searchPlaceholder: 'گەڕان بۆ بەرهەم یان دەرمان…',
    empty: 'هیچ بەرهەمێک نییە',
    emptyHint: 'بەرهەمەکان کاتێک زیاد دەکرێن لێرە دەردەکەون.',
    emptySearch: 'هیچ ئەنجامێک نییە',
    emptySearchHint: 'وشەی گەڕانی جیاواز تاقی بکەرەوە یان پاڵاوتنەکان لاببە.',
    loadingMore: 'زیاتر بار دەکرێت…',
  },

  categories: {
    all: 'هەموو',
    allInSection: 'هەموو {{name}}',
    sectionsOf: 'بەشەکانی {{name}}',
  },

  product: {
    title: 'وردەکاری بەرهەم',
    addToCart: 'زیادکردن بۆ سەبەتە',
    outOfStock: 'بەردەست نییە',
    notFound: 'بەرهەمەکە بەردەست نییە',
    specs: 'تایبەتمەندییەکان',
    inStock: 'بەردەستە ({{count}} لە کۆگادا)',
    ratingCount: '({{count}} هەڵسەنگاندن)',
  },

  cart: {
    title: 'سەبەتەی کڕین',
    open: 'کردنەوەی سەبەتە',
    added: 'بۆ سەبەتە زیاد کرا',
    remove: 'سڕینەوە',
    lowStock: 'بڕی داواکراو بە تەواوی بەردەست نییە',
    empty: 'سەبەتەی کڕین بەتاڵە',
    emptyHint: 'بەرهەم بۆ سەبەتەکەت زیاد بکە بۆ تەواوکردنی داواکاری.',
    browse: 'گەڕان لە فرۆشگا',
    itemCount: '{{count}} بەرهەم',
    clear: 'بەتاڵکردنی سەبەتە',
    deliveryNote: 'کرێی گەیاندن دیاری دەکرێت و لە کاتی وەرگرتندا دەدرێت.',
    checkout: 'تەواوکردنی داواکاری',
  },

  checkout: {
    title: 'تەواوکردنی داواکاری',
    subtitle: 'زانیاری گەیاندن و پارەدان',
    deliveryInfo: 'زانیاری گەیاندن',
    fieldName: 'ناوی تەواو',
    fieldNamePlaceholder: 'د. ئەحمەد محەمەد',
    fieldPhone: 'ژمارەی مۆبایل',
    fieldCity: 'شار',
    fieldCityPlaceholder: 'هەولێر',
    fieldAddress: 'ناونیشانی ورد',
    fieldAddressPlaceholder: 'گەڕەک، شەقام، ژمارەی باڵەخانە…',
    fieldNote: 'تێبینی (ئارەزوومەندانە)',
    fieldNotePlaceholder: 'تێبینییەکانت لێرە بنووسە…',
    paymentMethod: 'شێوازی پارەدان',
    confirm: 'پشتڕاستکردنەوەی داواکاری',
    errors: {
      name: 'تکایە ناوی تەواو بنووسە.',
      phone: 'ژمارەی مۆبایل دروست نییە.',
      city: 'تکایە شار بنووسە.',
      address: 'تکایە ناونیشانێکی ورد بنووسە.',
    },
  },

  payment: {
    title: 'پارەدان',
    comingSoon: 'بەم زووانە',
    method: {
      COD: 'پارەدان لە کاتی وەرگرتن',
      MADA: 'مەدا / ڤیزا',
      CREDIT_CARD: 'کارتی بانکی',
    },
    hint: {
      COD: 'لە کاتی وەرگرتنی داواکارییەکە بە نەختینە پارە بدە',
      MADA: 'بە کارتی مەدا یان ڤیزا پارە بدە',
      CREDIT_CARD: 'بە کارتی بانکی پارە بدە',
    },
  },

  summary: {
    title: 'کورتەی داواکاری',
    subtotal: 'کۆی بەرهەمەکان',
    delivery: 'ناردن',
    deliveryOnDelivery: 'لە کاتی وەرگرتندا دیاری دەکرێت',
    totalExcludesDelivery: 'کۆی گشتی کرێی گەیاندن لەخۆ ناگرێت.',
    total: 'کۆی گشتی',
  },

  order: {
    title: 'وردەکاری داواکاری',
    number: 'ژمارەی داواکاری',
    placedAt: 'دۆخ',
    items: 'بەرهەمەکان',
    status: {
      PENDING: 'لە ژێر پێداچوونەوەدا',
      CONFIRMED: 'پشتڕاستکراوە',
      PROCESSING: 'ئامادە دەکرێت',
      SHIPPED: 'نێردرا',
      DELIVERED: 'گەیەندرا',
      CANCELLED: 'هەڵوەشێنراوە',
    },
  },

  orders: {
    title: 'داواکارییەکانم',
    itemCount: '{{count}} بەرهەم',
    empty: 'هیچ داواکارییەک نییە',
    emptyHint: 'داواکارییەکانت دوای تەواوکردنی یەکەم کڕین لێرە دەردەکەون.',
    loadingMore: 'زیاتر بار دەکرێت…',
  },

  confirmation: {
    title: 'پشتڕاستکردنەوەی داواکاری',
    heading: 'داواکارییەکەت وەرگیرا',
    subtitle: 'پەیوەندیت پێوە دەکەین بۆ پشتڕاستکردنەوەی گەیاندن.',
    keepShopping: 'بەردەوامبوون لە بازاڕکردن',
    viewOrders: 'بینینی داواکارییەکانم',
  },
};

export default veterinarianStore;
