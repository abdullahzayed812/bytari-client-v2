import { useAppMode } from '@/hooks';

import PetOwnerCategoriesScreen from './PetOwnerCategoriesScreen';
import VeterinarianCategoriesScreen from './VeterinarianCategoriesScreen';

/**
 * The leftmost bottom tab (grid icon). `useAppMode()` decides what it shows:
 *  - `owner`        → "كل الأقسام" — the full pet-owner category grid
 *  - `veterinarian` → "كل الأقسام" — the full veterinarian category grid
 *
 * `useAppMode()` self-corrects to `owner` when veterinarian capability is lost,
 * so a non-approved user is never stranded on the vet branch.
 */
export default function CategoriesTabScreen() {
  const { isVeterinarianMode } = useAppMode();
  return isVeterinarianMode ? <VeterinarianCategoriesScreen /> : <PetOwnerCategoriesScreen />;
}
