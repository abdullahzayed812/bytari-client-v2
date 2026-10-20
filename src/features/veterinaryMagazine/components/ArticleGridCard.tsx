import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Text } from '@/components/typography';
import { useToggleContentBookmark, type ContentItem } from '@/features/content';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

/** Palette of the "جميع المقالات" reference. */
const C = {
  green: '#079653',
  border: '#E3E9E6',
  sub: '#7A8C85',
  footer: '#F9FAFB',
};

/**
 * Compact 3-up article card of the "جميع المقالات" reference: 4:3 cover with
 * a round bookmark toggle, a fixed two-line title, the author (green), the
 * publish date and a footer pill with the like / comment counts. Owns its
 * bookmark mutation (one hook per card, like `ArticleCard`).
 */
export function ArticleGridCard({
  article,
  width,
  onPress,
}: {
  article: ContentItem;
  width: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  const toast = useToast();
  const { t } = useTranslation('veterinaryMagazine');
  const toggleBookmark = useToggleContentBookmark(article.id);
  const muted = dark ? theme.colors.textMuted : C.sub;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={article.title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: dark ? theme.colors.border : C.border,
          ...theme.shadows.xs,
        },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View
        style={{
          width: '100%',
          aspectRatio: 4 / 3,
          backgroundColor: dark ? theme.colors.surfaceAccent : '#F3F4F6',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {article.coverUrl ? (
          <Image
            source={{ uri: article.coverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Icon name="newspaper-outline" size="iconLg" color="primary" />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            article.isBookmarked ? t('card.unbookmarkA11y') : t('card.bookmarkA11y')
          }
          hitSlop={8}
          disabled={toggleBookmark.isPending}
          onPress={() =>
            toggleBookmark.mutate(!article.isBookmarked, {
              onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
            })
          }
          style={{
            position: 'absolute',
            top: 6,
            end: 6,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.9)',
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.xs,
          }}
        >
          <Icon
            name={article.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={13}
            color={article.isBookmarked ? 'primary' : 'textMuted'}
          />
        </Pressable>
      </View>

      <View style={{ flex: 1, padding: 6 }}>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: theme.fontFamily.displayBold,
            fontSize: 11,
            lineHeight: 15,
            height: 30,
            marginBottom: 4,
            color: theme.colors.textPrimary,
          }}
        >
          {article.title}
        </Text>
        {article.authorName ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: theme.fontFamily.displaySemiBold,
              fontSize: 10,
              lineHeight: 14,
              color: dark ? theme.colors.primary : C.green,
            }}
          >
            {article.authorName}
          </Text>
        ) : null}
        {article.publishedAt ? (
          <Text
            numberOfLines={1}
            style={{ fontSize: 9, lineHeight: 13, color: muted, marginBottom: 6 }}
          >
            {formatDate(article.publishedAt)}
          </Text>
        ) : null}
        <View
          style={{
            marginTop: 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 6,
            paddingHorizontal: 4,
            paddingVertical: 2,
            backgroundColor: dark ? theme.colors.surfaceAccent : C.footer,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 2 }}>
            <Icon name="heart" size={12} color="danger" />
            <Text style={{ fontSize: 9, lineHeight: 13, color: muted }}>{article.likeCount}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 2 }}>
            <Icon name="chatbubble" size={11} color="textMuted" />
            <Text style={{ fontSize: 9, lineHeight: 13, color: muted }}>
              {article.commentCount}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
