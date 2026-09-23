import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { Caption, Heading } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import type { RegistrationOutcome } from '../types';

/** Loose scatter of decorative confetti dots behind the checkmark (top of the screen only). */
const CONFETTI = [
  { top: '4%', start: '12%', size: 8 },
  { top: '2%', start: '55%', size: 6 },
  { top: '9%', start: '75%', size: 10 },
  { top: '13%', start: '30%', size: 5 },
  { top: '16%', start: '85%', size: 7 },
  { top: '20%', start: '8%', size: 6 },
] as const;

function ConfettiDots() {
  const theme = useTheme();
  return (
    <View style={{ position: 'absolute', inset: 0 }} pointerEvents="none">
      {CONFETTI.map((dot, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            top: dot.top,
            start: dot.start,
            width: dot.size,
            height: dot.size,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.primary,
            opacity: 0.5,
            transform: [{ rotate: '45deg' }],
          }}
        />
      ))}
    </View>
  );
}

/**
 * Route `/(auth)/register-success` (A-10). Reached only AFTER
 * `VerifyEmailScreen` — the user is fully authenticated by the time this
 * renders (`verifyEmail()` establishes an unrestricted session), so the
 * primary action routes to the app home, not to sign-in.
 *
 * The secondary action is a deliberately lower-emphasis "back to Welcome" link.
 * Since the user is already signed in, actually landing on `/(auth)/welcome`
 * would just bounce them straight back to the app via `AuthRedirector` — so
 * instead it goes home too, styled as a plain text action, for anyone who
 * wants a "not now" out without a second prominent button competing with the
 * primary CTA.
 */
export default function RegistrationSuccessScreen() {
  const theme = useTheme();
  const { t } = useTranslation('registration');
  const { outcome } = useLocalSearchParams<{ outcome?: RegistrationOutcome }>();
  const isVeterinarian = outcome === 'veterinarian-pending';

  const goHome = () => router.replace(Routes.home);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.successSoft }}>
      <ConfettiDots />
      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.screenPadding,
          paddingVertical: theme.spacing.xxxl,
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            rowGap: theme.spacing.xxl,
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: theme.radius.xxl,
              backgroundColor: theme.colors.success,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="checkmark" size={64} color="onPrimary" />
          </View>

          <View style={{ alignItems: 'center', rowGap: theme.spacing.sm }}>
            <Heading level={2} center color="primary">
              {isVeterinarian ? t('success.vetPendingTitle') : t('success.ownerTitle')}
            </Heading>
            <Caption center style={{ maxWidth: 320 }}>
              {isVeterinarian ? t('success.vetPendingBody') : t('success.ownerBody')}
            </Caption>
          </View>
        </View>

        <View style={{ rowGap: theme.spacing.lg }}>
          <Button
            label={t('success.primaryCta')}
            fullWidth
            onPress={goHome}
            accessibilityLabel={t('success.primaryCta')}
          />
          <Button
            label={t('success.secondaryCta')}
            variant="outline"
            fullWidth
            leftIcon="home-outline"
            onPress={goHome}
            accessibilityLabel={t('success.secondaryCta')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
