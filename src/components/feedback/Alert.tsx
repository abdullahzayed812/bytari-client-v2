import { View } from 'react-native';

import { Icon, type IconName } from '@/components/content/Icon';
import { Text } from '@/components/typography';
import { useTheme, type Theme } from '@/theme';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  message: string;
}

const ICON: Record<AlertTone, IconName> = {
  info: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  warning: 'warning-outline',
  danger: 'alert-circle-outline',
};

function tones(theme: Theme, tone: AlertTone) {
  const c = theme.colors;
  const map = {
    info: { bg: c.infoSoft, fg: c.info },
    success: { bg: c.successSoft, fg: c.success },
    warning: { bg: c.warningSoft, fg: c.warning },
    danger: { bg: c.dangerSoft, fg: c.danger },
  } as const;
  return map[tone];
}

/** Inline, non-blocking status message. */
export function Alert({ tone = 'info', title, message }: AlertProps) {
  const theme = useTheme();
  const { bg, fg } = tones(theme, tone);
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        columnGap: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        backgroundColor: bg,
      }}
    >
      <Icon name={ICON[tone]} size="iconMd" style={{ color: fg }} />
      <View style={{ flex: 1, rowGap: 2 }}>
        {title ? (
          <Text variant="bodyMedium" style={{ color: fg }}>
            {title}
          </Text>
        ) : null}
        <Text variant="caption" style={{ color: fg }}>
          {message}
        </Text>
      </View>
    </View>
  );
}
