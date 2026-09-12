import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Divider, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';

import { useVetJobOffer } from '../hooks';
import { formatSalary } from '../utils';

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
      <Icon name={icon} size="iconSm" color="primary" />
      <View style={{ flex: 1 }}>
        <Caption color="textMuted">{label}</Caption>
        <Text variant="body">{value}</Text>
      </View>
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  const theme = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.xs }}>
          <Icon name="checkmark-circle" size="iconXs" color="success" />
          <Text variant="body" style={{ flex: 1 }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Route `/(app)/vet-jobs/offers/[offerId]` — "تفاصيل الوظيفة" (reference screenshot 3). */
export default function VetJobOfferDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const caps = useCapabilities();
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  const q = useVetJobOffer(offerId);
  const offer = q.data;

  return (
    <SafeAreaScreen>
      <AppHeader title={t('offer.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !offer ? (
        <EmptyState icon="briefcase-outline" title={t('offer.notFound')} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              padding: theme.screenPadding,
              rowGap: theme.spacing.lg,
              paddingBottom: theme.spacing.huge,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.md }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="briefcase-outline" size="iconLg" color="primary" />
              </View>
              <View style={{ flex: 1, rowGap: 4 }}>
                <Heading level={3}>{offer.title}</Heading>
                <Caption>{offer.organizationName}</Caption>
                <Badge label={t(`employmentType.${offer.employmentType}`)} tone="info" size="sm" />
              </View>
            </View>

            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.md }}>
                <InfoRow
                  icon="location-outline"
                  label={t('offer.location')}
                  value={[offer.governorate, offer.district].filter(Boolean).join(' - ')}
                />
                <InfoRow
                  icon="cash-outline"
                  label={t('offer.salary')}
                  value={formatSalary(offer.salaryAmount, offer.salaryNegotiable, t) || '—'}
                />
                {offer.experienceYearsRequired != null ? (
                  <InfoRow
                    icon="ribbon-outline"
                    label={t('offer.experience')}
                    value={String(offer.experienceYearsRequired)}
                  />
                ) : null}
                {offer.qualifications ? (
                  <InfoRow icon="school-outline" label={t('offer.qualifications')} value={offer.qualifications} />
                ) : null}
                {offer.applicationDeadline ? (
                  <InfoRow
                    icon="calendar-outline"
                    label={t('offer.lastApplyDate')}
                    value={offer.applicationDeadline}
                  />
                ) : null}
              </View>
            </Card>

            <View style={{ rowGap: theme.spacing.sm }}>
              <Label>{t('offer.description')}</Label>
              <Text variant="body" color="textSecondary">
                {offer.description}
              </Text>
            </View>

            {offer.responsibilities.length > 0 ? (
              <View style={{ rowGap: theme.spacing.sm }}>
                <Divider />
                <Label>{t('offer.responsibilities')}</Label>
                <BulletList items={offer.responsibilities} />
              </View>
            ) : null}

            {offer.requirements.length > 0 ? (
              <View style={{ rowGap: theme.spacing.sm }}>
                <Divider />
                <Label>{t('offer.requirements')}</Label>
                <BulletList items={offer.requirements} />
              </View>
            ) : null}

            {offer.benefits.length > 0 ? (
              <View style={{ rowGap: theme.spacing.sm }}>
                <Divider />
                <Label>{t('offer.benefits')}</Label>
                <BulletList items={offer.benefits} />
              </View>
            ) : null}

            <View style={{ rowGap: theme.spacing.xs }}>
              <Divider />
              <Label>{t('offer.contact')}</Label>
              <Caption>{offer.contactPhone}</Caption>
              {offer.contactEmail ? <Caption>{offer.contactEmail}</Caption> : null}
            </View>
          </ScrollView>

          {caps.isApprovedVeterinarian ? (
            <View
              style={{
                padding: theme.screenPadding,
                borderTopWidth: theme.sizes.hairline,
                borderTopColor: theme.colors.border,
                backgroundColor: theme.colors.background,
              }}
            >
              <Button
                label={t('offer.apply')}
                fullWidth
                onPress={() => router.push(Routes.vetJobOfferApply(offer.id))}
              />
            </View>
          ) : null}
        </>
      )}
    </SafeAreaScreen>
  );
}
