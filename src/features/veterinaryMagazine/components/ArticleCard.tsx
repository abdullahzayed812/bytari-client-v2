import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Caption, Text } from '@/components/typography';
import { useToggleContentBookmark, type ContentItem } from '@/features/content';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

export interface ArticleCardProps {
  article: ContentItem;
  onPress: () => void;
  /** Card width — the home screen uses a fixed card in a horizontal rail, the
   * category screen a 2-column grid. */
  width?: number;
}

/**
 * Grid/rail card for a Veterinary Magazine article, matching the reference
 * design. No cover-image thumbnail: the backend's list DTO never exposes a
 * direct file URL (only a per-file signed `/download` endpoint, resolved one
 * at a time on the detail screen) — showing a real thumbnail per card would
 * mean one extra network round-trip per card, so — like the existing generic
 * `ContentCard` — this renders a themed type icon instead.
 *
 * Owns its own bookmark-toggle mutation (one fixed hook call per card
 * instance) rather than the parent list managing a variable-length set of
 * mutations, which would violate the rules of hooks.
 */
export function ArticleCard({ article, onPress, width }: ArticleCardProps) {
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation('veterinaryMagazine');
  const toggleBookmark = useToggleContentBookmark(article.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={article.title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View
        style={{
          height: 100,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="newspaper-outline" size="iconXl" color="textMuted" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={article.isBookmarked ? t('card.unbookmarkA11y') : t('card.bookmarkA11y')}
          onPress={(e) => {
            e.stopPropagation();
            toggleBookmark.mutate(!article.isBookmarked, {
              onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
            });
          }}
          hitSlop={8}
          style={{
            position: 'absolute',
            top: theme.spacing.sm,
            insetInlineStart: theme.spacing.sm,
            width: 28,
            height: 28,
            borderRadius: theme.radius.pill,
            backgroundColor: 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={article.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size="iconXs"
            color={article.isBookmarked ? 'warning' : 'surface'}
          />
        </Pressable>
      </View>

      <View style={{ padding: theme.spacing.md, rowGap: 4 }}>
        <Text variant="bodyMedium" numberOfLines={2}>
          {article.title}
        </Text>
        {article.authorName ? (
          <Caption color="success" numberOfLines={1}>
            {article.authorName}
          </Caption>
        ) : null}
        {article.publishedAt ? (
          <Caption numberOfLines={1}>{formatDate(article.publishedAt)}</Caption>
        ) : null}
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md, marginTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
            <Icon name="chatbubble-outline" size="iconXs" color="textMuted" />
            <Caption>{article.commentCount}</Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
            <Icon
              name={article.isLiked ? 'heart' : 'heart-outline'}
              size="iconXs"
              color={article.isLiked ? 'danger' : 'textMuted'}
            />
            <Caption>{article.likeCount}</Caption>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
