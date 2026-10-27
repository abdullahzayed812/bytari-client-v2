import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton, TextButton } from '@/components/actions';
import { Card } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { SegmentedControl } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { MemberRow } from '../components';
import { orgCapabilities } from '../constants';
import {
  useOrganization,
  useOrganizationMembers,
  useRemoveOrganizationMember,
  useRemoveOrganizationSupervisor,
  useUpdateOrganizationMember,
} from '../hooks';
import {
  EMPLOYEE_ROLES,
  type AssignableMemberRole,
  type EmployeeRole,
  type OrganizationMember,
} from '../types';

type RoleFilter = 'ALL' | EmployeeRole;

/**
 * Route `/organizations/[organizationId]/employees` — the one "Employees"
 * page of the clinic and veterinary office dashboards (replaces the separate
 * Members / Veterinarians / Supervisors entries, whose routes still work).
 * Lists every non-owner membership with its role; the role filter narrows it.
 *
 * Actions per person follow the caller's own grants (`myPermissions`):
 *   - STAFF ↔ VETERINARIAN, suspend / reactivate, remove → member routes
 *     (`member.update` / `member.remove`);
 *   - make supervisor → the Add Employee form prefilled (`supervisor.assign`);
 *   - a SUPERVISOR's permissions / role / removal need supervisor keys — the
 *     backend refuses member-route changes to a supervisor without
 *     `supervisor.remove`, so these are hidden without it.
 */
export default function OrganizationEmployeesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin, detail.data?.myPermissions);
  const [filter, setFilter] = useState<RoleFilter>('ALL');
  const q = useOrganizationMembers(orgId, {
    roleKey: filter === 'ALL' ? undefined : filter,
    enabled: caps.canViewMembers,
  });
  const update = useUpdateOrganizationMember(orgId);
  const removeMember = useRemoveOrganizationMember(orgId);
  const removeSupervisor = useRemoveOrganizationSupervisor(orgId);
  const busy = update.isPending || removeMember.isPending || removeSupervisor.isPending;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<OrganizationMember | null>(null);

  // The owner is the one managing this page; removed / departed rows are history.
  const employees = useMemo(
    () =>
      q.members.filter(
        (m) => m.roleKey !== 'OWNER' && (m.status === 'ACTIVE' || m.status === 'SUSPENDED'),
      ),
    [q.members],
  );

  const canAdd = caps.canAddMembers || caps.canAssignSupervisors;
  const canManage = (m: OrganizationMember): boolean =>
    m.roleKey === 'SUPERVISOR'
      ? caps.canManageSupervisors
      : caps.canManageMembers || caps.canAssignSupervisors;

  const onDone = (message: string) => {
    toast.show({ tone: 'success', message });
    setExpandedId(null);
  };
  const onFail = (error: unknown) =>
    toast.show({ tone: 'danger', message: apiErrorMessage(error) });

  const runUpdate = (
    member: OrganizationMember,
    input: { role?: AssignableMemberRole; status?: 'ACTIVE' | 'SUSPENDED' },
  ) =>
    update.mutate(
      { memberId: member.id, input },
      { onSuccess: () => onDone(t('employees.updateSuccess')), onError: onFail },
    );

  const renderActions = (member: OrganizationMember) => {
    if (expandedId !== member.id) return null;
    const isSupervisor = member.roleKey === 'SUPERVISOR';
    // Moving a supervisor back to an ordinary role clears their grants (server-side).
    const canChangeRole = isSupervisor
      ? caps.canRemoveSupervisors && caps.canManageMembers
      : caps.canManageMembers;
    const canChangeStatus = isSupervisor ? caps.canRemoveSupervisors : caps.canManageMembers;
    const canRemove = isSupervisor ? caps.canRemoveSupervisors : caps.canManageMembers;
    const ordinaryTargets = (['STAFF', 'VETERINARIAN'] as const).filter(
      (r) => r !== member.roleKey,
    );

    return (
      <View style={{ rowGap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
        {canChangeRole
          ? ordinaryTargets.map((r) => (
              <TextButton
                key={r}
                label={t('employees.changeRole', { role: t(`employees.role.${r}`) })}
                icon="swap-horizontal-outline"
                disabled={busy}
                onPress={() => runUpdate(member, { role: r })}
              />
            ))
          : null}
        {!isSupervisor && caps.canAssignSupervisors ? (
          <TextButton
            label={t('employees.changeRole', { role: t('employees.role.SUPERVISOR') })}
            icon="shield-checkmark-outline"
            disabled={busy}
            onPress={() =>
              router.push({
                pathname: Routes.organizationEmployeesAdd(orgId) as never,
                params: { email: member.user.email, role: 'SUPERVISOR' },
              })
            }
          />
        ) : null}
        {isSupervisor && caps.canAssignSupervisors ? (
          <TextButton
            label={t('supervisors.editPermissions')}
            icon="create-outline"
            disabled={busy}
            onPress={() =>
              router.push({
                pathname: Routes.organizationSupervisorsAssign(orgId) as never,
                params: { membershipId: member.id },
              })
            }
          />
        ) : null}
        {canChangeStatus ? (
          member.status === 'ACTIVE' ? (
            <TextButton
              label={t('members.suspend')}
              icon="pause-circle-outline"
              disabled={busy}
              onPress={() => runUpdate(member, { status: 'SUSPENDED' })}
            />
          ) : (
            <TextButton
              label={t('members.reactivate')}
              icon="play-circle-outline"
              disabled={busy}
              onPress={() => runUpdate(member, { status: 'ACTIVE' })}
            />
          )
        ) : null}
        {canRemove ? (
          <TextButton
            label={t('employees.remove')}
            icon="trash-outline"
            tone="danger"
            disabled={busy}
            onPress={() => setPendingRemove(member)}
          />
        ) : null}
      </View>
    );
  };

  const filterOptions = [
    { value: 'ALL' as const, label: t('employees.filterAll') },
    ...EMPLOYEE_ROLES.map((r) => ({ value: r, label: t(`employees.roleShort.${r}`) })),
  ] as [
    { value: RoleFilter; label: string },
    { value: RoleFilter; label: string },
    ...{ value: RoleFilter; label: string }[],
  ];

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('employees.title')}
        showBack
        right={
          canAdd ? (
            <IconButton
              icon="person-add"
              variant="soft"
              accessibilityLabel={t('employees.addCta')}
              onPress={() => router.push(Routes.organizationEmployeesAdd(orgId))}
            />
          ) : undefined
        }
      />

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
        <SegmentedControl<RoleFilter> options={filterOptions} value={filter} onChange={setFilter} />
      </View>

      {detail.isLoading || q.isLoading ? (
        <Loading fill />
      ) : !caps.canViewMembers ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <EmptyState icon="lock-closed-outline" title={t('employees.noViewPermission')} />
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <Card variant="outlined" padding="md">
              <MemberRow
                member={item}
                right={
                  canManage(item) ? (
                    <IconButton
                      icon={expandedId === item.id ? 'chevron-up' : 'ellipsis-horizontal'}
                      variant="plain"
                      accessibilityLabel={t('members.manage', {
                        name: `${item.user.firstName} ${item.user.lastName}`.trim(),
                      })}
                      onPress={() => setExpandedId((cur) => (cur === item.id ? null : item.id))}
                    />
                  ) : undefined
                }
              />
              {renderActions(item)}
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={t('employees.empty')}
              message={t('employees.emptyHint')}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('list.loadingMore')} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.sm,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching && !q.isFetchingNextPage}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}

      <ConfirmationDialog
        visible={pendingRemove != null}
        title={t('employees.removeConfirmTitle')}
        message={t('employees.removeConfirmBody')}
        confirmLabel={t('employees.remove')}
        cancelLabel={t('common.cancel', { defaultValue: 'إلغاء' })}
        destructive
        loading={removeMember.isPending || removeSupervisor.isPending}
        onConfirm={() => {
          const target = pendingRemove;
          setPendingRemove(null);
          if (!target) return;
          const callbacks = {
            onSuccess: () => onDone(t('employees.removeSuccess')),
            onError: onFail,
          };
          if (target.roleKey === 'SUPERVISOR') {
            removeSupervisor.mutate({ membershipId: target.id }, callbacks);
          } else {
            removeMember.mutate({ memberId: target.id }, callbacks);
          }
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </SafeAreaScreen>
  );
}
