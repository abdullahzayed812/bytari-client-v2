import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { orgKeys, organizationsApi } from '../api';
import type {
  AddMemberInput,
  AssignSupervisorInput,
  CreateOrganizationInput,
  Organization,
  OrganizationMember,
  OrganizationSupervisor,
  OrganizationWithDetails,
  UpdateMemberInput,
  UpdateOrganizationInput,
  UpdateSupervisorInput,
} from '../types';

/**
 * Every organization mutation invalidates the narrowest key prefix that covers
 * the change (§14 — no global invalidation). The backend authorises each call;
 * these hooks never pre-check permissions.
 */

export function useCreateOrganization(): UseMutationResult<
  OrganizationWithDetails,
  unknown,
  CreateOrganizationInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'create'],
    mutationFn: (input: CreateOrganizationInput) => organizationsApi.create(input),
    onSuccess: (org) => {
      qc.setQueryData(orgKeys.detail(org.id), { ...org, myRole: 'OWNER' });
      void qc.invalidateQueries({ queryKey: orgKeys.lists() });
    },
  });
}

export function useUpdateOrganization(
  organizationId: string,
): UseMutationResult<Organization, unknown, UpdateOrganizationInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'update', organizationId],
    mutationFn: (input: UpdateOrganizationInput) => organizationsApi.update(organizationId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
      void qc.invalidateQueries({ queryKey: orgKeys.lists() });
    },
  });
}

export function useRemoveOrganizationLogo(
  organizationId: string,
): UseMutationResult<OrganizationWithDetails, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'logo', 'remove', organizationId],
    mutationFn: () => organizationsApi.removeLogo(organizationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
      void qc.invalidateQueries({ queryKey: orgKeys.lists() });
    },
  });
}

export function useRemoveOrganizationGalleryImage(
  organizationId: string,
): UseMutationResult<OrganizationWithDetails, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'gallery', 'remove', organizationId],
    mutationFn: (storageKey: string) =>
      organizationsApi.removeGalleryImage(organizationId, storageKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
      void qc.invalidateQueries({ queryKey: orgKeys.lists() });
    },
  });
}

export function useRemoveOrganizationLicenseDocument(
  organizationId: string,
): UseMutationResult<OrganizationWithDetails, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'license-documents', 'remove', organizationId],
    mutationFn: (storageKey: string) =>
      organizationsApi.removeLicenseDocument(organizationId, storageKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
      void qc.invalidateQueries({ queryKey: orgKeys.lists() });
    },
  });
}

/**
 * After leaving: drop every cached query scoped to that organization (detail,
 * dashboards, clinic pets, chats … — any key carrying its id) so nothing the
 * user can no longer access lingers, then refresh the membership lists.
 */
function forgetOrganization(qc: ReturnType<typeof useQueryClient>, organizationId: string): void {
  qc.removeQueries({ predicate: (q) => q.queryKey.includes(organizationId) });
  void qc.invalidateQueries({ queryKey: orgKeys.lists() });
}

export function useLeaveOrganization(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'leave', organizationId],
    mutationFn: () => organizationsApi.leave(organizationId),
    onSuccess: () => forgetOrganization(qc, organizationId),
  });
}

/**
 * Leave whichever organization is passed at call time — for lists (My
 * Veterinary Organizations) where one screen offers "leave" on many cards.
 * The backend decides membership/ownership; the client never asserts either.
 */
export function useLeaveAnyOrganization(): UseMutationResult<
  { success: boolean },
  unknown,
  { organizationId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'leave'],
    mutationFn: ({ organizationId }) => organizationsApi.leave(organizationId),
    onSuccess: (_res, { organizationId }) => forgetOrganization(qc, organizationId),
  });
}

// --- members ------------------------------------------------------

export function useAddOrganizationMember(
  organizationId: string,
): UseMutationResult<OrganizationMember, unknown, AddMemberInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'members', 'add', organizationId],
    mutationFn: (input: AddMemberInput) => organizationsApi.addMember(organizationId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.members(organizationId) });
    },
  });
}

export function useUpdateOrganizationMember(
  organizationId: string,
): UseMutationResult<OrganizationMember, unknown, { memberId: string; input: UpdateMemberInput }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'members', 'update', organizationId],
    mutationFn: ({ memberId, input }) =>
      organizationsApi.updateMember(organizationId, memberId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.members(organizationId) });
    },
  });
}

export function useRemoveOrganizationMember(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, { memberId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'members', 'remove', organizationId],
    mutationFn: ({ memberId }) => organizationsApi.removeMember(organizationId, memberId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.members(organizationId) });
      void qc.invalidateQueries({ queryKey: orgKeys.supervisors(organizationId) });
    },
  });
}

// --- supervisors ---------------------------------------------

export function useAssignOrganizationSupervisor(
  organizationId: string,
): UseMutationResult<OrganizationSupervisor, unknown, AssignSupervisorInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'supervisors', 'assign', organizationId],
    mutationFn: (input: AssignSupervisorInput) =>
      organizationsApi.assignSupervisor(organizationId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.supervisors(organizationId) });
      void qc.invalidateQueries({ queryKey: orgKeys.members(organizationId) });
    },
  });
}

export function useUpdateOrganizationSupervisor(
  organizationId: string,
): UseMutationResult<
  OrganizationSupervisor,
  unknown,
  { membershipId: string; input: UpdateSupervisorInput }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'supervisors', 'update', organizationId],
    mutationFn: ({ membershipId, input }) =>
      organizationsApi.updateSupervisor(organizationId, membershipId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.supervisors(organizationId) });
    },
  });
}

export function useRemoveOrganizationSupervisor(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, { membershipId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'supervisors', 'remove', organizationId],
    mutationFn: ({ membershipId }) =>
      organizationsApi.removeSupervisor(organizationId, membershipId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.supervisors(organizationId) });
      void qc.invalidateQueries({ queryKey: orgKeys.members(organizationId) });
    },
  });
}
