import { View, type DimensionValue } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { useTheme } from '@/theme';

/** Placeholder grid tile matching `AnimalCard`'s layout, for the initial list load. */
export function PublicationCardSkeleton({ width }: { width: DimensionValue }) {
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
      <Skeleton width="100%" height={140} radius={0} />
      <View style={{ padding: theme.spacing.md, rowGap: theme.spacing.sm }}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={12} />
        <Skeleton width="100%" height={20} />
      </View>
    </View>
  );
}
