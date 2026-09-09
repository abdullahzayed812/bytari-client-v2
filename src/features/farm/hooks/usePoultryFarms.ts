import { useMyFarms } from './useMyFarms';

/**
 * The current user's POULTRY farms — FARM organizations they own or are an
 * ACTIVE member of, whose `farmSpecies` is `POULTRY`. Backed by
 * `GET /organizations`; sheep / cattle / mixed / legacy farms are excluded.
 */
export function usePoultryFarms() {
  return useMyFarms(['POULTRY']);
}
