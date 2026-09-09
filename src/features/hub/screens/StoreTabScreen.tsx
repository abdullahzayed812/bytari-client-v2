import { PetOwnerStoreHomeScreen } from '@/features/petOwnerStore';
import { useAppMode } from '@/hooks';

import MoreHubScreen from './MoreHubScreen';

/**
 * The 3rd bottom tab (shopping-bag icon, left of the raised Home button).
 * `useAppMode()` decides what it shows:
 *  - `owner`        → the Pet Owners Store home
 *  - `veterinarian` → the "More" utilities hub (unchanged; the future
 *                     Veterinarians Store will slot into this branch)
 *
 * `useAppMode()` self-corrects to `owner` when veterinarian capability is lost,
 * so a non-approved user is never stranded on the vet branch.
 */
export default function StoreTabScreen() {
  const { isVeterinarianMode } = useAppMode();
  return isVeterinarianMode ? <MoreHubScreen /> : <PetOwnerStoreHomeScreen />;
}
