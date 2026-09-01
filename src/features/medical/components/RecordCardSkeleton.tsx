import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { useTheme } from '@/theme';

/** Placeholder row for the medical-record / vaccination list initial load. */
export function RecordCardSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        rowGap: theme.spacing.sm,
      }}
    >
      <Skeleton width="40%" height={16} />
      <Skeleton width="85%" height={12} />
      <Skeleton width="60%" height={12} />
    </View>
  );
}
