import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { EmptyState, ErrorState, SkeletonText, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import {
  ContentBody,
  useAddContentComment,
  useContentComments,
  useContentFileUrl,
  useContentItem,
  useContentRating,
  useSubmitContentRating,
  useToggleContentBookmark,
  useToggleContentLike,
} from '@/features/content';
import { RatingStars } from '@/features/organizations';
import { apiErrorMessage } from '@/lib/apiError';
import { shareText } from '@/lib/share';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

/** Route `/veterinary-books/[bookId]` — full book detail. */
export default function BookDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryBooks');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const id = bookId ?? '';

  const q = useContentItem(id);
  const favorite = useToggleContentBookmark(id);
  const like = useToggleContentLike(id);
  const rating = useContentRating(id);
  const submitRating = useSubmitContentRating(id);
  const comments = useContentComments(id);
  const addComment = useAddContentComment(id);
  const [commentDraft, setCommentDraft] = useState('');

  const notFound = q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon="book-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('detail.backToList')}
          onAction={() => router.replace(Routes.veterinaryBooksHome)}
        />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const book = q.data;
  const mainFile = book?.files.find((f) => f.kind === 'MAIN');
  const cover = book?.files.find((f) => f.kind === 'COVER');
  const coverUrl = useContentFileUrl(id, cover?.id, { enabled: Boolean(cover) });
  const primaryCategory = book?.categories[0]?.name;

  const onShare = () => {
    if (!book) return;
    void shareText(book.title).then((outcome) => {
      if (outcome === 'copied') toast.show({ tone: 'success', message: tc('share.copied') });
      else if (outcome === 'unavailable') toast.show({ tone: 'info', message: tc('share.unavailable') });
    });
  };

  const submitComment = () => {
    const body = commentDraft.trim();
    if (!body || addComment.isPending) return;
    addComment.mutate(body, {
      onSuccess: () => setCommentDraft(''),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  const onRate = (value: number) => {
    if (submitRating.isPending) return;
    submitRating.mutate(value, {
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  return (
    <ScrollScreen padded={false}>
      <View>
        <View
          style={{
            width: '100%',
            aspectRatio: 3 / 4,
            maxHeight: 260,
            backgroundColor: theme.colors.surfaceAccent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {q.isLoading || !book ? null : cover && coverUrl.data?.url ? (
            <Image
              source={{ uri: coverUrl.data.url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Icon name="book-outline" size="iconXl" color="primary" />
          )}
          {primaryCategory ? (
            <View
              style={{
                position: 'absolute',
                bottom: theme.spacing.md,
                insetInlineEnd: theme.spacing.md,
                backgroundColor: theme.colors.surface,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.radius.pill,
              }}
            >
              <Text variant="label">{primaryCategory}</Text>
            </View>
          ) : null}
        </View>
        <View
          style={{
            position: 'absolute',
            top: theme.spacing.md,
            insetInlineStart: theme.spacing.md,
            insetInlineEnd: theme.spacing.md,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <IconButton
            icon="chevron-back"
            directional
            variant="soft"
            accessibilityLabel={tc('actions.back')}
            onPress={() => router.back()}
          />
          <Row gap="sm">
            {book ? (
              <IconButton
                icon={book.isBookmarked ? 'heart' : 'heart-outline'}
                variant="soft"
                accessibilityLabel={t('detail.favoriteA11y')}
                onPress={() =>
                  favorite.mutate(!book.isBookmarked, {
                    onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                  })
                }
              />
            ) : null}
            <IconButton
              icon="share-social-outline"
              variant="soft"
              accessibilityLabel={t('detail.shareA11y')}
              onPress={onShare}
            />
          </Row>
        </View>
      </View>

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
        {q.isLoading || !book ? (
          <SkeletonText lines={6} />
        ) : (
          <>
            <Section spacing="sm">
              <Heading level={2}>{book.title}</Heading>
            </Section>

            {book.authorName ? (
              <Section spacing="md">
                <Caption color="success">{book.authorName}</Caption>
              </Section>
            ) : null}

            <Section spacing="lg">
              <Row gap="sm" align="center">
                <RatingStars value={rating.data?.aggregate.average ?? book.rating.average ?? 0} />
                <Caption>
                  {(rating.data?.aggregate.count ?? book.rating.count) > 0
                    ? `(${rating.data?.aggregate.count ?? book.rating.count})`
                    : t('detail.noRatings')}
                </Caption>
              </Row>
            </Section>

            {book.description ? (
              <Section spacing="xl">
                <Card padding="lg">
                  <Row gap="xs">
                    <Text variant="bodyStrong">{t('detail.aboutTitle')}</Text>
                    <Icon name="document-text-outline" size="iconSm" color="primary" />
                  </Row>
                  <Text style={{ marginTop: theme.spacing.md }}>{book.description}</Text>
                  {book.body ? (
                    <View style={{ marginTop: theme.spacing.md }}>
                      <ContentBody body={book.body} />
                    </View>
                  ) : null}
                </Card>
              </Section>
            ) : book.body ? (
              <Section spacing="xl">
                <Card padding="lg">
                  <ContentBody body={book.body} />
                </Card>
              </Section>
            ) : null}

            <Section spacing="xl">
              <Card padding="lg">
                <Row gap="xs">
                  <Text variant="bodyStrong">{t('detail.infoTitle')}</Text>
                  <Icon name="information-circle-outline" size="iconSm" color="primary" />
                </Row>
                <View style={{ marginTop: theme.spacing.lg, rowGap: theme.spacing.md }}>
                  {book.authorName ? (
                    <InfoRow icon="person-outline" label={t('detail.author')} value={book.authorName} />
                  ) : null}
                  {primaryCategory ? (
                    <InfoRow icon="pricetag-outline" label={t('detail.category')} value={primaryCategory} />
                  ) : null}
                  {book.language ? (
                    <InfoRow icon="language-outline" label={t('detail.language')} value={book.language} />
                  ) : null}
                  {book.pageCount != null ? (
                    <InfoRow
                      icon="reader-outline"
                      label={t('detail.pageCount')}
                      value={String(book.pageCount)}
                    />
                  ) : null}
                  {book.publishYear != null ? (
                    <InfoRow
                      icon="calendar-outline"
                      label={t('detail.publishYear')}
                      value={String(book.publishYear)}
                    />
                  ) : null}
                </View>
              </Card>
            </Section>

            <Section spacing="xl">
              <Label>{t('detail.rateTitle')}</Label>
              <Row gap="md" align="center" style={{ marginTop: theme.spacing.sm }}>
                <RatingStars
                  value={rating.data?.myRating ?? 0}
                  onChange={onRate}
                  accessibilityLabel={t('detail.rateA11y')}
                />
                {rating.data?.myRating ? (
                  <Caption>{t('detail.yourRating', { value: rating.data.myRating })}</Caption>
                ) : null}
              </Row>
            </Section>

            <Section spacing="xl">
              <Label>{t('detail.interactionTitle')}</Label>
              <Row gap="md" style={{ marginTop: theme.spacing.sm }}>
                {mainFile ? <BookFileButtons contentId={book.id} fileId={mainFile.id} /> : null}
                <Button
                  label={String(book.likeCount)}
                  variant={book.isLiked ? 'primary' : 'outline'}
                  leftIcon={book.isLiked ? 'heart' : 'heart-outline'}
                  onPress={() =>
                    like.mutate(!book.isLiked, {
                      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                    })
                  }
                  accessibilityLabel={t('detail.likeA11y')}
                />
              </Row>
            </Section>

            <Section spacing="xl">
              <Label>{t('detail.commentsTitle', { count: book.commentCount })}</Label>
              <View style={{ marginTop: theme.spacing.md, rowGap: theme.spacing.md }}>
                <Row gap="sm" align="flex-end">
                  <View style={{ flex: 1 }}>
                    <Input
                      value={commentDraft}
                      onChangeText={setCommentDraft}
                      placeholder={t('detail.commentPlaceholder')}
                      accessibilityLabel={t('detail.commentPlaceholder')}
                      multiline
                    />
                  </View>
                  <IconButton
                    icon="send"
                    directional
                    accessibilityLabel={t('detail.sendComment')}
                    disabled={!commentDraft.trim() || addComment.isPending}
                    onPress={submitComment}
                  />
                </Row>
                {comments.isLoading ? (
                  <SkeletonText lines={3} />
                ) : (
                  comments.data?.items.map((c) => (
                    <Card key={c.id} variant="outlined" padding="md">
                      <Text variant="bodyStrong">
                        {c.authorName.firstName} {c.authorName.lastName}
                      </Text>
                      <Text variant="body" style={{ marginTop: 4 }}>
                        {c.body}
                      </Text>
                    </Card>
                  ))
                )}
                {comments.data && comments.data.meta.total > (comments.data.items.length ?? 0) ? (
                  <Caption>{t('detail.moreComments', { count: comments.data.meta.total })}</Caption>
                ) : null}
              </View>
            </Section>
          </>
        )}
      </View>
    </ScrollScreen>
  );
}

interface InfoRowProps {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <Row justify="space-between" align="flex-start" gap="lg">
      <Row gap="xs" style={{ flexShrink: 0 }}>
        <Icon name={icon} size="iconSm" color="primary" />
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      </Row>
      <Text style={{ flex: 1, textAlign: 'left' }}>{value}</Text>
    </Row>
  );
}

function BookFileButtons({ contentId, fileId }: { contentId: string; fileId: string }) {
  const { t } = useTranslation('veterinaryBooks');
  return (
    <>
      <Button
        label={t('detail.readCta')}
        variant="primary"
        leftIcon="book-outline"
        onPress={() => router.push(Routes.contentFile(contentId, fileId))}
        accessibilityLabel={t('detail.readCta')}
      />
      <Button
        label={t('detail.downloadCta')}
        variant="outline"
        leftIcon="download-outline"
        onPress={() => router.push(Routes.contentFile(contentId, fileId))}
        accessibilityLabel={t('detail.downloadCta')}
      />
    </>
  );
}
