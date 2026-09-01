import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { AccountTypeCard } from '../components';

/** Route `/(auth)/account-type` (A-04) — choose Pet Owner vs Veterinarian/Student. */
export default function AccountTypeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('registration');

  return (
    <ScrollScreen>
      <AppHeader title={t('accountType.title')} showBack backAlign="left" />
      <Section spacing="lg">
        <Caption>{t('accountType.subtitle')}</Caption>
      </Section>

      <Section spacing="lg" style={{ rowGap: theme.spacing.lg }}>
        <AccountTypeCard
          icon="paw-outline"
          title={t('accountType.petOwnerTitle')}
          description={t('accountType.petOwnerDescription')}
          onPress={() => router.push(Routes.authRegister)}
        />
        <AccountTypeCard
          icon="medical-outline"
          title={t('accountType.veterinarianTitle')}
          description={t('accountType.veterinarianDescription')}
          onPress={() => router.push(Routes.authRegisterVeterinarian)}
        />
      </Section>
    </ScrollScreen>
  );
}
