import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { useTheme } from '@/theme';

/** Placeholder row matching `PoultryCard`'s layout, for the initial list load. */
export function PoultryCardSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.lg,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Skeleton width={44} height={44} radius={theme.radius.md} />
      <View style={{ flex: 1, rowGap: theme.spacing.sm }}>
        <Skeleton width="50%" height={16} />
        <Skeleton width="70%" height={12} />
      </View>
    </View>
  );
}
