import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { useTheme } from '@/theme';

/** Placeholder matching `TipCard`'s footprint for the initial grid load. */
export function TipCardSkeleton({ width }: { width: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      <Skeleton width={width} height={96} radius={0} />
      <View style={{ padding: theme.spacing.md, rowGap: theme.spacing.sm, alignItems: 'center' }}>
        <Skeleton width="80%" height={14} />
        <Skeleton width="50%" height={12} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
}
