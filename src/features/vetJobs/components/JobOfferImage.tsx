import { Image } from 'expo-image';
import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/content';
import { useTheme } from '@/theme';

/**
 * A job offer's image (its own uploaded image, else its organization's logo —
 * resolved server-side as `imageUrl`). Without one, or when it fails to
 * load, the briefcase icon on the soft primary tile stands in.
 */
export function JobOfferImage({
  imageUrl,
  iconSize,
  style,
}: {
  imageUrl: string | null | undefined;
  iconSize: 'iconMd' | 'iconLg' | 'iconXl';
  style: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  // Remember which URL failed, so a refreshed (re-signed) URL gets its own try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const uri = imageUrl && imageUrl !== failedUrl ? imageUrl : null;

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          onError={() => setFailedUrl(uri)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Icon name="briefcase-outline" size={iconSize} color="primary" />
      )}
    </View>
  );
}
