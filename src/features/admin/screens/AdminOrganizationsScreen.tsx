import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Card } from '@/components/content';
import { Skeleton, useToast } from '@/components/feedback';
import { ImageViewer } from '@/components/media';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { Permission } from '@/constants/permissions';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  AdminListScreen,
  AdminRow,
  FilterChips,
  RenewalApproveDialog,
  RenewalRejectDialog,
} from '../components';
import { useAdminOrganizations, useAdminPendingRenewals } from '../hooks';
import type {
  AdminPendingRenewalRequest,
  Organization,
  OrganizationStatus,
  OrganizationType,
} from '../types';

const FILTERABLE_TYPES = new Set<OrganizationType>([
  'CLINIC',
  'VETERINARY_OFFICE',
  'SYNDICATE',
  'CHAT_ROOM',
]);

function statusTone(s: OrganizationStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'ACTIVE') return 'success';
  if (s === 'PENDING') return 'info';
  if (s === 'SUSPENDED') return 'warning';
  return 'danger';
}

/**
 * `/admin/organizations?type=CLINIC|VETERINARY_OFFICE|SYNDICATE` — optionally
 * scoped to one organization type (the admin dashboard's "العيادات" /
 * "المكاتب" / "نقابة الأطباء البيطريين" cards); omitted shows every type,
 * same as before this param existed.
 */
type Scope = 'all' | 'pending' | 'renewals';

export default function AdminOrganizationsScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();
  const type =
    typeParam && FILTERABLE_TYPES.has(typeParam as OrganizationType)
      ? (typeParam as OrganizationType)
      : undefined;
  const [scope, setScope] = useState<Scope>('all');
  const caps = useCapabilities();

  // The renewals tab only makes sense for VETERINARY_OFFICE today (Clinic
  // Dashboard/renewal review is a separate, not-yet-built screen) — and it
  // must never mix in CLINIC/FARM requests, per the "المكاتب" spec.
  const showRenewalsTab = type === 'VETERINARY_OFFICE';
  const isRenewalsScope = showRenewalsTab && scope === 'renewals';

  const q = useAdminOrganizations({ pending: scope === 'pending', type, enabled: !isRenewalsScope });
  const renewalsQ = useAdminPendingRenewals({
    organizationType: 'VETERINARY_OFFICE',
    enabled: isRenewalsScope,
  });

  const [approvingRequest, setApprovingRequest] = useState<AdminPendingRenewalRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<AdminPendingRenewalRequest | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const fail = (e: unknown) => toast.show({ message: apiErrorMessage(e), tone: 'danger' });

  const canCreateSyndicate = type === 'SYNDICATE' && caps.can(Permission.SYNDICATE_ADMIN_CREATE);
  const canCreateChatRoom = type === 'CHAT_ROOM' && caps.can(Permission.CHAT_ROOM_ADMIN_CREATE);

  const filterBar = (
    <FilterChips<Scope>
      value={scope}
      onChange={(v) => setScope(v ?? 'all')}
      options={[
        { value: 'all', label: t('orgs.tab.all') },
        { value: 'pending', label: t('orgs.tab.pending') },
        ...(showRenewalsTab
          ? [{ value: 'renewals' as const, label: t('farms.tab.renewals') }]
          : []),
      ]}
    />
  );

  const right = canCreateSyndicate ? (
    <IconButton
      icon="add"
      variant="soft"
      accessibilityLabel={t('orgs.syndicate.createCta')}
      onPress={() => router.push(Routes.adminCreateSyndicate)}
    />
  ) : canCreateChatRoom ? (
    <IconButton
      icon="add"
      variant="soft"
      accessibilityLabel={t('orgs.chatRoom.createCta')}
      onPress={() => router.push(Routes.adminCreateChatRoom)}
    />
  ) : undefined;

  const skeletonRow = (
    <View style={{ rowGap: 8, padding: theme.spacing.md }}>
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={12} />
    </View>
  );

  return (
    <>
      {isRenewalsScope ? (
        <AdminListScreen<AdminPendingRenewalRequest>
          title={t(`orgs.type.${type}`)}
          query={renewalsQ}
          data={renewalsQ.requests}
          keyExtractor={(r) => r.id}
          skeletonRow={skeletonRow}
          emptyIcon="time-outline"
          emptyTitle={t('orgs.renewals.empty')}
          loadingMoreLabel={t('common.loadingMore')}
          filterBar={filterBar}
          renderItem={(r) => (
            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodyMedium">{r.organizationName}</Text>
                  <Caption>{formatDate(r.createdAt)}</Caption>
                </View>
                {r.note ? (
                  <Text variant="caption">
                    {t('farms.detail.renewalNote')}: {r.note}
                  </Text>
                ) : null}
                <View
                  style={{
                    flexDirection: 'row',
                    columnGap: theme.spacing.sm,
                    marginTop: theme.spacing.xs,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t('farms.detail.approveRenewal')}
                      variant="primary"
                      size="sm"
                      fullWidth
                      onPress={() => setApprovingRequest(r)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t('farms.detail.rejectRenewal')}
                      variant="danger"
                      size="sm"
                      fullWidth
                      onPress={() => setRejectingRequest(r)}
                    />
                  </View>
                </View>
              </View>
            </Card>
          )}
        />
      ) : (
        <AdminListScreen<Organization>
          title={type ? t(`orgs.type.${type}`) : t('orgs.title')}
          right={right}
          query={q}
          data={q.organizations}
          keyExtractor={(o) => o.id}
          skeletonRow={skeletonRow}
          emptyIcon="business-outline"
          emptyTitle={t('orgs.empty')}
          emptyMessage={t('orgs.emptyHint')}
          loadingMoreLabel={t('common.loadingMore')}
          filterBar={filterBar}
          renderItem={(o) => (
            <AdminRow
              title={o.name}
              subtitle={t(`orgs.type.${o.type}`)}
              badge={{ label: t(`orgs.status.${o.status}`), tone: statusTone(o.status) }}
              image={{
                uri: o.logoUrl ?? null,
                fallbackIcon: 'business-outline',
                onPress: o.logoUrl ? () => setViewerImage(o.logoUrl as string) : undefined,
              }}
              onPress={() => router.push(Routes.adminOrganization(o.id))}
            />
          )}
        />
      )}

      <RenewalApproveDialog
        visible={approvingRequest !== null}
        organizationId={approvingRequest?.organizationId ?? ''}
        requestId={approvingRequest?.id ?? null}
        onDone={() => {
          toast.show({ message: t('farms.toast.renewalApproved'), tone: 'success' });
          setApprovingRequest(null);
        }}
        onError={fail}
        onCancel={() => setApprovingRequest(null)}
      />
      <RenewalRejectDialog
        visible={rejectingRequest !== null}
        organizationId={rejectingRequest?.organizationId ?? ''}
        requestId={rejectingRequest?.id ?? null}
        onDone={() => {
          toast.show({ message: t('farms.toast.renewalRejected'), tone: 'success' });
          setRejectingRequest(null);
        }}
        onError={fail}
        onCancel={() => setRejectingRequest(null)}
      />

      <ImageViewer
        visible={viewerImage !== null}
        images={viewerImage ? [viewerImage] : []}
        onClose={() => setViewerImage(null)}
      />
    </>
  );
}
