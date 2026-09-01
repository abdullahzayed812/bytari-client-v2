import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { PublicationCard, PublicationCardSkeleton } from '../components';
import { publicationKindFromSlug, publicationKindSlug } from '../constants';
import { usePublicPublications } from '../hooks';
import type { PublicPublication } from '../types';

/**
 * Route `/publications/[kind]` — the authenticated public browse for one kind
 * (`adoption` | `mating` | `lost`). APPROVED publications only, backend-paginated.
 * The backend exposes no filters beyond `kind`, so there is no filter UI.
 */
export default function PublicationsBrowseScreen() {
  const theme = useTheme();
  const { t } = useTranslation('publications');
  const { kind: kindSlug } = useLocalSearchParams<{ kind: string }>();
  const kind = publicationKindFromSlug(kindSlug);

  const q = usePublicPublications(kind);

  const goToDetail = (p: PublicPublication) =>
    kind && router.push(Routes.publicationDetail(publicationKindSlug(kind), p.id));

  if (!kind) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('browse.title.ADOPTION')} showBack />
        <EmptyState icon="alert-circle-outline" title={t('browse.unknownKind')} />
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader title={t(`browse.title.${kind}`)} showBack />

      {q.isLoading ? (
        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            rowGap: theme.spacing.md,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <PublicationCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.publications}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PublicationCard publication={item} onPress={() => goToDetail(item)} />
          )}
          ListHeaderComponent={
            q.total > 0 ? (
              <Caption style={{ paddingBottom: theme.spacing.sm }}>
                {t('browse.count', { count: q.total })}
              </Caption>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState icon="file-tray-outline" title={t(`browse.empty.${kind}`)} />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching && !q.isFetchingNextPage}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaScreen>
  );
}
