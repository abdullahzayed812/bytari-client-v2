import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

/**
 * Wraps every clinic-operation route (the Clinic Dashboard group and the
 * clinic animal / medical routes) via their Expo Router layouts, so a deep link
 * or back-navigation can never render clinic screens while the clinic may not
 * operate. Mirrors the backend rule (`computeOrganizationOperability`):
 * status must be ACTIVE and the subscription not EXPIRED — for the owner and
 * staff alike. UX only: the backend refuses every call regardless.
 *
 * The organization is always refetched on entry, so a cached "ACTIVE" profile
 * cannot keep an expired / suspended clinic's dashboard open.
 */
export function ClinicOperationalGate({
  organizationId,
  children,
}: {
  organizationId: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  const { t } = useTranslation('clinicDashboard');
  const { isAdmin } = useCapabilities();
  const org = useOrganization(organizationId);
  const { refetch } = org;

  useEffect(() => {
    void refetch();
  }, [organizationId, refetch]);

  const shell = (body: ReactNode) => (
    <SafeAreaScreen>
      <AppHeader title={t('title')} showBack />
      <View style={{ flex: 1, padding: theme.screenPadding }}>{body}</View>
    </SafeAreaScreen>
  );

  if (!org.data) {
    if (org.isLoading || org.isFetching) return shell(<Loading fill label={t('loading')} />);
    const denied = org.error instanceof ApiError && [403, 404].includes(org.error.status);
    return shell(
      denied ? (
        <EmptyState
          icon="lock-closed-outline"
          title={t('notAvailableTitle')}
          message={t('notAvailableBody')}
          actionLabel={t('backToList')}
          onAction={() => router.back()}
        />
      ) : (
        <ErrorState error={org.error} onRetry={() => void org.refetch()} />
      ),
    );
  }

  const data = org.data;
  if (data.type !== 'CLINIC' || isAdmin) return <>{children}</>;

  const openProfile = () => router.replace(Routes.organizationDetail(data.id));

  if (data.status === 'PENDING') {
    return shell(
      <EmptyState
        icon="time-outline"
        title={t('pendingTitle')}
        message={t('pendingBody')}
        actionLabel={t('openProfile')}
        onAction={openProfile}
      />,
    );
  }
  if (data.status !== 'ACTIVE') {
    return shell(
      <EmptyState
        icon="pause-circle-outline"
        title={t('inactiveTitle')}
        message={t('inactiveBody')}
        actionLabel={t('openProfile')}
        onAction={openProfile}
      />,
    );
  }
  if (data.details.subscriptionStatus === 'EXPIRED') {
    return shell(
      <View style={{ rowGap: theme.spacing.md }}>
        <EmptyState
          icon="lock-closed-outline"
          title={t('expiredTitle')}
          message={t('expiredBody')}
        />
        {data.myRole === 'OWNER' ? (
          <Button
            label={t('renewCta')}
            leftIcon="refresh-outline"
            onPress={() => router.replace(Routes.organizationSubscriptionRenewal(data.id))}
          />
        ) : null}
        <Button label={t('openProfile')} variant="outline" onPress={openProfile} />
      </View>,
    );
  }
  return <>{children}</>;
}
