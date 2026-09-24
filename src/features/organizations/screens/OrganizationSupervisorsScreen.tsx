import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

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

import { SupervisorRow } from '../components';
import { orgCapabilities } from '../constants';
import {
  useOrganization,
  useOrganizationSupervisors,
  useRemoveOrganizationSupervisor,
} from '../hooks';
import type { OrganizationSupervisor } from '../types';

/** Route `/organizations/[organizationId]/supervisors` — list + manage organization supervisors. */
export default function OrganizationSupervisorsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const q = useOrganizationSupervisors(orgId);
  const remove = useRemoveOrganizationSupervisor(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const [pendingRemove, setPendingRemove] = useState<OrganizationSupervisor | null>(null);

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('supervisors.title')}
        showBack
        right={
          caps.canManageSupervisors ? (
            <IconButton
              icon="person-add"
              variant="soft"
              accessibilityLabel={t('supervisors.assignCta')}
              onPress={() => router.push(Routes.organizationSupervisorsAssign(orgId))}
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
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.sm,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          <Caption>{t('supervisors.intro')}</Caption>

          {(q.data ?? []).length === 0 ? (
            <EmptyState
              icon="shield-outline"
              title={t('supervisors.empty')}
              message={t('supervisors.emptyHint')}
            />
          ) : (
            (q.data ?? []).map((sup) => (
              <Card key={sup.id} variant="outlined" padding="md">
                <SupervisorRow
                  supervisor={sup}
                  right={
                    caps.canManageSupervisors ? (
                      <IconButton
                        icon="create-outline"
                        variant="plain"
                        accessibilityLabel={t('supervisors.editPermissions')}
                        onPress={() =>
                          router.push({
                            pathname: Routes.organizationSupervisorsAssign(orgId) as never,
                            params: { membershipId: sup.id },
                          })
                        }
                      />
                    ) : undefined
                  }
                />
                {caps.canManageSupervisors ? (
                  <View style={{ marginTop: theme.spacing.xs }}>
                    <TextButton
                      label={t('supervisors.remove')}
                      icon="trash-outline"
                      tone="danger"
                      disabled={remove.isPending}
                      onPress={() => setPendingRemove(sup)}
                    />
                  </View>
                ) : null}
              </Card>
            ))
          )}
        </ScrollView>
      )}

      <ConfirmationDialog
        visible={pendingRemove != null}
        title={t('supervisors.removeConfirmTitle')}
        message={t('supervisors.removeConfirmBody')}
        confirmLabel={t('supervisors.remove')}
        cancelLabel={t('common.cancel', { defaultValue: 'إلغاء' })}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          const target = pendingRemove;
          setPendingRemove(null);
          if (!target) return;
          remove.mutate(
            { membershipId: target.id },
            {
              onSuccess: () =>
                toast.show({ tone: 'success', message: t('supervisors.removeSuccess') }),
              onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
            },
          );
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </SafeAreaScreen>
  );
}
