import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { StoreAccent } from '../accents';

export interface StoreGridProductCardProps {
  width: number;
  title: string;
  /** Category / short description line under the name. */
  subtitle?: string | null;
  imageUrl: string | null;
  /** Already formatted amount ("8,500"), or `null` when there is no price. */
  price: string | null;
  /** Currency label shown small after the amount ("د.ع"). */
  currency?: string;
  /** Shown instead of the price when it is `null`. */
  noPriceLabel?: string;
  /** Small caption under the price (e.g. which office sells it). */
  footnote?: string | null;
  /** Shown only when there is at least one review. */
  rating?: { average: string | null; count: number } | null;
  accent: StoreAccent;
  /** The pill button — add to cart ("تسوق") or open the product. */
  actionLabel: string;
  actionIcon?: IconName;
  onAction: () => void;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

/**
 * Compact 3-up product card of the store references (أدوية / أغنام وأبقار /
 * …): image well, centred name + sub-line, price with a small currency, and
 * a full-width accent pill. Shared by the Pet Owners Store, the Veterinarian
 * Store and the veterinary-office products on the home page.
 */
export function StoreGridProductCard({
  width,
  title,
  subtitle,
  imageUrl,
  price,
  currency,
  noPriceLabel,
  footnote,
  rating,
  accent,
  actionLabel,
  actionIcon = 'bag-handle-outline',
  onAction,
  actionDisabled,
  actionLoading,
  onPress,
  accessibilityLabel,
}: StoreGridProductCardProps) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  const imageHeight = Math.round(Math.min(width * 0.92, 150));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
          borderRadius: 16,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: dark ? theme.colors.border : '#F1F5F9',
          overflow: 'hidden',
          ...theme.shadows.xs,
        },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <View
        style={{
          height: imageHeight,
          backgroundColor: dark ? theme.colors.surfaceAccent : '#FAFBFB',
          alignItems: 'center',
          justifyContent: 'center',
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
          <View
            style={{
              width: 44,
              height: 56,
              borderRadius: 12,
              backgroundColor: dark ? theme.colors.surface : accent.soft,
              borderWidth: 1,
              borderColor: dark ? theme.colors.border : accent.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="cube-outline" size="iconMd" color="textMuted" />
          </View>
        )}
      </View>

      <View style={{ flex: 1, paddingHorizontal: 6, paddingTop: 6, paddingBottom: 8, rowGap: 4 }}>
        <View style={{ alignItems: 'center' }}>
          <Text
            numberOfLines={1}
            center
            style={{
              fontFamily: theme.fontFamily.displayBold,
              fontSize: 11,
              lineHeight: 16,
              color: theme.colors.textPrimary,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              center
              style={{ fontSize: 9, lineHeight: 13, color: theme.colors.textMuted }}
            >
              {subtitle}
            </Text>
          ) : null}
          {rating && rating.count > 0 && rating.average ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: 3, marginTop: 2 }}
            >
              <Icon name="star" size={11} color="warning" />
              <Text
                style={{
                  fontFamily: theme.fontFamily.displayBold,
                  fontSize: 10,
                  lineHeight: 14,
                  color: theme.colors.textSecondary,
                }}
              >
                {Number(rating.average).toFixed(1)}
              </Text>
              <Text style={{ fontSize: 8, lineHeight: 14, color: theme.colors.textMuted }}>
                ({rating.count})
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ alignItems: 'center', marginTop: 'auto' }}>
          {price !== null ? (
            <Text
              center
              numberOfLines={1}
              style={{
                fontFamily: theme.fontFamily.displayBold,
                fontSize: 11,
                lineHeight: 16,
                color: theme.colors.textPrimary,
              }}
            >
              {price}
              {currency ? (
                <Text style={{ fontSize: 8, lineHeight: 16, color: theme.colors.textMuted }}>
                  {` ${currency}`}
                </Text>
              ) : null}
            </Text>
          ) : (
            <Text center style={{ fontSize: 9, lineHeight: 16, color: theme.colors.textMuted }}>
              {noPriceLabel}
            </Text>
          )}
          {footnote ? (
            <Text
              center
              numberOfLines={1}
              style={{ fontSize: 9, lineHeight: 13, color: theme.colors.textMuted }}
            >
              {footnote}
            </Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} — ${title}`}
          accessibilityState={{ disabled: actionDisabled, busy: actionLoading }}
          disabled={actionDisabled || actionLoading}
          onPress={onAction}
          hitSlop={4}
          style={({ pressed }) => ({
            minHeight: 28,
            borderRadius: 999,
            backgroundColor: actionDisabled
              ? dark
                ? theme.colors.border
                : '#CBD5E1'
              : pressed
                ? accent.strong
                : accent.main,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: 4,
            paddingHorizontal: 6,
          })}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name={actionIcon} size={13} color="onPrimary" />
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: theme.fontFamily.displaySemiBold,
                  fontSize: 10,
                  lineHeight: 15,
                  color: '#FFFFFF',
                  flexShrink: 1,
                }}
              >
                {actionLabel}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

/** Loading placeholder with the same footprint. */
export function StoreGridProductCardSkeleton({ width }: { width: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width,
        height: Math.round(Math.min(width * 0.92, 150)) + 104,
        borderRadius: 16,
        backgroundColor: theme.colors.skeleton,
      }}
    />
  );
}
