import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { BATCH_STATUS_TONE } from '../constants';
import type { CattleBatch, SheepBatch } from '../types';

interface Props {
  batch: SheepBatch | CattleBatch;
  headCountLabel: string;
  statusLabel: string;
  onPress: () => void;
}

/** One batch row in the batches list. Shared by Sheep and Cattle (mirrors `PoultryCard`). */
export function LivestockBatchRow({ batch, headCountLabel, statusLabel, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={batch.name}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.md,
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="paw-outline" size="iconMd" color="primary" />
      </View>
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {batch.name}
        </Text>
        <Caption numberOfLines={1}>{headCountLabel}</Caption>
      </View>
      <Badge label={statusLabel} tone={BATCH_STATUS_TONE[batch.status]} size="sm" />
    </Pressable>
  );
}
