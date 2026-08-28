import { View } from 'react-native';

import { Text } from '@/components/typography';
import { useTheme, type Theme } from '@/theme';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

function toneColors(theme: Theme, tone: BadgeTone) {
  const c = theme.colors;
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: c.surfaceMuted, fg: c.textSecondary },
    primary: { bg: c.primarySoft, fg: c.primaryHover },
    success: { bg: c.successSoft, fg: c.success },
    warning: { bg: c.warningSoft, fg: c.warning },
    danger: { bg: c.dangerSoft, fg: c.danger },
    info: { bg: c.infoSoft, fg: c.info },
  };
  return map[tone];
}

/** Small status pill. */
export function Badge({ label, tone = 'neutral', size = 'md' }: BadgeProps) {
  const theme = useTheme();
  const { bg, fg } = toneColors(theme, tone);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: bg,
        borderRadius: theme.radius.pill,
        paddingHorizontal: size === 'sm' ? theme.spacing.sm : theme.spacing.md,
        paddingVertical: size === 'sm' ? 2 : theme.spacing.xs,
      }}
    >
      <Text variant={size === 'sm' ? 'overline' : 'caption'} style={{ color: fg }} weight="medium">
        {label}
      </Text>
    </View>
  );
}
