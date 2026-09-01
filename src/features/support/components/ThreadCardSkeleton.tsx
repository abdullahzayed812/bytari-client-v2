import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { useTheme } from '@/theme';

/** Placeholder row matching `ThreadCard`'s layout. */
export function ThreadCardSkeleton() {
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
        <Skeleton width="45%" height={16} />
        <Skeleton width="65%" height={12} />
      </View>
    </View>
  );
}
