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
  useFollowOrganization,
  useUnfollowOrganization,
  useLikeOrganization,
  useUnlikeOrganization,
  useSubmitOrganizationReview,
  useDeleteOwnOrganizationReview,
  useOrganizationReviews,
  useAdminOrganizationReviews,
  useAdminDeleteOrganizationReview,
  useOrganizationMembers,
  useOrganizationSupervisors,
  useCreateOrganization,
  useUpdateOrganization,
  useRemoveOrganizationLogo,
  useOrganizationLogoPresignProvider,
  useLeaveOrganization,
  useAddOrganizationMember,
  useUpdateOrganizationMember,
  useRemoveOrganizationMember,
  useAssignOrganizationSupervisor,
  useUpdateOrganizationSupervisor,
  useRemoveOrganizationSupervisor,
  useOrganizationSubscriptionRenewals,
  useRequestOrganizationRenewal,
  type UseOrganizationMembersParams,
} from './hooks';
export {
  OrganizationCard,
  OwnedOrganizationCard,
  type OwnedOrganizationCardProps,
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
  RatingStars,
  ReviewModal,
  DiscoverFilterBar,
  type OrganizationCardProps,
  type OrganizationFormProps,
  type ReviewModalProps,
} from './components';
export {
  MyOrganizationsScreen,
  MyVeterinaryOrganizationsScreen,
  OrganizationSubscriptionRenewalScreen,
  CreateOrganizationScreen,
  OrganizationDetailsScreen,
  OrganizationEditScreen,
  OrganizationReviewsScreen,
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
  buildMemberIdentifierSchema,
  memberIdentifierToInput,
  type CreateOrganizationFormValues,
  type EditOrganizationFormValues,
  type MemberIdentifierFormValues,
  type OrgTFn,
} from './validation/schemas';
export * from './types';
