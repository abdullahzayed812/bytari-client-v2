import type { KuNamespace } from './types';

// Reader-facing copy only; the content-admin screens (`admin.*`) keep the
// Arabic fallback, like the rest of the administration.
const content: KuNamespace<'content'> = {
  common: {
    loadingMore: 'بار دەکرێت…',
    delete: 'سڕینەوە',
  },
  type: {
    ARTICLE: 'وتار',
    BOOK: 'کتێب',
    MAGAZINE: 'گۆڤار',
  },
  home: {
    title: 'زانیاری',
    browse: {
      ARTICLE: 'وتارەکان',
      BOOK: 'کتێبەکان',
      MAGAZINE: 'گۆڤارەکان',
    },
    latestLabel: 'نوێترین ناوەڕۆک',
    resultsLabel: 'ئەنجامەکان',
  },
  list: {
    title: {
      ARTICLE: 'وتارەکان',
      BOOK: 'کتێبەکان',
      MAGAZINE: 'گۆڤارەکان',
    },
    empty: {
      ARTICLE: 'لە ئێستادا هیچ وتارێک بەردەست نییە',
      BOOK: 'لە ئێستادا هیچ کتێبێک بەردەست نییە',
      MAGAZINE: 'لە ئێستادا هیچ گۆڤارێک بەردەست نییە',
    },
    emptyAll: 'لە ئێستادا هیچ ناوەڕۆکێک بەردەست نییە',
    emptyFiltered: 'هیچ ئەنجامێک نییە',
    emptyFilteredHint: 'وشەی گەڕان یان پۆلەکە بگۆڕە.',
    emptyHint: 'ئەو ناوەڕۆکەی تیمی ناوەڕۆک بڵاوی دەکاتەوە لێرە دەردەکەوێت.',
    count: '{{count}} بڕگە',
  },
  search: {
    placeholder: 'گەڕان لە ناوەڕۆکدا…',
    empty: 'هیچ ئەنجامێک نییە',
  },
  filters: {
    allTypes: 'هەموو جۆرەکان',
    allCategories: 'هەموو پۆلەکان',
  },
  card: {
    openLabel: 'کردنەوەی {{title}}',
    by: 'نووسینی {{author}}',
  },
  detail: {
    title: 'وردەکاری ناوەڕۆک',
    notFoundTitle: 'ناوەڕۆکەکە بەردەست نییە',
    notFoundBody:
      'لەوانەیە ئەم ناوەڕۆکە بڵاو نەکرابێتەوە، یان ئەرشیف یان سڕابێتەوە، یان ناسنامەکەی هەڵە بێت.',
    backToContent: 'گەڕانەوە بۆ زانیاری',
    coverAlt: 'بەرگی {{title}}',
    publishedOn: 'لە {{date}} بڵاو کرایەوە',
    filesTitle: 'فایلەکان',
    noContent: 'هیچ دەق یان فایلێک بۆ پیشاندان لەم بڕگەیەدا نییە.',
    linksTitle: 'ئەو بەستەرانەی لە دەقەکەدا هاتوون',
    openLink: 'کردنەوەی بەستەری {{url}}',
    linkOpenFailed: 'نەتوانرا بەستەرەکە بکرێتەوە.',
  },
  file: {
    title: 'فایلی ناوەڕۆک',
    openLabel: 'کردنەوەی {{name}}',
    notPreviewable: 'ناتوانرێت لە ناو ئەپەکەدا پیشان بدرێت',
    notFoundTitle: 'فایلەکە بەردەست نییە',
    notFoundBody:
      'لەوانەیە ئەم فایلە سڕابێتەوە، یان سەر بەم ناوەڕۆکە نەبێت، یان ناوەڕۆکەکە بڵاو نەکرابێتەوە.',
    viewableHint: 'ئەم فایلە لە پیشاندەری سیستەمدا دەکرێتەوە (وێبگەڕ یان خوێنەری PDF).',
    notViewableHint:
      'ئەم شێوازە ناتوانرێت لە ناو ئەپەکەدا پیشان بدرێت؛ دەتوانیت لە ئەپێکی دەرەکیدا بیکەیتەوە.',
    expiryHint: 'بەستەری کردنەوە کاتییە و تەنها بۆ چەند خولەکێک کار دەکات.',
    openCta: 'کردنەوەی فایل',
    openExternalCta: 'کردنەوە لە ئەپێکی دەرەکی',
    openFailed: 'نەتوانرا فایلەکە بکرێتەوە.',
  },
  errors: {
    notFound: 'ناوەڕۆکی داواکراو بوونی نییە.',
    forbidden: 'مۆڵەتی دەستگەیشتنت بەم ناوەڕۆکە نییە.',
  },
};

export default content;
