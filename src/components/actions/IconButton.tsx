import { Image } from 'expo-image';
import { Pressable, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/content/Icon';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';

interface IconButtonBaseProps extends Omit<PressableProps, 'style' | 'children'> {
  accessibilityLabel: string;
  variant?: 'plain' | 'soft' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  color?: keyof ColorTokens;
  directional?: boolean;
  disabled?: boolean;
}

/**
 * The visual: a glyph, or a bundled image asset (e.g. the brand logo) that
 * fills the round button. Size, touch target and press feedback are the same.
 */
export type IconButtonProps = IconButtonBaseProps &
  ({ icon: IconName; image?: never } | { image: number; icon?: never });

const DIAMETER = { sm: 32, md: 40, lg: 48 } as const;

/** Tappable icon with an accessible label and a ≥44pt touch target via hitSlop. */
export function IconButton({
  icon,
  image,
  accessibilityLabel,
  variant = 'plain',
  size = 'md',
  color = 'textPrimary',
  directional,
  disabled,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  const diameter = DIAMETER[size];
  const iconColor: keyof ColorTokens = variant === 'filled' ? 'onPrimary' : color;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={Math.max(0, (theme.sizes.touchTarget - diameter) / 2)}
      style={({ pressed }) => [
        {
          width: diameter,
          height: diameter,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            variant === 'filled'
              ? theme.colors.primary
              : variant === 'soft'
                ? theme.colors.surfaceAccent
                : 'transparent',
        },
        pressed && { opacity: 0.6 },
        disabled && { opacity: 0.4 },
      ]}
      {...rest}
    >
      {image !== undefined ? (
        <Image
          source={image}
          contentFit="cover"
          accessible={false}
          style={{ width: diameter, height: diameter, borderRadius: theme.radius.pill }}
        />
      ) : (
        <Icon
          name={icon}
          size={size === 'sm' ? 'iconSm' : 'iconMd'}
          color={iconColor}
          directional={directional}
        />
      )}
    </Pressable>
  );
}
