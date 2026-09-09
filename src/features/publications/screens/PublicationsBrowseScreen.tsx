import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View, useWindowDimensions } from 'react-native';

import { Chip, Icon } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { BackButton } from '@/components/navigation';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { AnimalCard, PublicationCardSkeleton } from '../components';
import { PUBLICATION_KIND_META, publicationKindFromSlug, publicationKindSlug } from '../constants';
import { useDeletePublication, useMyPublications, usePublicPublications } from '../hooks';
import type { MyPublication, PublicPublication } from '../types';

const GRID_GAP = 12;
const COLUMNS = 2;

type Scope = 'all' | 'mine';

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
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { kind: kindSlug } = useLocalSearchParams<{ kind: string }>();
  const kind = publicationKindFromSlug(kindSlug);
  const localRouter = useRouter();

  const [scope, setScope] = useState<Scope>('all');
  const [pendingDelete, setPendingDelete] = useState<MyPublication | null>(null);

  const allQ = usePublicPublications(kind, { enabled: scope === 'all' });
  const mineQ = useMyPublications(kind, { enabled: scope === 'mine' });
  const q = scope === 'all' ? allQ : mineQ;
  const del = useDeletePublication();

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
    </View>
  );

  const renderItem = ({ item }: { item: PublicPublication | MyPublication }) => {
    if (scope === 'mine') {
      const my = item as MyPublication;
      return (
        <AnimalCard
          publication={my}
          kind={kind}
          width={cardWidth}
          status={my.status}
          onDelete={() => setPendingDelete(my)}
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

      {q.isLoading ? (
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

      <ConfirmationDialog
        visible={pendingDelete !== null}
        title={t('mine.deleteTitle')}
        message={t('mine.deleteBody')}
        confirmLabel={t('mine.deleteConfirm')}
        cancelLabel={tc('actions.cancel')}
        destructive
        loading={del.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          if (!target) return;
          del.mutate(
            { publicationId: target.id, kind: target.kind, animalId: target.animalId },
            {
              onSuccess: () => {
                toast.show({ tone: 'success', message: t('mine.deleteSuccess') });
                setPendingDelete(null);
              },
              onError: (error) => {
                toast.show({ tone: 'danger', message: apiErrorMessage(error) });
                setPendingDelete(null);
              },
            },
          );
        }}
      />
    </SafeAreaScreen>
  );
}
