import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
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
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
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
  useUpdateOrganizationMember,
} from '../hooks';
import type { AssignableMemberRole, OrganizationMember } from '../types';

/** Route `/organizations/[organizationId]/members` — list + manage members. */
export default function OrganizationMembersScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId, roleKey } = useLocalSearchParams<{
    organizationId: string;
    roleKey?: string;
  }>();
  const orgId = organizationId ?? '';
  // Phase 7: the dashboard's "Veterinarians" entry opens this same screen with
  // `?roleKey=VETERINARIAN` — a filtered view, not a separate screen.
  const roleFilter = roleKey === 'VETERINARIAN' ? ('VETERINARIAN' as const) : undefined;

  const detail = useOrganization(orgId);
  const q = useOrganizationMembers(orgId, { roleKey: roleFilter });
  const update = useUpdateOrganizationMember(orgId);
  const remove = useRemoveOrganizationMember(orgId);

  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<OrganizationMember | null>(null);

  const runUpdate = (
    member: OrganizationMember,
    input: { role?: AssignableMemberRole; status?: 'ACTIVE' | 'SUSPENDED' },
  ) => {
    update.mutate(
      { memberId: member.id, input },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('members.updateSuccess') });
          setExpandedId(null);
        },
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      },
    );
  };

  const renderActions = (member: OrganizationMember) => {
    if (member.roleKey === 'OWNER') {
      return <Caption>{t('members.ownerLocked')}</Caption>;
    }
    if (expandedId !== member.id) return null;
    const nextRole: AssignableMemberRole =
      member.roleKey === 'VETERINARIAN' ? 'STAFF' : 'VETERINARIAN';
    const busy = update.isPending || remove.isPending;
    return (
      <View style={{ rowGap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
        <TextButton
          label={t(`members.setRole.${nextRole}`)}
          icon="swap-horizontal-outline"
          disabled={busy}
          onPress={() => runUpdate(member, { role: nextRole })}
        />
        {member.status === 'ACTIVE' ? (
          <TextButton
            label={t('members.suspend')}
            icon="pause-circle-outline"
            disabled={busy}
            onPress={() => runUpdate(member, { status: 'SUSPENDED' })}
          />
        ) : member.status === 'SUSPENDED' ? (
          <TextButton
            label={t('members.reactivate')}
            icon="play-circle-outline"
            disabled={busy}
            onPress={() => runUpdate(member, { status: 'ACTIVE' })}
          />
        ) : null}
        <TextButton
          label={t('members.remove')}
          icon="trash-outline"
          tone="danger"
          disabled={busy}
          onPress={() => setPendingRemove(member)}
        />
      </View>
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader
        title={roleFilter ? t('veterinarians.title') : t('members.title')}
        showBack
        right={
          caps.canManageMembers ? (
            <IconButton
              icon="person-add"
              variant="soft"
              accessibilityLabel={t('members.addCta')}
              onPress={() => router.push(Routes.organizationMembersAdd(orgId))}
            />
          ) : undefined
        }
      />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.members}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <Card variant="outlined" padding="md">
              <MemberRow
                member={item}
                right={
                  caps.canManageMembers && item.roleKey !== 'OWNER' ? (
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
              title={roleFilter ? t('veterinarians.empty') : t('members.empty')}
              message={roleFilter ? t('veterinarians.emptyHint') : t('members.emptyHint')}
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
        title={t('members.removeConfirmTitle')}
        message={t('members.removeConfirmBody')}
        confirmLabel={t('members.remove')}
        cancelLabel={t('common.cancel', { defaultValue: 'إلغاء' })}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          const target = pendingRemove;
          setPendingRemove(null);
          if (!target) return;
          remove.mutate(
            { memberId: target.id },
            {
              onSuccess: () => {
                toast.show({ tone: 'success', message: t('members.removeSuccess') });
                setExpandedId(null);
              },
              onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
            },
          );
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </SafeAreaScreen>
  );
}
