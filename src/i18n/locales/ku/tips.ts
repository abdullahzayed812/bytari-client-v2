import type { KuNamespace } from './types';

const tips: KuNamespace<'tips'> = {
  card: {
    open: 'کردنەوەی {{title}}',
  },
  priority: {
    IMPORTANT: 'گرنگ',
    RECOMMENDED: 'پێشنیارکراو',
    NORMAL: 'گشتی',
  },
  meta: {
    minutes: '{{count}} خولەک',
    quickRead: 'خوێندنەوەی خێرا',
  },
  actions: {
    save: 'پاشەکەوتکردن',
    saved: 'پاشەکەوتکراوە',
    saveA11y: 'پاشەکەوتکردنی ئامۆژگاری',
    unsaveA11y: 'لابردنی پاشەکەوت',
    helpful: 'بەسوود',
    helpfulWithCount: 'بەسوود · {{count}}',
  },
  featured: {
    section: 'ئامۆژگاریی ئەمڕۆ',
    badge: 'ئامۆژگاریی ئەمڕۆ',
    cta: 'ئامۆژگارییەکە بخوێنەرەوە',
  },
  list: {
    title: 'باشترین ئامۆژگارییەکان',
    section: 'گرنگترین ئامۆژگارییەکان',
    searchPlaceholder: 'گەڕان بەدوای ئامۆژگارییەکدا…',
    empty: 'هێشتا هیچ ئامۆژگارییەک نییە',
    emptyHint: 'ناوەڕۆکی بڵاوکراوەی تیمی ناوەڕۆک لێرە دەردەکەوێت.',
    emptySearch: 'هیچ ئەنجامێک نییە',
    emptySearchHint: 'وشەی گەڕانەکە بگۆڕە.',
    loadingMore: 'بارکردن…',
  },
  detail: {
    title: 'وردەکاریی ئامۆژگاری',
    loading: 'بارکردن…',
    notFoundTitle: 'ئامۆژگارییەکە بەردەست نییە',
    notFoundBody: 'لەوانەیە ئەم ئامۆژگارییە بڵاونەکرابێتەوە، یان ئەرشیف یان سڕابێتەوە.',
    updatedOn: 'نوێکرایەوە لە {{date}}',
    keyPoints: 'خاڵە گرنگەکان',
    whenToWorry: 'کەی نیگەران بیت؟',
    vetAdvice: 'کەی پێویستت بە پزیشکی ڤێتێرنەری هەیە؟',
  },
};

export default tips;
