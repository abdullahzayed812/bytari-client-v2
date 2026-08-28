import { useState } from 'react';
import { Image, View } from 'react-native';

import { Text } from '@/components/typography';
import { useTheme } from '@/theme';
import type { SizeToken } from '@/theme/sizes';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: Extract<SizeToken, 'avatarSm' | 'avatarMd' | 'avatarLg' | 'avatarXl'> | number;
  accessibilityLabel?: string;
}

function initials(name?: string): string {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? '').join('') || '؟';
}

/** Rounded avatar with an image, or initials fallback on a soft green surface. */
export function Avatar({ uri, name, size = 'avatarMd', accessibilityLabel }: AvatarProps) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const diameter = typeof size === 'number' ? size : theme.sizes[size];
  const showImage = uri && !failed;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? name}
      style={{
        width: diameter,
        height: diameter,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surfaceAccent,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <Text
          variant={diameter >= theme.sizes.avatarLg ? 'title' : 'label'}
          color="primary"
          weight="bold"
        >
          {initials(name)}
        </Text>
      )}
    </View>
  );
}
