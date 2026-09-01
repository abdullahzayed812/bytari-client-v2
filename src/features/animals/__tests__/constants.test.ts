import { orgCapabilities } from '@/features/organizations';

import {
  VETERINARY_ANIMAL_ORG_TYPES,
  animalSpeciesIcon,
  organizationManagesAnimals,
} from '../constants';

describe('animals feature — org-type rule + capability gates', () => {
  it('only CLINIC organizations manage animals in Phase 5 (backend VETERINARY_ORG_TYPES)', () => {
    expect(VETERINARY_ANIMAL_ORG_TYPES).toEqual(['CLINIC']);
    expect(organizationManagesAnimals('CLINIC')).toBe(true);
    expect(organizationManagesAnimals('FARM')).toBe(false);
    expect(organizationManagesAnimals('VETERINARY_OFFICE')).toBe(false);
    expect(organizationManagesAnimals('VETERINARY_STORE')).toBe(false);
    expect(organizationManagesAnimals(undefined)).toBe(false);
  });

  it('animalSpeciesIcon falls back for an unknown species string', () => {
    expect(animalSpeciesIcon('DOG')).toBe('paw-outline');
    expect(animalSpeciesIcon('DRAGON')).toBe('help-circle-outline');
  });

  it('orgCapabilities: VETERINARIAN can view org animals but not manage access', () => {
    const vet = orgCapabilities('VETERINARIAN', false);
    expect(vet.canViewOrganizationAnimals).toBe(true);
    expect(vet.canManageOrganizationAnimalAccess).toBe(false);
  });

  it('orgCapabilities: OWNER / ADMIN can manage access; STAFF can do neither', () => {
    expect(orgCapabilities('OWNER', false).canManageOrganizationAnimalAccess).toBe(true);
    expect(orgCapabilities(null, true).canManageOrganizationAnimalAccess).toBe(true);
    const staff = orgCapabilities('STAFF', false);
    expect(staff.canViewOrganizationAnimals).toBe(false);
    expect(staff.canManageOrganizationAnimalAccess).toBe(false);
  });
});
