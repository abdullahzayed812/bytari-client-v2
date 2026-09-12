import { PetOwnerStoreHomeScreen } from '@/features/petOwnerStore';
import { VeterinarianStoreHomeScreen } from '@/features/veterinarianStore';
import { useAppMode } from '@/hooks';

/**
 * The 3rd bottom tab (shopping-bag icon, left of the raised Home button).
 * `useAppMode()` decides what it shows:
 *  - `owner`        → the Pet Owners Store home
 *  - `veterinarian` → the Veterinarian Store home (own catalogue/tables,
 *                     completely separate from the Pet Owners Store)
 *
 * `useAppMode()` self-corrects to `owner` when veterinarian capability is lost,
 * so a non-approved user is never stranded on the vet branch. (The "More"
 * utilities hub's content — account, notifications, management, language,
 * sign-out — already lives on `AccountScreen` / the home header for both
 * modes, same as when the owner branch took over this tab.)
 */
export default function StoreTabScreen() {
  const { isVeterinarianMode } = useAppMode();
  return isVeterinarianMode ? <VeterinarianStoreHomeScreen /> : <PetOwnerStoreHomeScreen />;
}
