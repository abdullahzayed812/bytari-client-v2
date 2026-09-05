import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { useTheme } from '@/theme';

/** Placeholder matching `NewsCard`'s footprint for the initial grid load. */
export function NewsCardSkeleton({ width }: { width: number }) {
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
      <Skeleton width={width} height={Math.round(width * 0.58)} radius={0} />
      <View style={{ padding: theme.spacing.md, rowGap: theme.spacing.sm }}>
        <Skeleton width="90%" height={14} />
        <Skeleton width="45%" height={12} />
        <Skeleton width="35%" height={10} />
      </View>
    </View>
  );
}
