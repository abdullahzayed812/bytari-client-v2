/**
 * DEVELOPMENT ONLY — pre-fills the "Add Poultry Farm" / "Add Flock" forms so
 * testing doesn't require retyping the same values every time.
 * `__DEV__` is statically replaced with `false` in release builds, so this
 * whole module is dead-code-eliminated and never ships.
 */
import type { CreatePoultryFarmFormValues, PoultryFlockFormValues } from '../validation/schemas';

/** ISO date `daysAgo` days before today — never in the future. */
function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function devPoultryFarmDefaults(): Partial<CreatePoultryFarmFormValues> {
  return {
    name: 'مزرعة النور للدواجن',
    location: 'قضاء أبو غريب - طريق الفلوجة',
    governorate: 'بغداد',
    poultryProductionType: 'BROILER',
    description: 'مزرعة دواجن متخصصة في إنتاج فروج اللحم بمعايير صحية عالية.',
    address: 'قرب الجسر الجديد، محلة 305، بغداد',
    capacity: '5000',
    currentBirdCount: '4200',
    contactName: 'أحمد الجبوري',
    contactPhone: '07701234567',
    contactEmail: 'ahmed.farm@example.test',
  };
}

export function devPoultryFlockDefaults(): Partial<PoultryFlockFormValues> {
  return {
    name: 'دفعة فروج رقم 12',
    birdType: 'CHICKEN',
    birdCount: '5000',
    arrivalDate: isoDaysAgo(10),
    notes: 'دفعة سليمة صحيًا عند الاستلام، تم تطعيمها في المفرخ.',
  };
}
