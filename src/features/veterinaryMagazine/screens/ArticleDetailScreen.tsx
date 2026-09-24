import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading, SkeletonText, useToast } from '@/components/feedback';
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
  useToggleContentBookmark,
  useToggleContentLike,
} from '@/features/content';
import { apiErrorMessage } from '@/lib/apiError';
import { shareText } from '@/lib/share';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

/** Route `/veterinary-magazine/[articleId]` — full article reader. */
export default function ArticleDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryMagazine');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  const id = articleId ?? '';

  const q = useContentItem(id);
  const bookmark = useToggleContentBookmark(id);
  const like = useToggleContentLike(id);
  const comments = useContentComments(id);
  const addComment = useAddContentComment(id);
  const [commentDraft, setCommentDraft] = useState('');

  // Called before the early returns so the hook order is identical on every render.
  const cover = q.data?.files.find((f) => f.kind === 'COVER');
  const coverUrl = useContentFileUrl(id, cover?.id, { enabled: Boolean(cover) });

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon="newspaper-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('detail.backToList')}
          onAction={() => router.replace(Routes.veterinaryMagazineHome)}
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

  const article = q.data;
  const mainFile = article?.files.find((f) => f.kind === 'MAIN');
  const attachments = article?.files.filter((f) => f.kind === 'ATTACHMENT') ?? [];
  const primaryCategory = article?.categories[0]?.name;

  const onShare = () => {
    if (!article) return;
    void shareText(article.title).then((outcome) => {
      if (outcome === 'copied') toast.show({ tone: 'success', message: tc('share.copied') });
      else if (outcome === 'unavailable')
        toast.show({ tone: 'info', message: tc('share.unavailable') });
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

  return (
    <ScrollScreen padded={false}>
      <View>
        <View
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            backgroundColor: theme.colors.surfaceAccent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {q.isLoading || !article ? null : cover && coverUrl.data?.url ? (
            <Image
              source={{ uri: coverUrl.data.url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Icon name="newspaper-outline" size="iconXl" color="primary" />
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
            {article ? (
              <IconButton
                icon={article.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                variant="soft"
                accessibilityLabel={t('detail.bookmarkA11y')}
                onPress={() =>
                  bookmark.mutate(!article.isBookmarked, {
                    onError: (error) =>
                      toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
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
        {q.isLoading || !article ? (
          <SkeletonText lines={6} />
        ) : (
          <>
            <Section spacing="lg">
              <Heading level={2}>{article.title}</Heading>
            </Section>

            {article.authorName ? (
              <Section spacing="lg">
                <Row gap="md" align="center">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: theme.radius.pill,
                      backgroundColor: theme.colors.surfaceAccent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="person-outline" size="iconMd" color="primary" />
                  </View>
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    {article.authorName}
                  </Text>
                </Row>
              </Section>
            ) : null}

            <Section spacing="xl">
              <Row gap="lg" wrap>
                {article.publishedAt ? (
                  <Row gap="xs">
                    <Icon name="calendar-outline" size="iconXs" color="textMuted" />
                    <Caption>{formatDate(article.publishedAt)}</Caption>
                  </Row>
                ) : null}
                <Row gap="xs">
                  <Icon name="chatbubble-outline" size="iconXs" color="textMuted" />
                  <Caption>{article.commentCount}</Caption>
                </Row>
                <Row gap="xs">
                  <Icon
                    name={article.isLiked ? 'heart' : 'heart-outline'}
                    size="iconXs"
                    color={article.isLiked ? 'danger' : 'textMuted'}
                  />
                  <Caption>{article.likeCount}</Caption>
                </Row>
              </Row>
            </Section>

            {article.body ? (
              <Section spacing="xl">
                <ContentBody body={article.body} />
              </Section>
            ) : null}

            {attachments.length > 0 ? (
              <Section spacing="xl">
                <Label>{t('detail.imagesTitle')}</Label>
                <Row gap="sm" wrap style={{ marginTop: theme.spacing.sm }}>
                  {attachments.map((f) => (
                    <ArticleAttachmentImage key={f.id} contentId={article.id} fileId={f.id} />
                  ))}
                </Row>
              </Section>
            ) : null}

            <Section spacing="xl">
              <Label>{t('detail.interactionTitle')}</Label>
              <Row gap="md" style={{ marginTop: theme.spacing.sm }}>
                {mainFile ? (
                  <ArticleDownloadButton contentId={article.id} fileId={mainFile.id} />
                ) : null}
                <Button
                  label={String(article.likeCount)}
                  variant={article.isLiked ? 'primary' : 'outline'}
                  leftIcon={article.isLiked ? 'heart' : 'heart-outline'}
                  onPress={() =>
                    like.mutate(!article.isLiked, {
                      onError: (error) =>
                        toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                    })
                  }
                  accessibilityLabel={t('detail.likeA11y')}
                />
                <Button
                  label={String(article.commentCount)}
                  variant="outline"
                  leftIcon="chatbubble-outline"
                  disabled
                  accessibilityLabel={t('detail.commentsCountA11y')}
                />
              </Row>
            </Section>

            <Section spacing="xl">
              <Label>{t('detail.commentsTitle', { count: article.commentCount })}</Label>
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

function ArticleAttachmentImage({ contentId, fileId }: { contentId: string; fileId: string }) {
  const theme = useTheme();
  const download = useContentFileUrl(contentId, fileId);
  return (
    <View
      style={{
        width: 96,
        height: 96,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceAccent,
        overflow: 'hidden',
      }}
    >
      {download.data?.url ? (
        <Image
          source={{ uri: download.data.url }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Loading />
        </View>
      )}
    </View>
  );
}

function ArticleDownloadButton({ contentId, fileId }: { contentId: string; fileId: string }) {
  const { t } = useTranslation('veterinaryMagazine');
  return (
    <Button
      label={t('detail.downloadCta')}
      variant="outline"
      leftIcon="download-outline"
      onPress={() => router.push(Routes.contentFile(contentId, fileId))}
      accessibilityLabel={t('detail.downloadCta')}
    />
  );
}
