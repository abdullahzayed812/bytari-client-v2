import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Icon } from '@/components/content';
import { EmptyState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { NewsPointList } from '../components';
import { NEWS_TAG_META, newsCategoryIcon } from '../constants';
import { useNewsBookmark, useNewsItem } from '../hooks';

/** Route `/news/[newsId]` — "تفاصيل الخبر": hero, meta, sections, gallery, save. */
export default function NewsDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('news');
  const { newsId } = useLocalSearchParams<{ newsId: string }>();
  const q = useNewsItem(newsId);
  const { toggleBookmark, isBookmarking } = useNewsBookmark();

  if (q.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('detail.title')} showBack />
        <Loading label={t('detail.loading')} />
      </SafeAreaScreen>
    );
  }

  if (q.isError || !q.data) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon="newspaper-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
        />
      </SafeAreaScreen>
    );
  }

  const item = q.data;
  const tagMeta = NEWS_TAG_META[item.tag];

  const metaRows: { icon: Parameters<typeof Icon>[0]['name']; label: string; value: string }[] = [];
  if (item.publishedAt) {
    metaRows.push({
      icon: 'calendar-outline',
      label: t('detail.dateLabel'),
      value: formatDate(item.publishedAt),
    });
  }
  if (item.source) {
    metaRows.push({ icon: 'business-outline', label: t('detail.sourceLabel'), value: item.source });
  }
  if (item.category) {
    metaRows.push({
      icon: newsCategoryIcon(item.category.slug),
      label: t('detail.categoryLabel'),
      value: item.category.name,
    });
  }

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('detail.title')}
        showBack
        right={<Icon name="newspaper-outline" size="iconMd" color="primary" />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.lg,
        }}
      >
        <View
          style={{
            height: 190,
            borderRadius: theme.radius.xl,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceAccent,
          }}
        >
          {item.coverImageUrl ? (
            <Image
              source={item.coverImageUrl}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="newspaper-outline" size="iconXl" color="primary" />
            </View>
          )}
          <View
            style={{
              position: 'absolute',
              top: theme.spacing.md,
              start: theme.spacing.md,
              flexDirection: 'row',
              columnGap: theme.spacing.xs,
            }}
          >
            {item.isFeatured ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: theme.spacing.xs,
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radius.pill,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: 3,
                }}
              >
                <Icon name="star" size="iconXs" color="onPrimary" />
                <Text variant="overline" style={{ color: theme.colors.onPrimary }} weight="bold">
                  {t('featured.badge')}
                </Text>
              </View>
            ) : null}
            {tagMeta.show ? (
              <Badge label={t(`tag.${item.tag}`)} tone={tagMeta.tone} size="sm" />
            ) : null}
          </View>
        </View>

        <Heading level={2}>{item.title}</Heading>

        {metaRows.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.md,
            }}
          >
            {metaRows.map((r) => (
              <View key={r.label} style={{ rowGap: 2, minWidth: 120 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: theme.spacing.xs,
                  }}
                >
                  <Icon name={r.icon} size="iconXs" color="primary" />
                  <Caption>{r.label}</Caption>
                </View>
                <Text variant="label" weight="bold">
                  {r.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {item.summary ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
            }}
          >
            <Text variant="body">{item.summary}</Text>
          </View>
        ) : null}

        {item.body ? <Text variant="body">{item.body}</Text> : null}

        <NewsPointList
          icon="stats-chart-outline"
          title={t('detail.reasons')}
          points={item.reasonPoints}
        />
        <NewsPointList
          icon="clipboard-outline"
          title={t('detail.advice')}
          points={item.advicePoints}
        />

        {item.alertNote ? (
          <View
            style={{
              backgroundColor: theme.colors.surfaceAccent,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              rowGap: theme.spacing.sm,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}
            >
              <Icon name="notifications-outline" size="iconSm" color="primary" />
              <Label style={{ color: theme.colors.primary }}>{t('detail.alert')}</Label>
            </View>
            <Text variant="body">{item.alertNote}</Text>
          </View>
        ) : null}

        {item.galleryUrls.length > 0 ? (
          <View style={{ rowGap: theme.spacing.sm }}>
            <Label>{t('detail.gallery')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {item.galleryUrls.map((url) => (
                <Image
                  key={url}
                  source={url}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.colors.surfaceAccent,
                  }}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: theme.spacing.sm }}>
          <Button
            label={item.isBookmarked ? t('actions.saved') : t('actions.save')}
            variant="secondary"
            leftIcon={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            fullWidth
            disabled={isBookmarking}
            onPress={() => toggleBookmark(item.id, !item.isBookmarked, item.bookmarkCount)}
          />
        </View>
      </ScrollView>
    </SafeAreaScreen>
  );
}
