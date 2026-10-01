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
import type { AdminAccountType, AdminUser, UserStatus } from '../types';

function statusTone(status: UserStatus): 'success' | 'info' | 'warning' | 'danger' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PENDING_VERIFICATION') return 'info';
  if (status === 'SUSPENDED') return 'warning';
  return 'danger';
}

const ACCOUNT_TYPES = new Set<string>(['PET_OWNER', 'VETERINARIAN']);

/**
 * `/admin/users?accountType=PET_OWNER|VETERINARIAN` — optionally scoped to one
 * audience (the admin dashboard's "أصحاب الحيوانات" / "الأطباء البيطريون"
 * cards). The split is enforced by the server (`GET /admin/users?accountType=`),
 * never filtered here; omitted shows every user.
 */
export default function AdminUsersScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const { accountType: accountTypeParam } = useLocalSearchParams<{ accountType?: string }>();
  const accountType =
    accountTypeParam && ACCOUNT_TYPES.has(accountTypeParam)
      ? (accountTypeParam as AdminAccountType)
      : undefined;
  const [rawSearch, setRawSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | undefined>(undefined);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const search = useDebouncedValue(rawSearch, 300);

  const q = useAdminUsers({ search, status, accountType });

  return (
    <>
      <AdminListScreen<AdminUser>
        title={
          accountType
            ? t(
                `dashboard.cards.${accountType === 'PET_OWNER' ? 'petOwners' : 'veterinarians'}.title`,
              )
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
