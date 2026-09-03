import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Text } from '@/components/typography';
import { rawPalette, useTheme } from '@/theme';

interface Props {
  onPress: () => void;
}

/** The prominent green "إضافة حقل دواجن" card on the Poultry Farms landing. */
export function AddFarmCard({ onPress }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('landing.addFarmTitle')}
      onPress={onPress}
      style={({ pressed }) => [{ borderRadius: theme.radius.xl }, pressed && { opacity: 0.9 }]}
    >
      <LinearGradient
        colors={[rawPalette.green500, rawPalette.green700]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.lg,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: theme.radius.pill,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="add" size="iconLg" color="textInverse" />
        </View>
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="subtitle" weight="bold" style={{ color: theme.colors.textInverse }}>
            {t('landing.addFarmTitle')}
          </Text>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {t('landing.addFarmSubtitle')}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
