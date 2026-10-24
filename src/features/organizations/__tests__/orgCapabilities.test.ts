import { ORG_MANAGEMENT_PERMISSION_KEYS, orgCapabilities, permissionGroupsFor } from '../constants';

describe('orgCapabilities — UX-only gates derived from myRole (backend stays authoritative)', () => {
  it('OWNER can manage everything and cannot leave', () => {
    const c = orgCapabilities('OWNER', false);
    expect(c).toMatchObject({
      canEditOrganization: true,
      canManageMembers: true,
      canManageSupervisors: true,
      canViewMembers: true,
      canViewSupervisors: true,
      canLeave: false,
      isOwner: true,
    });
  });

  it('ADMIN (myRole null) gets full management access', () => {
    const c = orgCapabilities(null, true);
    expect(c.canEditOrganization).toBe(true);
    expect(c.canManageMembers).toBe(true);
    expect(c.canManageSupervisors).toBe(true);
    // Not a member → cannot "leave".
    expect(c.canLeave).toBe(false);
  });

  it('VETERINARIAN can view members but not manage, and can leave', () => {
    const c = orgCapabilities('VETERINARIAN', false);
    expect(c.canViewMembers).toBe(true);
    expect(c.canManageMembers).toBe(false);
    expect(c.canEditOrganization).toBe(false);
    expect(c.canManageSupervisors).toBe(false);
    expect(c.canLeave).toBe(true);
  });

  it('SUPERVISOR sees a read-only view (real perms are owner-selected + unknown to the client)', () => {
    const c = orgCapabilities('SUPERVISOR', false);
    expect(c.canViewMembers).toBe(true);
    expect(c.canViewSupervisors).toBe(true);
    expect(c.canManageMembers).toBe(false);
    expect(c.canManageSupervisors).toBe(false);
    expect(c.canEditOrganization).toBe(false);
  });

  it('STAFF views the profile and (read-only) the members — e.g. farm vet ↔ employees', () => {
    const c = orgCapabilities('STAFF', false);
    expect(c.canViewOrganization).toBe(true);
    expect(c.canViewMembers).toBe(true);
    expect(c.canViewSupervisors).toBe(false);
    expect(c.canManageMembers).toBe(false);
    expect(c.canLeave).toBe(true);
  });

  it('clinic STAFF enter medical records (view + create / edit) but never delete them', () => {
    const c = orgCapabilities('STAFF', false);
    expect(c.canViewOrganizationAnimals).toBe(true);
    expect(c.canViewOrganizationMedical).toBe(true);
    expect(c.canManageOrganizationMedical).toBe(true);
    expect(c.canDeleteOrganizationMedical).toBe(false);
    expect(c.canManageOrganizationAnimalAccess).toBe(false);
    expect(orgCapabilities('VETERINARIAN', false).canDeleteOrganizationMedical).toBe(true);
  });

  it('the mobile permission catalogue is a subset of the backend org-management keys', () => {
    // The 11 organization-management permissions, copied verbatim from the backend.
    expect(ORG_MANAGEMENT_PERMISSION_KEYS).toEqual([
      'organization.read',
      'organization.update',
      'member.read',
      'member.add',
      'member.update',
      'member.remove',
      'supervisor.read',
      'supervisor.assign',
      'supervisor.remove',
      'organization.veterinarian.read',
      'organization.veterinarian.manage',
    ]);
  });
});

describe('orgCapabilities — from the server-resolved permissions (owner-selected grants)', () => {
  it('a clinic SUPERVISOR granted animals + medical records sees exactly those sections', () => {
    const c = orgCapabilities('SUPERVISOR', false, [
      'organization.read',
      'animal.veterinary.access.read',
      'medical_record.read',
      'medical_record.create',
    ]);
    expect(c.canViewOrganizationAnimals).toBe(true);
    expect(c.canViewOrganizationMedical).toBe(true);
    expect(c.canManageOrganizationMedical).toBe(true);
    expect(c.canDeleteOrganizationMedical).toBe(false);
    // Nothing the owner did not grant.
    expect(c.canEditOrganization).toBe(false);
    expect(c.canViewMembers).toBe(false);
    expect(c.canViewSupervisors).toBe(false);
    expect(c.canSendBroadcast).toBe(false);
    expect(c.canManageStoreProducts).toBe(false);
    expect(c.canViewFarmPoultry).toBe(false);
  });

  it('a supervisor with no domain grants gets no sections (no role guessing)', () => {
    const c = orgCapabilities('SUPERVISOR', false, ['organization.read']);
    expect(
      Object.entries(c).filter(([k, v]) => v && k !== 'canViewOrganization' && k !== 'canLeave'),
    ).toEqual([]);
  });

  it('a farm supervisor sees only the granted farm sections', () => {
    const c = orgCapabilities('SUPERVISOR', false, [
      'farm.sheep_batch.read',
      'farm.expense.read',
      'farm.expense.create',
    ]);
    expect(c.canViewFarmPoultry).toBe(true); // any species' batch read
    expect(c.canViewFarmExpenses).toBe(true);
    expect(c.canManageFarmPoultry).toBe(true);
    expect(c.canViewFarmDailyRecords).toBe(false);
    expect(c.canCreateFarmDailyRecords).toBe(false);
    expect(c.canViewFarmHealthEvents).toBe(false);
    expect(c.canViewFarmAppointments).toBe(false);
    expect(c.canViewFarmCases).toBe(false);
    expect(c.canSellFarmBatch).toBe(false);
    expect(c.canViewFarmFinancials).toBe(false);
    expect(c.canCreateFarmBatch).toBe(false);
  });

  it('member / supervisor actions follow their exact keys', () => {
    const c = orgCapabilities('SUPERVISOR', false, [
      'member.read',
      'member.remove',
      'supervisor.read',
    ]);
    expect(c.canViewMembers).toBe(true);
    expect(c.canAddMembers).toBe(false);
    expect(c.canManageMembers).toBe(true);
    expect(c.canViewSupervisors).toBe(true);
    expect(c.canAssignSupervisors).toBe(false);
    expect(c.canRemoveSupervisors).toBe(false);
  });

  it('a farm STAFF member (role grants) cannot delete, sell or see financials', () => {
    const c = orgCapabilities('STAFF', false, [
      'member.read',
      'organization.read',
      'farm.poultry.read',
      'farm.daily_record.read',
      'farm.daily_record.create',
      'farm.expense.read',
    ]);
    expect(c.canViewFarmPoultry).toBe(true);
    expect(c.canCreateFarmDailyRecords).toBe(true);
    expect(c.canDeleteFarmRecords).toBe(false);
    expect(c.canSellFarmBatch).toBe(false);
    expect(c.canViewFarmFinancials).toBe(false);
    expect(c.canEditOrganization).toBe(false);
  });

  it('the OWNER and an ADMIN keep everything regardless of the list', () => {
    expect(orgCapabilities('OWNER', false, []).canSellFarmBatch).toBe(true);
    expect(orgCapabilities(null, true, null).canEditOrganization).toBe(true);
  });
});

describe('permissionGroupsFor — the owner can grant every dashboard section', () => {
  const keysFor = (type: Parameters<typeof permissionGroupsFor>[0]) =>
    permissionGroupsFor(type).flatMap((g) => [...g.permissions]);

  it('CLINIC offers the clinic sections next to the management keys', () => {
    const keys = keysFor('CLINIC');
    for (const k of [
      'animal.veterinary.access.read',
      'medical_record.read',
      'vaccination.read',
      'clinic.appointment.read',
      'clinic.appointment.manage',
      'organization.broadcast.send',
      'member.read',
    ]) {
      expect(keys).toContain(k);
    }
    expect(keys).not.toContain('farm.poultry.read');
  });

  it('FARM offers the farm sections but never the subscription approval', () => {
    const keys = keysFor('FARM');
    for (const k of [
      'farm.poultry.read',
      'farm.sheep_batch.read',
      'farm.cattle_batch.read',
      'farm.daily_record.create',
      'farm.expense.read',
      'farm.batch.sell',
      'farm.financials.read',
    ]) {
      expect(keys).toContain(k);
    }
    expect(keys).not.toContain('farm.subscription.manage');
    expect(keys).not.toContain('medical_record.read');
  });
});
