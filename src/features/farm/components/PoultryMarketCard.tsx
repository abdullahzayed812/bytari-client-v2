import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

interface Props {
  onPress: () => void;
}

/** "الدواجن والسوق والبورصات" navigation card on the landing screen. */
export function PoultryMarketCard({ onPress }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('landing.marketTitle')}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.lg,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="trending-up-outline" size="iconMd" color="primary" />
      </View>
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyStrong">{t('landing.marketTitle')}</Text>
        <Caption numberOfLines={1}>{t('landing.marketSubtitle')}</Caption>
      </View>
      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
