export default {
  appName: 'بيطري',
  tagline: 'منصة الرعاية البيطرية',
  actions: {
    continue: 'متابعة',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ',
    retry: 'إعادة المحاولة',
    close: 'إغلاق',
    back: 'رجوع',
    search: 'بحث',
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    signUp: 'إنشاء حساب',
  },
  states: {
    loading: 'جارٍ التحميل…',
    empty: 'لا يوجد شيء لعرضه',
    emptyHint: 'سيظهر المحتوى هنا عند توفره.',
    offline: 'لا يوجد اتصال بالإنترنت',
    offlineHint: 'تحقق من اتصالك ثم أعد المحاولة.',
  },
  mode: {
    owner: 'وضع صاحب الحيوان',
    veterinarian: 'وضع الطبيب البيطري',
    switchTo: 'التبديل إلى {{mode}}',
  },
  greeting: {
    hello: 'أهلاً بك',
    welcome: 'مرحباً بك في بيطري',
  },
};
