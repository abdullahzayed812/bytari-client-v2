import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { VetStoreCategory } from '../types';

interface HomeCategoryCircleProps {
  category: VetStoreCategory;
  hint?: string;
  onPress: () => void;
}

/** Round image tile for the store home "shop by animal" row. */
export function HomeCategoryCircle({ category, hint, onPress }: HomeCategoryCircleProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.name}
      onPress={onPress}
      style={{ alignItems: 'center', rowGap: theme.spacing.xs, width: 104 }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {category.imageUrl ? (
          <Image
            source={{ uri: category.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Icon name="paw-outline" size="iconLg" color="primary" />
        )}
      </View>
      <Text variant="label" color="primary" center numberOfLines={1}>
        {category.name}
      </Text>
      {hint ? (
        <Caption center numberOfLines={2}>
          {hint}
        </Caption>
      ) : null}
    </Pressable>
  );
}
