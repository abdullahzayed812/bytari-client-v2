/**
 * Organizations feature — Mobile Phase 4. Veterinarian-side organization
 * management: My Organizations · create · detail · edit · members · supervisors.
 *
 * Authorization is entirely backend-derived and enforced. `myRole` +
 * `orgCapabilities()` only decide what UI to render; every mutation is
 * authorised server-side and a 403 is mapped to a safe Arabic message.
 * No medical / poultry / product / chat / job features here — later phases.
 */
export { organizationsApi, orgKeys, type OrganizationsApi } from './api';
export {
  useOrganizations,
  useOrganization,
  useDiscoverOrganizations,
  usePublicOrganization,
  useOrganizationMembers,
  useOrganizationSupervisors,
  useCreateOrganization,
  useUpdateOrganization,
  useLeaveOrganization,
  useAddOrganizationMember,
  useUpdateOrganizationMember,
  useRemoveOrganizationMember,
  useAssignOrganizationSupervisor,
  useUpdateOrganizationSupervisor,
  useRemoveOrganizationSupervisor,
  type UseOrganizationMembersParams,
} from './hooks';
export {
  OrganizationCard,
  OrganizationCardSkeleton,
  ClinicCard,
  OrganizationTypeBadge,
  OrganizationStatusBadge,
  MemberRow,
  SupervisorRow,
  PermissionSelector,
  OrganizationForm,
  OrgFormLayout,
  ImageCarousel,
  type OrganizationCardProps,
  type OrganizationFormProps,
} from './components';
export {
  MyOrganizationsScreen,
  DiscoverClinicsScreen,
  ClinicDetailScreen,
  CreateOrganizationScreen,
  OrganizationDetailsScreen,
  OrganizationEditScreen,
  OrganizationMembersScreen,
  AddMemberScreen,
  OrganizationSupervisorsScreen,
  AssignSupervisorScreen,
} from './screens';
export {
  ORG_TYPE_ICON,
  ORG_TYPE_ORDER,
  ORG_STATUS_TONE,
  ORG_PERMISSION_GROUPS,
  ORG_MANAGEMENT_PERMISSION_KEYS,
  orgCapabilities,
  type OrgCapabilities,
} from './constants';
export {
  buildCreateOrganizationSchema,
  buildEditOrganizationSchema,
  buildUserIdSchema,
  buildMemberIdentifierSchema,
  memberIdentifierToInput,
  type CreateOrganizationFormValues,
  type EditOrganizationFormValues,
  type MemberIdentifierFormValues,
  type OrgTFn,
} from './validation/schemas';
export * from './types';
