import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { AdminListScreen, AdminRow, FilterChips } from '../components';
import { useAdminOrganizations } from '../hooks';
import type { Organization, OrganizationStatus, OrganizationType } from '../types';

const FILTERABLE_TYPES = new Set<OrganizationType>([
  'CLINIC',
  'VETERINARY_OFFICE',
  'SYNDICATE',
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
export default function AdminOrganizationsScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();
  const type =
    typeParam && FILTERABLE_TYPES.has(typeParam as OrganizationType)
      ? (typeParam as OrganizationType)
      : undefined;
  const [scope, setScope] = useState<'all' | 'pending'>('all');

  const q = useAdminOrganizations({ pending: scope === 'pending', type });

  return (
    <AdminListScreen<Organization>
      title={type ? t(`orgs.type.${type}`) : t('orgs.title')}
      query={q}
      data={q.organizations}
      keyExtractor={(o) => o.id}
      skeletonRow={
        <View style={{ rowGap: 8, padding: theme.spacing.md }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
      }
      emptyIcon="business-outline"
      emptyTitle={t('orgs.empty')}
      emptyMessage={t('orgs.emptyHint')}
      loadingMoreLabel={t('common.loadingMore')}
      filterBar={
        <FilterChips<'all' | 'pending'>
          value={scope}
          onChange={(v) => setScope(v ?? 'all')}
          options={[
            { value: 'all', label: t('orgs.tab.all') },
            { value: 'pending', label: t('orgs.tab.pending') },
          ]}
        />
      }
      renderItem={(o) => (
        <AdminRow
          title={o.name}
          subtitle={t(`orgs.type.${o.type}`)}
          badge={{ label: t(`orgs.status.${o.status}`), tone: statusTone(o.status) }}
          onPress={() => router.push(Routes.adminOrganization(o.id))}
        />
      )}
    />
  );
}
