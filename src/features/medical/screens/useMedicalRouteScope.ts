import { useLocalSearchParams } from 'expo-router';

import type { MedicalScope } from '../types';

/**
 * Resolves the medical context from the route. The same screen components serve
 * two mount points:
 *  - CLINIC  `/organizations/[organizationId]/animals/[animalId]/...`
 *  - OWNER   `/pets/[petId]/...`
 * so `animalId` comes from `animalId` OR `petId`, and CLINIC context is present
 * only when `organizationId` is in the route.
 */
export interface MedicalRouteScope extends MedicalScope {
  isClinic: boolean;
  recordId?: string;
  vaccinationId?: string;
}

export function useMedicalRouteScope(): MedicalRouteScope {
  const params = useLocalSearchParams<{
    organizationId?: string;
    animalId?: string;
    petId?: string;
    recordId?: string;
    vaccinationId?: string;
  }>();

  const animalId = params.animalId ?? params.petId ?? '';
  const organizationId = params.organizationId || undefined;

  return {
    animalId,
    organizationId,
    isClinic: Boolean(organizationId),
    recordId: params.recordId,
    vaccinationId: params.vaccinationId,
  };
}
