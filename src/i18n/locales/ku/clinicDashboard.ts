import type { KuNamespace } from './types';

const clinicDashboard: KuNamespace<'clinicDashboard'> = {
  title: 'داشبۆردی کلینیک',
  loading: 'زانیارییەکانی کلینیک بار دەکرێن...',
  notAvailableTitle: 'داشبۆردی کلینیک بەردەست نییە',
  notAvailableBody: 'دەسەڵاتی چوونە ناو داشبۆردی ئەم کلینیکەت نییە.',
  backToList: 'گەڕانەوە بۆ دامەزراوەکانم',
  inactiveTitle: 'کلینیکەکە چالاک نییە',
  inactiveBody: 'هەندێک کردار بەردەست نین تا کلینیکەکە چالاک دەبێت.',
  expiredTitle: 'بەشداریکردنی کلینیک بەسەرچووە',
  expiredBody:
    'تا بەشداریکردن نوێ نەکرێتەوە، نە خاوەنی کلینیک و نە پزیشک و کارمەندانی ناتوانن داشبۆردی کلینیک، ئاژەڵان، تۆمارەکان، چاوپێکەوتنەکان و گفتوگۆکان بەکاربهێنن. تەنها خاوەنی کلینیک دەتوانێت داوای نوێکردنەوە بکات.',
  renewCta: 'داواکردنی نوێکردنەوەی بەشداریکردن',
  contactAdminCta: 'پەیوەندی بە بەڕێوەبەرایەتییەوە',
  stats: {
    activeAnimals: 'ئاژەڵەکان',
    followers: 'شوێنکەوتووان',
    rating: 'هەڵسەنگاندن',
  },
  search: {
    placeholder: 'بە ناو بەدوای ئاژەڵێکدا بگەڕێ…',
  },
  today: {
    title: 'ئامارەکانی ئەمڕۆ',
    medicalRecords: 'تۆمارەکانی ئەمڕۆ',
    vaccinationsDue: 'کوتانەکانی ئەمڕۆ',
    appointments: 'ژوانەکانی ئەمڕۆ',
    visitors: 'سەردانکەرانی ئەمڕۆ',
    pendingRequests: 'چاوەڕێی وەڵام',
  },
  recent: {
    title: 'دوایین ئاژەڵەکان',
    viewAll: 'بینینی هەموو',
  },
  quick: {
    title: 'دەستگەیشتنی خێرا',
    animals: 'هەموو ئاژەڵەکان',
    appointments: 'ژوانەکان',
    conversations: 'گفتوگۆکان',
    broadcast: 'ناردنی نامە بۆ شوێنکەوتووان',
    pendingBadge: '{{count}} داواکاری چاوەڕێی وەڵام',
    unreadBadge: '{{count}} نامەی نەخوێندراو',
  },
  settings: {
    title: 'ڕێکخستنە خێراکان',
    members: 'بەڕێوەبردنی بەکارهێنەران و پزیشکان',
    veterinarians: 'پزیشکان',
    supervisors: 'سەرپەرشتیاران',
    employees: 'کارمەندان',
    followers: 'شوێنکەوتووان',
    editProfile: 'ڕێکخستنەکانی کلینیک',
    profile: 'پرۆفایلی کلینیک',
    reviews: 'هەڵسەنگاندن و پێداچوونەوەکان',
  },
  noManageAccess: 'هیچ دەسەڵاتێکی بەڕێوەبردنی زیاترت لەم کلینیکەدا نییە.',
};

export default clinicDashboard;
