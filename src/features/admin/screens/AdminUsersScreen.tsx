import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { ImageViewer } from '@/components/media';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { AdminListScreen, AdminRow, FilterChips } from '../components';
import { useAdminUsers } from '../hooks';
import type { AdminUser, UserStatus } from '../types';

function statusTone(status: UserStatus): 'success' | 'info' | 'warning' | 'danger' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PENDING_VERIFICATION') return 'info';
  if (status === 'SUSPENDED') return 'warning';
  return 'danger';
}

const FILTERABLE_ROLES = new Set(['PET_OWNER', 'VETERINARIAN']);

/**
 * `/admin/users?role=PET_OWNER|VETERINARIAN` — optionally scoped to one role
 * (the admin dashboard's "أصحاب الحيوانات" / "الأطباء البيطريون" cards);
 * omitted shows every user, same as before this param existed.
 */
export default function AdminUsersScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role =
    roleParam && FILTERABLE_ROLES.has(roleParam)
      ? (roleParam as 'PET_OWNER' | 'VETERINARIAN')
      : undefined;
  const [rawSearch, setRawSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | undefined>(undefined);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const search = useDebouncedValue(rawSearch, 300);

  const q = useAdminUsers({ search, status, role });

  return (
    <>
      <AdminListScreen<AdminUser>
        title={
          role
            ? t(`dashboard.cards.${role === 'PET_OWNER' ? 'petOwners' : 'veterinarians'}.title`)
            : t('users.title')
        }
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
            image={{
              uri: u.avatarUrl ?? null,
              fallbackIcon: 'person-outline',
              onPress: u.avatarUrl ? () => setViewerImage(u.avatarUrl as string) : undefined,
            }}
            badge={{ label: t(`users.status.${u.status}`), tone: statusTone(u.status) }}
            onPress={() => router.push(Routes.adminUser(u.id))}
          />
        )}
      />

      <ImageViewer
        visible={viewerImage !== null}
        images={viewerImage ? [viewerImage] : []}
        onClose={() => setViewerImage(null)}
      />
    </>
  );
}
