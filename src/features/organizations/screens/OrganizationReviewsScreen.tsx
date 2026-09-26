import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Text } from '@/components/typography';
import { useAuth } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate, fullName } from '@/utils';

import { RatingStars, ReviewModal } from '../components';
import {
  useDeleteOwnOrganizationReview,
  useOrganizationReviews,
  usePublicOrganization,
} from '../hooks';
import type { OrganizationReviewWithAuthor } from '../types';

/**
 * "التقييمات" — every rating / written review of a clinic or veterinary
 * office, the aggregate, and the viewer's own review (add, update — one per
 * user, resubmitting updates it — or delete). Rules (valid 1–5 range, no
 * reviewing your own organization, reviewable types only) are enforced by the
 * backend; this screen only renders its answers.
 */
export default function OrganizationReviewsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { user } = useAuth();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const org = usePublicOrganization(organizationId);
  const q = useOrganizationReviews(organizationId);
  const deleteMine = useDeleteOwnOrganizationReview(organizationId ?? '');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const engagement = org.data?.engagement;
  const myReview = engagement?.myReview ?? null;

  const renderReview = ({ item }: { item: OrganizationReviewWithAuthor }) => {
    const isMine = item.userId === user?.id;
    return (
      <Card padding="lg" variant={isMine ? 'outlined' : undefined}>
        <Row justify="space-between" align="center">
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {isMine
              ? t('reviews.you')
              : fullName(item.author.firstName, item.author.lastName) || t('reviews.anonymous')}
          </Text>
          <RatingStars value={item.rating} size="sm" />
        </Row>
        {item.comment ? <Text style={{ marginTop: theme.spacing.sm }}>{item.comment}</Text> : null}
        <Caption style={{ marginTop: theme.spacing.xs }}>{formatDate(item.updatedAt)}</Caption>
      </Card>
    );
  };

  const header = (
    <View style={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
      {org.data ? <Heading level={3}>{org.data.name}</Heading> : null}
      <Card padding="lg">
        <Row justify="space-between" align="center">
          <View style={{ rowGap: 2 }}>
            {engagement?.rating != null ? (
              <Row gap="xs">
                <Text variant="bodyStrong">{engagement.rating}</Text>
                <RatingStars value={engagement.rating} size="sm" />
              </Row>
            ) : (
              <Caption>{t('clinicDetail.noRatingsYet')}</Caption>
            )}
            <Caption>
              {t('clinicDetail.reviewsCount', { count: engagement?.reviewsCount ?? 0 })}
            </Caption>
          </View>
          <View style={{ rowGap: theme.spacing.xs }}>
            <Button
              label={myReview ? t('reviews.editMine') : t('reviews.addMine')}
              size="sm"
              leftIcon="star-outline"
              onPress={() => setModalOpen(true)}
            />
            {myReview ? (
              <Button
                label={t('reviews.deleteMine')}
                size="sm"
                variant="danger"
                onPress={() => setConfirmDelete(true)}
              />
            ) : null}
          </View>
        </Row>
      </Card>
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader title={t('reviews.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.reviews}
          keyExtractor={(r) => r.id}
          renderItem={renderReview}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState icon="star-outline" title={t('reviews.empty')} />}
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('discover.loadingMore')} /> : null
          }
          contentContainerStyle={{
            padding: theme.screenPadding,
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
              onRefresh={() => {
                void q.refetch();
                void org.refetch();
              }}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}

      {organizationId ? (
        <ReviewModal
          organizationId={organizationId}
          visible={modalOpen}
          initial={myReview}
          onClose={() => setModalOpen(false)}
        />
      ) : null}

      <ConfirmationDialog
        visible={confirmDelete}
        title={t('reviews.deleteConfirmTitle')}
        message={t('reviews.deleteConfirmBody')}
        confirmLabel={t('reviews.deleteMine')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={deleteMine.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMine.mutate(undefined, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.show({ message: t('reviews.deleted'), tone: 'success' });
            },
            onError: (error) => toast.show({ message: apiErrorMessage(error), tone: 'danger' }),
          })
        }
      />
    </SafeAreaScreen>
  );
}
