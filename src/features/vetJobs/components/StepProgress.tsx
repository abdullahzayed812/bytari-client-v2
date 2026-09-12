import { View } from 'react-native';

import { useTheme } from '@/theme';

/** A simple step-dots progress indicator for the multi-step Jobs forms. */
export function StepProgress({ current, total }: { current: number; total: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', columnGap: theme.spacing.xs }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: i <= current ? theme.colors.primary : theme.colors.border,
          }}
        />
      ))}
    </View>
  );
}
