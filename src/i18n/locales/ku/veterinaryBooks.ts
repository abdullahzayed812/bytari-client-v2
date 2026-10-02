import type { KuNamespace } from './types';

const veterinaryBooks: KuNamespace<'veterinaryBooks'> = {
  home: {
    title: 'کتێبە ڤێتێرنەرییەکان',
    subtitle: 'سەرچاوە و کتێبی ڤێتێرنەریی پسپۆڕانە',
    viewAll: 'بینینی هەموو',
    all: 'هەموو کتێبەکان',
    mostRead: 'زۆرترین خوێنراو',
    favorites: 'دڵخوازەکان',
    favoritesChip: 'دڵخوازەکان',
    emptyAll: 'هێشتا هیچ کتێبێک نییە',
    emptyMostRead: 'هێشتا هیچ کتێبێک نییە',
    emptyFavorites: 'هێشتا هیچ کتێبێکت بۆ دڵخوازەکان زیاد نەکردووە',
  },
  search: {
    placeholder: 'گەڕان لە کتێبەکاندا...',
    empty: 'هیچ ئەنجامێکی گونجاو نییە',
  },
  category: {
    title: 'کتێبەکانی {{name}}',
    subtitle: 'کتێب لە بواری {{name}}',
    searchPlaceholder: 'گەڕان لەم بەشەدا...',
    resultsCount: 'کتێبەکان ({{count}})',
    empty: 'هێشتا هیچ کتێبێک نییە',
    emptySearch: 'هیچ ئەنجامێکی گونجاو نییە',
  },
  sort: {
    latest: 'نوێترین',
    mostRead: 'زۆرترین خوێنراو',
    topRated: 'بەرزترین هەڵسەنگاندن',
  },
  common: {
    loadingMore: 'زیاتر بار دەکرێت…',
  },
  card: {
    favoriteA11y: 'زیادکردن بۆ دڵخوازەکان',
    unfavoriteA11y: 'لابردن لە دڵخوازەکان',
  },
  detail: {
    title: 'کتێب',
    notFoundTitle: 'کتێبەکە بەردەست نییە',
    notFoundBody: 'ئەم کتێبە لە ئێستادا بەردەست نییە.',
    backToList: 'گەڕانەوە بۆ کتێبەکان',
    favoriteA11y: 'زیادکردنی کتێب بۆ دڵخوازەکان',
    shareA11y: 'هاوبەشکردنی کتێب',
    noRatings: 'هێشتا هیچ هەڵسەنگاندنێک نییە',
    aboutTitle: 'دەربارەی کتێب',
    infoTitle: 'زانیاری کتێب',
    author: 'نووسەر',
    category: 'پۆل',
    language: 'زمان',
    pageCount: 'ژمارەی لاپەڕەکان',
    publishYear: 'ساڵی بڵاوکردنەوە',
    rateTitle: 'ئەم کتێبە هەڵبسەنگێنە',
    rateA11y: 'هەڵسەنگاندنی کتێب',
    yourRating: 'هەڵسەنگاندنەکەت: {{value}}',
    interactionTitle: 'کارلێک لەگەڵ کتێب',
    readCta: 'خوێندنەوە',
    downloadCta: 'داگرتن',
    likeA11y: 'بەدڵبوونی کتێب',
    commentsTitle: 'لێدوانەکان ({{count}})',
    commentPlaceholder: 'لێدوانێک بنووسە...',
    sendComment: 'ناردنی لێدوان',
    moreComments: 'و بینینی {{count}} لێدوانی تر',
  },
};

export default veterinaryBooks;
