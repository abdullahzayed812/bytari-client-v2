import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { EmptyState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { TipPointList } from '../components';
import { categoryIcon } from '../constants';
import { useTip, useTipEngagement } from '../hooks';

/** Route `/tips/[tipId]` — "تفاصيل النصيحة": hero, sections, save / helpful. */
export default function TipDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('tips');
  const { tipId } = useLocalSearchParams<{ tipId: string }>();
  const q = useTip(tipId);
  const { toggleBookmark, toggleHelpful, isBookmarking, isTogglingHelpful } = useTipEngagement();

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
          icon="bulb-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
        />
      </SafeAreaScreen>
    );
  }

  const tip = q.data;

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('detail.title')}
        showBack
        right={<Icon name="bulb-outline" size="iconMd" color="primary" />}
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
          {tip.coverImageUrl ? (
            <Image
              source={tip.coverImageUrl}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bulb-outline" size="iconXl" color="primary" />
            </View>
          )}
          {tip.isTipOfDay ? (
            <View
              style={{
                position: 'absolute',
                top: theme.spacing.md,
                start: theme.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: theme.spacing.xs,
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.pill,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 3,
              }}
            >
              <Text variant="overline" style={{ color: theme.colors.onPrimary }} weight="bold">
                {t('featured.badge')}
              </Text>
              <Icon name="star" size="iconXs" color="onPrimary" />
            </View>
          ) : null}
        </View>

        {tip.category ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              columnGap: theme.spacing.xs,
              backgroundColor: theme.colors.surfaceAccent,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
            }}
          >
            <Icon name={categoryIcon(tip.category.slug)} size="iconXs" color="primary" />
            <Text variant="label" color="success">
              {tip.category.name}
            </Text>
          </View>
        ) : null}

        <Heading level={2}>{tip.title}</Heading>

        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
            <Icon name="time-outline" size="iconXs" color="textMuted" />
            <Caption>
              {tip.readMinutes
                ? t('meta.minutes', { count: tip.readMinutes })
                : t('meta.quickRead')}
            </Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
            <Icon name="calendar-outline" size="iconXs" color="textMuted" />
            <Caption>{t('detail.updatedOn', { date: formatDate(tip.updatedAt) })}</Caption>
          </View>
        </View>

        {tip.bodyIntro ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
            }}
          >
            <Text variant="body">{tip.bodyIntro}</Text>
          </View>
        ) : null}

        <TipPointList
          icon="clipboard-outline"
          title={t('detail.keyPoints')}
          points={tip.keyPoints}
        />
        <TipPointList
          icon="warning-outline"
          title={t('detail.whenToWorry')}
          points={tip.warningPoints}
          accent="warning"
        />

        {tip.vetAdvice ? (
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
              <Icon name="medkit-outline" size="iconSm" color="primary" />
              <Label style={{ color: theme.colors.primary }}>{t('detail.vetAdvice')}</Label>
            </View>
            <Text variant="body">{tip.vetAdvice}</Text>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            columnGap: theme.spacing.md,
            marginTop: theme.spacing.sm,
          }}
        >
          <View style={{ flex: 1 }}>
            <Button
              label={tip.isBookmarked ? t('actions.saved') : t('actions.save')}
              variant="secondary"
              leftIcon={tip.isBookmarked ? 'bookmark' : 'bookmark-outline'}
              disabled={isBookmarking}
              onPress={() => toggleBookmark(tip.id, !tip.isBookmarked)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={
                tip.helpfulCount > 0
                  ? t('actions.helpfulWithCount', { count: tip.helpfulCount })
                  : t('actions.helpful')
              }
              variant={tip.isHelpful ? 'primary' : 'secondary'}
              leftIcon="thumbs-up-outline"
              disabled={isTogglingHelpful}
              onPress={() => toggleHelpful(tip.id, !tip.isHelpful, tip.helpfulCount)}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaScreen>
  );
}
