import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { useTheme } from '@/theme';

/** Placeholder card matching `ArticleCard`'s layout, for the initial list load. */
export function ArticleCardSkeleton({ width }: { width?: number }) {
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
      <Skeleton width="100%" height={100} radius={0} />
      <View style={{ padding: theme.spacing.md, rowGap: theme.spacing.sm }}>
        <Skeleton width="90%" height={14} />
        <Skeleton width="50%" height={12} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}
