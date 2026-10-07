/**
 * Organization-animal query keys (§20). Nested under the organization id so a
 * whole organization's animal state invalidates with one prefix.
 *
 *   orgAnimalKeys.all                       → ['organization-animals']
 *   orgAnimalKeys.forOrg(orgId)             → ['organization-animals', orgId]
 *   orgAnimalKeys.list(orgId)               → ['organization-animals', orgId, 'list']
 *   orgAnimalKeys.detail(orgId, animalId)   → ['organization-animals', orgId, 'detail', animalId]
 *   orgAnimalKeys.profile(orgId, animalId)  → ['organization-animals', orgId, 'profile', animalId]
 */
export const orgAnimalKeys = {
  all: ['organization-animals'] as const,
  forOrg: (organizationId: string) => [...orgAnimalKeys.all, organizationId] as const,
  list: (organizationId: string) => [...orgAnimalKeys.forOrg(organizationId), 'list'] as const,
  search: (organizationId: string, term: string) =>
    [...orgAnimalKeys.forOrg(organizationId), 'search', term] as const,
  detail: (organizationId: string, animalId: string) =>
    [...orgAnimalKeys.forOrg(organizationId), 'detail', animalId] as const,
  profile: (organizationId: string, animalId: string) =>
    [...orgAnimalKeys.forOrg(organizationId), 'profile', animalId] as const,
};
