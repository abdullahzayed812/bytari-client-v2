import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { AnnouncementCard } from '../components';
import { useMySyndicateAccess, useSyndicateAnnouncements } from '../hooks';

/**
 * Route `/(app)/syndicates/[organizationId]/announcements` — "الإعلانات
 * والتبليغات". The "+" add button only renders for an ADMIN, the syndicate's
 * OWNER, or a supervisor explicitly granted `syndicate.announcement.manage`
 * for THIS syndicate (`useMySyndicateAccess` — the backend still re-checks
 * on every write regardless).
 */
export default function SyndicateAnnouncementsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const q = useSyndicateAnnouncements(organizationId);
  const access = useMySyndicateAccess(organizationId);

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('announcements.title')}
        showBack
        right={
          access.data?.canManageAnnouncements ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('announcements.addAnnouncement')}
              onPress={() => router.push(Routes.syndicateAnnouncementNew(organizationId))}
            />
          ) : undefined
        }
      />
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.announcements}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <AnnouncementCard
              announcement={item}
              onPress={() => router.push(Routes.syndicateAnnouncementDetails(item.id))}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          ListEmptyComponent={
            <EmptyState icon="megaphone-outline" title={t('announcements.empty')} message={t('announcements.emptyHint')} />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading label={t('announcements.loadingMore')} /> : null}
          contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge, flexGrow: 1 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
        />
      )}
    </SafeAreaScreen>
  );
}
