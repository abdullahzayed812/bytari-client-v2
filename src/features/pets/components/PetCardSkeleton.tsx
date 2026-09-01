import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { useTheme } from '@/theme';

/** Placeholder row matching `PetCard`'s layout, for the initial list load. */
export function PetCardSkeleton() {
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
      <Skeleton width={60} height={60} radius={theme.radius.lg} />
      <View style={{ flex: 1, rowGap: theme.spacing.sm }}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="80%" height={12} />
        <Skeleton width="35%" height={12} />
      </View>
    </View>
  );
}
