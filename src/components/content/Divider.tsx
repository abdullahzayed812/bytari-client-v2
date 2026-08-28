import { View } from 'react-native';

import { Text } from '@/components/typography';
import { useTheme } from '@/theme';
import type { SpacingToken } from '@/theme/spacing';

export interface DividerProps {
  spacing?: SpacingToken;
  label?: string;
}

/** Hairline separator, optionally with a centred label. */
export function Divider({ spacing = 'lg', label }: DividerProps) {
  const theme = useTheme();
  const line = { flex: 1, height: theme.sizes.hairline, backgroundColor: theme.colors.divider };

  if (!label) {
    return <View style={{ ...line, marginVertical: theme.spacing[spacing] }} />;
  }
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.md,
        marginVertical: theme.spacing[spacing],
      }}
    >
      <View style={line} />
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <View style={line} />
    </View>
  );
}
