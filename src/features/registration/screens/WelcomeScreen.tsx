import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextButton } from '@/components/actions';
import { useToast } from '@/components/feedback';
import { Caption, Heading } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { ContactUsButton, LanguageSelector } from '@/features/auth';
import { useTheme } from '@/theme';

import logoMark from '../../../../assets/logo-mark.png';

/** Matches the trimmed `logo-mark.png` aspect ratio (width / height). */
const LOGO_ASPECT_RATIO = 944 / 1100;
const LOGO_WIDTH = 180;

/**
 * Route `/(auth)/welcome` (A-02) — the app's entry screen for a signed-out
 * user.
 */
export default function WelcomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('registration');
  const toast = useToast();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.screenPadding,
          paddingVertical: theme.spacing.xxxl,
          justifyContent: 'space-between',
        }}
      >
        {/* Language list + "تواصل معنا", side by side. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <LanguageSelector />
          <ContactUsButton />
        </View>

        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            rowGap: theme.spacing.xxl,
          }}
        >
          <Image
            source={logoMark}
            contentFit="contain"
            style={{ width: LOGO_WIDTH, height: LOGO_WIDTH / LOGO_ASPECT_RATIO }}
            accessibilityIgnoresInvertColors
          />

          <View style={{ alignItems: 'center', rowGap: theme.spacing.sm }}>
            <Heading level={1} center color="primary">
              {t('welcome.title')}
            </Heading>
            <Caption center style={{ maxWidth: 300 }}>
              {t('welcome.subtitle')}
            </Caption>
          </View>
        </View>

        <View style={{ rowGap: theme.spacing.lg }}>
          <Button
            label={t('welcome.signIn')}
            fullWidth
            onPress={() => router.push(Routes.authSignIn)}
            accessibilityLabel={t('welcome.signIn')}
          />
          <Button
            label={t('welcome.createAccount')}
            fullWidth
            variant="outline"
            onPress={() => router.push(Routes.authAccountType)}
            accessibilityLabel={t('welcome.createAccount')}
          />
          <View style={{ alignItems: 'center' }}>
            <TextButton
              label={t('welcome.browseAsGuest')}
              underline
              onPress={() => toast.show({ message: t('welcome.guestComingSoon'), tone: 'info' })}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
