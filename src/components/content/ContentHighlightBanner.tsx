import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';

export interface ContentHighlightBannerProps {
  badgeLabel: string;
  badgeIcon?: IconName;
  title: string;
  summary?: string | null;
  ctaLabel: string;
  imageUrl: string | null;
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * The highlighted item banner of the "آخر الأخبار" / "النصائح" references
 * ("خبر اليوم العاجل" / "نصيحة اليوم"): soft green panel, amber pill, title,
 * a one-line summary, a "read" link and a square thumbnail.
 */
export function ContentHighlightBanner({
  badgeLabel,
  badgeIcon = 'bulb',
  title,
  summary,
  ctaLabel,
  imageUrl,
  onPress,
  accessibilityLabel,
}: ContentHighlightBannerProps) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 12,
          padding: 14,
          borderRadius: 16,
          backgroundColor: dark ? theme.colors.surfaceAccent : '#F2F8F3',
          borderWidth: 1,
          borderColor: dark ? theme.colors.border : '#DCEEE0',
          ...theme.shadows.xs,
        },
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 4,
            paddingHorizontal: 10,
            paddingVertical: 2,
            borderRadius: 999,
            backgroundColor: '#E7A700',
            marginBottom: 8,
          }}
        >
          <Icon name={badgeIcon} size={12} color="textPrimary" />
          <Text
            style={{
              fontFamily: theme.fontFamily.displayBold,
              fontSize: 10,
              lineHeight: 15,
              color: '#111827',
            }}
          >
            {badgeLabel}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: theme.fontFamily.displayBold,
            fontSize: 14,
            lineHeight: 21,
            color: theme.colors.textPrimary,
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        {summary ? (
          <Text
            numberOfLines={1}
            style={{ fontSize: 11, lineHeight: 17, color: theme.colors.textMuted, marginBottom: 8 }}
          >
            {summary}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
          <Text
            style={{
              fontFamily: theme.fontFamily.displayBold,
              fontSize: 11,
              lineHeight: 16,
              color: dark ? theme.colors.primary : '#2D8A48',
            }}
          >
            {ctaLabel}
          </Text>
          <Icon name="chevron-forward" directional size={12} color="primary" />
        </View>
      </View>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: dark ? theme.colors.border : 'rgba(229,231,235,0.8)',
          backgroundColor: theme.colors.surface,
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
          <Icon name={badgeIcon} size="iconLg" color="primary" />
        )}
      </View>
    </Pressable>
  );
}
