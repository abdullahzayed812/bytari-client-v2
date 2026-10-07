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
  pendingTitle: 'العيادة قيد المراجعة',
  pendingBody:
    'طلب تسجيل العيادة بانتظار اعتماد الإدارة. لا يمكن لمالك العيادة أو موظفيها استخدام لوحة العيادة حتى تتم الموافقة.',
  openProfile: 'عرض ملف العيادة',
  inactiveTitle: 'العيادة غير نشطة',
  inactiveBody: 'لا يمكن استخدام لوحة العيادة لأن العيادة غير نشطة حالياً.',
  expiredTitle: 'انتهى اشتراك العيادة',
  expiredBody:
    'لا يمكن لمالك العيادة أو موظفيها استخدام لوحة العيادة أو إدارة الحيوانات والسجلات والمواعيد والمحادثات حتى يتم تجديد الاشتراك.',
  renewCta: 'طلب تجديد الاشتراك',
  stats: {
    activeAnimals: 'الحيوانات',
    followers: 'المتابعون',
    rating: 'التقييم',
  },
  search: {
    placeholder: 'رقم المعرف أو اسم الحيوان أو اسم المالك أو هاتفه',
    scan: 'مسح الباركود',
    results: 'نتائج البحث',
    clear: 'مسح البحث',
    noResults: 'لم يتم العثور على نتائج مطابقة',
    linkScanned: 'ربط هذا الحيوان بالعيادة',
    title: 'البحث عن حيوان',
    hint: 'ابحث بالاسم أو السلالة أو رقم المعرف أو اسم المالك أو رقم هاتفه، أو امسح رمز QR من ملف الحيوان.',
    searching: 'جارٍ البحث…',
    resultsCount: '{{count}} نتيجة',
    resultsCount_other: '{{count}} نتيجة',
    noResultsHint: 'جرّب كلمة أخرى أو امسح رمز QR الخاص بالحيوان.',
    inaccessibleTitle: 'الحيوان غير موجود أو لا يمكن الوصول إليه',
    inaccessibleBody:
      'هذا الحيوان ليس من مرضى العيادة. اطلب من مالكه زيارة العيادة أو من مدير العيادة ربطه.',
    inaccessibleLinkBody: 'هذا الحيوان ليس من مرضى العيادة بعد. يمكنك ربطه بالعيادة لفتح ملفه.',
    linkAndOpen: 'ربط الحيوان وفتح ملفه',
    linkFailed: 'تعذّر ربط هذا الحيوان. تأكد من رقم المعرف وحاول مرة أخرى.',
  },
  today: {
    title: 'إحصائيات اليوم',
    medicalRecords: 'سجلات اليوم',
    vaccinationsDue: 'تطعيمات اليوم',
    appointments: 'مواعيد اليوم',
    visitors: 'المراجعون اليوم',
    reminders: 'تذكيرات اليوم',
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
    quickReview: 'مراجعة سريعة',
    fullExam: 'فحص كامل',
    vaccinations: 'التطعيمات',
    reminders: 'التذكيرات',
    broadcastVisitors: 'إرسال رسالة للمراجعين',
    quickReviewSettings: 'إعدادات المراجعة السريعة',
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
