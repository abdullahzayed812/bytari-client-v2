import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { BadgeTone } from './Badge';
import { Icon, type IconName } from './Icon';

/** Badge fills of the "آخر الأخبار" / "النصائح" references (e.g. «مهم» amber, «موصى بها» green). */
const BADGE_FILL: Record<BadgeTone, string> = {
  danger: '#DC2626',
  warning: '#E7A700',
  success: '#19883C',
  primary: '#135C34',
  info: '#0284C7',
  neutral: '#64748B',
};

export interface ContentGridCardProps {
  width: number;
  title: string;
  imageUrl: string | null;
  /** Icon shown in the image well when there is no cover. */
  fallbackIcon: IconName;
  badge?: { label: string; tone: BadgeTone } | null;
  /** Category chip under the title. */
  chip?: string | null;
  /** Footer meta (reading time / date) with its icon. */
  meta?: { icon: IconName; text: string } | null;
  bookmark?: {
    saved: boolean;
    onToggle: (next: boolean) => void;
    saveLabel: string;
    unsaveLabel: string;
  };
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * Compact 3-up content card of the "آخر الأخبار" / "النصائح" references: 4:3
 * cover with a corner badge, a two-line title (fixed height, so a row of
 * cards stays even), a soft category chip, and a footer with the meta line
 * and the bookmark toggle. Used by the full news / tips grids and by the
 * three-card previews on the section home pages.
 */
export function ContentGridCard({
  width,
  title,
  imageUrl,
  fallbackIcon,
  badge,
  chip,
  meta,
  bookmark,
  onPress,
  accessibilityLabel,
}: ContentGridCardProps) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: pressed ? theme.colors.primary : dark ? theme.colors.border : '#F3F4F6',
          ...theme.shadows.xs,
        },
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
        {imageUrl ? (
          <Image
            source={imageUrl}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Icon name={fallbackIcon} size="iconLg" color="primary" />
        )}
        {badge ? (
          <View
            style={{
              position: 'absolute',
              top: 6,
              start: 6,
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: 6,
              backgroundColor: BADGE_FILL[badge.tone],
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: theme.fontFamily.displayBold,
                fontSize: 9,
                lineHeight: 14,
                color: '#FFFFFF',
              }}
            >
              {badge.label}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, padding: 8, justifyContent: 'space-between', rowGap: 6 }}>
        <View style={{ rowGap: 6 }}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: theme.fontFamily.displayBold,
              fontSize: 11,
              lineHeight: 17,
              minHeight: 34,
              color: theme.colors.textPrimary,
            }}
          >
            {title}
          </Text>
          {chip ? (
            <View
              style={{
                alignSelf: 'flex-start',
                maxWidth: '100%',
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 4,
                backgroundColor: dark ? theme.colors.surfaceAccent : '#E9F3E9',
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: theme.fontFamily.displaySemiBold,
                  fontSize: 9,
                  lineHeight: 14,
                  color: dark ? theme.colors.primary : '#073D24',
                }}
              >
                {chip}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: dark ? theme.colors.border : '#F9FAFB',
          }}
        >
          {meta ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: 3, flexShrink: 1 }}
            >
              <Icon name={meta.icon} size={11} color="textMuted" />
              <Text
                numberOfLines={1}
                style={{ fontSize: 9, lineHeight: 14, color: theme.colors.textMuted }}
              >
                {meta.text}
              </Text>
            </View>
          ) : (
            <View />
          )}
          {bookmark ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={bookmark.saved ? bookmark.unsaveLabel : bookmark.saveLabel}
              hitSlop={10}
              onPress={() => bookmark.onToggle(!bookmark.saved)}
            >
              <Icon
                name={bookmark.saved ? 'bookmark' : 'bookmark-outline'}
                size={13}
                color={bookmark.saved ? 'primary' : 'textMuted'}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
