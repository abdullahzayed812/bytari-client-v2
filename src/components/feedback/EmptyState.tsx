import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon, type IconName } from '@/components/content/Icon';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly "nothing here yet" placeholder for empty lists / screens. */
export function EmptyState({
  title,
  message,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xxxl,
        rowGap: theme.spacing.md,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size="iconXl" color="primary" />
      </View>
      <Text variant="title" weight="medium" center>
        {title}
      </Text>
      {message ? (
        <Text variant="body" color="textMuted" center>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button label={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
