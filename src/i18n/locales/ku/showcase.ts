import type { KuNamespace } from './types';

const showcase: KuNamespace<'showcase'> = {
  title: 'سیستەمی دیزاین',
  subtitle: 'شاشەیەکی ناوخۆیی گەشەپێدان بۆ پشکنینی بینراو — تایبەتمەندییەکی بەرهەم نییە.',
  sections: {
    typography: 'نووسین',
    colors: 'ڕەنگەکان',
    buttons: 'دوگمەکان',
    inputs: 'خانەکان',
    cards: 'کارتەکان',
    badges: 'نیشانەکان',
    avatars: 'وێنە هێماییەکان',
    banners: 'بانەرەکان',
    feedback: 'دۆخەکانی ڕووکار',
    overlays: 'پەنجەرە دەرکەوتووەکان',
  },
  sample: {
    paragraph:
      'چاودێریی ڤێتێرنەریی هاوچەرخ بە بەدواداچوونی وردی تەندروستیی ئاژەڵەکەت و پەیوەندیی ڕاستەوخۆ لەگەڵ پزیشکانی پەسەندکراو دەست پێدەکات.',
    buttonPrimary: 'حیجزکردنی ژوان',
    buttonSecondary: 'پیشاندانی وردەکاری',
    inputLabel: 'ناوی ئاژەڵ',
    inputPlaceholder: 'نموونە: لولو',
    bannerTitle: 'ڕاوێژی ڤێتێرنەریی خێرا',
    bannerBody: 'لە ماوەی چەند خولەکێکدا لەگەڵ پزیشکێکی ڤێتێرنەریی پەسەندکراو قسە بکە.',
    emptyTitle: 'هیچ بڕگەیەک نییە',
    errorTitle: 'نەتوانرا زانیارییەکان باربکرێن',
    openModal: 'کردنەوەی پەنجەرە',
    openSheet: 'کردنەوەی پانێڵی خوارەوە',
  },
};

export default showcase;
