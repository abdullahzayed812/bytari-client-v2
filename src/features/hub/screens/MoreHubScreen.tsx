import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/content';
import { useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';
import { setLanguage as applyI18nLanguage } from '@/i18n';
import { usePreferencesStore, type AppLanguage } from '@/store';
import { useTheme } from '@/theme';

import { HubTile } from '../components/HubTile';

/**
 * "More" tab — app-level utilities and settings that don't belong on a content
 * screen: quick links to Account / Notifications / Management, the language
 * switch, the dev Design System, and the app version. Sign-out lives on Account.
 */
export default function MoreHubScreen() {
  const { t } = useTranslation('nav');
  const theme = useTheme();
  const toast = useToast();
  const caps = useCapabilities();
  const language = usePreferencesStore((s) => s.language);
  const setLanguagePref = usePreferencesStore((s) => s.setLanguage);

  const appVersion = Constants.expoConfig?.version ?? '—';

  const changeLanguage = async (next: AppLanguage) => {
    if (next === language) return;
    setLanguagePref(next);
    const { directionChanged } = await applyI18nLanguage(next);
    if (directionChanged) {
      toast.show({ message: t('more.languageRestart'), tone: 'info', durationMs: 6000 });
    }
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('more.title')} />

      <Section spacing="lg">
        <Label>{t('more.sectionAccount')}</Label>
        <View style={{ rowGap: theme.spacing.sm }}>
          <HubTile
            icon="person-circle-outline"
            label={t('more.account')}
            hint={t('more.accountHint')}
            onPress={() => router.push(Routes.account)}
          />
          <HubTile
            icon="notifications-outline"
            label={t('more.notifications')}
            onPress={() => router.push(Routes.notifications)}
          />
          {caps.canAccessManagementArea ? (
            <HubTile
              icon="shield-checkmark-outline"
              label={t('more.management')}
              hint={t('more.managementHint')}
              onPress={() => router.push(Routes.managementHome)}
            />
          ) : null}
        </View>
      </Section>

      <Section spacing="lg">
        <Label>{t('more.sectionApp')}</Label>
        <View style={{ rowGap: theme.spacing.md }}>
          <View style={{ rowGap: theme.spacing.sm }}>
            <Text variant="bodyMedium">{t('more.language')}</Text>
            <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
              <Chip
                label={t('more.languageArabic')}
                selected={language === 'ar'}
                onPress={() => void changeLanguage('ar')}
              />
              <Chip
                label={t('more.languageEnglish')}
                selected={language === 'en'}
                onPress={() => void changeLanguage('en')}
              />
            </View>
          </View>

          {__DEV__ ? (
            <HubTile
              icon="color-palette-outline"
              label={t('more.designSystem')}
              onPress={() => router.push(Routes.showcase)}
            />
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Caption>{t('more.version')}</Caption>
            <Caption>{appVersion}</Caption>
          </View>
        </View>
      </Section>
    </ScrollScreen>
  );
}
