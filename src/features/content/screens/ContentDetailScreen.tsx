import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, View } from 'react-native';

import { Badge, Chip, Divider, Icon } from '@/components/content';
import { EmptyState, ErrorState, SkeletonText } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { ContentBody, ContentFileRow } from '../components';
import { CONTENT_TYPE_META } from '../constants';
import { useContentFileUrl, useContentItem } from '../hooks';

/**
 * Route `/content/item/[contentId]`. A DRAFT / ARCHIVED / deleted / unknown id
 * returns `404` from the backend and collapses to a neutral not-found state —
 * unpublished content can never be reached (§17, §18). Only the safe
 * `ContentItem` fields are shown; no `status` / author-id / moderation metadata.
 */
export default function ContentDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('content');
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const id = contentId ?? '';

  const q = useContentItem(id);
  const item = q.data;

  const cover = item?.files.find((f) => f.kind === 'COVER');
  const coverUrl = useContentFileUrl(id, cover?.id, { enabled: Boolean(cover) });
  const docFiles = item?.files.filter((f) => f.kind !== 'COVER') ?? [];

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon="library-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('detail.backToContent')}
          onAction={() => router.replace(Routes.contentHome)}
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

  const meta = item ? CONTENT_TYPE_META[item.type] : null;

  return (
    <ScrollScreen>
      <AppHeader title={t('detail.title')} showBack />

      {q.isLoading || !item || !meta ? (
        <Section spacing="xl">
          <SkeletonText lines={8} />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            {cover && coverUrl.data?.url ? (
              <Image
                source={{ uri: coverUrl.data.url }}
                accessibilityLabel={t('detail.coverAlt', { title: item.title })}
                style={{
                  width: '100%',
                  aspectRatio: 16 / 10,
                  borderRadius: theme.radius.xl,
                  backgroundColor: theme.colors.surfaceAccent,
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surfaceAccent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={meta.icon} size="iconLg" color="primary" />
              </View>
            )}

            <Row gap="xs" wrap style={{ marginTop: theme.spacing.md }}>
              <Badge label={t(`type.${item.type}`)} tone={meta.tone} size="md" />
              {item.publishedAt ? (
                <Caption>{t('detail.publishedOn', { date: formatDate(item.publishedAt) })}</Caption>
              ) : null}
            </Row>

            <Heading level={2} numberOfLines={4} style={{ marginTop: theme.spacing.sm }}>
              {item.title}
            </Heading>

            {item.authorName ? (
              <Caption style={{ marginTop: 4 }}>
                {t('card.by', { author: item.authorName })}
              </Caption>
            ) : null}

            {item.categories.length > 0 ? (
              <Row gap="xs" wrap style={{ marginTop: theme.spacing.sm }}>
                {item.categories.map((c) => (
                  <Chip key={c.id} label={c.name} />
                ))}
              </Row>
            ) : null}
          </Section>

          {item.description ? (
            <Section spacing="lg">
              <Text variant="subtitle">{item.description}</Text>
            </Section>
          ) : null}

          {item.body ? (
            <Section spacing="lg">
              <ContentBody body={item.body} />
            </Section>
          ) : null}

          {docFiles.length > 0 ? (
            <Section spacing="lg">
              <Label>{t('detail.filesTitle')}</Label>
              <View style={{ rowGap: theme.spacing.sm }}>
                {docFiles.map((f) => (
                  <ContentFileRow
                    key={f.id}
                    file={f}
                    onPress={() => router.push(Routes.contentFile(item.id, f.id))}
                  />
                ))}
              </View>
            </Section>
          ) : null}

          {!item.body && !item.description && docFiles.length === 0 ? (
            <Section spacing="lg">
              <Divider />
              <Caption>{t('detail.noContent')}</Caption>
            </Section>
          ) : null}
        </>
      )}
    </ScrollScreen>
  );
}
