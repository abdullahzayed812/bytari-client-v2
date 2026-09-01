import { useState } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/content';
import { useTheme } from '@/theme';

import { SPECIES_ICON } from '../constants';
import type { PetSpecies } from '../types';

export interface PetImageProps {
  /**
   * Image source. The backend has NO image field on an animal yet (§11), so
   * this is always `null` today — the component renders a species placeholder.
   * It stays here so a future upload phase is a prop change, not a rewrite.
   */
  uri?: string | null;
  species: PetSpecies;
  /** Square edge length. */
  size?: number;
  rounded?: 'md' | 'lg' | 'xl' | 'pill';
  style?: StyleProp<ViewStyle>;
}

/** Pet avatar: the image when available, else a soft-green species placeholder. */
export function PetImage({ uri, species, size = 56, rounded = 'lg', style }: PetImageProps) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const borderRadius = theme.radius[rounded];
  const showImage = Boolean(uri) && !failed;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: uri as string }}
          onError={() => setFailed(true)}
          resizeMode="cover"
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <Icon name={SPECIES_ICON[species]} size={Math.round(size * 0.44)} color="primary" />
      )}
    </View>
  );
}
