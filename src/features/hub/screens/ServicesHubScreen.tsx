import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';

import { HubTile } from '../components/HubTile';

/**
 * "Services" tab — a curated hub of every pet-owner / veterinarian destination.
 * Entries are capability-aware (Inquiries + Join-farm need an approved vet), but
 * the backend still authorises every screen. No dead ends.
 */
export default function ServicesHubScreen() {
  const { t } = useTranslation('nav');
  const theme = useTheme();
  const caps = useCapabilities();
  const isApprovedVet = caps.isApprovedVeterinarian;

  return (
    <ScrollScreen>
      <AppHeader title={t('services.title')} />
      <Section spacing="lg">
        <Caption>{t('services.subtitle')}</Caption>
      </Section>

      <Section spacing="lg">
        <Label>{t('services.sectionCare')}</Label>
        <View style={{ rowGap: theme.spacing.sm }}>
          <HubTile
            icon="chatbubbles-outline"
            label={t('services.consultations')}
            hint={t('services.consultationsHint')}
            onPress={() => router.push(Routes.support('consultations'))}
          />
          {isApprovedVet ? (
            <HubTile
              icon="help-buoy-outline"
              label={t('services.inquiries')}
              hint={t('services.inquiriesHint')}
              onPress={() => router.push(Routes.support('inquiries'))}
            />
          ) : null}
          <HubTile
            icon="mail-outline"
            label={t('services.chat')}
            hint={t('services.chatHint')}
            onPress={() => router.push(Routes.chat)}
          />
          <HubTile
            icon="library-outline"
            label={t('services.knowledge')}
            hint={t('services.knowledgeHint')}
            onPress={() => router.push(Routes.contentHome)}
          />
          <HubTile
            icon="paw-outline"
            label={t('services.myPets')}
            hint={t('services.myPetsHint')}
            onPress={() => router.push(Routes.pets)}
          />
        </View>
      </Section>

      <Section spacing="lg">
        <Label>{t('services.sectionCommunity')}</Label>
        <View style={{ rowGap: theme.spacing.sm }}>
          <HubTile
            icon="heart-outline"
            label={t('services.adoption')}
            onPress={() => router.push(Routes.publications('adoption'))}
          />
          <HubTile
            icon="male-female-outline"
            label={t('services.mating')}
            onPress={() => router.push(Routes.publications('mating'))}
          />
          <HubTile
            icon="search-outline"
            label={t('services.lost')}
            onPress={() => router.push(Routes.publications('lost'))}
          />
        </View>
      </Section>

      <Section spacing="lg">
        <Label>{t('services.sectionWork')}</Label>
        <View style={{ rowGap: theme.spacing.sm }}>
          <HubTile
            icon="business-outline"
            label={t('services.organizations')}
            hint={t('services.organizationsHint')}
            onPress={() => router.push(Routes.organizations)}
          />
          {isApprovedVet ? (
            <HubTile
              icon="git-branch-outline"
              label={t('services.joinFarm')}
              hint={t('services.joinFarmHint')}
              onPress={() => router.push(Routes.veterinarianJoinFarm)}
            />
          ) : (
            <HubTile
              icon="ribbon-outline"
              label={t('services.becomeVet')}
              hint={t('services.becomeVetHint')}
              onPress={() => router.push(Routes.veterinarian)}
            />
          )}
        </View>
      </Section>
    </ScrollScreen>
  );
}
