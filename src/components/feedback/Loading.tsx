import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface LoadingProps {
  label?: string;
  /** Fill the parent and centre. */
  fill?: boolean;
  size?: 'small' | 'large';
}

/** Standard activity indicator with an optional caption. */
export function Loading({ label, fill, size = 'large' }: LoadingProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      style={[
        { alignItems: 'center', justifyContent: 'center', rowGap: theme.spacing.md },
        fill && { flex: 1, padding: theme.spacing.xxl },
      ]}
    >
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {label ? (
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
