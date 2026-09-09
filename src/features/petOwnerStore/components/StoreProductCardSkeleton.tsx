import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { useTheme } from '@/theme';

/** Loading placeholder matching {@link StoreProductCard}'s footprint. */
export function StoreProductCardSkeleton({ width }: { width: number }) {
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
      <Skeleton width={width} height={width * 0.82} radius={0} />
      <View style={{ padding: theme.spacing.md, rowGap: theme.spacing.sm }}>
        <Skeleton width={width * 0.8} height={14} />
        <Skeleton width={width * 0.4} height={12} />
        <Skeleton width={width - theme.spacing.md * 2} height={32} radius={theme.radius.md} />
      </View>
    </View>
  );
}
