import type { KuNamespace } from './types';

const news: KuNamespace<'news'> = {
  card: {
    open: 'کردنەوەی {{title}}',
  },
  tag: {
    URGENT: 'بەپەلە',
    IMPORTANT_ALERT: 'ئاگاداری گرنگ',
    NORMAL: 'هەواڵ',
  },
  actions: {
    save: 'پاشەکەوتکردنی هەواڵ',
    saved: 'پاشەکەوتکراوە',
    saveA11y: 'پاشەکەوتکردنی هەواڵ',
    unsaveA11y: 'لابردنی پاشەکەوت',
  },
  featured: {
    section: 'هەواڵی دیار',
    badge: 'هەواڵی دیار',
    cta: 'هەواڵەکە بخوێنەرەوە',
  },
  list: {
    title: 'دوایین هەواڵەکان',
    section: 'نوێترین هەواڵەکان',
    searchPlaceholder: 'گەڕان بەدوای هەواڵێکدا…',
    empty: 'هێشتا هیچ هەواڵێک نییە',
    emptyHint: 'هەواڵە بڵاوکراوەکان لێرە دەردەکەون.',
    emptySearch: 'هیچ ئەنجامێک نییە',
    emptySearchHint: 'وشەی گەڕانی جیاواز تاقی بکەرەوە.',
    loadingMore: 'بارکردنی زیاتر…',
  },
  detail: {
    title: 'وردەکاریی هەواڵ',
    loading: 'بارکردن…',
    notFoundTitle: 'هەواڵەکە بەردەست نییە',
    notFoundBody: 'لەوانەیە ئەم هەواڵە بڵاونەکرابێتەوە یان لابرابێت.',
    dateLabel: 'بەروار',
    sourceLabel: 'سەرچاوە',
    categoryLabel: 'پۆلێن',
    reasons: 'هۆکارەکان',
    advice: 'پەروەردەکاران دەبێت چی بکەن؟',
    alert: 'ئاگاداری',
    gallery: 'وێنە هاوپێچکراوەکان',
  },
};

export default news;
