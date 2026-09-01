import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Icon, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

interface Props {
  icon: IconName;
  label: string;
}

/**
 * A disabled navigation slot for a section that belongs to a later phase
 * (medical records, vaccinations). Shows a "coming soon" badge — no press
 * target, no premature implementation (§6).
 */
export function FutureSectionRow({ icon, label }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  return (
    <View
      accessibilityRole="text"
      accessibilityState={{ disabled: true }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceMuted,
        opacity: 0.75,
      }}
    >
      <Icon name={icon} size="iconMd" color="textMuted" />
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium" color="textSecondary">
          {label}
        </Text>
        <Caption>{t('detail.comingSoon')}</Caption>
      </View>
      <Badge label={t('detail.comingSoon')} tone="neutral" size="sm" />
    </View>
  );
}
