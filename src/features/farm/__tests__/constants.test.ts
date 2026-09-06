import { FARM_ORG_TYPE, organizationIsFarm } from '@/features/farmShared';
import { orgCapabilities } from '@/features/organizations';

import { birdTypeIcon } from '../constants';

describe('farm feature — org-type rule + capability gates', () => {
  it('only FARM organizations carry farm behaviour', () => {
    expect(FARM_ORG_TYPE).toBe('FARM');
    expect(organizationIsFarm('FARM')).toBe(true);
    expect(organizationIsFarm('CLINIC')).toBe(false);
    expect(organizationIsFarm(undefined)).toBe(false);
  });

  it('birdTypeIcon falls back for an unknown bird type', () => {
    expect(birdTypeIcon('CHICKEN')).toBe('egg-outline');
    expect(birdTypeIcon('OSTRICH')).toBe('help-circle-outline');
  });

  it('orgCapabilities: STAFF can view poultry but not manage it (seed: read-only)', () => {
    const staff = orgCapabilities('STAFF', false);
    expect(staff.canViewFarmPoultry).toBe(true);
    expect(staff.canManageFarmPoultry).toBe(false);
    expect(staff.canViewFarmJoinCode).toBe(false);
  });

  it('orgCapabilities: VETERINARIAN can view + manage poultry; only OWNER/ADMIN sees the join code', () => {
    const vet = orgCapabilities('VETERINARIAN', false);
    expect(vet.canViewFarmPoultry).toBe(true);
    expect(vet.canManageFarmPoultry).toBe(true);
    expect(vet.canViewFarmJoinCode).toBe(false);

    expect(orgCapabilities('OWNER', false).canViewFarmJoinCode).toBe(true);
    expect(orgCapabilities(null, true).canViewFarmJoinCode).toBe(true);
  });
});
