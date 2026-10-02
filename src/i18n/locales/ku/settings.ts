import type { KuNamespace } from './types';

const settings: KuNamespace<'settings'> = {
  title: 'ڕێکخستنەکان',
  comingSoon: 'ئەم بەشە لە ئێستادا بەردەست نییە.',
  notificationsError: 'نەتوانرا ڕێکخستنەکانی ئاگادارکردنەوە باربکرێت.',
  cancel: 'هەڵوەشاندنەوە',
  signOut: 'چوونەدەرەوە',
  signOutConfirmTitle: 'چوونەدەرەوە؟',
  signOutConfirmBody: 'دانیشتنەکەت لەسەر ئەم ئامێرە کۆتایی پێدێت.',
  rows: {
    language: 'زمان',
    notifications: 'ئاگادارکردنەوەکان',
    privacy: 'تایبەتمەندی و ئاسایش',
    changePassword: 'گۆڕینی وشەی نهێنی',
    appearance: 'ڕووکاری ئەپ',
    help: 'یارمەتی',
    about: 'دەربارەی ئەپ',
  },
  appearance: {
    light: 'ڕووناک',
    dark: 'تاریک',
    system: 'بەپێی سیستەم',
  },
  about: {
    title: 'دەربارەی ئەپ',
    version: 'وەشان',
    description:
      'ئەپی بیتەری بۆ چاودێریی ئاژەڵەکانت: حیجزکردنی ژوانی کلینیک، تۆماری پزیشکی، فرۆشگا، و پەیوەندی لەگەڵ تیمی پشتگیری.',
  },
};

export default settings;
