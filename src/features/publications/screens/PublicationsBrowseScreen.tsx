import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View, useWindowDimensions } from 'react-native';

import { Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { BackButton } from '@/components/navigation';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { AnimalCard, PublicationCardSkeleton } from '../components';
import { PUBLICATION_KIND_META, publicationKindFromSlug, publicationKindSlug } from '../constants';
import { usePublicPublications } from '../hooks';
import type { PublicPublication } from '../types';

const GRID_GAP = 12;
const COLUMNS = 2;

/**
 * Route `/publications/[kind]` — the authenticated public browse for one kind
 * (`adoption` | `mating` | `lost`). APPROVED publications from ALL users,
 * never scoped to the caller — a directory, not "my listings". Two-column
 * grid matching the reference; "+ إضافة حيوان" opens `CreatePublicationScreen`.
 */
export default function PublicationsBrowseScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { t } = useTranslation('publications');
  const { kind: kindSlug } = useLocalSearchParams<{ kind: string }>();
  const kind = publicationKindFromSlug(kindSlug);
  const localRouter = useRouter();

  const q = usePublicPublications(kind);

  const goToDetail = (p: PublicPublication) =>
    kind && router.push(Routes.publicationDetail(publicationKindSlug(kind), p.id));
  const goToCreate = () =>
    kind && localRouter.push(Routes.publicationsCreate(publicationKindSlug(kind)));

  if (!kind) {
    return (
      <SafeAreaScreen>
        <EmptyState icon="alert-circle-outline" title={t('browse.unknownKind')} />
      </SafeAreaScreen>
    );
  }

  const meta = PUBLICATION_KIND_META[kind];
  const accent = theme.colors[meta.accent];
  const cardWidth = (width - theme.screenPadding * 2 - GRID_GAP) / COLUMNS;

  return (
    <SafeAreaScreen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
        }}
      >
        <BackButton />
        <Heading level={3}>{t(`browse.title.${kind}`)}</Heading>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('browse.addCta')}
          onPress={goToCreate}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: 4,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.pill,
              backgroundColor: accent,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Icon name="add" size="iconSm" color="onPrimary" />
          <Text variant="label" style={{ color: theme.colors.onPrimary }}>
            {t('browse.addCta')}
          </Text>
        </Pressable>
      </View>

      {q.isLoading ? (
        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: GRID_GAP,
            rowGap: GRID_GAP,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <PublicationCardSkeleton key={i} width={cardWidth} />
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
          numColumns={COLUMNS}
          columnWrapperStyle={{ columnGap: GRID_GAP }}
          renderItem={({ item }) => (
            <AnimalCard
              publication={item}
              kind={kind}
              width={cardWidth}
              onPress={() => goToDetail(item)}
            />
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
            rowGap: GRID_GAP,
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
