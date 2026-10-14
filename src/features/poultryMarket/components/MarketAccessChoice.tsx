import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';

type Tone = 'farm' | 'merchant';

const FARM_FEATURES: { key: string; icon: IconName }[] = [
  { key: 'merchant', icon: 'star-outline' },
  { key: 'dashboard', icon: 'grid-outline' },
  { key: 'info', icon: 'document-text-outline' },
  { key: 'staff', icon: 'people-outline' },
  { key: 'vets', icon: 'medkit-outline' },
  { key: 'remote', icon: 'eye-outline' },
  { key: 'treatments', icon: 'bandage-outline' },
  { key: 'stats', icon: 'bar-chart-outline' },
  { key: 'alerts', icon: 'notifications-outline' },
];

const MERCHANT_FEATURES: { key: string; icon: IconName }[] = [
  { key: 'poultryMarket', icon: 'storefront-outline' },
  { key: 'eggMarket', icon: 'egg-outline' },
  { key: 'poultryBourse', icon: 'trending-up-outline' },
  { key: 'eggBourse', icon: 'analytics-outline' },
  { key: 'statistics', icon: 'pie-chart-outline' },
  { key: 'ads', icon: 'megaphone-outline' },
  { key: 'contact', icon: 'people-outline' },
  { key: 'prices', icon: 'cash-outline' },
];

/** Below this width the two account cards stack instead of sitting side by side. */
const STACK_BELOW = 360;

function toneColors(tone: Tone): {
  accent: 'warning' | 'primary';
  surface: keyof ColorTokens;
} {
  return tone === 'farm'
    ? { accent: 'warning', surface: 'warningSoft' }
    : { accent: 'primary', surface: 'successSoft' };
}

interface AccountCardProps {
  tone: Tone;
  icon: IconName;
  title: string;
  subtitle: string;
  features: { key: string; icon: IconName; label: string }[];
  ctaLabel?: string;
  ctaIcon: IconName;
  onPress?: () => void;
  testID?: string;
}

/** One account option ("إضافة حقل دواجن" gold / "حساب تاجر" green) of the access screen. */
function AccountCard({
  tone,
  icon,
  title,
  subtitle,
  features,
  ctaLabel,
  ctaIcon,
  onPress,
  testID,
}: AccountCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const c = toneColors(tone);

  return (
    <View
      testID={testID}
      style={{
        flex: 1,
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.xs,
      }}
    >
      <View style={{ rowGap: theme.spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            columnGap: theme.spacing.sm,
          }}
        >
          <View style={{ flex: 1, rowGap: 2 }}>
            <Text variant="bodyStrong" color={c.accent}>
              {title}
            </Text>
            <Text variant="caption" color="textSecondary">
              {subtitle}
            </Text>
          </View>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors[c.surface],
              borderWidth: 1,
              borderColor: theme.colors[c.accent],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={icon} size="iconSm" color={c.accent} />
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: theme.colors.divider }} />

        <Text variant="caption" weight="bold" color={c.accent}>
          {t('access.featuresTitle')}
        </Text>
        <View style={{ rowGap: theme.spacing.xs }}>
          {features.map((f) => (
            <View
              key={f.key}
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}
            >
              <Icon name={f.icon} size="iconXs" color={c.accent} />
              <Text variant="caption" style={{ flex: 1 }}>
                {f.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {ctaLabel && onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          onPress={onPress}
          style={({ pressed }) => ({
            marginTop: theme.spacing.lg,
            minHeight: 40,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors[c.accent],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: theme.spacing.xs,
            paddingHorizontal: theme.spacing.sm,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text variant="caption" weight="bold" color="textInverse">
            {ctaLabel}
          </Text>
          <Icon name={ctaIcon} size="iconXs" color="textInverse" />
        </Pressable>
      ) : null}
    </View>
  );
}

export interface MarketAccessChoiceProps {
  /** `undefined` hides the card's CTA (e.g. a merchant application already pending). */
  onRegisterMerchant?: () => void;
  onCreateFarm: () => void;
  /** Account status notices (pending / expired / renewal) rendered above the cards. */
  notices?: ReactNode;
}

/**
 * The Markets & Exchanges access screen for a user without an eligible
 * account (design reference "تسجيل تاجر"): welcome hero, the two account
 * options, and the "معلومة مهمة" note. Both CTAs open the EXISTING flows
 * (trader registration / farm creation) — nothing is registered here.
 */
export function MarketAccessChoice({
  onRegisterMerchant,
  onCreateFarm,
  notices,
}: MarketAccessChoiceProps) {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const { width } = useWindowDimensions();
  const stacked = width < STACK_BELOW;

  const farmFeatures = FARM_FEATURES.map((f) => ({
    ...f,
    label: t(`access.farm.feature.${f.key}` as 'access.farm.feature.merchant'),
  }));
  const merchantFeatures = MERCHANT_FEATURES.map((f) => ({
    ...f,
    label: t(`access.merchant.feature.${f.key}` as 'access.merchant.feature.poultryMarket'),
  }));

  return (
    <View style={{ rowGap: theme.spacing.lg }}>
      <LinearGradient
        colors={[theme.colors.surfaceAccent, theme.colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: theme.radius.xl,
          padding: theme.spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.lg,
        }}
      >
        <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
          <Text variant="subtitle" weight="bold">
            {t('access.welcome')}
          </Text>
          <Text variant="title" weight="bold" color="primary">
            {t('access.title')}
          </Text>
          <Text variant="caption" color="textSecondary">
            {t('access.heroSubtitle')}
          </Text>
        </View>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="storefront" size="iconXl" color="primary" />
        </View>
      </LinearGradient>

      {notices}

      <View
        testID="market-access-cards"
        style={{
          flexDirection: stacked ? 'column' : 'row',
          alignItems: 'stretch',
          columnGap: theme.spacing.md,
          rowGap: theme.spacing.md,
        }}
      >
        {/* Logical order: the farm card is first (the right side in RTL), as in the design. */}
        <AccountCard
          testID="market-access-farm-card"
          tone="farm"
          icon="home-outline"
          title={t('access.farm.title')}
          subtitle={t('access.farm.subtitle')}
          features={farmFeatures}
          ctaLabel={t('access.farm.cta')}
          ctaIcon="add-circle-outline"
          onPress={onCreateFarm}
        />
        <AccountCard
          testID="market-access-merchant-card"
          tone="merchant"
          icon="cart-outline"
          title={t('access.merchant.title')}
          subtitle={t('access.merchant.subtitle')}
          features={merchantFeatures}
          ctaLabel={onRegisterMerchant ? t('access.merchant.cta') : undefined}
          ctaIcon="person-add-outline"
          onPress={onRegisterMerchant}
        />
      </View>

      <View
        style={{
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.infoSoft,
          borderWidth: 1,
          borderColor: theme.colors.info,
          rowGap: theme.spacing.xs,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: theme.spacing.xs,
          }}
        >
          <Icon name="information-circle" size="iconMd" color="info" />
          <Text variant="bodyStrong" color="info">
            {t('access.infoTitle')}
          </Text>
        </View>
        <Text variant="caption" center>
          {t('access.infoBody')}
        </Text>
      </View>
    </View>
  );
}
