import type { KuNamespace } from './types';

const veterinaryOfficeDashboard: KuNamespace<'veterinaryOfficeDashboard'> = {
  tabBar: {
    home: 'سەرەکی',
    profile: 'پرۆفایل',
    notifications: 'ئاگادارکردنەوەکان',
    orders: 'داواکارییەکان',
    reports: 'ڕاپۆرتەکان',
  },
  status: {
    pendingTitle: 'لە ژێر پێداچوونەوەدا',
    pendingBody:
      'ئەم نووسینگەیە چاوەڕێی پەسەندکردنی تیمی بەڕێوەبەرایەتییە پێش ئەوەی چالاک ببێت. تا پەسەند نەکرێت ناتوانیت هیچ کردارێک لە داشبۆردەکەدا ئەنجام بدەیت.',
    rejectedTitle: 'داواکاری تۆمارکردن ڕەت کرایەوە',
    suspendedTitle: 'نووسینگەکە ڕاگیراوە',
    suspendedBody:
      'ئەم نووسینگەیە لە لایەن بەڕێوەبەرایەتییەوە ڕاگیراوە. لە ئێستادا ناتوانیت هیچ کردارێک ئەنجام بدەیت.',
    deactivatedTitle: 'نووسینگەکە ناچالاکە',
    deactivatedBody: 'ئەم نووسینگەیە ناچالاک کراوە و ناتوانرێت هیچ کردارێکی لەسەر ئەنجام بدرێت.',
    activeTitle: 'چالاک',
    subscriptionActiveUntil: 'بەشداریکردن تا ئەم بەروارە کارپێکراوە: {{date}}',
    subscriptionExpiredTitle: 'بەشداریکردن کۆتایی هات',
    subscriptionRenewalPending:
      'داواکاری نوێکردنەوەی بەشداریکردن نێردرا و لە لایەن بەڕێوەبەرایەتییەوە لە ژێر پێداچوونەوەدایە.',
    subscriptionRenewalCta:
      'بەشداریکردنەکەت کۆتایی هات. تا بەشداریکردنەکە نوێ نەکەیتەوە ناتوانیت بەرهەمەکان بەڕێوە ببەیت یان نامە بۆ شوێنکەوتووان بنێریت.',
    requestRenewal: 'داواکاری نوێکردنەوەی بەشداریکردن',
    notStartedTitle: 'بەشداریکردن هێشتا دەستی پێنەکردووە',
    notStartedBody:
      'چاوەڕێی ئەوەیە بەڕێوەبەرایەتی ماوەی بەشداریکردنەکەت دیاری بکات. تا ئەو کاتە ناتوانیت هیچ کردارێک لە داشبۆردەکەدا ئەنجام بدەیت.',
    actionsDisabledNotice:
      'لە ئێستادا ناتوانیت ئەم کردارە ئەنجام بدەیت — دۆخی نووسینگەکە لە پەڕەی سەرەکی داشبۆردەکەدا ببینە.',
  },
  home: {
    followersCount: 'ژمارەی شوێنکەوتووان',
    productsLabel: 'بەرهەمەکان',
    ratingLabel: 'هەڵسەنگاندن',
    searchPlaceholder: 'گەڕان بۆ بەرهەمێک...',
    addProductCta: 'زیادکردنی بەرهەم',
    productsTitle: 'بەرهەمەکان',
    viewAll: 'بینینی هەموو',
    emptyProducts: 'هێشتا هیچ بەرهەمێک نییە',
    emptyProductsHint: 'یەکەم بەرهەم زیاد بکە بۆ ئەوەی لێرە دەربکەوێت.',
    quickActionsTitle: 'کردارە خێراکان',
    settingsCta: 'ڕێکخستنەکان',
    hiddenProductsCta: 'بەرهەمە شاردراوەکان',
    conversationsCta: 'گفتوگۆکان',
    sendMessageCta: 'ناردنی نامە بۆ شوێنکەوتووان',
    membersCta: 'ئەندامان',
    supervisorsCta: 'سەرپەرشتیاران',
    unreadMessages: '{{count}} نامەی نەخوێندراوە',
    lockedTitle: 'داشبۆرد داخراوە',
    lockedBody:
      'بەشداریکردنی نووسینگەکە بەسەرچووە. تا نوێکردنەوە بەرهەمەکان نابینرێن و بەڕێوە نابرێن.',
  },
  products: {
    title: 'بینینی هەموو بەرهەمەکان',
    searchPlaceholder: 'گەڕان بۆ بەرهەمێک...',
    count: '{{count}} بەرهەم',
    empty: 'هێشتا هیچ بەرهەمێک نییە',
    emptyFiltered: 'هیچ ئەنجامێکی گونجاو بۆ گەڕانەکەت نییە',
    loadingMore: 'زیاتر بار دەکرێت…',
    hideSuccess: 'بەرهەمەکە شاردرایەوە.',
    deleteSuccess: 'بەرهەمەکە سڕایەوە.',
    deleteConfirmTitle: 'سڕینەوەی بەرهەم',
    deleteConfirmBody: 'بەرهەمەکە لە فرۆشگاکە دەسڕدرێتەوە و لە نێو بەرهەمە چالاکەکاندا دەرناکەوێت.',
    deleteConfirmCta: 'سڕینەوەی بەرهەم',
    cancel: 'هەڵوەشاندنەوە',
  },
  hiddenProducts: {
    title: 'بەرهەمە شاردراوەکان',
    searchPlaceholder: 'گەڕان بۆ بەرهەمێکی شاردراو...',
    count: '{{count}} بەرهەمی شاردراو',
    empty: 'هیچ بەرهەمێکی شاردراو نییە',
    emptyHint: 'ئەو بەرهەمانەی دەیانشاریتەوە لێرە دەردەکەون.',
    showSuccess: 'بەرهەمەکە پیشان درا.',
  },
  card: {
    inStock: 'لە کۆگادا بەردەستە',
    outOfStock: 'بەردەست نییە',
    delete: 'سڕینەوە',
    hide: 'شاردنەوە',
    show: 'پیشاندان',
    edit: 'دەستکاری',
    hiddenBadge: 'شاردراوە',
  },
  broadcast: {
    title: 'ناردنی نامە بۆ شوێنکەوتووان',
    followersLabel: 'شوێنکەوتوو',
    intro:
      'دەتوانیت یەک نامە بۆ هەموو شوێنکەوتووانت بنێریت بۆ ئاگادارکردنەوەیان لە پێشنیار یان هەواڵە نوێیەکان.',
    sent: 'نامەکە نێردرا.',
    form: {
      titleLabel: 'ناونیشانی نامە',
      titlePlaceholder: 'نموونە: پێشنیارێکی تایبەت بۆ ماوەیەکی سنووردار...',
      bodyLabel: 'دەقی نامە',
      bodyPlaceholder: 'نامەکەت لێرە بنووسە...',
      imageLabel: 'هاوپێچکردنی وێنە یان ڕیکلام (ئارەزوومەندانە)',
      imageHint: 'دەتوانیت یەک وێنە بە شێوازی JPG یان PNG هاوپێچ بکەیت',
      linkLabel: 'بەستەر (ئارەزوومەندانە)',
      submit: 'ناردنی نامە',
    },
    errors: {
      title: 'ناونیشانی نامە پێویستە.',
      body: 'دەقی نامە پێویستە.',
      link: 'بەستەرێکی دروست بنووسە کە بە http:// یان https:// دەست پێ بکات',
    },
  },
  conversations: {
    title: 'گفتوگۆکان',
    searchPlaceholder: 'گەڕان لە گفتوگۆکاندا...',
    filterAll: 'هەموو',
    filterUnread: 'نەخوێنراوەکان',
    empty: 'هێشتا هیچ گفتوگۆیەک نییە',
    emptyHint: 'گفتوگۆکانت لەگەڵ خاوەن ئاژەڵان لێرە دەردەکەون.',
  },
  orders: {
    title: 'داواکارییەکان',
    comingSoonTitle: 'ئەم تایبەتمەندییە بەم زووانە بەردەست دەبێت',
    comingSoonBody: 'بەڕێوەبردنی داواکارییەکان لە ناو ئەپەکەدا لە ئێستادا لە ژێر گەشەپێداندایە.',
  },
  reports: {
    title: 'ڕاپۆرتەکان',
    comingSoonTitle: 'ئەم تایبەتمەندییە بەم زووانە بەردەست دەبێت',
    comingSoonBody: 'ڕاپۆرتە وردەکانی نووسینگە لە ئێستادا لە ژێر گەشەپێداندان.',
  },
};

export default veterinaryOfficeDashboard;
