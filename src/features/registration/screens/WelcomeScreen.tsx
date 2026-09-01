import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextButton } from '@/components/actions';
import { Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { setLanguage as applyI18nLanguage } from '@/i18n';
import { usePreferencesStore, type AppLanguage } from '@/store';
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
  const { t: tNav } = useTranslation('nav');
  const toast = useToast();

  const language = usePreferencesStore((s) => s.language);
  const setLanguagePref = usePreferencesStore((s) => s.setLanguage);
  const nextLanguage: AppLanguage = language === 'ar' ? 'en' : 'ar';

  const toggleLanguage = async () => {
    setLanguagePref(nextLanguage);
    const { directionChanged } = await applyI18nLanguage(nextLanguage);
    if (directionChanged) {
      toast.show({ message: tNav('more.languageRestart'), tone: 'info', durationMs: 6000 });
    }
  };

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
        <View style={{ alignItems: 'flex-start' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              language === 'ar' ? tNav('more.languageEnglish') : tNav('more.languageArabic')
            }
            onPress={() => void toggleLanguage()}
            hitSlop={8}
            style={({ pressed }) => [
              { flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text variant="label" color="primary">
              {language === 'ar' ? tNav('more.languageArabic') : tNav('more.languageEnglish')}
            </Text>
            <Icon name="globe-outline" size="iconSm" color="primary" />
          </Pressable>
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
