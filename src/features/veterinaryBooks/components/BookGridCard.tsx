import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useToggleContentBookmark, type ContentItem } from '@/features/content';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

/** Palette of the "الكتب البيطرية" references. */
export const BOOKS_C = {
  primary: '#079653',
  primaryDark: '#087A4A',
  primaryLight: '#EFFAF4',
  border: '#DFE9E3',
  gold: '#F6B81A',
};

/**
 * Compact 3-up book card of the "الكتب البيطرية" / "عرض كل الكتب" references:
 * bookmark toggle, 3:4 cover, centred title / author / category, gold stars
 * with the review count, and «قراءة» / «تحميل» buttons (both open the book's
 * file through the existing file screen; a book without a file opens its
 * details instead). Owns its bookmark mutation (one hook per card).
 */
export function BookGridCard({
  book,
  width,
  onPress,
}: {
  book: ContentItem;
  width: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  const toast = useToast();
  const { t } = useTranslation('veterinaryBooks');
  const toggleBookmark = useToggleContentBookmark(book.id);
  const mainFile = book.files.find((f) => f.kind === 'MAIN');
  const openFile = () =>
    mainFile ? router.push(Routes.contentFile(book.id, mainFile.id)) : onPress();
  const stars = Math.round(book.rating.average ?? 0);
  const primary = dark ? theme.colors.primary : BOOKS_C.primary;

  const action = (label: string, icon: IconName, filled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} — ${book.title}`}
      onPress={openFile}
      hitSlop={4}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 2,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: filled ? primary : theme.colors.surface,
        borderWidth: filled ? 0 : 1,
        borderColor: primary,
        transform: pressed ? [{ scale: 0.95 }] : undefined,
      })}
    >
      <Icon name={icon} size={10} color={filled ? 'onPrimary' : 'primary'} />
      <Text
        numberOfLines={1}
        style={{
          fontFamily: theme.fontFamily.displayBold,
          fontSize: 9,
          lineHeight: 13,
          color: filled ? '#FFFFFF' : primary,
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={book.title}
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        padding: 6,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: pressed ? primary : dark ? theme.colors.border : BOOKS_C.border,
        ...theme.shadows.xs,
      })}
    >
      <View
        style={{
          width: '100%',
          aspectRatio: 3 / 4,
          borderRadius: 6,
          overflow: 'hidden',
          marginBottom: 6,
          backgroundColor: dark ? theme.colors.surfaceAccent : '#F3F4F6',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {book.coverUrl ? (
          <Image
            source={{ uri: book.coverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Icon name="book-outline" size="iconLg" color="primary" />
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={book.isBookmarked ? t('card.unfavoriteA11y') : t('card.favoriteA11y')}
        hitSlop={8}
        disabled={toggleBookmark.isPending}
        onPress={() =>
          toggleBookmark.mutate(!book.isBookmarked, {
            onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
          })
        }
        style={{
          position: 'absolute',
          top: 10,
          start: 10,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: 'rgba(255,255,255,0.9)',
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadows.xs,
        }}
      >
        <Icon
          name={book.isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={12}
          color="primary"
        />
      </Pressable>

      <Text
        numberOfLines={2}
        center
        style={{
          fontFamily: theme.fontFamily.displayBold,
          fontSize: 11,
          lineHeight: 16,
          minHeight: 32,
          color: theme.colors.textPrimary,
        }}
      >
        {book.title}
      </Text>
      {book.authorName ? (
        <Text
          numberOfLines={1}
          center
          style={{ fontSize: 9, lineHeight: 13, color: theme.colors.textMuted }}
        >
          {book.authorName}
        </Text>
      ) : null}
      {book.categories[0] ? (
        <Text
          numberOfLines={1}
          center
          style={{
            fontFamily: theme.fontFamily.displaySemiBold,
            fontSize: 8,
            lineHeight: 12,
            color: primary,
          }}
        >
          {book.categories[0].name}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: 1,
          marginTop: 2,
          marginBottom: 6,
        }}
        accessible
        accessibilityLabel={t('card.ratingA11y', {
          value: (book.rating.average ?? 0).toFixed(1),
          count: book.rating.count,
        })}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Icon key={i} name={i <= stars ? 'star' : 'star-outline'} size={9} color="warning" />
        ))}
        <Text
          style={{ fontSize: 8, lineHeight: 12, color: theme.colors.textMuted, marginStart: 2 }}
        >
          ({book.rating.count})
        </Text>
      </View>
      <View style={{ flexDirection: 'row', columnGap: 4, marginTop: 'auto' }}>
        {action(t('card.read'), 'book-outline', true)}
        {action(t('card.download'), 'download-outline', false)}
      </View>
    </Pressable>
  );
}
