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

  it('orgCapabilities: STAFF run operations but never create / delete / sell a batch or see financials', () => {
    const staff = orgCapabilities('STAFF', false);
    expect(staff.canViewFarmPoultry).toBe(true);
    expect(staff.canManageFarmPoultry).toBe(true);
    expect(staff.canDeleteFarmRecords).toBe(false);
    expect(staff.canEditFarmBatch).toBe(false);
    expect(staff.canCreateFarmBatch).toBe(false);
    expect(staff.canSellFarmBatch).toBe(false);
    expect(staff.canViewFarmFinancials).toBe(false);
    expect(staff.canViewFarmJoinCode).toBe(false);

    const vet = orgCapabilities('VETERINARIAN', false);
    expect(vet.canEditFarmBatch).toBe(true);
    expect(vet.canCreateFarmBatch).toBe(false);
    expect(vet.canSellFarmBatch).toBe(false);
    expect(vet.canViewFarmFinancials).toBe(false);

    const owner = orgCapabilities('OWNER', false);
    expect(owner.canCreateFarmBatch && owner.canSellFarmBatch && owner.canViewFarmFinancials).toBe(
      true,
    );
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
