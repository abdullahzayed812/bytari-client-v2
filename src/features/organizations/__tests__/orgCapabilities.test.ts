import { ORG_MANAGEMENT_PERMISSION_KEYS, orgCapabilities } from '../constants';

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

  it('STAFF can only view the profile', () => {
    const c = orgCapabilities('STAFF', false);
    expect(c.canViewOrganization).toBe(true);
    expect(c.canViewMembers).toBe(false);
    expect(c.canViewSupervisors).toBe(false);
    expect(c.canManageMembers).toBe(false);
    expect(c.canLeave).toBe(true);
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
