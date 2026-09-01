import { Image } from 'expo-image';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import splashImage from '../../../assets/splash.png';

/** Matches the `./assets/splash.png` dimensions used by the native expo-splash-screen config. */
const SPLASH_ASPECT_RATIO = 1195 / 1316;
/** Matches `imageWidth` in the `expo-splash-screen` plugin config (app.json). */
const SPLASH_WIDTH = 320;

/**
 * JS-rendered stand-in for the native splash screen, shown while
 * `useAppBootstrap` is still resolving. Mirrors the native `expo-splash-screen`
 * config (same image, width, resize mode, and background colour) so hiding the
 * native splash hands off to this screen with no visible flash or jump.
 */
export function AppSplash() {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
      }}
    >
      <Image
        source={splashImage}
        contentFit="contain"
        style={{ width: SPLASH_WIDTH, height: SPLASH_WIDTH / SPLASH_ASPECT_RATIO }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
