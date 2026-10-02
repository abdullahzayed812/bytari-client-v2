import type { KuNamespace } from './types';

const veterinaryMagazine: KuNamespace<'veterinaryMagazine'> = {
  home: {
    title: 'گۆڤاری ڤێتێرنەری',
    subtitle: 'وتار و ناوەڕۆکی ڤێتێرنەریی پسپۆڕانە',
    viewAll: 'بینینی هەموو',
    latest: 'نوێترین وتارەکان',
    mostRead: 'زۆرترین خوێنراو',
    saved: 'وتارە پاشەکەوتکراوەکان',
    savedChip: 'پاشەکەوتکراوەکان',
    emptyLatest: 'هێشتا هیچ وتارێک نییە',
    emptyMostRead: 'هێشتا هیچ وتارێک نییە',
    emptySaved: 'هێشتا هیچ وتارێکت پاشەکەوت نەکردووە',
  },
  search: {
    placeholder: 'گەڕان لە وتارەکاندا...',
    empty: 'هیچ ئەنجامێکی گونجاو نییە',
  },
  category: {
    title: 'وتارەکانی {{name}}',
    subtitle: 'وتار لە بواری {{name}}',
    searchPlaceholder: 'گەڕان لەم بەشەدا...',
    resultsCount: 'وتارەکان ({{count}})',
    empty: 'هێشتا هیچ وتارێک نییە',
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
    bookmarkA11y: 'پاشەکەوتکردن',
    unbookmarkA11y: 'لابردنی پاشەکەوت',
  },
  detail: {
    title: 'وتار',
    notFoundTitle: 'وتارەکە بەردەست نییە',
    notFoundBody: 'ئەم وتارە لە ئێستادا بەردەست نییە.',
    backToList: 'گەڕانەوە بۆ گۆڤار',
    bookmarkA11y: 'پاشەکەوتکردنی وتار',
    shareA11y: 'هاوبەشکردنی وتار',
    imagesTitle: 'وێنە ڕوونکەرەوەکان',
    interactionTitle: 'کارلێک لەگەڵ وتار',
    likeA11y: 'بەدڵبوونی وتار',
    commentsCountA11y: 'ژمارەی لێدوانەکان',
    commentsTitle: 'لێدوانەکان ({{count}})',
    commentPlaceholder: 'لێدوانێک بنووسە...',
    sendComment: 'ناردنی لێدوان',
    moreComments: 'و بینینی {{count}} لێدوانی تر',
    downloadCta: 'داگرتنی وتار',
  },
};

export default veterinaryMagazine;
