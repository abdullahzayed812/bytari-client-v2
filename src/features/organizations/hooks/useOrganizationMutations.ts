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

export function useLeaveOrganization(
  organizationId: string,
): UseMutationResult<{ success: boolean }, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organizations', 'leave', organizationId],
    mutationFn: () => organizationsApi.leave(organizationId),
    onSuccess: () => {
      qc.removeQueries({ queryKey: orgKeys.detail(organizationId) });
      void qc.invalidateQueries({ queryKey: orgKeys.lists() });
    },
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
