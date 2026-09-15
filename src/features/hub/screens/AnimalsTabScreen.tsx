import { MyVeterinaryOrganizationsScreen } from '@/features/organizations';
import { MyPetsScreen } from '@/features/pets';
import { useAppMode } from '@/hooks';

/**
 * The 2nd bottom tab (paw icon). `useAppMode()` decides what it shows:
 *  - `owner`        → "My Pets" (unchanged)
 *  - `veterinarian` → "My Veterinary Organizations" — the vet's owned/managed
 *                     Veterinary Offices and Clinics (Veterinary Office
 *                     Dashboard spec §2: replace the Pet-Owner-specific tab
 *                     item in Veterinarian mode)
 *
 * Same mode-aware content-swap pattern as `StoreTabScreen` (the 3rd tab) —
 * the tab SLOT stays fixed, only its content and (via `BottomTabBar`'s own
 * mode check) its icon/title change.
 */
export default function AnimalsTabScreen() {
  const { isVeterinarianMode } = useAppMode();
  return isVeterinarianMode ? <MyVeterinaryOrganizationsScreen /> : <MyPetsScreen />;
}
