import type { KuNamespace } from './types';

const home: KuNamespace<'home'> = {
  header: {
    searchA11y: 'گەڕان',
    switchToVetA11y: 'گۆڕین بۆ دۆخی پزیشکی ڤێتێرنەری',
    becomeVetA11y: 'داواکاری بۆ ئەوەی ببیت بە پزیشکی ڤێتێرنەریی پەسەندکراو',
  },
  ads: {
    a11y: 'ڕیکلام: {{title}}',
  },
  categories: {
    title: 'بەشەکان',
    pets: {
      title: 'ئاژەڵە ماڵییەکان',
      subtitle: 'فایلەکان، بەدواداچوون',
    },
    livestock: {
      title: 'مەڕ و مانگا',
      subtitle: 'فایلەکان، بەدواداچوون',
    },
    poultry: {
      title: 'پەلەوەر و باڵندە',
      subtitle: 'ئامۆژگاری و خزمەتگوزارییەکان',
    },
    comingSoon: 'ئەم بەشە لە ئێستادا لە ژێر گەشەپێداندایە.',
  },
};

export default home;
