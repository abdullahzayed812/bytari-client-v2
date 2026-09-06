import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge } from '@/components/content';
import { Skeleton } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AdminListScreen, AdminRow, FilterChips } from '../components';
import { useAdminFarms } from '../hooks';
import type { OrganizationStatus } from '../types';

type Scope = 'all' | 'pending' | 'active' | 'rejected' | 'expired';

function scopeFilter(scope: Scope): {
  status?: OrganizationStatus;
  subscriptionStatus?: 'EXPIRED';
} {
  if (scope === 'pending') return { status: 'PENDING' };
  if (scope === 'active') return { status: 'ACTIVE' };
  if (scope === 'rejected') return { status: 'REJECTED' };
  if (scope === 'expired') return { subscriptionStatus: 'EXPIRED' };
  return {};
}

function statusTone(s: OrganizationStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'ACTIVE') return 'success';
  if (s === 'PENDING') return 'info';
  if (s === 'SUSPENDED') return 'warning';
  return 'danger';
}

/** `/admin/farms` — Poultry Farms management (spec §8): approval + subscription in one place. */
export default function AdminFarmsScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const [scope, setScope] = useState<Scope>('all');

  const filter = scopeFilter(scope);
  const q = useAdminFarms(filter);

  return (
    <AdminListScreen
      title={t('farms.title')}
      query={q}
      data={q.farms}
      keyExtractor={(f) => f.organizationId}
      skeletonRow={
        <View style={{ rowGap: 8, padding: theme.spacing.md }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
      }
      emptyIcon="egg-outline"
      emptyTitle={t('farms.empty')}
      emptyMessage={t('farms.emptyHint')}
      loadingMoreLabel={t('common.loadingMore')}
      filterBar={
        <FilterChips<Scope>
          value={scope}
          onChange={(v) => setScope(v ?? 'all')}
          options={[
            { value: 'all', label: t('farms.tab.all') },
            { value: 'pending', label: t('farms.tab.pending') },
            { value: 'active', label: t('farms.tab.active') },
            { value: 'rejected', label: t('orgs.status.REJECTED') },
            { value: 'expired', label: t('farms.tab.expired') },
          ]}
        />
      }
      renderItem={(f) => (
        <AdminRow
          title={f.name}
          subtitle={`${t('farms.ownerLabel')}: ${f.ownerName}`}
          meta={
            f.subscriptionEndDate
              ? t('farms.subscriptionUntil', { date: formatDate(f.subscriptionEndDate) })
              : undefined
          }
          badge={{ label: t(`orgs.status.${f.status}`), tone: statusTone(f.status) }}
          actions={
            f.status === 'ACTIVE' ? (
              <>
                <Badge
                  label={t(`farms.subscriptionStatus.${f.subscriptionStatus}`)}
                  tone={f.subscriptionStatus === 'EXPIRED' ? 'danger' : 'success'}
                  size="sm"
                />
                {f.hasOpenRenewalRequest ? (
                  <Badge label={t('farms.renewalPendingBadge')} tone="warning" size="sm" />
                ) : null}
              </>
            ) : undefined
          }
          onPress={() => router.push(Routes.adminFarm(f.organizationId))}
        />
      )}
    />
  );
}
