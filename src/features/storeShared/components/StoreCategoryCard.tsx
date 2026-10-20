import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { StoreAccent } from '../accents';

export interface StoreCategoryCardProps {
  title: string;
  subtitle?: string;
  icon: IconName;
  /** Admin-uploaded category image — replaces the icon when present. */
  imageUrl?: string | null;
  accent: StoreAccent;
  /**
   * `featured` — the full-width row card (first card of the Pet Owners Store
   * home); `tile` — the grid card (icon + arrow on top, text below).
   */
  variant: 'featured' | 'tile';
  onPress: () => void;
  /** Tile height (grid rows stay even). */
  height?: number;
  flex?: number;
}

/** Category entry card of the store home references. */
export function StoreCategoryCard({
  title,
  subtitle,
  icon,
  imageUrl,
  accent,
  variant,
  onPress,
  height,
  flex,
}: StoreCategoryCardProps) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  const featured = variant === 'featured';
  const box = featured ? 48 : 40;

  const iconBox = (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: 12,
        backgroundColor: dark ? theme.colors.surfaceAccent : accent.soft,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Icon name={icon} size={featured ? 24 : 20} color="textPrimary" />
      )}
    </View>
  );

  const arrow = (
    <View
      style={{
        width: featured ? 28 : 24,
        height: featured ? 28 : 24,
        borderRadius: 14,
        backgroundColor: dark ? theme.colors.surfaceAccent : accent.soft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="chevron-forward" directional size={14} color="textPrimary" />
    </View>
  );

  const text = (
    <View style={{ flexShrink: 1, minWidth: 0 }}>
      <Text
        numberOfLines={2}
        style={{
          fontFamily: theme.fontFamily.displayBold,
          fontSize: featured ? 15 : 14,
          lineHeight: featured ? 22 : 20,
          color: theme.colors.textPrimary,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          numberOfLines={2}
          style={{
            fontSize: featured ? 11 : 10,
            lineHeight: featured ? 17 : 15,
            color: theme.colors.textMuted,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex,
          minHeight: height,
          padding: featured ? 14 : 12,
          borderRadius: 16,
          backgroundColor: pressed && !dark ? accent.soft : theme.colors.surface,
          borderWidth: 1,
          borderColor: pressed ? accent.border : dark ? theme.colors.border : '#F1F5F9',
          ...theme.shadows.xs,
        },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {featured ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12 }}>
          {iconBox}
          <View style={{ flex: 1, minWidth: 0 }}>{text}</View>
          {arrow}
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'space-between', rowGap: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            {iconBox}
            {arrow}
          </View>
          {text}
        </View>
      )}
    </Pressable>
  );
}
