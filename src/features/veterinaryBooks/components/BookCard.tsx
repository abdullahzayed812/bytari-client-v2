import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Caption, Text } from '@/components/typography';
import { RatingStars } from '@/features/organizations';
import { useToggleContentBookmark, type ContentItem } from '@/features/content';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

export interface BookCardProps {
  book: ContentItem;
  onPress: () => void;
  /** Card width — the home screen uses a fixed card in a horizontal rail, the
   * category screen a 2-column grid. */
  width?: number;
}

/**
 * Grid/rail card for a Veterinary Books entry, matching the reference design.
 * No cover-image thumbnail — same reasoning as `ArticleCard`: the backend's
 * list DTO never exposes a direct file URL, so this renders a themed book
 * icon instead of an N+1 per-card download call.
 *
 * Owns its own bookmark-toggle mutation (one fixed hook call per card
 * instance) rather than the parent list managing a variable-length set of
 * mutations, which would violate the rules of hooks.
 */
export function BookCard({ book, onPress, width }: BookCardProps) {
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation('veterinaryBooks');
  const toggleBookmark = useToggleContentBookmark(book.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={book.title}
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
          height: 130,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="book-outline" size="iconXl" color="textMuted" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={book.isBookmarked ? t('card.unfavoriteA11y') : t('card.favoriteA11y')}
          onPress={(e) => {
            e.stopPropagation();
            toggleBookmark.mutate(!book.isBookmarked, {
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
            name={book.isBookmarked ? 'heart' : 'heart-outline'}
            size="iconXs"
            color={book.isBookmarked ? 'danger' : 'surface'}
          />
        </Pressable>
      </View>

      <View style={{ padding: theme.spacing.md, rowGap: 4 }}>
        <Text variant="bodyMedium" numberOfLines={2}>
          {book.title}
        </Text>
        {book.authorName ? (
          <Caption color="success" numberOfLines={1}>
            {book.authorName}
          </Caption>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, marginTop: 2 }}>
          <RatingStars value={book.rating.average ?? 0} size="sm" />
          {book.rating.count > 0 ? <Caption>({book.rating.count})</Caption> : null}
        </View>
      </View>
    </Pressable>
  );
}
