import type { KuNamespace } from './types';

const contact: KuNamespace<'contact'> = {
  title: 'پەیوەندیمان پێوە بکە',
  hero: {
    title: 'ئەگەر هەر پرسیار یان سکاڵا یان پێشنیارێکت هەیە، بێ دوودڵی پەیوەندیمان پێوە بکە',
    subtitle: 'ئێمە هەمیشە لێرەین بۆ خزمەتکردن و یارمەتیدانتان',
  },
  info: {
    title: 'زانیارییەکانی پەیوەندی',
    email: 'ئیمەیڵ',
    phone: 'تەلەفۆن',
    whatsapp: 'واتسئاپ',
    address: 'ناونیشان',
  },
  types: {
    title: 'جۆرەکانی پشتگیریی بەردەست',
    technical: {
      title: 'پشتگیریی تەکنیکی',
      subtitle: 'یارمەتی لە بەکارهێنانی ئەپ و کێشە تەکنیکییەکان',
    },
    general: {
      title: 'پرسیارە گشتییەکان',
      subtitle: 'پرسیار دەربارەی خزمەتگوزاری و تایبەتمەندییە بەردەستەکان',
    },
    complaints: {
      title: 'سکاڵا و پێشنیارەکان',
      subtitle: 'پێشوازی لە تێبینییەکانتان دەکەین بۆ باشترکردنی خزمەتگوزارییەکانمان',
    },
  },
  form: {
    title: 'نامەیەک بنێرە',
    signInRequired: 'بۆ ناردنی نامە دەبێت بچیتە ژوورەوە.',
    nameLabel: 'ناو',
    emailLabel: 'ئیمەیڵ',
    messageLabel: 'نامەکەت',
    messagePlaceholder: 'نامەکەت...',
    messageRequired: 'تکایە نامەکەت بنووسە.',
    submit: 'ناردنی نامە',
    success: 'نامەکەت نێردرا بۆ بەڕێوەبەرایەتی.',
    note: 'نامەکەت دەگاتە تیمی پشتگیری و وەڵامت لێرە دەدرێتەوە.',
  },
};

export default contact;
