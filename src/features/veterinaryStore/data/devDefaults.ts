/**
 * DEVELOPMENT ONLY — pre-fills the veterinary-store product / stock-adjust
 * forms so testing doesn't require retyping the same values every time.
 * `__DEV__` is statically replaced with `false` in release builds, so this
 * whole module is dead-code-eliminated and never ships.
 */
import type { AdjustVeterinaryStoreStockFormValues, VeterinaryStoreProductFormValues } from '../validation/schemas';

export function devProductDefaults(): Partial<VeterinaryStoreProductFormValues> {
  return {
    name: 'مضاد حيوي أموكسيسيلين 250 ملغ',
    productType: 'MEDICINE',
    price: '15.50',
    stockQuantity: '100',
    description:
      'مضاد حيوي واسع الطيف يستخدم لعلاج الالتهابات البكتيرية لدى الحيوانات الأليفة والدواجن.',
  };
}

export function devAdjustStockDefaults(): Partial<AdjustVeterinaryStoreStockFormValues> {
  return {
    delta: '10',
    reason: 'توريد دفعة جديدة من المخزون',
  };
}
