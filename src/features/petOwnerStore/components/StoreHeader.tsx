import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { usePetOwnerStore } from '../hooks';

interface StoreHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

/**
 * Pet Owners Store app bar — brand paw badge, title/subtitle, and a cart pill
 * with a live item count. Matches the reference store header. Logical layout,
 * so it flips correctly under the app's RTL Arabic direction.
 */
export function StoreHeader({ title, subtitle, showBack }: StoreHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const { itemCount } = usePetOwnerStore();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.md,
        paddingHorizontal: theme.screenPadding,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.md,
      }}
    >
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Icon name="chevron-back" directional size="iconMd" color="textPrimary" />
        </Pressable>
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="paw" size="iconMd" color="onPrimary" />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Heading level={3} color="primary" numberOfLines={1}>
          {title}
        </Heading>
        {subtitle ? <Caption numberOfLines={1}>{subtitle}</Caption> : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('cart.open')}
        onPress={() => router.push(Routes.petOwnerStoreCart)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceAccent,
        }}
      >
        <Icon name="cart-outline" size="iconSm" color="primary" />
        <Text variant="label" color="primary">
          {itemCount}
        </Text>
      </Pressable>
    </View>
  );
}
