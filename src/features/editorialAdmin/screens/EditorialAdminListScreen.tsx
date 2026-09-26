import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Badge, Card, Chip } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Row, SafeAreaScreen } from '@/components/layout';
import { ImagePreview } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { useEditorialLifecycle, useEditorialList } from '../hooks';
import {
  EDITORIAL_STATUSES,
  isEditorialKind,
  type EditorialItem,
  type EditorialStatus,
} from '../types';

const STATUS_TONE: Record<EditorialStatus, 'neutral' | 'success' | 'warning'> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'warning',
};

/**
 * `/admin/editorial/[kind]` — Tips or News management: every item in every
 * status, publish / unpublish (archive) / delete (soft), and entry to the
 * single-page create / edit form. Every action is authorised by the backend
 * (`content.*` — ADMIN or a CONTENT supervisor).
 */
export default function EditorialAdminListScreen() {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const toast = useToast();
  const { kind: rawKind } = useLocalSearchParams<{ kind: string }>();
  const kind = isEditorialKind(rawKind) ? rawKind : 'tips';

  const [rawSearch, setRawSearch] = useState('');
  const q = useDebouncedValue(rawSearch);
  const [status, setStatus] = useState<EditorialStatus | undefined>(undefined);
  const list = useEditorialList(kind, { status, q: q || undefined });
  const { publish, archive, remove } = useEditorialLifecycle(kind);
  const [pendingDelete, setPendingDelete] = useState<EditorialItem | null>(null);

  const onError = (e: unknown) => toast.show({ message: apiErrorMessage(e), tone: 'danger' });

  const header = (
    <View style={{ rowGap: theme.spacing.sm, paddingBottom: theme.spacing.md }}>
      <SearchInput
        value={rawSearch}
        onChangeText={setRawSearch}
        onClear={() => setRawSearch('')}
        placeholder={t('editorial.searchPlaceholder')}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        <Chip
          label={t('editorial.filterAll')}
          selected={!status}
          onPress={() => setStatus(undefined)}
        />
        {EDITORIAL_STATUSES.map((s) => (
          <Chip
            key={s}
            label={t(`editorial.status.${s}`)}
            selected={status === s}
            onPress={() => setStatus(s)}
          />
        ))}
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: EditorialItem }) => (
    <Card
      variant="outlined"
      padding="md"
      onPress={() => router.push(Routes.adminEditorialEdit(kind, item.id))}
      accessibilityLabel={item.title}
    >
      <Row gap="md" align="flex-start">
        {item.coverImageUrl ? <ImagePreview uri={item.coverImageUrl} size={56} /> : null}
        <View style={{ flex: 1, rowGap: 4 }}>
          <Row justify="space-between" gap="sm">
            <Text variant="bodyStrong" numberOfLines={2} style={{ flex: 1 }}>
              {item.title}
            </Text>
            <Badge
              label={t(`editorial.status.${item.status}`)}
              tone={STATUS_TONE[item.status]}
              size="sm"
            />
          </Row>
          {item.summary ? <Caption numberOfLines={2}>{item.summary}</Caption> : null}
          <Caption>
            {item.publishedAt
              ? t('editorial.publishedAt', { date: formatDate(item.publishedAt) })
              : t('editorial.createdAt', { date: formatDate(item.createdAt) })}
          </Caption>
          <Row gap="sm" wrap style={{ marginTop: theme.spacing.xs }}>
            {item.status !== 'PUBLISHED' ? (
              <Button
                label={t('editorial.publish')}
                size="sm"
                loading={publish.isPending && publish.variables === item.id}
                onPress={() =>
                  publish.mutate(item.id, {
                    onSuccess: () =>
                      toast.show({ message: t('editorial.published'), tone: 'success' }),
                    onError,
                  })
                }
              />
            ) : (
              <Button
                label={t('editorial.unpublish')}
                size="sm"
                variant="outline"
                loading={archive.isPending && archive.variables === item.id}
                onPress={() =>
                  archive.mutate(item.id, {
                    onSuccess: () =>
                      toast.show({ message: t('editorial.unpublished'), tone: 'success' }),
                    onError,
                  })
                }
              />
            )}
            <Button
              label={t('editorial.delete')}
              size="sm"
              variant="danger"
              onPress={() => setPendingDelete(item)}
            />
          </Row>
        </View>
      </Row>
    </Card>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t(`editorial.title.${kind}`)}
        showBack
        right={
          <IconButton
            icon="add"
            accessibilityLabel={t(`editorial.add.${kind}`)}
            onPress={() => router.push(Routes.adminEditorialCreate(kind))}
          />
        }
      />

      {list.isLoading ? (
        <Loading fill />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon={kind === 'tips' ? 'bulb-outline' : 'newspaper-outline'}
              title={t('editorial.empty')}
              actionLabel={t(`editorial.add.${kind}`)}
              onAction={() => router.push(Routes.adminEditorialCreate(kind))}
            />
          }
          ListFooterComponent={
            list.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null
          }
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.sm,
            flexGrow: 1,
            paddingBottom: theme.spacing.huge,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} />
          }
        />
      )}

      <ConfirmationDialog
        visible={pendingDelete != null}
        title={t('editorial.deleteTitle')}
        message={t('editorial.deleteBody')}
        confirmLabel={t('editorial.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          remove.mutate(pendingDelete.id, {
            onSuccess: () => {
              toast.show({ message: t('editorial.deleted'), tone: 'success' });
              setPendingDelete(null);
            },
            onError: (e) => {
              onError(e);
              setPendingDelete(null);
            },
          });
        }}
      />
    </SafeAreaScreen>
  );
}
