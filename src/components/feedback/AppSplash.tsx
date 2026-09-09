import { Image } from 'expo-image';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import splashImage from '../../../assets/splash.png';

/**
 * JS-rendered stand-in for the native splash screen, shown while
 * `useAppBootstrap` is still resolving. Renders the SAME `./assets/splash.png`
 * the native `expo-splash-screen` uses, full-screen with `contain` on the same
 * background colour — so once the native splash is dismissed this screen looks
 * like a seamless continuation of it (no flash, no jump).
 *
 * On Android 12+ the OS still draws its own brief circular icon splash first —
 * that shape is mandated by the platform and cannot be turned off from config;
 * this screen takes over immediately after and shows the real image.
 */
export function AppSplash() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Image
        source={splashImage}
        contentFit="contain"
        style={{ flex: 1, width: '100%' }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
