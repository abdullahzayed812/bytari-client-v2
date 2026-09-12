import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { EmptyState } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { AiSettingsCard } from '@/features/support/components';
import { useCapabilities } from '@/hooks';

/**
 * Management Centre (§16 / §23). Admins & system supervisors use the same app;
 * this is their entry point. Entries are gated by the user's real backend
 * permissions / supervisor domains — never a hard-coded role. The admin areas
 * (users / vet approvals / organizations / supervisors / audit) navigate to
 * live screens; the Consultation / Inquiry supervisor queues + the admin AI
 * toggle are wired here too.
 */
export default function ManagementScreen() {
  const { t } = useTranslation('auth');
  const { t: ta } = useTranslation('admin');
  const { t: ts } = useTranslation('support');
  const { t: tp } = useTranslation('petOwnerStore');
  const { t: tv } = useTranslation('veterinarianStore');
  const { t: tc } = useTranslation('content');
  const caps = useCapabilities();

  const areas = [
    {
      key: 'users',
      label: ta('home.users'),
      route: Routes.adminUsers,
      show: caps.isAdmin || caps.can('user.read'),
    },
    {
      key: 'vets',
      label: ta('home.vets'),
      route: Routes.adminVetApplications,
      show: caps.isAdmin || caps.can('veterinarian.read'),
    },
    {
      key: 'orgs',
      label: ta('home.orgs'),
      route: Routes.adminOrganizations,
      show: caps.isAdmin || caps.can('organization.admin.read'),
    },
    {
      key: 'farmsPoultry',
      label: ta('farms.titlePoultry'),
      route: { pathname: Routes.adminFarms, params: { species: 'POULTRY' } },
      show: caps.isAdmin || caps.can('organization.admin.read'),
    },
    {
      key: 'farmsLivestock',
      label: ta('farms.titleLivestock'),
      route: { pathname: Routes.adminFarms, params: { species: 'LIVESTOCK' } },
      show: caps.isAdmin || caps.can('organization.admin.read'),
    },
    {
      key: 'traders',
      label: ta('home.traders'),
      route: Routes.adminTraderApplications,
      show: caps.isAdmin || caps.can('trader.admin.read'),
    },
    {
      key: 'animalPublications',
      label: ta('animalPublications.title'),
      route: Routes.adminAnimalPublications,
      show: caps.isAdmin || caps.isSupervisorOf('ANIMAL') || caps.can('animal.read'),
    },
    {
      key: 'adminAnimals',
      label: ta('adminAnimals.title'),
      route: Routes.adminAnimals,
      show: caps.isAdmin || caps.isSupervisorOf('ANIMAL') || caps.can('animal.read'),
    },
    {
      key: 'vetServiceListings',
      label: ta('vetServiceListings.title'),
      route: Routes.adminVetServiceListings,
      show: caps.isAdmin || caps.isSupervisorOf('VET_SERVICE') || caps.can('vet_service.read'),
    },
    {
      key: 'vetServiceRequests',
      label: ta('vetServiceRequests.title'),
      route: Routes.adminVetServiceRequests,
      show: caps.isAdmin || caps.isSupervisorOf('VET_SERVICE') || caps.can('vet_service.read'),
    },
    {
      key: 'marketOffers',
      label: ta('home.marketOffers'),
      route: Routes.adminMarketOffers('poultry'),
      show: caps.isAdmin || caps.isSupervisorOf('MARKET') || caps.can('market.offer.admin.read'),
    },
    {
      key: 'poultryExchangeRates',
      label: ta('home.poultryExchangeRates'),
      route: Routes.poultryExchangeRatesEntry,
      show: caps.isAdmin || caps.isSupervisorOf('MARKET') || caps.can('market.rate.manage'),
    },
    {
      key: 'eggExchangeRates',
      label: ta('home.eggExchangeRates'),
      route: Routes.eggExchangeRatesEntry,
      show: caps.isAdmin || caps.isSupervisorOf('MARKET') || caps.can('market.rate.manage'),
    },
    {
      key: 'petStoreProducts',
      label: tp('admin.entry.products'),
      route: Routes.adminPetStoreProducts,
      show:
        caps.isAdmin ||
        caps.isSupervisorOf('PET_OWNER_STORE') ||
        caps.can('pet_store.product.manage'),
    },
    {
      key: 'petStoreCategories',
      label: tp('admin.entry.categories'),
      route: Routes.adminPetStoreCategories,
      show:
        caps.isAdmin ||
        caps.isSupervisorOf('PET_OWNER_STORE') ||
        caps.can('pet_store.category.manage'),
    },
    {
      key: 'petStoreOrders',
      label: tp('admin.entry.orders'),
      route: Routes.adminPetStoreOrders,
      show:
        caps.isAdmin ||
        caps.isSupervisorOf('PET_OWNER_STORE') ||
        caps.can('pet_store.order.manage'),
    },
    {
      key: 'vetStoreProducts',
      label: tv('admin.entry.products'),
      route: Routes.adminVetStoreProducts,
      show:
        caps.isAdmin ||
        caps.isSupervisorOf('VETERINARIAN_STORE') ||
        caps.can('veterinarian_store.product.manage'),
    },
    {
      key: 'vetStoreCategories',
      label: tv('admin.entry.categories'),
      route: Routes.adminVetStoreCategories,
      show:
        caps.isAdmin ||
        caps.isSupervisorOf('VETERINARIAN_STORE') ||
        caps.can('veterinarian_store.category.manage'),
    },
    {
      key: 'vetStoreOrders',
      label: tv('admin.entry.orders'),
      route: Routes.adminVetStoreOrders,
      show:
        caps.isAdmin ||
        caps.isSupervisorOf('VETERINARIAN_STORE') ||
        caps.can('veterinarian_store.order.manage'),
    },
    {
      key: 'veterinaryMagazine',
      label: tc('admin.entry.magazine'),
      route: Routes.adminVeterinaryContent('MAGAZINE'),
      show: caps.isAdmin || caps.isSupervisorOf('CONTENT') || caps.can('content.read'),
    },
    {
      key: 'veterinaryBooks',
      label: tc('admin.entry.books'),
      route: Routes.adminVeterinaryContent('BOOK'),
      show: caps.isAdmin || caps.isSupervisorOf('CONTENT') || caps.can('content.read'),
    },
    {
      key: 'veterinaryContentCategories',
      label: tc('admin.entry.categories'),
      route: Routes.adminVeterinaryContentCategories,
      show:
        caps.isAdmin || caps.isSupervisorOf('CONTENT') || caps.can('content.category.manage'),
    },
    {
      key: 'supervisors',
      label: ta('home.supervisors'),
      route: Routes.adminSupervisors,
      show: caps.isAdmin || caps.can('supervisor.read'),
    },
    {
      key: 'audit',
      label: ta('home.audit'),
      route: Routes.adminAuditLogs,
      show: caps.isAdmin || caps.can('audit.read'),
    },
  ].filter((a) => a.show);

  const canConsultations =
    caps.isAdmin || caps.isSupervisorOf('CONSULTATION') || caps.can('consultation.admin.read');
  const canInquiries =
    caps.isAdmin || caps.isSupervisorOf('INQUIRY') || caps.can('inquiry.admin.read');
  const canAi = caps.isAdmin || caps.can('ai.settings.manage');
  const nothing = areas.length === 0 && !canConsultations && !canInquiries && !canAi;

  return (
    <ScrollScreen>
      <AppHeader title={t('management.title')} showBack />
      <Section spacing="lg">
        <Caption>{t('management.intro')}</Caption>
      </Section>

      {nothing ? (
        <EmptyState
          icon="lock-closed-outline"
          title={t('management.title')}
          message={t('management.placeholder')}
        />
      ) : (
        <>
          {canConsultations || canInquiries ? (
            <Section spacing="lg">
              <Label>{ts('manage.sectionTitle')}</Label>
              <View style={{ rowGap: 12 }}>
                {canConsultations ? (
                  <NavCard
                    label={ts('manage.title.CONSULTATION')}
                    onPress={() => router.push(Routes.supportManage('consultations'))}
                  />
                ) : null}
                {canInquiries ? (
                  <NavCard
                    label={ts('manage.title.INQUIRY')}
                    onPress={() => router.push(Routes.supportManage('inquiries'))}
                  />
                ) : null}
              </View>
            </Section>
          ) : null}

          {canAi ? (
            <Section spacing="lg">
              <Label>{ts('ai.title')}</Label>
              <AiSettingsCard />
            </Section>
          ) : null}

          {areas.length > 0 ? (
            <Section spacing="lg">
              <Label>{t('management.title')}</Label>
              <View style={{ rowGap: 12 }}>
                {areas.map((area) => (
                  <NavCard
                    key={area.key}
                    label={area.label}
                    onPress={() => router.push(area.route)}
                  />
                ))}
              </View>
            </Section>
          ) : null}
        </>
      )}
    </ScrollScreen>
  );
}

function NavCard({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Card variant="outlined" padding="md" onPress={onPress} accessibilityLabel={label}>
      <Row gap="md">
        <Icon name="shield-checkmark-outline" size="iconMd" color="primary" />
        <Text variant="bodyMedium" style={{ flex: 1 }}>
          {label}
        </Text>
        <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
      </Row>
    </Card>
  );
}
