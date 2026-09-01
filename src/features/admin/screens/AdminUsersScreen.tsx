import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { AdminListScreen, AdminRow, FilterChips } from '../components';
import { useAdminUsers } from '../hooks';
import type { AdminUser, UserStatus } from '../types';

function statusTone(status: UserStatus): 'success' | 'warning' | 'danger' {
  return status === 'ACTIVE' ? 'success' : status === 'SUSPENDED' ? 'warning' : 'danger';
}

export default function AdminUsersScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const [rawSearch, setRawSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | undefined>(undefined);
  const search = useDebouncedValue(rawSearch, 300);

  const q = useAdminUsers({ search, status });

  return (
    <AdminListScreen<AdminUser>
      title={t('users.title')}
      query={q}
      data={q.users}
      keyExtractor={(u) => u.id}
      skeletonRow={
        <View style={{ rowGap: 8, padding: theme.spacing.md }}>
          <Skeleton width="55%" height={16} />
          <Skeleton width="75%" height={12} />
        </View>
      }
      emptyIcon="people-outline"
      emptyTitle={t('users.empty')}
      emptyMessage={t('users.emptyHint')}
      loadingMoreLabel={t('common.loadingMore')}
      filterBar={
        <>
          <View
            style={{
              paddingHorizontal: theme.screenPadding,
              paddingTop: theme.spacing.sm,
            }}
          >
            <SearchInput
              value={rawSearch}
              onChangeText={setRawSearch}
              onClear={() => setRawSearch('')}
              placeholder={t('users.searchPlaceholder')}
              accessibilityLabel={t('users.searchPlaceholder')}
            />
          </View>
          <FilterChips<UserStatus>
            value={status}
            onChange={setStatus}
            options={[
              { value: undefined, label: t('users.filter.all') },
              { value: 'ACTIVE', label: t('users.filter.active') },
              { value: 'SUSPENDED', label: t('users.filter.suspended') },
              { value: 'DEACTIVATED', label: t('users.filter.deactivated') },
            ]}
          />
        </>
      }
      renderItem={(u) => (
        <AdminRow
          title={`${u.firstName} ${u.lastName}`.trim() || u.email}
          subtitle={u.email}
          badge={{ label: t(`users.status.${u.status}`), tone: statusTone(u.status) }}
          onPress={() => router.push(Routes.adminUser(u.id))}
        />
      )}
    />
  );
}
