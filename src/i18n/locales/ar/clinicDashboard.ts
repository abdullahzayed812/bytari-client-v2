/**
 * Clinic Dashboard (لوحة العيادة). Structurally mirrored by `en/index.ts`
 * (`clinicDashboard`).
 */
const clinicDashboard = {
  title: 'لوحة العيادة',
  loading: 'جاري تحميل بيانات العيادة...',
  notAvailableTitle: 'لوحة العيادة غير متاحة',
  notAvailableBody: 'لا تملك صلاحية الوصول إلى لوحة هذه العيادة.',
  backToList: 'العودة إلى مؤسساتي',
  inactiveTitle: 'العيادة غير نشطة',
  inactiveBody: 'بعض العمليات غير متاحة حتى تصبح العيادة نشطة.',
  expiredTitle: 'انتهى اشتراك العيادة',
  expiredBody:
    'لن تظهر العيادة لأصحاب الحيوانات ولا يمكن إرسال رسائل للمتابعين حتى يتم تجديد الاشتراك.',
  renewCta: 'طلب تجديد الاشتراك',
  stats: {
    activeAnimals: 'الحيوانات',
    followers: 'المتابعون',
    rating: 'التقييم',
  },
  search: {
    placeholder: 'ابحث عن حيوان بالاسم…',
  },
  today: {
    title: 'إحصائيات اليوم',
    medicalRecords: 'سجلات اليوم',
    vaccinationsDue: 'تطعيمات اليوم',
    appointments: 'مواعيد اليوم',
    visitors: 'المراجعون اليوم',
    pendingRequests: 'طلبات بانتظار الرد',
  },
  recent: {
    title: 'الحيوانات الأخيرة',
    viewAll: 'عرض الكل',
    empty: 'لا توجد حيوانات مرتبطة بالعيادة بعد',
    emptyHint: 'اربط حيواناً بالعيادة لبدء متابعته وتسجيل سجلاته الطبية.',
  },
  quick: {
    title: 'الوصول السريع',
    animals: 'جميع الحيوانات',
    linkAnimal: 'ربط حيوان',
    appointments: 'المواعيد',
    conversations: 'المحادثات',
    broadcast: 'إرسال رسالة للمتابعين',
    pendingBadge: '{{count}} طلب بانتظار الرد',
    unreadBadge: '{{count}} رسالة غير مقروءة',
  },
  settings: {
    title: 'الإعدادات السريعة',
    members: 'إدارة المستخدمين والأطباء',
    veterinarians: 'الأطباء',
    supervisors: 'المشرفون',
    editProfile: 'إعدادات العيادة',
    profile: 'ملف العيادة',
    reviews: 'التقييمات والمراجعات',
  },
  noManageAccess: 'لا تملك صلاحيات إدارة إضافية في هذه العيادة.',
};

export default clinicDashboard;
