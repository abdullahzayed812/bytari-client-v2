/**
 * DEVELOPMENT ONLY — pre-fills the medical-record / vaccination forms so
 * testing doesn't require retyping the same values every time. `__DEV__` is
 * statically replaced with `false` in release builds, so this whole module is
 * dead-code-eliminated and never ships.
 */
import type { MedicalRecordFormValues, VaccinationFormValues } from '../validation/schemas';

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function devMedicalRecordDefaults(): Partial<MedicalRecordFormValues> {
  return {
    visitDate: isoDaysFromNow(0),
    reason: 'فحص دوري وتقييم الحالة الصحية العامة',
    diagnosis: 'التهاب بسيط في الجهاز التنفسي العلوي',
    treatment: 'مضاد حيوي لمدة 5 أيام مع فيتامينات مقوية للمناعة',
    notes: 'الحيوان بحالة مستقرة، يُنصح بالمتابعة خلال أسبوعين',
  };
}

export function devVaccinationDefaults(): Partial<VaccinationFormValues> {
  return {
    vaccineName: 'لقاح داسك الرباعي',
    administeredOn: isoDaysFromNow(0),
    nextDueOn: isoDaysFromNow(365),
    notes: 'تم إعطاء اللقاح دون أي ردة فعل تحسسية',
  };
}
