/**
 * DEVELOPMENT ONLY — pre-fills the "Add Organization" form so testing doesn't
 * require retyping the same values every time. `__DEV__` is statically
 * replaced with `false` in release builds, so this whole module is
 * dead-code-eliminated and never ships.
 */
import type { CreateOrganizationFormValues } from '../validation/schemas';

export function devOrganizationDefaults(): Partial<CreateOrganizationFormValues> {
  return {
    name: 'العيادة البيطرية الحديثة',
    description: 'نقدم خدمات الفحص والعلاج والتطعيم لجميع أنواع الحيوانات الأليفة والمزارع.',
  };
}
