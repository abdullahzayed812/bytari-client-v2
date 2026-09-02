import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';

export interface RatingStarsProps {
  /** 0-5, fractional values render a filled star for anything ≥ 0.75 past the last whole star. */
  value: number;
  size?: 'sm' | 'md' | 'lg';
  /** Present to make the stars tappable (1-5) — used by the review composer. */
  onChange?: (rating: number) => void;
  accessibilityLabel?: string;
}

const ICON_SIZE = { sm: 'iconXs', md: 'iconSm', lg: 'iconMd' } as const;

/** Read-only by default; pass `onChange` for an interactive 1-5 picker. */
export function RatingStars({
  value,
  size = 'md',
  onChange,
  accessibilityLabel,
}: RatingStarsProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View
      accessible={!onChange}
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', columnGap: 2 }}
    >
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        const icon = filled ? 'star' : 'star-outline';
        if (!onChange) {
          return <Icon key={star} name={icon} size={ICON_SIZE[size]} color="warning" />;
        }
        return (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`${star}`}
            hitSlop={6}
            onPress={() => onChange(star)}
          >
            <Icon name={icon} size={ICON_SIZE[size]} color="warning" />
          </Pressable>
        );
      })}
    </View>
  );
}
