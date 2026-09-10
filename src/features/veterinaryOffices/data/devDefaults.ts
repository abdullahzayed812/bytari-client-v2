/**
 * DEVELOPMENT ONLY — pre-fills the veterinary-office product / stock-adjust
 * management forms so testing doesn't require retyping the same values every
 * time. `__DEV__` is statically replaced with `false` in release builds, so
 * this whole module is dead-code-eliminated and never ships.
 */
import type {
  AdjustVeterinaryOfficeStockFormValues,
  VeterinaryOfficeProductFormValues,
} from '../validation/schemas';

export function devProductDefaults(): Partial<VeterinaryOfficeProductFormValues> {
  return {
    name: 'أنتي بيك',
    productType: 'MEDICINE',
    price: '25000',
    stockQuantity: '50',
    description: 'مضاد حيوي واسع الطيف يستخدم لعلاج الالتهابات البكتيرية لدى الحيوانات الأليفة.',
  };
}

export function devAdjustStockDefaults(): Partial<AdjustVeterinaryOfficeStockFormValues> {
  return {
    delta: '10',
    reason: 'توريد دفعة جديدة من المخزون',
  };
}
