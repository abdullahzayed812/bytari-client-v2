/**
 * DEVELOPMENT ONLY — pre-fills the "Add Organization" / registration forms so
 * testing doesn't require retyping the same values every time. `__DEV__` is
 * statically replaced with `false` in release builds, so this whole module is
 * dead-code-eliminated and never ships.
 */
import type { CreateOrganizationFormValues, RegistrationFormValues } from '../validation/schemas';

export function devOrganizationDefaults(): Partial<CreateOrganizationFormValues> {
  return {
    name: 'العيادة البيطرية الحديثة',
    description: 'نقدم خدمات الفحص والعلاج والتطعيم لجميع أنواع الحيوانات الأليفة والمزارع.',
  };
}

/** "تسجيل العيادة" / "تسجيل المكتب" — one realistic sample profile per org type. */
export function devRegistrationDefaults(isClinic: boolean): Partial<RegistrationFormValues> {
  if (isClinic) {
    return {
      name: 'عيادة الرحمة البيطرية',
      description: 'نقدم خدمات الفحص والعلاج والتطعيم لجميع أنواع الحيوانات الأليفة.',
      address: 'شارع الجامعة، حي المنصور، بغداد',
      country: 'العراق',
      phone: '07701234567',
      email: 'info@rahma-clinic.test',
      workingHours: 'السبت - الخميس: 8:00 ص - 6:00 م',
      services: 'جراحة، أشعة، تطعيمات',
      websiteUrl: 'https://rahma-clinic.example.com',
      facebookUrl: 'https://facebook.com/rahmaclinic',
      instagramUrl: 'https://instagram.com/rahmaclinic',
      whatsapp: '07701234567',
      licenseNumber: 'CL-2026-00123',
    };
  }
  return {
    name: 'مكتب النور البيطري',
    description: 'مكتب بيطري متخصص في بيع المستلزمات والأدوية البيطرية.',
    address: 'شارع الرشيد، الكرادة، بغداد',
    country: 'العراق',
    phone: '07709876543',
    email: 'info@alnoor-office.test',
    workingHours: 'السبت - الخميس: 9:00 ص - 5:00 م',
    websiteUrl: 'https://alnoor-office.example.com',
    facebookUrl: 'https://facebook.com/alnooroffice',
    instagramUrl: 'https://instagram.com/alnooroffice',
    whatsapp: '07709876543',
    licenseNumber: 'OF-2026-00456',
  };
}
