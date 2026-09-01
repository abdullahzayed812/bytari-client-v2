import { VeterinarianHomeScreen } from '@/features/veterinarian';
import { useAppMode } from '@/hooks';

import HomeScreen from './HomeScreen';

/**
 * The Home tab. `useAppMode()` decides which experience to render:
 *  - `veterinarian` → the Veterinarian Home (organization management)
 *  - `owner`        → the Pet Owner Home (unchanged from Phase 3)
 *
 * `useAppMode()` self-corrects to `owner` if veterinarian capability is lost, so
 * a non-approved user never gets stuck on the vet home.
 */
export default function ModeAwareHomeScreen() {
  const { isVeterinarianMode } = useAppMode();
  return isVeterinarianMode ? <VeterinarianHomeScreen /> : <HomeScreen />;
}
