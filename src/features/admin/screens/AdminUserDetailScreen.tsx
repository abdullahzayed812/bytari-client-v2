import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Chip } from '@/components/content';
import { ConfirmationDialog, ErrorState, Loading, useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { useAuth } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { ReasonPromptDialog } from '../components';
import { useAdminUser, useUserRoleMutation, useUserStatusMutation } from '../hooks';
import { ROLE_KEYS, type RoleKey, type UserStatus, type UserStatusAction } from '../types';

function statusTone(status: UserStatus): 'success' | 'warning' | 'danger' {
  return status === 'ACTIVE' ? 'success' : status === 'SUSPENDED' ? 'warning' : 'danger';
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: 12 }}>
      <Caption>{label}</Caption>
      <Text variant="caption" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

export default function AdminUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();
  const { session } = useAuth();

  const q = useAdminUser(userId);
  const statusMut = useUserStatusMutation(userId);
  const roleMut = useUserRoleMutation(userId);

  const [pendingAction, setPendingAction] = useState<UserStatusAction | null>(null);
  const isSelf = session?.user.id === userId;

  const runStatus = (reason?: string) => {
    if (!pendingAction) return;
    const action = pendingAction;
    statusMut.mutate(
      { action, reason },
      {
        onSuccess: () => {
          toast.show({
            message: t(
              `users.toast.${action === 'suspend' ? 'suspended' : action === 'activate' ? 'activated' : 'deactivated'}`,
            ),
            tone: 'success',
          });
          setPendingAction(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const toggleRole = (roleKey: RoleKey, has: boolean) => {
    roleMut.mutate(
      { roleKey, op: has ? 'remove' : 'add' },
      {
        onSuccess: () =>
          toast.show({
            message: t(has ? 'users.toast.roleRemoved' : 'users.toast.roleAdded'),
            tone: 'success',
          }),
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('users.detail.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !q.data ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            <View style={{ rowGap: theme.spacing.xs }}>
              <Text variant="heading">
                {`${q.data.firstName} ${q.data.lastName}`.trim() || q.data.email}
              </Text>
              <Caption>{q.data.email}</Caption>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: 4 }}>
                <Badge
                  label={t(`users.status.${q.data.status}`)}
                  tone={statusTone(q.data.status)}
                  size="sm"
                />
                <Badge
                  label={t(`users.vetStatus.${q.data.veterinarianStatus}`)}
                  tone="neutral"
                  size="sm"
                />
              </View>
            </View>
          </Section>

          <Section spacing="lg">
            <Label>{t('users.detail.accountSection')}</Label>
            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.sm }}>
                <InfoRow label={t('users.detail.phoneLabel')} value={q.data.phone ?? '—'} />
                <InfoRow
                  label={t('users.detail.vetLabel')}
                  value={t(`users.vetStatus.${q.data.veterinarianStatus}`)}
                />
                <InfoRow
                  label={t('users.detail.joinedLabel')}
                  value={new Date(q.data.createdAt).toLocaleDateString()}
                />
              </View>
            </Card>
          </Section>

          <Section spacing="lg">
            <Label>{t('users.detail.rolesSection')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {ROLE_KEYS.map((rk) => {
                const has = q.data!.roles.includes(rk);
                return (
                  <Chip
                    key={rk}
                    label={rk}
                    selected={has}
                    disabled={roleMut.isPending || (isSelf && rk === 'ADMIN')}
                    onPress={() => toggleRole(rk, has)}
                  />
                );
              })}
            </View>
          </Section>

          <Section spacing="lg">
            {isSelf ? (
              <Caption>{t('users.detail.selfActionBlocked')}</Caption>
            ) : (
              <View style={{ rowGap: theme.spacing.sm }}>
                {q.data.status !== 'ACTIVE' ? (
                  <Button
                    label={t('users.detail.activate')}
                    variant="primary"
                    fullWidth
                    onPress={() => setPendingAction('activate')}
                  />
                ) : null}
                {q.data.status === 'ACTIVE' ? (
                  <Button
                    label={t('users.detail.suspend')}
                    variant="outline"
                    fullWidth
                    onPress={() => setPendingAction('suspend')}
                  />
                ) : null}
                {q.data.status !== 'DEACTIVATED' ? (
                  <Button
                    label={t('users.detail.deactivate')}
                    variant="danger"
                    fullWidth
                    onPress={() => setPendingAction('deactivate')}
                  />
                ) : null}
              </View>
            )}
          </Section>
        </>
      )}

      <ConfirmationDialog
        visible={pendingAction === 'activate'}
        title={t('users.detail.activateTitle')}
        message={t('users.detail.activateBody')}
        confirmLabel={t('users.detail.activate')}
        cancelLabel={t('common.cancel')}
        loading={statusMut.isPending}
        onConfirm={() => runStatus()}
        onCancel={() => setPendingAction(null)}
      />

      <ReasonPromptDialog
        visible={pendingAction === 'suspend' || pendingAction === 'deactivate'}
        title={t(
          pendingAction === 'suspend'
            ? 'users.detail.suspendTitle'
            : 'users.detail.deactivateTitle',
        )}
        message={t(
          pendingAction === 'suspend' ? 'users.detail.suspendBody' : 'users.detail.deactivateBody',
        )}
        label={t('users.detail.reasonLabel')}
        placeholder={t('users.detail.reasonPlaceholder')}
        confirmLabel={t(
          pendingAction === 'suspend' ? 'users.detail.suspend' : 'users.detail.deactivate',
        )}
        cancelLabel={t('common.cancel')}
        destructive
        loading={statusMut.isPending}
        onConfirm={(reason) => runStatus(reason || undefined)}
        onCancel={() => setPendingAction(null)}
      />
    </ScrollScreen>
  );
}
