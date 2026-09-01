import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Row } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

/**
 * Visual-only Google / Apple sign-in buttons shown on `LoginScreen` below an
 * "أو" divider. No SDK is wired — `expo-auth-session` / `expo-apple-authentication`
 * are NOT dependencies of this app yet. Both buttons show a "coming soon" toast.
 */
export function SocialLoginButtons() {
  const { t } = useTranslation('registration');
  const { t: tCommon } = useTranslation('common');
  const theme = useTheme();
  const toast = useToast();

  const comingSoon = () => toast.show({ message: tCommon('comingSoon'), tone: 'info' });

  return (
    <View style={{ rowGap: theme.spacing.lg }}>
      <Row gap="md" align="center">
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.divider }} />
        <Caption>{t('welcome.orDivider')}</Caption>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.divider }} />
      </Row>

      <View style={{ rowGap: theme.spacing.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('welcome.continueWithGoogle')}
          onPress={comingSoon}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              columnGap: theme.spacing.sm,
              minHeight: theme.sizes.controlHeightMd,
              borderRadius: theme.radius.lg,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
            },
          ]}
        >
          <Text variant="bodyMedium">{t('welcome.continueWithGoogle')}</Text>
          <Icon name="logo-google" size="iconSm" color="textPrimary" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('welcome.continueWithApple')}
          onPress={comingSoon}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              columnGap: theme.spacing.sm,
              minHeight: theme.sizes.controlHeightMd,
              borderRadius: theme.radius.lg,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
            },
          ]}
        >
          <Text variant="bodyMedium">{t('welcome.continueWithApple')}</Text>
          <Icon name="logo-apple" size="iconSm" color="textPrimary" />
        </Pressable>
      </View>
    </View>
  );
}
