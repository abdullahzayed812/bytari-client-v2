import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View, useWindowDimensions } from 'react-native';

import { Chip, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { BackButton } from '@/components/navigation';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AnimalCard, PublicationCardSkeleton } from '../components';
import { PUBLICATION_KIND_META, publicationKindFromSlug, publicationKindSlug } from '../constants';
import { useMyPublicationInteractions, useMyPublications, usePublicPublications } from '../hooks';
import type { MyPublication, MyPublicationInteraction, PublicPublication } from '../types';

const GRID_GAP = 12;
const COLUMNS = 2;

type Scope = 'all' | 'mine' | 'requests';

/**
 * Route `/publications/[kind]` — the animal community for one kind
 * (`adoption` | `mating` | `lost`). Two scopes:
 *  - "الكل"      → APPROVED listings from ALL users (a directory, `GET /animal-publications`)
 *  - "منشوراتي" → the caller's OWN listings of every status (`GET /animal-publications/mine`,
 *                  owner id derived server-side). Own listings show their moderation status
 *                  and can be deleted (backend enforces owner-or-moderator).
 */
export default function PublicationsBrowseScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { t } = useTranslation('publications');
  const { kind: kindSlug } = useLocalSearchParams<{ kind: string }>();
  const kind = publicationKindFromSlug(kindSlug);
  const localRouter = useRouter();

  const [scope, setScope] = useState<Scope>('all');

  const allQ = usePublicPublications(kind, { enabled: scope === 'all' });
  const mineQ = useMyPublications(kind, { enabled: scope === 'mine' });
  const requestsQ = useMyPublicationInteractions({
    kind: kind ?? undefined,
    enabled: scope === 'requests' && Boolean(kind),
  });
  const q = scope === 'all' ? allQ : mineQ;

  const goToDetail = (p: PublicPublication) =>
    kind && router.push(Routes.publicationDetail(publicationKindSlug(kind), p.id));
  const goToOwnerDetail = (p: MyPublication) =>
    router.push(Routes.petPublication(p.animalId, p.id));
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

  const scopeRow = (
    <View
      style={{
        flexDirection: 'row',
        columnGap: theme.spacing.sm,
        paddingHorizontal: theme.screenPadding,
        paddingBottom: theme.spacing.md,
      }}
    >
      <Chip
        label={t('browse.scope.all')}
        selected={scope === 'all'}
        onPress={() => setScope('all')}
      />
      <Chip
        label={t('browse.scope.mine')}
        selected={scope === 'mine'}
        onPress={() => setScope('mine')}
      />
      <Chip
        label={t('browse.scope.requests')}
        selected={scope === 'requests'}
        onPress={() => setScope('requests')}
      />
    </View>
  );

  // "طلباتي" — my requests / sighting reports and each listing's outcome.
  const renderRequest = ({ item }: { item: MyPublicationInteraction }) => {
    const outcome =
      item.publication.status !== 'APPROVED'
        ? t('requests.pendingReview')
        : t(`resolution.status.${item.publication.resolution ?? 'AVAILABLE'}`);
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          rowGap: 4,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="bodyStrong">{item.publication.animalName}</Text>
          <Text variant="label" color={item.publication.resolution ? 'textSecondary' : 'success'}>
            {outcome}
          </Text>
        </View>
        <Caption>
          {`${t(`requests.type.${item.type}`)} · ${t('requests.sentAt', {
            date: formatDate(item.createdAt),
          })}`}
        </Caption>
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm, marginTop: 4 }}>
          <Chip
            label={t('requests.openListing')}
            onPress={() =>
              router.push(
                Routes.publicationDetail(
                  publicationKindSlug(item.publication.kind),
                  item.publicationId,
                ),
              )
            }
          />
          {item.conversationId ? (
            <Chip
              label={t('requests.chat')}
              onPress={() => router.push(Routes.chatThread(item.conversationId as string))}
            />
          ) : null}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: PublicPublication | MyPublication }) => {
    if (scope === 'mine') {
      const my = item as MyPublication;
      return (
        <AnimalCard
          publication={my}
          kind={kind}
          width={cardWidth}
          status={my.status}
          onPress={() => goToOwnerDetail(my)}
        />
      );
    }
    return (
      <AnimalCard
        publication={item}
        kind={kind}
        width={cardWidth}
        onPress={() => goToDetail(item)}
      />
    );
  };

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

      {scope === 'requests' ? (
        <FlatList
          data={requestsQ.interactions}
          keyExtractor={(i) => i.id}
          renderItem={renderRequest}
          ListHeaderComponent={scopeRow}
          ListEmptyComponent={
            requestsQ.isPending && requestsQ.isFetching ? (
              <Loading />
            ) : requestsQ.isError ? (
              <ErrorState error={requestsQ.error} onRetry={() => void requestsQ.refetch()} />
            ) : (
              <EmptyState
                icon="chatbubbles-outline"
                title={t('requests.mineEmpty')}
                message={t('requests.mineEmptyHint')}
              />
            )
          }
          contentContainerStyle={{
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.huge,
            rowGap: GRID_GAP,
            paddingHorizontal: theme.screenPadding,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (requestsQ.hasNextPage && !requestsQ.isFetchingNextPage) {
              void requestsQ.fetchNextPage();
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={requestsQ.isRefetching && !requestsQ.isFetchingNextPage}
              onRefresh={() => void requestsQ.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      ) : q.isPending && q.isFetching ? (
        <View>
          {scopeRow}
          <View
            style={{
              paddingHorizontal: theme.screenPadding,
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
        </View>
      ) : q.isError ? (
        <View>
          {scopeRow}
          <View style={{ paddingHorizontal: theme.screenPadding }}>
            <ErrorState error={q.error} onRetry={() => void q.refetch()} />
          </View>
        </View>
      ) : (
        <FlatList
          data={q.publications}
          keyExtractor={(p) => p.id}
          numColumns={COLUMNS}
          columnWrapperStyle={{ columnGap: GRID_GAP }}
          renderItem={renderItem}
          ListHeaderComponent={
            <View>
              {scopeRow}
              {q.total > 0 ? (
                <Caption style={{ paddingBottom: theme.spacing.sm }}>
                  {t('browse.count', { count: q.total })}
                </Caption>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="file-tray-outline"
              title={scope === 'mine' ? t('browse.mineEmpty') : t(`browse.empty.${kind}`)}
              message={scope === 'mine' ? t('browse.mineEmptyHint') : undefined}
            />
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
